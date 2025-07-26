import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createProductSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  price: z.number().min(0, 'Precio debe ser positivo'),
  cost: z.number().min(0, 'Costo debe ser positivo').optional(),
  stock: z.number().int().min(0, 'Stock debe ser positivo'),
  minStock: z.number().int().min(0, 'Stock mínimo debe ser positivo'),
  taxable: z.boolean().default(true),
  categoryId: z.string().optional(),
})

const updateProductSchema = createProductSchema.partial()

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await req.json()
    const productData = createProductSchema.parse(body)

    // Check if code already exists
    const existingProduct = await prisma.product.findUnique({
      where: { code: productData.code },
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Ya existe un producto con este código' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: productData,
      include: {
        category: true,
      },
    })

    // Log the creation
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Product',
        entityId: product.id,
        newValue: { code: product.code, name: product.name },
        userId: authResult.user.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('Create product error:', error)
    
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const lowStock = searchParams.get('lowStock') === 'true'
    const isActive = searchParams.get('isActive')

    const where: any = {}

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (lowStock) {
      where.stock = { lte: prisma.raw('min_stock') }
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get products error:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
