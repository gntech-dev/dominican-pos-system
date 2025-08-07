'use client';

import React from 'react';

interface ReceiptItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  product: {
    name: string;
    code: string;
    description?: string;
  };
}

interface ReceiptData {
  id?: string;
  saleNumber?: string;
  ncf: string;
  createdAt: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashierName?: string;
  business?: {
    name?: string;
    rnc?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    slogan?: string;
  };
  customer?: {
    name: string;
    rnc?: string;
    email?: string;
  };
  items: ReceiptItem[];
}

interface ThermalReceiptModalProps {
  receiptData: ReceiptData;
  onClose: () => void;
}

export default function ThermalReceiptModal({ receiptData, onClose }: ThermalReceiptModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-DO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodText = (method: string) => {
    const methods: { [key: string]: string } = {
      'CASH': 'Efectivo',
      'CARD': 'Tarjeta',
      'TRANSFER': 'Transferencia',
      'CHECK': 'Cheque',
      'CREDIT': 'Crédito'
    };
    return methods[method] || method;
  };

  const handleThermalPrint = () => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Recibo Térmico</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { width: 80mm; font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; line-height: 1.4; margin: 0; padding: 3mm; background: white; color: #000; }
            .center { text-align: center; font-weight: bold; }
            .bold { font-weight: 900; font-size: 16px; }
            .line { border-bottom: 2px dashed #000; margin: 3px 0; }
            .double-line { border-bottom: 3px solid #000; margin: 5px 0; }
            .item-row { display: flex; justify-content: space-between; margin: 2px 0; font-weight: bold; }
            .item-desc { max-width: 45mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 900; }
            .right { text-align: right; font-weight: bold; }
            .small { font-size: 12px; font-weight: bold; }
            .large { font-size: 18px; font-weight: 900; }
            @media print { body { width: 80mm !important; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="center bold large">=== RECIBO DE VENTA ===</div>
          <div class="double-line"></div>
          
          ${receiptData.business?.name ? `
          <div class="center bold">${receiptData.business.name}</div>
          ${receiptData.business.rnc ? `<div class="center small">RNC: ${receiptData.business.rnc}</div>` : ''}
          ${receiptData.business.address ? `<div class="center small">${receiptData.business.address}</div>` : ''}
          ${receiptData.business.phone ? `<div class="center small">Tel: ${receiptData.business.phone}</div>` : ''}
          <div class="line"></div>
          ` : ''}
          
          <div class="center bold">NCF: ${receiptData.ncf}</div>
          <div class="center bold">${formatDate(receiptData.createdAt)}</div>
          <div class="center small">${receiptData.saleNumber || `Venta: ${receiptData.id ? receiptData.id.substring(0, 8) : 'N/A'}`}</div>
          ${receiptData.cashierName ? `<div class="center small">Cajero: ${receiptData.cashierName}</div>` : ''}
          
          <div class="line"></div>
          
          ${receiptData.customer ? `
          <div class="small">
            <div class="bold">CLIENTE:</div>
            <div class="bold">${receiptData.customer.name}</div>
            ${receiptData.customer.rnc ? `<div class="bold">RNC: ${receiptData.customer.rnc}</div>` : ''}
          </div>
          <div class="line"></div>
          ` : ''}
          
          <div class="bold large">== PRODUCTOS ==</div>
          <div class="line"></div>
          ${receiptData.items.map((item: any) => `
            <div style="margin: 3px 0;">
              <div class="item-desc bold large">${item.product.name}</div>
              <div class="item-row">
                <span class="bold">${item.quantity} x $${Number(item.unitPrice).toFixed(2)}</span>
                <span class="bold">$${(item.quantity * Number(item.unitPrice)).toFixed(2)}</span>
              </div>
              <div class="small">Cod: ${item.product.code}</div>
            </div>
            <div class="line"></div>
          `).join('')}
          
          <div class="double-line"></div>
          
          <div class="item-row large">
            <span class="bold">SUBTOTAL:</span>
            <span class="bold">$${Number(receiptData.subtotal).toFixed(2)}</span>
          </div>
          <div class="item-row large">
            <span class="bold">ITBIS (18%):</span>
            <span class="bold">$${Number(receiptData.tax).toFixed(2)}</span>
          </div>
          <div class="double-line"></div>
          <div class="item-row" style="font-size: 20px; font-weight: 900;">
            <span class="bold">TOTAL:</span>
            <span class="bold">$${Number(receiptData.total).toFixed(2)}</span>
          </div>
          
          <div class="double-line"></div>
          <div class="center bold">PAGO: ${getPaymentMethodText(receiptData.paymentMethod)}</div>
          
          <div class="line"></div>
          <div class="center small">
            <div class="bold">Gracias por su compra!</div>
            <div class="bold">Sistema POS - DGII</div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thermal Receipt Content */}
        <div className="p-4 bg-white text-black font-mono text-sm" id="thermal-receipt-content">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-2 mb-3">
            <h2 className="text-lg font-bold text-black mb-1">=== RECIBO DE VENTA ===</h2>
            {receiptData.business?.name && (
              <div className="text-base font-bold text-black">{receiptData.business.name}</div>
            )}
            {receiptData.business?.rnc && (
              <div className="text-xs text-black">RNC: {receiptData.business.rnc}</div>
            )}
            {receiptData.business?.address && (
              <div className="text-xs text-black">{receiptData.business.address}</div>
            )}
            {receiptData.business?.phone && (
              <div className="text-xs text-black">Tel: {receiptData.business.phone}</div>
            )}
          </div>

          {/* Transaction Info */}
          <div className="text-center mb-3 text-xs text-black">
            <div className="font-bold">NCF: {receiptData.ncf}</div>
            <div className="font-bold">{formatDate(receiptData.createdAt)}</div>
            <div>{receiptData.saleNumber || (receiptData.id ? receiptData.id.substring(0, 8) : 'N/A')}</div>
            {receiptData.cashierName && (
              <div>Cajero: {receiptData.cashierName}</div>
            )}
          </div>

          {/* Customer Info */}
          {receiptData.customer && (
            <div className="mb-3 text-xs text-black border-b border-gray-400 pb-2">
              <div className="font-bold">CLIENTE:</div>
              <div className="font-bold">{receiptData.customer.name}</div>
              {receiptData.customer.rnc && (
                <div className="font-bold">RNC: {receiptData.customer.rnc}</div>
              )}
            </div>
          )}

          {/* Items */}
          <div className="mb-3">
            <div className="text-center font-bold text-black mb-2">== PRODUCTOS ==</div>
            
            {receiptData.items.map((item) => (
              <div key={item.id} className="mb-2 pb-2 border-b border-gray-300">
                <div className="font-bold text-black text-sm">{item.product.name}</div>
                <div className="flex justify-between text-xs text-black">
                  <span className="font-bold">{item.quantity} x RD$ {Number(item.unitPrice).toFixed(2)}</span>
                  <span className="font-bold">RD$ {(item.totalPrice || item.quantity * Number(item.unitPrice)).toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-600">Cód: {item.product.code}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t-2 border-gray-800 pt-2 text-black">
            <div className="flex justify-between text-sm">
              <span className="font-bold">SUBTOTAL:</span>
              <span className="font-bold">RD$ {Number(receiptData.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-bold">ITBIS (18%):</span>
              <span className="font-bold">RD$ {Number(receiptData.tax).toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-gray-800 mt-1 pt-1"></div>
            <div className="flex justify-between text-base font-bold">
              <span>TOTAL:</span>
              <span>RD$ {Number(receiptData.total).toFixed(2)}</span>
            </div>
            <div className="text-center text-sm mt-2 font-bold">
              PAGO: {getPaymentMethodText(receiptData.paymentMethod)}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-black mt-3 pt-2 border-t border-gray-400">
            <div className="font-bold">¡Gracias por su compra!</div>
            <div>Sistema POS - DGII</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-4 py-3 rounded-b-lg">
          <div className="flex gap-3">
            <button
              onClick={handleThermalPrint}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium flex items-center justify-center gap-2"
            >
              🧾 Imprimir Térmico
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
