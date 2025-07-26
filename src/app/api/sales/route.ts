import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { generateNCF, calculateITBIS, roundToTwoDecimals } from '@/utils/dominican-validators'
import { Prisma } from '@prisma/client'

const createSaleSchema = z.object({
  customerId: z.string().optional(),
  customerRnc: z.string().optional(), // For one-time customers with RNC
  ncfType: z.enum(['B01', 'B02']).optional().default('B02'), // B01 for credit fiscal, B02 for consumption
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'CHECK', 'CREDIT']),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.union([z.number(), z.string()]).transform((val) => 
      typeof val === 'string' ? parseFloat(val) : val
    ).refine((val) => !isNaN(val) && val >= 0, {
      message: "Unit price must be a valid positive number"
    }),
  })).min(1),
})

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER', 'CASHIER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await req.json()
    const saleData = createSaleSchema.parse(body)

    // Validate NCF requirements
    if (saleData.ncfType === 'B01') {
      if (!saleData.customerId && !saleData.customerRnc) {
        return NextResponse.json({ 
          error: 'Para emitir factura B01 se requiere cliente con RNC válido' 
        }, { status: 400 })
      }

      // If using existing customer, verify they have RNC
      if (saleData.customerId) {
        const customer = await prisma.customer.findUnique({
          where: { id: saleData.customerId },
          select: { rnc: true }
        })
        
        if (!customer?.rnc) {
          return NextResponse.json({ 
            error: 'El cliente seleccionado no tiene RNC registrado para factura B01' 
          }, { status: 400 })
        }
      }
    }

    // Calculate totals
    let subtotal = 0
    for (const item of saleData.items) {
      subtotal += item.quantity * item.unitPrice
    }

    const itbis = calculateITBIS(subtotal)
    const total = roundToTwoDecimals(subtotal + itbis)

    // Generate sale number
    const saleCount = await prisma.sale.count()
    const saleNumber = `VTA-${(saleCount + 1).toString().padStart(6, '0')}`

    // Get active NCF sequence for the specified type
    const ncfSequence = await prisma.ncfSequence.findFirst({
      where: { type: saleData.ncfType, isActive: true },
    })

    let ncf: string | undefined
    let ncfSequenceId: string | undefined

    if (ncfSequence) {
      const nextNumber = ncfSequence.currentNumber + 1
      ncf = generateNCF(saleData.ncfType, nextNumber)
      ncfSequenceId = ncfSequence.id

      // Update sequence
      await prisma.ncfSequence.update({
        where: { id: ncfSequence.id },
        data: { currentNumber: nextNumber },
      })
    }

    // Create the sale with transaction
    const sale = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          ncf,
          ncfType: saleData.ncfType,
          subtotal: roundToTwoDecimals(subtotal),
          itbis: roundToTwoDecimals(itbis),
          total,
          paymentMethod: saleData.paymentMethod,
          notes: saleData.notes,
          cashierId: authResult.user.userId,
          customerId: saleData.customerId,
          ncfSequenceId,
        },
        include: {
          cashier: {
            select: { firstName: true, lastName: true, username: true },
          },
          customer: {
            select: { name: true, rnc: true, cedula: true },
          },
        },
      })

      // Create sale items and update stock
      for (const item of saleData.items) {
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: roundToTwoDecimals(item.unitPrice),
            total: roundToTwoDecimals(item.quantity * item.unitPrice),
          },
        })

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      }

      return newSale
    })

    // Log the sale creation
    await prisma.auditLog.create({
      data: {
        action: 'SALE_CREATE',
        entityType: 'Sale',
        entityId: sale.id,
        newValue: { saleNumber: sale.saleNumber, total: sale.total, ncf: sale.ncf },
        userId: authResult.user.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      data: sale,
    })
  } catch (error) {
    console.error('Create sale error:', error)
    
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
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const cashierId = searchParams.get('cashierId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (cashierId) {
      where.cashierId = cashierId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          cashier: {
            select: { firstName: true, lastName: true, username: true },
          },
          customer: {
            select: { name: true, rnc: true, cedula: true },
          },
          items: {
            include: {
              product: {
                select: { name: true, code: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        sales,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get sales error:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
