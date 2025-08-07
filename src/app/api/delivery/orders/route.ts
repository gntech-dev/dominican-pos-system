import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Mock delivery orders for now
    const mockOrders = [
      {
        id: '1',
        orderId: 'VTA-001',
        customerName: 'María González',
        customerPhone: '8091234567',
        customerAddress: 'Av. Winston Churchill, Torre Empresarial, Piso 15, Santo Domingo',
        customerCoordinates: { lat: 18.4861, lng: -69.9312 },
        items: [
          { name: 'Laptop Dell', quantity: 1, price: 35000 },
          { name: 'Mouse Inalámbrico', quantity: 2, price: 1500 }
        ],
        total: 38000,
        status: 'ASSIGNED',
        driverId: '1',
        driverName: 'Carlos Martínez',
        driverPhone: '8097654321',
        estimatedDelivery: new Date(Date.now() + 3600000).toISOString(),
        notes: 'Llamar al llegar al lobby',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 900000).toISOString()
      },
      {
        id: '2',
        orderId: 'VTA-002',
        customerName: 'Juan Pérez',
        customerPhone: '8293456789',
        customerAddress: 'C/ Máximo Gómez #45, Gazcue, Santo Domingo',
        items: [
          { name: 'Monitor Samsung 24"', quantity: 1, price: 18500 },
          { name: 'Teclado Mecánico', quantity: 1, price: 4500 }
        ],
        total: 23000,
        status: 'PENDING',
        notes: 'Entregar en horario de oficina (9am-5pm)',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        orderId: 'VTA-003',
        customerName: 'Ana Rodríguez',
        customerPhone: '8495678901',
        customerAddress: 'Plaza Central, Local 23B, Santiago',
        items: [
          { name: 'Impresora Canon', quantity: 1, price: 12500 }
        ],
        total: 12500,
        status: 'DELIVERED',
        driverId: '2',
        driverName: 'Roberto Silva',
        driverPhone: '8098765432',
        actualDelivery: new Date(Date.now() - 7200000).toISOString(),
        createdAt: new Date(Date.now() - 21600000).toISOString(),
        updatedAt: new Date(Date.now() - 7200000).toISOString()
      }
    ]

    return NextResponse.json({ 
      success: true,
      orders: mockOrders
    })

  } catch (error) {
    console.error('Delivery orders error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
