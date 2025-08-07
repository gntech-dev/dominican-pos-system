import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { validateRNC, validateCedula } from '@/utils/dominican-validators'

const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').optional(),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  documentType: z.enum(['RNC', 'CEDULA']).optional(),
  documentNumber: z.string().min(1, 'Número de documento requerido').optional(),
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
        { error: 'ID de cliente inválido' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            total: true,
            ncf: true,
            createdAt: true,
          },
        },
        _count: {
          select: { sales: true },
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: customer,
    })
  } catch (error) {
    console.error('Get customer error:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const customerId = parseInt(params.id, 10)
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'ID de cliente inválido' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const updateData = updateCustomerSchema.parse(body)

    // Validate document number if provided
    if (updateData.documentType && updateData.documentNumber) {
      if (updateData.documentType === 'RNC') {
        if (!validateRNC(updateData.documentNumber)) {
          return NextResponse.json(
            { error: 'RNC inválido' },
            { status: 400 }
          )
        }
      } else if (updateData.documentType === 'CEDULA') {
        if (!validateCedula(updateData.documentNumber)) {
          return NextResponse.json(
            { error: 'Cédula inválida' },
            { status: 400 }
          )
        }
      }

      // Check if document number already exists for another customer
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          documentNumber: updateData.documentNumber,
          NOT: { id: customerId },
        },
      })

      if (existingCustomer) {
        return NextResponse.json(
          { error: 'Ya existe otro cliente con este número de documento' },
          { status: 400 }
        )
      }
    }

    // Get current customer for audit log
    const currentCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!currentCustomer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    })

    // Log the update
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Customer',
        entityId: customerId,
        oldValue: {
          name: currentCustomer.name,
          email: currentCustomer.email,
          phone: currentCustomer.phone,
          address: currentCustomer.address,
          documentType: currentCustomer.documentType,
          documentNumber: currentCustomer.documentNumber,
          isActive: currentCustomer.isActive,
        },
        newValue: {
          name: updatedCustomer.name,
          email: updatedCustomer.email,
          phone: updatedCustomer.phone,
          address: updatedCustomer.address,
          documentType: updatedCustomer.documentType,
          documentNumber: updatedCustomer.documentNumber,
          isActive: updatedCustomer.isActive,
        },
        userId: authResult.user.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
    })
  } catch (error) {
    console.error('Update customer error:', error)
    
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
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(['ADMIN'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const customerId = parseInt(params.id, 10)
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'ID de cliente inválido' },
        { status: 400 }
      )
    }

    // Check if customer has sales
    const salesCount = await prisma.sale.count({
      where: { customerId },
    })

    if (salesCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente que tiene ventas registradas' },
        { status: 400 }
      )
    }

    // Get current customer for audit log
    const currentCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!currentCustomer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    await prisma.customer.delete({
      where: { id: customerId },
    })

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Customer',
        entityId: customerId,
        oldValue: {
          name: currentCustomer.name,
          documentType: currentCustomer.documentType,
          documentNumber: currentCustomer.documentNumber,
        },
        userId: authResult.user.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
    })
  } catch (error) {
    console.error('Delete customer error:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
