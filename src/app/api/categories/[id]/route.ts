import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nombre requerido').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER', 'CASHIER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de categoría inválido' },
        { status: 400 }
      )
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error('Get category error:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de categoría inválido' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const updateData = updateCategorySchema.parse(body)

    // Get current category for audit log
    const currentCategory = await prisma.category.findUnique({
      where: { id },
    })

    if (!currentCategory) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
    })

    // Log the update
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Category',
        entityId: id,
        oldValue: {
          name: currentCategory.name,
          description: currentCategory.description,
          isActive: currentCategory.isActive,
        },
        newValue: {
          name: updatedCategory.name,
          description: updatedCategory.description,
          isActive: updatedCategory.isActive,
        },
        userId: authResult.user.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedCategory,
    })
  } catch (error) {
    console.error('Update category error:', error)
    
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(['ADMIN'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de categoría inválido' },
        { status: 400 }
      )
    }

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    })

    if (productCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una categoría que tiene productos asignados' },
        { status: 400 }
      )
    }

    // Get current category for audit log
    const currentCategory = await prisma.category.findUnique({
      where: { id },
    })

    if (!currentCategory) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Category',
        entityId: id,
        oldValue: {
          name: currentCategory.name,
          description: currentCategory.description,
        },
        userId: authResult.user.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada exitosamente',
    })
  } catch (error) {
    console.error('Delete category error:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
