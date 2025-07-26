import { NextRequest, NextResponse } from 'next/server'
import { printReceipt } from '@/utils/print-utils'

/**
 * POST /api/receipts/print - Print a receipt
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { receiptData, printType } = body

    if (!receiptData) {
      return NextResponse.json(
        { error: 'Datos de recibo requeridos' },
        { status: 400 }
      )
    }

    // Print the receipt
    const success = await printReceipt(receiptData, printType)

    if (success) {
      return NextResponse.json({ 
        message: 'Recibo impreso exitosamente',
        success: true 
      })
    } else {
      return NextResponse.json(
        { error: 'Error al imprimir el recibo' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error printing receipt:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
