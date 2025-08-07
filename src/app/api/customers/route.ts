import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { validateRNC, validateCedula } from '@/utils/dominican-validators'

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  documentType: z.enum(['RNC', 'CEDULA']),
  documentNumber: z.string().min(1, 'Número de documento requerido'),
  isActive: z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER', 'CASHIER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await req.json()
    const customerData = createCustomerSchema.parse(body)

    // Validate document number
    if (customerData.documentType === 'RNC') {
      if (!validateRNC(customerData.documentNumber)) {
        return NextResponse.json(
          { error: 'RNC inválido' },
          { status: 400 }
        )
      }
    } else if (customerData.documentType === 'CEDULA') {
      if (!validateCedula(customerData.documentNumber)) {
        return NextResponse.json(
          { error: 'Cédula inválida' },
          { status: 400 }
        )
      }
    }

    // Check if document number already exists
    let existingCustomer = null
    if (customerData.documentType === 'RNC') {
      existingCustomer = await prisma.customer.findFirst({
        where: {
          rnc: customerData.documentNumber,
        },
      })
    } else if (customerData.documentType === 'CEDULA') {
      existingCustomer = await prisma.customer.findFirst({
        where: {
          cedula: customerData.documentNumber,
        },
      })
    }

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este número de documento' },
        { status: 400 }
      )
    }

    // Prepare customer data for creation
    const createData: any = {
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
      isActive: customerData.isActive,
      customerType: customerData.documentType === 'RNC' ? 'BUSINESS' : 'INDIVIDUAL',
    }

    // Set the appropriate document field
    if (customerData.documentType === 'RNC') {
      createData.rnc = customerData.documentNumber
    } else if (customerData.documentType === 'CEDULA') {
      createData.cedula = customerData.documentNumber
    }

    const customer = await prisma.customer.create({
      data: createData,
    })

    // Determine the document info for logging
    const documentType = customer.rnc ? 'RNC' : 'CEDULA'
    const documentNumber = customer.rnc || customer.cedula

    // Log the creation
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Customer',
        entityId: customer.id,
        newValue: {
          name: customer.name,
          documentType: documentType,
          documentNumber: documentNumber,
        },
        userId: authResult.user.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })

    // Return customer with computed fields for compatibility
    const responseCustomer = {
      ...customer,
      documentType: documentType,
      documentNumber: documentNumber,
    }

    return NextResponse.json({
      success: true,
      data: responseCustomer,
    })
  } catch (error) {
    console.error('Create customer error:', error)
    
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
    const search = searchParams.get('search')
    const documentType = searchParams.get('documentType')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { rnc: { contains: search, mode: 'insensitive' } },
        { cedula: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (documentType === 'RNC') {
      where.rnc = { not: null }
    } else if (documentType === 'CEDULA') {
      where.cedula = { not: null }
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { sales: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ])

    // Transform customers to include computed fields for compatibility
    const transformedCustomers = customers.map(customer => ({
      ...customer,
      documentType: customer.rnc ? 'RNC' : 'CEDULA',
      documentNumber: customer.rnc || customer.cedula,
    }))

    return NextResponse.json({
      success: true,
      data: {
        customers: transformedCustomers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get customers error:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
