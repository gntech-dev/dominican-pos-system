import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ReceiptData } from '@/types'

/**
 * GET /api/receipts/[saleId] - Get receipt data for a sale
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const { saleId } = await params;
    console.log('Receipt API - Received saleId:', saleId);
    console.log('Receipt API - saleId type:', typeof saleId);
    
    if (!saleId || saleId === 'undefined') {
      console.log('Receipt API - Invalid saleId:', saleId);
      return NextResponse.json(
        { error: 'ID de venta inválido' },
        { status: 400 }
      )
    }

    // Fetch sale with all related data
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true,
        cashier: true
      }
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Get business information from database settings
    const businessSettings = await prisma.businessSettings.findFirst({
      where: {
        isDefault: true,
        isActive: true
      }
    })

    if (!businessSettings) {
      return NextResponse.json(
        { error: 'No se encontraron configuraciones del negocio' },
        { status: 500 }
      )
    }

    const businessInfo = {
      name: businessSettings.name,
      rnc: businessSettings.rnc,
      address: businessSettings.address,
      phone: businessSettings.phone,
      email: businessSettings.email,
      website: businessSettings.website || undefined,
      slogan: businessSettings.slogan || undefined
    }

    // Format receipt data
    const receiptData: ReceiptData = {
      business: businessInfo,
      sale: {
        id: sale.id,
        saleNumber: sale.saleNumber,
        ncf: sale.ncf || undefined,
        ncfType: sale.ncfType || undefined,
        subtotal: parseFloat(sale.subtotal.toString()),
        itbis: parseFloat(sale.itbis.toString()),
        total: parseFloat(sale.total.toString()),
        paymentMethod: sale.paymentMethod,
        status: sale.status,
        notes: sale.notes || undefined,
        cashierId: sale.cashierId,
        customerId: sale.customerId || undefined,
        ncfSequenceId: sale.ncfSequenceId || undefined,
        createdAt: sale.createdAt.toISOString(),
        updatedAt: sale.updatedAt.toISOString(),
        items: sale.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice.toString()),
          total: parseFloat(item.total.toString()),
          saleId: item.saleId,
          productId: item.productId,
          createdAt: item.createdAt,
          product: {
            ...item.product,
            description: item.product.description || undefined,
            price: parseFloat(item.product.price.toString()),
            cost: item.product.cost ? parseFloat(item.product.cost.toString()) : undefined,
            categoryId: item.product.categoryId || undefined
          }
        }))
      },
      cashier: {
        firstName: sale.cashier.firstName,
        lastName: sale.cashier.lastName
      },
      customer: sale.customer ? {
        name: sale.customer.name,
        rnc: sale.customer.rnc || undefined,
        cedula: sale.customer.cedula || undefined,
        address: sale.customer.address || undefined,
        email: sale.customer.email || undefined
      } : ((sale as any).customerRnc && (sale as any).customerName) ? {
        // Walk-in customer data
        name: (sale as any).customerName as string,
        rnc: (sale as any).customerRnc as string,
        cedula: undefined,
        address: undefined,
        email: undefined
      } : undefined,
      // Backward compatibility fields
      cashierName: `${sale.cashier.firstName} ${sale.cashier.lastName}`,
      customerName: sale.customer?.name || (sale as any).customerName as string | undefined,
      customerRnc: sale.customer?.rnc || (sale as any).customerRnc as string | undefined
    }

    return NextResponse.json(receiptData)
  } catch (error) {
    console.error('Error fetching receipt data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
