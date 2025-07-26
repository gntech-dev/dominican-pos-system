import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await req.json()
    const categoryData = createCategorySchema.parse(body)

    const category = await prisma.category.create({
      data: categoryData,
    })

    // Log the creation
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Category',
        entityId: category.id,
        newValue: { name: category.name },
        userId: authResult.user.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error('Create category error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER', 'CASHIER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (!includeInactive) {
      where.isActive = true
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        categories,
      },
    })
  } catch (error) {
    console.error('Get categories error:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
