import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { orderId, driverId } = await request.json()

    if (!orderId || !driverId) {
      return NextResponse.json({ 
        error: 'ID de pedido y repartidor son requeridos' 
      }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Update the order in database with driver assignment
    // 2. Update driver status to BUSY
    // 3. Send notifications to customer and driver
    // 4. Log the assignment with timestamp

    return NextResponse.json({ 
      success: true,
      message: 'Repartidor asignado exitosamente',
      assignment: {
        orderId,
        driverId,
        assignedAt: new Date().toISOString(),
        assignedBy: user.userId
      }
    })

  } catch (error) {
    console.error('Assign driver error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
