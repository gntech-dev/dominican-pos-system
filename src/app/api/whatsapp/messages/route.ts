import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // In a real implementation, you would fetch from your database
    // For now, return mock data
    const mockMessages = [
      {
        id: '1',
        phone: '8091234567',
        customerName: 'María González',
        message: '¡Hola María! Tu pedido #VTA-001 ha sido confirmado por un total de RD$1,250.00',
        type: 'ORDER_CONFIRMATION',
        status: 'DELIVERED',
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString()
      },
      {
        id: '2',
        phone: '8297654321',
        customerName: 'Carlos Martínez',
        message: 'Hola Carlos, te recordamos que tienes una factura pendiente #FAC-002 por RD$850.00',
        type: 'PAYMENT_REMINDER',
        status: 'READ',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        sentAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]

    return NextResponse.json({ 
      success: true,
      messages: mockMessages
    })

  } catch (error) {
    console.error('WhatsApp messages error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { phone, message, type = 'SUPPORT' } = await request.json()

    if (!phone || !message) {
      return NextResponse.json({ 
        error: 'Teléfono y mensaje son requeridos' 
      }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Save message to database
    // 2. Send via WhatsApp Business API
    // 3. Update status based on API response

    const newMessage = {
      id: Date.now().toString(),
      phone,
      message,
      type,
      status: 'SENT',
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString()
    }

    return NextResponse.json({ 
      success: true,
      message: newMessage
    })

  } catch (error) {
    console.error('Send WhatsApp message error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
