import { useState } from 'react'
import { formatDominicanDate, formatDominicanTime } from '@/utils/date-helpers'
import type { ReceiptData } from '@/types'

export interface UseReceiptPrintOptions {
  autoReprint?: boolean
  defaultPrintType?: 'thermal' | 'standard'
}

export function useReceiptPrint(options: UseReceiptPrintOptions = {}) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [lastPrintError, setLastPrintError] = useState<string | null>(null)

  /**
   * Fetch receipt data for a sale
   */
  const fetchReceiptData = async (saleId: string): Promise<ReceiptData | null> => {
    try {
      const response = await fetch(`/api/receipts/${saleId}`)
      if (!response.ok) {
        throw new Error('Error al obtener datos del recibo')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching receipt data:', error)
      setLastPrintError(error instanceof Error ? error.message : 'Error desconocido')
      return null
    }
  }

  /**
   * Print a receipt using browser's print API (client-side only)
   */
  const printReceipt = async (
    receiptData: ReceiptData, 
    printType: 'thermal' | 'standard' = options.defaultPrintType || 'thermal'
  ): Promise<boolean> => {
    setIsPrinting(true)
    setLastPrintError(null)

    try {
      // Use client-side printing only
      const success = await printReceiptWindow(receiptData)
      return success
    } catch (error) {
      console.error('Error printing receipt:', error)
      setLastPrintError(error instanceof Error ? error.message : 'Error al imprimir')
      return false
    } finally {
      setIsPrinting(false)
    }
  }

  /**
   * Print receipt using browser window (fallback)
   */
  const printReceiptWindow = async (receiptData: ReceiptData): Promise<boolean> => {
    try {
      setIsPrinting(true)
      setLastPrintError(null)

      // Generate receipt HTML
      const receiptHTML = generateReceiptHTML(receiptData)
      
      // Create a blob URL for the receipt HTML
      const blob = new Blob([receiptHTML], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      // Open print window
      const printWindow = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes')
      if (!printWindow) {
        throw new Error('No se pudo abrir ventana de impresión. Verifique que no esté bloqueado por el navegador.')
      }

      // Return promise that resolves when printing is complete
      return new Promise((resolve) => {
        let hasResolved = false
        
        const handleLoad = () => {
          if (hasResolved) return
          
          try {
            setTimeout(() => {
              if (hasResolved) return
              printWindow.print()
              
              // Wait for user to complete print dialog
              setTimeout(() => {
                if (!hasResolved) {
                  hasResolved = true
                  printWindow.close()
                  URL.revokeObjectURL(url)
                  resolve(true)
                }
              }, 3000) // Give user time with print dialog
            }, 500)
          } catch (printError) {
            console.error('Print dialog error:', printError)
            if (!hasResolved) {
              hasResolved = true
              printWindow.close()
              URL.revokeObjectURL(url)
              resolve(false)
            }
          }
        }
        
        // Listen for window load
        printWindow.addEventListener('load', handleLoad)
        
        // Fallback in case load event doesn't fire
        setTimeout(() => {
          if (!hasResolved) {
            handleLoad()
          }
        }, 1000)
        
        // Fallback timeout to prevent hanging
        setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true
            printWindow.close()
            URL.revokeObjectURL(url)
            resolve(true) // Consider it successful even if we timeout
          }
        }, 10000)
      })
    } catch (error) {
      console.error('Error with window printing:', error)
      setLastPrintError(error instanceof Error ? error.message : 'Error al imprimir')
      return false
    } finally {
      setIsPrinting(false)
    }
  }

  /**
   * Generate HTML for receipt printing
   */
  const generateReceiptHTML = (receiptData: ReceiptData): string => {
    const { sale, business, cashierName, customerName, customerRnc } = receiptData
    
    // Auto-detect logo for thermal receipt printing
    const logoHTML = `
      <script>
        async function detectAndInsertLogo() {
          const logoFormats = ['png', 'jpg', 'jpeg', 'svg'];
          for (const format of logoFormats) {
            try {
              const response = await fetch('/logo.' + format, { method: 'HEAD' });
              if (response.ok) {
                const logoImg = document.createElement('img');
                logoImg.src = '/logo.' + format;
                logoImg.style.maxWidth = '60mm';
                logoImg.style.height = '15mm';
                logoImg.style.objectFit = 'contain';
                logoImg.style.display = 'block';
                logoImg.style.margin = '0 auto 2mm auto';
                
                const headerElement = document.querySelector('.business-header');
                if (headerElement) {
                  headerElement.insertBefore(logoImg, headerElement.firstChild);
                }
                return;
              }
            } catch (error) {
              continue;
            }
          }
        }
        detectAndInsertLogo();
      </script>
    `;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo - ${sale.saleNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            line-height: 1.2; 
            margin: 0; 
            padding: 2mm; 
            width: 72mm; 
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .large { font-size: 14px; }
          .separator { border-bottom: 1px dashed #000; margin: 2mm 0; }
          .no-margin { margin: 0; }
          .small { font-size: 10px; }
          table { width: 100%; border-collapse: collapse; }
          .item-row { border-bottom: 1px dotted #ccc; }
          .totals { border-top: 2px solid #000; margin-top: 5mm; }
          .business-header { text-align: center; margin-bottom: 3mm; }
        </style>
        ${logoHTML}
      </head>
      <body onload="window.print(); window.close();">
        <div class="business-header">
          <div class="bold large">${business.name}</div>
          <div class="small">${business.address}</div>
          <div class="small">Tel: ${business.phone}</div>
          <div class="small">RNC: ${business.rnc}</div>
        </div>
        
        <div class="separator"></div>
        
        <div>
          <div class="bold">FACTURA: ${sale.saleNumber}</div>
          ${sale.ncf ? `<div>NCF: ${sale.ncf}</div>` : ''}
          <div>FECHA: ${formatDominicanDate(sale.createdAt)}</div>
          <div>HORA: ${formatDominicanTime(sale.createdAt)}</div>
          ${customerName ? `<div>CLIENTE: ${customerName}</div>` : ''}
          ${customerRnc ? `<div>RNC: ${customerRnc}</div>` : ''}
          <div>VENDEDOR: ${cashierName}</div>
        </div>
        
        <div class="separator"></div>
        
        <table>
          ${sale.items?.map(item => `
            <tr class="item-row">
              <td colspan="3" class="bold">${item.product?.name || ''}</td>
            </tr>
            <tr class="item-row">
              <td>${item.quantity}</td>
              <td>x ${typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : item.unitPrice}</td>
              <td style="text-align: right;">${typeof item.total === 'number' ? item.total.toFixed(2) : item.total}</td>
            </tr>
          `).join('') || ''}
        </table>
        
        <div class="totals">
          <table>
            <tr>
              <td>SUBTOTAL:</td>
              <td style="text-align: right;">RD$${typeof sale.subtotal === 'number' ? sale.subtotal.toFixed(2) : sale.subtotal}</td>
            </tr>
            <tr>
              <td>ITBIS (18%):</td>
              <td style="text-align: right;">RD$${typeof sale.itbis === 'number' ? sale.itbis.toFixed(2) : sale.itbis}</td>
            </tr>
            <tr class="bold large">
              <td>TOTAL:</td>
              <td style="text-align: right;">RD$${typeof sale.total === 'number' ? sale.total.toFixed(2) : sale.total}</td>
            </tr>
            <tr>
              <td>PAGO:</td>
              <td style="text-align: right;">${getPaymentMethodText(sale.paymentMethod.toString())}</td>
            </tr>
          </table>
        </div>
        
        <div class="separator"></div>
        
        <div class="center small">
          <div>¡GRACIAS POR SU COMPRA!</div>
          <div>Sistema POS - República Dominicana</div>
          <div>${formatDominicanDate(new Date())} ${formatDominicanTime(new Date())}</div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Get payment method display text
   */
  const getPaymentMethodText = (method: string): string => {
    const methods: Record<string, string> = {
      'CASH': 'Efectivo',
      'CARD': 'Tarjeta',
      'TRANSFER': 'Transferencia',
      'CHECK': 'Cheque',
      'CREDIT': 'Crédito'
    }
    return methods[method] || method
  }

  /**
   * Print receipt by sale ID
   */
  const printReceiptBySaleId = async (
    saleId: string, 
    printType: 'thermal' | 'standard' = options.defaultPrintType || 'thermal'
  ): Promise<boolean> => {
    const receiptData = await fetchReceiptData(saleId)
    if (!receiptData) {
      return false
    }

    return await printReceipt(receiptData, printType)
  }

  /**
   * Clear the last print error
   */
  const clearError = () => {
    setLastPrintError(null)
  }

  return {
    isPrinting,
    lastPrintError,
    fetchReceiptData,
    printReceipt,
    printReceiptBySaleId,
    printReceiptWindow,
    clearError
  }
}
