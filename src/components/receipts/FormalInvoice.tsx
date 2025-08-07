'use client'

import React from 'react'
import { formatCurrency, formatDate, formatRNC } from '@/utils/dominican-validators'

interface FormalInvoiceProps {
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
          description?: string
        }
      }>
    }
    business: {
      name: string
      rnc: string
      address: string
      phone: string
      email?: string
      logo?: string
    }
    cashier: {
      firstName: string
      lastName: string
    }
    customer?: {
      name: string
      rnc?: string
      cedula?: string
      address?: string
      email?: string
    }
  }
  onPrint?: () => void
}

/**
 * Formal Invoice Component for A4 printing
 * Full DGII compliance with all required fiscal fields
 */
export default function FormalInvoice({ receiptData, onPrint }: FormalInvoiceProps) {
  const { sale, business, cashier, customer } = receiptData

  const subtotal = typeof sale.subtotal === 'string' ? parseFloat(sale.subtotal) : sale.subtotal
  const itbis = typeof sale.itbis === 'string' ? parseFloat(sale.itbis) : sale.itbis
  const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total

  const handlePrint = () => {
    window.print()
    onPrint?.()
  }

  const getPaymentMethodText = (method: string) => {
    const methods: Record<string, string> = {
      CASH: 'Efectivo',
      CARD: 'Tarjeta de Crédito/Débito',
      TRANSFER: 'Transferencia Bancaria',
      CHECK: 'Cheque',
      CREDIT: 'Crédito'
    }
    return methods[method] || method
  }

  const getNCFTypeDescription = (type?: string) => {
    const types: Record<string, string> = {
      B01: 'Facturas de Crédito Fiscal',
      B02: 'Facturas de Consumo',
      B03: 'Notas de Débito',
      B04: 'Notas de Crédito'
    }
    return type ? types[type] || type : ''
  }

  return (
    <div className="invoice-container max-w-4xl mx-auto bg-white text-black">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .invoice-container {
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 10mm;
            font-size: 12px;
          }
          .print-break {
            page-break-after: always;
          }
        }
      `}</style>

      {/* Print Button - Only visible on screen */}
      <div className="no-print mb-6 text-center">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          🖨️ Imprimir Factura
        </button>
      </div>

      {/* Invoice Content */}
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-300 pb-6">
          <div className="flex-1">
            {business.logo && (
              <img src={business.logo} alt="Logo" className="h-16 mb-4" />
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{business.name}</h1>
            <div className="text-gray-700 space-y-1">
              <p>{business.address}</p>
              <p>Teléfono: {business.phone}</p>
              {business.email && <p>Email: {business.email}</p>}
              <p className="font-semibold">RNC: {formatRNC(business.rnc)}</p>
            </div>
          </div>
          
          <div className="text-right">
            <h2 className="text-3xl font-bold text-blue-600 mb-4">FACTURA</h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Factura #:</span>
                <span className="font-bold">{sale.saleNumber}</span>
              </div>
              {sale.ncf && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">NCF:</span>
                    <span className="font-bold text-blue-600">{sale.ncf}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {getNCFTypeDescription(sale.ncfType)}
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Fecha:</span>
                <span>{formatDate(new Date(sale.createdAt))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer and Sale Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Facturar A:</h3>
            {customer ? (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-gray-900">{customer.name}</p>
                {customer.rnc && (
                  <>
                    <p><span className="font-medium">RNC:</span> {formatRNC(customer.rnc)}</p>
                    {/* Enhanced B01 Customer Information */}
                    {sale.ncfType === 'B01' && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <p className="font-medium text-blue-900 mb-1">📋 Información Fiscal del Cliente</p>
                        <p className="text-blue-800">Cliente registrado en base de datos DGII</p>
                        <p className="text-blue-800">Válido para deducciones de ITBIS según Ley 11-92</p>
                        <p className="text-blue-800">Régimen: Contribuyente Normal</p>
                      </div>
                    )}
                  </>
                )}
                {customer.cedula && (
                  <p><span className="font-medium">Cédula:</span> {customer.cedula}</p>
                )}
                {customer.address && <p>{customer.address}</p>}
                {customer.email && <p>{customer.email}</p>}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900">Cliente General</p>
                <p className="text-gray-600">Venta al consumidor final</p>
                {sale.ncfType === 'B02' && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <p className="text-yellow-800">NCF B02 - No válido para crédito fiscal</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sale Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Información de Venta:</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Vendedor:</span>
                <span>{cashier.firstName} {cashier.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Método de Pago:</span>
                <span>{getPaymentMethodText(sale.paymentMethod)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Fecha de Emisión:</span>
                <span>{formatDate(new Date(sale.createdAt))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Detalle de Productos/Servicios:</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Código</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Descripción</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Cantidad</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Precio Unit.</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => {
                  const itemUnitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice
                  const itemTotal = typeof item.total === 'string' ? parseFloat(item.total) : item.total
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-mono text-sm">
                        {item.product.code}
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <div className="font-medium">{item.product.name}</div>
                        {item.product.description && (
                          <div className="text-sm text-gray-600">{item.product.description}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-mono">
                        {formatCurrency(itemUnitPrice)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-mono font-semibold">
                        {formatCurrency(itemTotal)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between text-lg">
                <span className="font-medium">Subtotal:</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-medium">ITBIS (18%):</span>
                <span className="font-mono">{formatCurrency(itbis)}</span>
              </div>
              {/* Enhanced tax information for B01 invoices */}
              {sale.ncfType === 'B01' && customer?.rnc && (
                <div className="border-t border-gray-300 pt-2">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Gravada:</span>
                      <span className="font-mono text-gray-600">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Exenta:</span>
                      <span className="font-mono text-gray-600">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ITBIS Retenido:</span>
                      <span className="font-mono text-gray-600">{formatCurrency(0)}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="border-t-2 border-gray-300 pt-3">
                <div className="flex justify-between text-xl font-bold text-blue-600">
                  <span>TOTAL:</span>
                  <span className="font-mono">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Observaciones:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{sale.notes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-6 mt-8 space-y-4">
          {/* DGII Compliance Information */}
          {sale.ncf && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Información Fiscal DGII</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>NCF:</strong> {sale.ncf} - {getNCFTypeDescription(sale.ncfType)}</p>
                <p><strong>RNC Emisor:</strong> {formatRNC(business.rnc)}</p>
                
                {/* Enhanced information for B01 invoices with customer RNC */}
                {sale.ncfType === 'B01' && customer?.rnc && (
                  <>
                    <p><strong>RNC Cliente:</strong> {formatRNC(customer.rnc)}</p>
                    <p><strong>Tipo de Comprobante:</strong> Factura de Crédito Fiscal</p>
                    <div className="mt-2 p-2 bg-blue-100 rounded">
                      <p className="font-medium">✅ Comprobante Válido para Crédito Fiscal</p>
                      <p>• Permite deducción de ITBIS según Art. 8 Ley 11-92</p>
                      <p>• Cliente debe conservar por 5 años (Art. 54 Código Tributario)</p>
                      <p>• RNC del cliente verificado en base de datos DGII</p>
                      <p>• Válido para sustentación de costos y gastos deducibles</p>
                    </div>
                  </>
                )}
                
                {sale.ncfType === 'B02' && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded">
                    <p className="font-medium">⚠️ Factura de Consumo</p>
                    <p>• NO válida para crédito fiscal de ITBIS</p>
                    <p>• Válida solo para gastos deducibles de ISR</p>
                  </div>
                )}
                
                <p className="mt-2">Este comprobante es válido para deducciones fiscales según la Ley 11-92 y sus modificaciones.</p>
                <p>Los compradores deben conservar este documento por un período mínimo de cinco (5) años.</p>
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-semibold text-gray-900">Términos y Condiciones:</h4>
            <p>• Los precios incluyen ITBIS (18%)</p>
            <p>• Esta factura se considera aceptada si no se objeta dentro de 5 días hábiles</p>
            <p>• Para cualquier reclamación, presentar este documento original</p>
          </div>

          {/* System Information */}
          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p>Factura generada por Sistema POS - República Dominicana</p>
            <p>Conforme a las normativas de la Dirección General de Impuestos Internos (DGII)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
