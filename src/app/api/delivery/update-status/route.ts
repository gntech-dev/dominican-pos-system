import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json({ 
        error: 'ID de pedido y estado son requeridos' 
      }, { status: 400 })
    }

    const validStatuses = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Estado inválido' 
      }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Update the order status in database
    // 2. Log the status change with timestamp and user
    // 3. Send notifications to customer if appropriate
    // 4. Update driver availability if order is completed/cancelled

    return NextResponse.json({ 
      success: true,
      message: 'Estado actualizado exitosamente',
      statusUpdate: {
        orderId,
        newStatus: status,
        updatedAt: new Date().toISOString(),
        updatedBy: user.userId
      }
    })

  } catch (error) {
    console.error('Update delivery status error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
