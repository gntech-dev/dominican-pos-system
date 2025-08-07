import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Mock drivers for now
    const mockDrivers = [
      {
        id: '1',
        name: 'Carlos Martínez',
        phone: '8097654321',
        vehicle: 'Motocicleta Honda CG150',
        status: 'BUSY',
        currentDeliveries: 1,
        totalDeliveries: 145,
        rating: 4.8
      },
      {
        id: '2',
        name: 'Roberto Silva',
        phone: '8098765432',
        vehicle: 'Camioneta Toyota Hilux',
        status: 'AVAILABLE',
        currentDeliveries: 0,
        totalDeliveries: 98,
        rating: 4.6
      },
      {
        id: '3',
        name: 'Luis Fernández',
        phone: '8094567890',
        vehicle: 'Motocicleta Yamaha FZ',
        status: 'OFFLINE',
        currentDeliveries: 0,
        totalDeliveries: 67,
        rating: 4.4
      }
    ]

    return NextResponse.json({ 
      success: true,
      drivers: mockDrivers
    })

  } catch (error) {
    console.error('Delivery drivers error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
