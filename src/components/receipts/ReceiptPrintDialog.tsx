import React, { useState, useRef } from 'react'
import { useReceiptPrint } from '@/hooks/useReceiptPrint'
import type { ReceiptData } from '@/types'

interface ReceiptPrintDialogProps {
  isOpen: boolean
  onClose: () => void
  saleId?: string
  receiptData?: ReceiptData
  title?: string
}

export default function ReceiptPrintDialog({
  isOpen,
  onClose,
  saleId,
  receiptData,
  title = 'Imprimir Recibo'
}: ReceiptPrintDialogProps) {
  const [printType, setPrintType] = useState<'thermal' | 'standard'>('thermal')
  const [copies, setCopies] = useState(1)
  const [showPreview, setShowPreview] = useState(false)
  const [currentReceiptData, setCurrentReceiptData] = useState<ReceiptData | null>(receiptData || null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const fetchedRef = useRef<string | null>(null)
  
  const {
    isPrinting,
    lastPrintError,
    fetchReceiptData,
    printReceiptWindow,
    clearError
  } = useReceiptPrint()

  // Reset fetched ref when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      fetchedRef.current = null
      setCurrentReceiptData(receiptData || null)
      setIsLoadingData(false)
      setShowPreview(false)
    }
  }, [isOpen, receiptData])

  // Fetch receipt data if only saleId is provided
  React.useEffect(() => {
    if (saleId && !receiptData && isOpen && !currentReceiptData && fetchedRef.current !== saleId) {
      fetchedRef.current = saleId
      setIsLoadingData(true)
      fetchReceiptData(saleId).then(data => {
        if (data) {
          setCurrentReceiptData(data)
        }
      }).catch(error => {
        console.error('Error fetching receipt data:', error)
      }).finally(() => {
        setIsLoadingData(false)
      })
    }
  }, [saleId, receiptData, isOpen])

  const handlePrint = async () => {
    if (!currentReceiptData) return

    let success = false
    
    try {
      // Use client-side printing with window.print()
      success = await printReceiptWindow(currentReceiptData)
      
      if (success && copies > 1) {
        // Print additional copies
        for (let i = 1; i < copies; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000)) // Delay between copies
          await printReceiptWindow(currentReceiptData)
        }
      }
      
      // Don't close dialog immediately - let user decide
      // if (success) {
      //   onClose()
      // }
    } catch (error) {
      console.error('Print error:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {lastPrintError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{lastPrintError}</p>
                  <button
                    onClick={clearError}
                    className="text-sm text-red-600 hover:text-red-500 underline mt-1"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {isLoadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-600">Cargando datos del recibo...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Print Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Impresión
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="printType"
                        value="thermal"
                        checked={printType === 'thermal'}
                        onChange={(e) => setPrintType(e.target.value as 'thermal' | 'standard')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">Impresora Térmica (80mm)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="printType"
                        value="standard"
                        checked={printType === 'standard'}
                        onChange={(e) => setPrintType(e.target.value as 'thermal' | 'standard')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">Impresora Estándar (A4)</span>
                    </label>
                  </div>
                </div>

                {/* Number of Copies */}
                <div>
                  <label htmlFor="copies" className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Copias
                  </label>
                  <input
                    type="number"
                    id="copies"
                    min="1"
                    max="5"
                    value={copies}
                    onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Print Information */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Información del Recibo</h4>
                  {saleId && (
                    <p className="text-sm text-gray-600">ID de Venta: {saleId}</p>
                  )}
                  {currentReceiptData && (
                    <>
                      <p className="text-sm text-gray-600">Factura: {currentReceiptData.sale.saleNumber}</p>
                      {currentReceiptData.sale.ncf && (
                        <p className="text-sm text-gray-600">NCF: {currentReceiptData.sale.ncf}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        Total: RD${currentReceiptData.sale.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setShowPreview(true)}
              disabled={!currentReceiptData || isLoadingData}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              👁️ Vista Previa
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting || !currentReceiptData || isLoadingData}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPrinting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Imprimiendo...
                </span>
              ) : isLoadingData ? (
                'Cargando...'
              ) : (
                '🖨️ Imprimir'
              )}
            </button>

            <button
              onClick={onClose}
              disabled={isPrinting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && currentReceiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Vista Previa del Recibo</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              {/* Receipt Preview Content */}
              <div className="font-mono text-sm bg-gray-50 p-4 rounded border">
                <div className="text-center mb-4">
                  <div className="font-bold">{currentReceiptData.business?.name || 'EMPRESA'}</div>
                  <div>RNC: {currentReceiptData.business?.rnc || 'N/A'}</div>
                  <div>{currentReceiptData.business?.address || ''}</div>
                  <div>Tel: {currentReceiptData.business?.phone || ''}</div>
                </div>
                
                <div className="border-t border-gray-300 my-3"></div>
                
                <div className="mb-3">
                  <div>Fecha: {new Date(currentReceiptData.sale.createdAt).toLocaleDateString('es-DO')}</div>
                  <div>Hora: {new Date(currentReceiptData.sale.createdAt).toLocaleTimeString('es-DO')}</div>
                  <div>Cajero: {currentReceiptData.sale.cashier?.firstName} {currentReceiptData.sale.cashier?.lastName}</div>
                  <div>Venta #: {currentReceiptData.sale.saleNumber}</div>
                  {currentReceiptData.sale.ncf && (
                    <div>NCF: {currentReceiptData.sale.ncf}</div>
                  )}
                </div>
                
                {currentReceiptData.sale.customer && (
                  <div className="mb-3">
                    <div>Cliente: {currentReceiptData.sale.customer.name}</div>
                    {currentReceiptData.sale.customer.rnc && (
                      <div>RNC: {currentReceiptData.sale.customer.rnc}</div>
                    )}
                  </div>
                )}
                
                <div className="border-t border-gray-300 my-3"></div>
                
                <div className="space-y-1">
                  {currentReceiptData.sale.items?.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <div className="flex-1">
                        <div>{item.product?.name || 'Producto'}</div>
                        <div className="text-xs">{item.quantity} x RD${item.unitPrice.toFixed(2)}</div>
                      </div>
                      <div>RD${item.total.toFixed(2)}</div>
                    </div>
                  )) || []}
                </div>
                
                <div className="border-t border-gray-300 my-3"></div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>RD${currentReceiptData.sale.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ITBIS (18%):</span>
                    <span>RD${currentReceiptData.sale.itbis.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-1">
                    <span>TOTAL:</span>
                    <span>RD${currentReceiptData.sale.total.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-300 my-3"></div>
                
                <div className="text-center">
                  <div>Método de Pago: {currentReceiptData.sale.paymentMethod}</div>
                  <div className="mt-2 text-xs">¡Gracias por su compra!</div>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => {
                    setShowPreview(false)
                    handlePrint()
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  🖨️ Imprimir
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
