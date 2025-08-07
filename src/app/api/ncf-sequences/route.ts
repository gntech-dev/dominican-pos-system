import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

// NCF Sequence validation schemas
const CreateNCFSequenceSchema = z.object({
  type: z.enum(['B01', 'B02', 'B03', 'B04', 'B11', 'B12', 'B13', 'B14', 'B15']),
  currentNumber: z.number().min(0).max(99999999),
  maxNumber: z.number().min(1).max(99999999),
  expiryDate: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true)
})

/**
 * GET /api/ncf-sequences - Get all NCF sequences
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Allow ADMIN, MANAGER, and CASHIER to view NCF sequences for sales
    if (!['ADMIN', 'MANAGER', 'CASHIER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const ncfSequences = await prisma.ncfSequence.findMany({
      orderBy: [
        { type: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Calculate usage percentage and status for each sequence
    const sequencesWithStatus = ncfSequences.map(seq => {
      const total = seq.maxNumber
      const used = seq.currentNumber
      const usagePercentage = Math.round((used / total) * 100)
      const remaining = seq.maxNumber - seq.currentNumber
      
      let status: 'active' | 'warning' | 'critical' | 'exhausted' = 'active'
      if (remaining <= 0 || seq.currentNumber >= seq.maxNumber) {
        status = 'exhausted'
      } else if (remaining <= 100) {
        status = 'critical'
      } else if (remaining <= 1000) {
        status = 'warning'
      }

      const isExpired = seq.expiryDate && new Date(seq.expiryDate) < new Date()

      return {
        ...seq,
        usagePercentage,
        remaining,
        status,
        total,
        isExpired: !!isExpired
      }
    })

    return NextResponse.json({
      success: true,
      data: sequencesWithStatus
    })
  } catch (error) {
    console.error('Error fetching NCF sequences:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ncf-sequences - Create new NCF sequence
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Only admins can create NCF sequences
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado - Solo administradores' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = CreateNCFSequenceSchema.parse(body)

    // Check if there's already an active sequence for this type
    const existingActiveSequence = await prisma.ncfSequence.findFirst({
      where: {
        type: validatedData.type as any,
        isActive: true
      }
    })

    if (existingActiveSequence) {
      return NextResponse.json(
        { error: `Ya existe una secuencia activa para el tipo ${validatedData.type}` },
        { status: 400 }
      )
    }

    const ncfSequence = await prisma.ncfSequence.create({
      data: {
        type: validatedData.type as any, // Temporary type assertion
        maxNumber: validatedData.maxNumber,
        currentNumber: 0,
        isActive: validatedData.isActive,
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE',
        entityType: 'NCF_SEQUENCE',
        entityId: ncfSequence.id,
        newValue: ncfSequence,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      data: ncfSequence
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating NCF sequence:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
