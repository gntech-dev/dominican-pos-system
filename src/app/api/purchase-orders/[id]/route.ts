/**
 * @file Individual Purchase Order API Route
 * @description Handles individual purchase order operations (GET, PUT, DELETE)
 * @author POS System
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT, requireRole } from '@/lib/auth'

/**
 * GET /api/purchase-orders/[id]
 * Returns a specific purchase order with full details.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyJWT(req)
    requireRole(user, ['ADMIN', 'MANAGER'])

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true
              }
            }
          }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        receiver: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!purchaseOrder) {
      return NextResponse.json({ 
        error: 'Purchase order not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ purchaseOrder })
  } catch (error: any) {
    console.error('Error fetching purchase order:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/purchase-orders/[id]
 * Updates a purchase order (useful for receiving items).
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyJWT(req)
    requireRole(user, ['ADMIN', 'MANAGER'])
    
    const data = await req.json()
    const { action } = data

    if (action === 'receive') {
      // Receive items and update inventory
      const purchaseOrder = await prisma.$transaction(async (tx) => {
        // Update purchase order status
        const po = await tx.purchaseOrder.update({
          where: { id: params.id },
          data: {
            status: 'RECEIVED',
            receivedDate: new Date(),
            receivedBy: user.userId
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        })

        // Update inventory for each item
        for (const item of po.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantityOrdered
              },
              cost: item.unitCost // Update product cost
            }
          })

          // Update received quantity
          await tx.purchaseOrderItem.update({
            where: { id: item.id },
            data: {
              quantityReceived: item.quantityOrdered
            }
          })
        }

        return po
      })

      return NextResponse.json({
        success: true,
        purchaseOrder,
        message: 'Purchase order received and inventory updated'
      })
    }

    // Regular update
    const updateData: any = {}
    if (data.expectedDate) updateData.expectedDate = new Date(data.expectedDate)
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.status) updateData.status = data.status

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      purchaseOrder,
      message: 'Purchase order updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json({
      error: error.message || 'Failed to update purchase order'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/purchase-orders/[id]
 * Deletes a purchase order (only if not received).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyJWT(req)
    requireRole(user, ['ADMIN'])

    // Check if purchase order exists and is not received
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: params.id }
    })

    if (!existingPO) {
      return NextResponse.json({ 
        error: 'Purchase order not found' 
      }, { status: 404 })
    }

    if (existingPO.status === 'RECEIVED') {
      return NextResponse.json({ 
        error: 'Cannot delete received purchase order' 
      }, { status: 400 })
    }

    await prisma.purchaseOrder.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Purchase order deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json({
      error: error.message || 'Failed to delete purchase order'
    }, { status: 500 })
  }
}
