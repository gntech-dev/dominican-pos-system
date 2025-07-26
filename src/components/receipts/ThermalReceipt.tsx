'use client'

import React from 'react'
import { formatCurrency, formatDateTime, formatRNC } from '@/utils/dominican-validators'

interface ThermalReceiptProps {
  receiptData: {
    sale: {
      id: string
      saleNumber: string
      ncf?: string
      ncfType?: string
      subtotal: number | string
      itbis: number | string
      total: number | string
      paymentMethod: string
      notes?: string
      createdAt: string
      items: Array<{
        quantity: number
        unitPrice: number | string
        total: number | string
        product: {
          name: string
          code: string
        }
      }>
    }
    business: {
      name: string
      rnc: string
      address: string
      phone: string
      email?: string
    }
    cashier: {
      firstName: string
      lastName: string
    }
    customer?: {
      name: string
      rnc?: string
      cedula?: string
    }
  }
  onPrint?: () => void
}

/**
 * Thermal Receipt Component for 80mm thermal printers
 * Compliant with Dominican Republic DGII requirements
 */
export default function ThermalReceipt({ receiptData, onPrint }: ThermalReceiptProps) {
  const { sale, business, cashier, customer } = receiptData

  const subtotal = typeof sale.subtotal === 'string' ? parseFloat(sale.subtotal) : sale.subtotal
  const itbis = typeof sale.itbis === 'string' ? parseFloat(sale.itbis) : sale.itbis
  const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total

  const handlePrint = () => {
    window.print()
    onPrint?.()
  }

  return (
    <div className="receipt-container max-w-xs mx-auto bg-white text-black font-mono text-xs leading-tight">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .receipt-container {
            max-width: none !important;
            width: 80mm !important;
            font-size: 11px !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      {/* Print Button - Only visible on screen */}
      <div className="no-print mb-4 text-center">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-sans"
        >
          🖨️ Imprimir Recibo
        </button>
      </div>

      {/* Receipt Content */}
      <div className="p-2 space-y-1">
        {/* Business Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="font-bold text-sm">{business.name.toUpperCase()}</div>
          <div className="text-xs">{business.address}</div>
          <div className="text-xs">Tel: {business.phone}</div>
          {business.email && <div className="text-xs">{business.email}</div>}
          <div className="text-xs font-semibold">RNC: {formatRNC(business.rnc)}</div>
        </div>

        {/* Sale Information */}
        <div className="space-y-1 border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="flex justify-between">
            <span>FACTURA:</span>
            <span className="font-bold">{sale.saleNumber}</span>
          </div>
          {sale.ncf && (
            <div className="flex justify-between">
              <span>NCF:</span>
              <span className="font-bold">{sale.ncf}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>FECHA:</span>
            <span>{formatDateTime(new Date(sale.createdAt))}</span>
          </div>
          <div className="flex justify-between">
            <span>CAJERO:</span>
            <span>{cashier.firstName} {cashier.lastName}</span>
          </div>
        </div>

        {/* Customer Information */}
        {customer && (
          <div className="space-y-1 border-b border-dashed border-gray-400 pb-2 mb-2">
            <div className="font-semibold">CLIENTE:</div>
            <div className="text-xs">{customer.name}</div>
            {customer.rnc && (
              <div className="text-xs">RNC: {formatRNC(customer.rnc)}</div>
            )}
            {customer.cedula && (
              <div className="text-xs">CEDULA: {customer.cedula}</div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="space-y-1 border-b border-dashed border-gray-400 pb-2 mb-2">
          <div className="font-semibold">ARTICULOS:</div>
          
          {sale.items.map((item, index) => {
            const itemUnitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice
            const itemTotal = typeof item.total === 'string' ? parseFloat(item.total) : item.total
            
            return (
              <div key={index} className="space-y-0.5">
                <div className="font-medium">{item.product.name}</div>
                <div className="flex justify-between text-xs">
                  <span>Cod: {item.product.code}</span>
                </div>
                <div className="flex justify-between">
                  <span>{item.quantity} x {formatCurrency(itemUnitPrice)}</span>
                  <span className="font-semibold">{formatCurrency(itemTotal)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>ITBIS (18%):</span>
            <span>{formatCurrency(itbis)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-400 pt-1 font-bold text-sm">
            <span>TOTAL:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="border-t border-dashed border-gray-400 pt-2 mt-2">
          <div className="flex justify-between">
            <span>PAGO:</span>
            <span className="font-semibold">
              {sale.paymentMethod === 'CASH' && 'EFECTIVO'}
              {sale.paymentMethod === 'CARD' && 'TARJETA'}
              {sale.paymentMethod === 'TRANSFER' && 'TRANSFERENCIA'}
              {sale.paymentMethod === 'CHECK' && 'CHEQUE'}
              {sale.paymentMethod === 'CREDIT' && 'CREDITO'}
            </span>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="border-t border-dashed border-gray-400 pt-2 mt-2">
            <div className="font-semibold">NOTAS:</div>
            <div className="text-xs">{sale.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center border-t border-dashed border-gray-400 pt-2 mt-2 space-y-1">
          <div className="text-xs">¡GRACIAS POR SU COMPRA!</div>
          <div className="text-xs">Sistema POS - República Dominicana</div>
          <div className="text-xs">Cumple con las normativas DGII</div>
        </div>

        {/* DGII Compliance Note */}
        {sale.ncf && (
          <div className="text-center mt-2 pt-2 border-t border-gray-400">
            <div className="text-xs font-semibold">COMPROBANTE FISCAL</div>
            <div className="text-xs">Válido como comprobante para deducciones y crédito fiscal</div>
          </div>
        )}
      </div>
    </div>
  )
}
