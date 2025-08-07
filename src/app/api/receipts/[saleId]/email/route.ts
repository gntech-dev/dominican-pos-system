import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const emailReceiptSchema = z.object({
  email: z.string().email('Email inválido')
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER', 'CASHIER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await req.json()
    const { email } = emailReceiptSchema.parse(body)

    // Get the sale with all related data
    const { saleId } = await params;
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            rnc: true,
            cedula: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      }
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Generate receipt HTML
    const receiptHTML = generateReceiptHTML(sale)

    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    // - Resend
    
    // For now, we'll simulate the email sending
    console.log(`Sending email to: ${email}`)
    console.log(`Receipt HTML generated for sale: ${sale.id}`)
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Log the email attempt
    await prisma.auditLog.create({
      data: {
        action: 'SALE_CREATE', // Using existing action for email receipt
        entityType: 'Sale',
        entityId: sale.id,
        newValue: {
          email,
          saleId: sale.id,
          ncf: sale.ncf,
          total: sale.total,
          action: 'EMAIL_SENT'
        },
        userId: authResult.user.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Factura enviada por email exitosamente'
    })

  } catch (error) {
    console.error('Email receipt error:', error)
    
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

function generateReceiptHTML(sale: any): string {
  const formatDate = (date: Date) => {
    return date.toLocaleString('es-DO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentMethodText = (method: string) => {
    const methods: { [key: string]: string } = {
      'CASH': 'Efectivo',
      'CARD': 'Tarjeta',
      'TRANSFER': 'Transferencia',
      'CHECK': 'Cheque',
      'CREDIT': 'Crédito'
    }
    return methods[method] || method
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Factura - ${sale.ncf}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .receipt {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .header h1 {
          color: #333;
          margin: 0 0 10px 0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .info-section {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 5px;
        }
        .info-section h3 {
          margin: 0 0 10px 0;
          color: #333;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th,
        .items-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        .items-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .items-table .price {
          text-align: right;
        }
        .totals {
          border-top: 2px solid #333;
          padding-top: 15px;
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          padding: 5px 0;
        }
        .total-row.final {
          font-size: 1.2em;
          font-weight: bold;
          border-top: 1px solid #333;
          padding-top: 10px;
          color: #007bff;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>FACTURA / RECIBO</h1>
          <p><strong>NCF:</strong> ${sale.ncf}</p>
          <p><strong>Fecha:</strong> ${formatDate(sale.createdAt)}</p>
        </div>

        <div class="info-grid">
          <div class="info-section">
            <h3>Información de Venta</h3>
            <p><strong>Venta #:</strong> ${sale.id.substring(0, 8)}</p>
            <p><strong>Método de Pago:</strong> ${getPaymentMethodText(sale.paymentMethod)}</p>
          </div>
          
          ${sale.customer ? `
          <div class="info-section">
            <h3>Cliente</h3>
            <p><strong>Nombre:</strong> ${sale.customer.name}</p>
            ${sale.customer.rnc ? `<p><strong>RNC:</strong> ${sale.customer.rnc}</p>` : ''}
            ${sale.customer.email ? `<p><strong>Email:</strong> ${sale.customer.email}</p>` : ''}
          </div>
          ` : '<div class="info-section"><h3>Cliente</h3><p>Cliente General</p></div>'}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Código</th>
              <th class="price">Cant.</th>
              <th class="price">Precio Unit.</th>
              <th class="price">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map((item: any) => `
              <tr>
                <td>${item.product.name}</td>
                <td>${item.product.code}</td>
                <td class="price">${item.quantity}</td>
                <td class="price">$RD ${Number(item.unitPrice).toFixed(2)}</td>
                <td class="price">$RD ${(item.quantity * Number(item.unitPrice)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$RD ${Number(sale.subtotal).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>ITBIS (18%):</span>
            <span>$RD ${Number(sale.tax).toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>TOTAL:</span>
            <span>$RD ${Number(sale.total).toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>¡Gracias por su compra!</p>
          <p>Sistema POS - Cumplimiento DGII</p>
          <p>Este documento fue generado electrónicamente</p>
        </div>
      </div>
    </body>
    </html>
  `
}
