import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

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
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      data: { customer }
    })

  } catch (error) {
    console.error('Error fetching customer:', error)
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
    const body = await req.json()

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        rnc: body.rnc,
        cedula: body.cedula,
        isActive: body.isActive,
      },
    })

    return NextResponse.json({
      success: true,
      data: { customer: updatedCustomer }
    })

  } catch (error) {
    console.error('Error updating customer:', error)
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

    await prisma.customer.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
