import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Mock templates for now
    const mockTemplates = [
      {
        id: '1',
        name: 'Confirmación de Pedido',
        type: 'ORDER_CONFIRMATION',
        template: '¡Hola {{customer_name}}! Tu pedido #{{order_number}} ha sido confirmado por un total de RD${{total}}. Será procesado en breve. ¡Gracias por tu compra!',
        variables: ['customer_name', 'order_number', 'total']
      },
      {
        id: '2',
        name: 'Recordatorio de Pago',
        type: 'PAYMENT_REMINDER',
        template: 'Hola {{customer_name}}, te recordamos que tienes una factura pendiente #{{invoice_number}} por RD${{amount}}. Por favor procede con el pago.',
        variables: ['customer_name', 'invoice_number', 'amount']
      },
      {
        id: '3',
        name: 'Promoción Especial',
        type: 'PROMOTION',
        template: '🎉 ¡Oferta especial para ti {{customer_name}}! {{promotion_details}} Válida hasta {{expiry_date}}. ¡No te la pierdas!',
        variables: ['customer_name', 'promotion_details', 'expiry_date']
      }
    ]

    return NextResponse.json({ 
      success: true,
      templates: mockTemplates
    })

  } catch (error) {
    console.error('WhatsApp templates error:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
