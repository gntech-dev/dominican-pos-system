import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateProductSchema = z.object({
  code: z.string().min(1, 'Código requerido').optional(),
  name: z.string().min(1, 'Nombre requerido').optional(),
  description: z.string().optional(),
  price: z.number().min(0, 'Precio debe ser positivo').optional(),
  cost: z.number().min(0, 'Costo debe ser positivo').optional(),
  stock: z.number().int().min(0, 'Stock debe ser positivo').optional(),
  minStock: z.number().int().min(0, 'Stock mínimo debe ser positivo').optional(),
  taxable: z.boolean().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER', 'CASHIER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('Get product error:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await req.json()
    const productData = updateProductSchema.parse(body)

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Check if code already exists (if code is being updated)
    if (productData.code && productData.code !== existingProduct.code) {
      const codeExists = await prisma.product.findUnique({
        where: { code: productData.code },
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Ya existe un producto con este código' },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: productData,
      include: {
        category: true,
      },
    })

    // Log the update
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Product',
        entityId: product.id,
        oldValue: { code: existingProduct.code, name: existingProduct.name },
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
    console.error('Update product error:', error)
    
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAuth(['ADMIN'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Check if product is used in any sales
    const salesCount = await prisma.saleItem.count({
      where: { productId: params.id },
    })

    if (salesCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el producto porque tiene ventas asociadas' },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id: params.id },
    })

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Product',
        entityId: params.id,
        oldValue: { code: existingProduct.code, name: existingProduct.name },
        userId: authResult.user.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado exitosamente',
    })
  } catch (error) {
    console.error('Delete product error:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
