import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const UpdateNCFSequenceSchema = z.object({
  currentNumber: z.number().min(0).max(99999999).optional(),
  maxNumber: z.number().min(1).max(99999999).optional(),
  expiryDate: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional()
})

/**
 * GET /api/ncf-sequences/[id] - Get specific NCF sequence
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Only admins can view NCF sequences
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado - Solo administradores' },
        { status: 403 }
      )
    }

    const { id } = await params
    
    const ncfSequence = await prisma.ncfSequence.findUnique({
      where: { id },
      include: {
        sales: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            saleNumber: true,
            ncf: true,
            total: true,
            createdAt: true,
            customer: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!ncfSequence) {
      return NextResponse.json(
        { error: 'Secuencia NCF no encontrada' },
        { status: 404 }
      )
    }

    // Calculate additional statistics
    const total = ncfSequence.maxNumber
    const used = ncfSequence.currentNumber
    const usagePercentage = Math.round((used / total) * 100)
    const remaining = ncfSequence.maxNumber - ncfSequence.currentNumber
    
    let status: 'active' | 'warning' | 'critical' | 'exhausted' = 'active'
    if (remaining <= 0 || ncfSequence.currentNumber >= ncfSequence.maxNumber) {
      status = 'exhausted'
    } else if (remaining <= 100) {
      status = 'critical'
    } else if (remaining <= 1000) {
      status = 'warning'
    }

    const isExpired = ncfSequence.expiryDate && new Date(ncfSequence.expiryDate) < new Date()

    return NextResponse.json({
      success: true,
      data: {
        ...ncfSequence,
        usagePercentage,
        remaining,
        status,
        total,
        isExpired: !!isExpired
      }
    })
  } catch (error) {
    console.error('Error fetching NCF sequence:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/ncf-sequences/[id] - Update NCF sequence
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Only admins can update NCF sequences
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado - Solo administradores' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateNCFSequenceSchema.parse(body)

    // Get current sequence
    const currentSequence = await prisma.ncfSequence.findUnique({
      where: { id }
    })

    if (!currentSequence) {
      return NextResponse.json(
        { error: 'Secuencia NCF no encontrada' },
        { status: 404 }
      )
    }

    // Validate currentNumber doesn't exceed maxNumber
    if (validatedData.currentNumber !== undefined && validatedData.maxNumber !== undefined) {
      if (validatedData.currentNumber > validatedData.maxNumber) {
        return NextResponse.json(
          { error: 'El número actual no puede ser mayor que el número máximo' },
          { status: 400 }
        )
      }
    } else if (validatedData.currentNumber !== undefined) {
      if (validatedData.currentNumber > currentSequence.maxNumber) {
        return NextResponse.json(
          { error: 'El número actual no puede ser mayor que el número máximo' },
          { status: 400 }
        )
      }
    } else if (validatedData.maxNumber !== undefined) {
      if (currentSequence.currentNumber > validatedData.maxNumber) {
        return NextResponse.json(
          { error: 'El número máximo no puede ser menor que el número actual' },
          { status: 400 }
        )
      }
    }

    const updatedSequence = await prisma.ncfSequence.update({
      where: { id },
      data: {
        currentNumber: validatedData.currentNumber,
        maxNumber: validatedData.maxNumber,
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : validatedData.expiryDate === null ? null : undefined,
        isActive: validatedData.isActive
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE',
        entityType: 'NCF_SEQUENCE',
        entityId: updatedSequence.id,
        oldValue: currentSequence,
        newValue: updatedSequence,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedSequence
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating NCF sequence:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ncf-sequences/[id] - Deactivate NCF sequence (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Only admins can delete NCF sequences
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado - Solo administradores' },
        { status: 403 }
      )
    }

    const { id } = await params

    const sequence = await prisma.ncfSequence.findUnique({
      where: { id },
      include: {
        sales: {
          take: 1
        }
      }
    })

    if (!sequence) {
      return NextResponse.json(
        { error: 'Secuencia NCF no encontrada' },
        { status: 404 }
      )
    }

    // Check if sequence has been used
    if (sequence.sales.length > 0) {
      // Can't delete, only deactivate
      const deactivatedSequence = await prisma.ncfSequence.update({
        where: { id },
        data: { isActive: false }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'UPDATE',
          entityType: 'NCF_SEQUENCE',
          entityId: deactivatedSequence.id,
          oldValue: sequence,
          newValue: deactivatedSequence,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Secuencia desactivada (no se puede eliminar porque tiene ventas asociadas)',
        data: deactivatedSequence
      })
    } else {
      // Can safely delete
      await prisma.ncfSequence.delete({
        where: { id }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'DELETE',
          entityType: 'NCF_SEQUENCE',
          entityId: id,
          oldValue: sequence,
          newValue: {},
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Secuencia NCF eliminada exitosamente'
      })
    }
  } catch (error) {
    console.error('Error deleting NCF sequence:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
