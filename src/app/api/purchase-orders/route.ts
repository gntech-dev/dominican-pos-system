/**
 * @file Purchase Orders API Route
 * @description Handles CRUD operations for purchase orders - Essential for DGII 606 reports
 * @author POS System
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT, requireRole } from '@/lib/auth'

/**
 * GET /api/purchase-orders
 * Returns a list of purchase orders with supplier and item details.
 * Supports filtering by date range, supplier, status.
 * Required for DGII 606 reports.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyJWT(req)
    requireRole(user, ['ADMIN', 'MANAGER'])

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {}
    
    if (supplierId) {
      where.supplierId = supplierId
    }
    
    if (status) {
      where.status = status
    }
    
    if (fromDate || toDate) {
      where.orderDate = {}
      if (fromDate) where.orderDate.gte = new Date(fromDate)
      if (toDate) where.orderDate.lte = new Date(toDate)
    }

    const [purchaseOrders, totalCount] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
          items: {
            include: {
              product: true
            }
          },
          creator: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          receiver: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { orderDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.purchaseOrder.count({ where })
    ])

    return NextResponse.json({
      purchaseOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/purchase-orders
 * Creates a new purchase order.
 * Essential for tracking purchases for DGII 606 reports.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyJWT(req)
    requireRole(user, ['ADMIN', 'MANAGER'])
    
    const data = await req.json()

    // Validate required fields
    if (!data.supplierId || !data.items || data.items.length === 0) {
      return NextResponse.json({ 
        error: 'Supplier and items are required' 
      }, { status: 400 })
    }

    // Generate PO number
    const lastPO = await prisma.purchaseOrder.findFirst({
      orderBy: { poNumber: 'desc' }
    })
    
    const nextNumber = lastPO ? 
      parseInt(lastPO.poNumber.replace('PO-', '')) + 1 : 1
    const poNumber = `PO-${String(nextNumber).padStart(6, '0')}`

    // Calculate totals
    let subtotal = 0
    const validatedItems: Array<{
      productId: string
      quantityOrdered: number
      unitCost: number
      totalCost: number
    }> = []

    for (const item of data.items) {
      if (!item.productId || !item.quantityOrdered || !item.unitCost) {
        throw new Error('Invalid item data')
      }
      
      const totalCost = item.quantityOrdered * item.unitCost
      subtotal += totalCost
      
      validatedItems.push({
        productId: item.productId,
        quantityOrdered: item.quantityOrdered,
        unitCost: item.unitCost,
        totalCost
      })
    }

    // Calculate tax (18% ITBIS for Dominican Republic)
    const taxAmount = subtotal * 0.18
    const totalAmount = subtotal + taxAmount

    // Create purchase order with items in a transaction
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId: data.supplierId,
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          subtotal,
          taxAmount,
          totalAmount,
          notes: data.notes,
          createdBy: user.userId,
          items: {
            create: validatedItems
          }
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: true
            }
          }
        }
      })

      return po
    })

    return NextResponse.json({ 
      success: true, 
      purchaseOrder,
      message: `Purchase Order ${poNumber} created successfully`
    })

  } catch (error: any) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to create purchase order' 
    }, { status: 500 })
  }
}
