'use client';

import React, { useState, useEffect } from 'react';

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

interface ReceiptModalProps {
  receiptData: ReceiptData;
  onClose: () => void;
  onEmailSent?: () => void;
  showInvoiceButton?: boolean;
  onShowInvoice?: () => void;
}

export default function ReceiptModal({ 
  receiptData, 
  onClose, 
  onEmailSent,
  showInvoiceButton = false,
  onShowInvoice 
}: ReceiptModalProps) {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState(receiptData.customer?.email || '');
  const [isEmailSending, setIsEmailSending] = useState(false);

  // Debug modal lifecycle
  useEffect(() => {
    console.log('ReceiptModal mounted with data:', receiptData);
    console.log('🧾 NCF value in receiptData:', receiptData.ncf);
    console.log('🧾 NCF type:', typeof receiptData.ncf);
    console.log('🧾 NCF length:', receiptData.ncf?.length);
    
    return () => {
      console.log('ReceiptModal unmounting');
    };
  }, []);

  // Debug when receiptData changes
  useEffect(() => {
    console.log('ReceiptModal receiptData changed:', receiptData);
  }, [receiptData]);

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

  const handleEmailInvoice = async () => {
    if (!emailAddress.trim()) {
      alert('Por favor ingrese una dirección de email válida');
      return;
    }

    setIsEmailSending(true);
    try {
      if (!receiptData.id) {
        alert('Error: ID de venta no disponible');
        setIsEmailSending(false);
        return;
      }

      const response = await fetch(`/api/receipts/${receiptData.id}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email: emailAddress })
      });

      if (response.ok) {
        alert('Factura enviada por email exitosamente');
        setIsEmailModalOpen(false);
        onEmailSent?.();
      } else {
        const error = await response.json();
        alert(`Error al enviar email: ${error.message}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error al enviar email');
    } finally {
      setIsEmailSending(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          console.log('Modal backdrop clicked, closing modal');
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => {
          // Prevent clicks on modal content from bubbling up
          e.stopPropagation();
        }}
      >
        {/* Receipt Content */}
        <div className="p-6 bg-white text-black font-mono" id="receipt-content">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
            <h2 className="text-xl font-bold text-black mb-2">RECIBO DE VENTA</h2>
            {receiptData.business?.name && (
              <div className="text-lg font-bold text-black">{receiptData.business.name}</div>
            )}
            {receiptData.business?.rnc && (
              <div className="text-sm text-black">RNC: {receiptData.business.rnc}</div>
            )}
            {receiptData.business?.address && (
              <div className="text-sm text-black">{receiptData.business.address}</div>
            )}
            {receiptData.business?.phone && (
              <div className="text-sm text-black">Tel: {receiptData.business.phone}</div>
            )}
          </div>

          {/* Transaction Info */}
          <div className="mb-4 text-sm text-black">
            <div className="flex justify-between">
              <span>Fecha:</span>
              <span>{formatDate(receiptData.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>NCF:</span>
              <span className="font-bold">{receiptData.ncf || 'SIN NCF'}</span>
            </div>
            <div className="flex justify-between">
              <span>Recibo #:</span>
              <span>{receiptData.saleNumber || (receiptData.id ? receiptData.id.substring(0, 8) : 'N/A')}</span>
            </div>
            {receiptData.cashierName && (
              <div className="flex justify-between">
                <span>Cajero:</span>
                <span>{receiptData.cashierName}</span>
              </div>
            )}
          </div>

          {/* Customer Info */}
          {receiptData.customer && (
            <div className="mb-4 text-sm text-black border-b border-gray-400 pb-2">
              <div className="font-bold">CLIENTE:</div>
              <div>{receiptData.customer.name}</div>
              {receiptData.customer.rnc && (
                <div>RNC: {receiptData.customer.rnc}</div>
              )}
            </div>
          )}

          {/* Items */}
          <div className="mb-4">
            <div className="border-b border-gray-400 pb-1 mb-2">
              <div className="flex justify-between text-sm font-bold text-black">
                <span>DESCRIPCIÓN</span>
                <span>TOTAL</span>
              </div>
            </div>
            
            {receiptData.items.map((item) => (
              <div key={item.id} className="mb-3 text-sm text-black">
                <div className="flex justify-between">
                  <span className="font-bold">{item.product.name}</span>
                  <span className="font-bold">RD$ {(item.totalPrice || item.quantity * Number(item.unitPrice)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-700">
                  <span>{item.quantity} x RD$ {Number(item.unitPrice).toFixed(2)}</span>
                  <span>Cód: {item.product.code}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t-2 border-gray-800 pt-2 text-black">
            <div className="flex justify-between text-sm">
              <span>SUBTOTAL:</span>
              <span>RD$ {Number(receiptData.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>ITBIS (18%):</span>
              <span>RD$ {Number(receiptData.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-400 pt-1 mt-1">
              <span>TOTAL:</span>
              <span>RD$ {Number(receiptData.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span>PAGO:</span>
              <span>{getPaymentMethodText(receiptData.paymentMethod)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-black mt-4 pt-3 border-t border-gray-400">
            <div className="font-bold">¡Gracias por su compra!</div>
            <div className="text-xs mt-1">Sistema POS - DGII</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg space-y-3">
          <div className="grid grid-cols-1 gap-3 mb-3">
            <button
              onClick={handleThermalPrint}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium flex items-center justify-center gap-2"
            >
              🧾 Imprimir Térmico 80mm
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
              disabled={!receiptData.customer?.email && !emailAddress}
            >
              📧 Enviar Email
            </button>
            {showInvoiceButton && onShowInvoice && (
              <button
                onClick={onShowInvoice}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                📄 Ver Factura DGII
              </button>
            )}
            <button
              onClick={onClose}
              className={`w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium ${showInvoiceButton ? 'sm:col-span-2' : ''}`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Enviar Factura por Email</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección de Email
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="cliente@email.com"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleEmailInvoice}
                disabled={isEmailSending || !emailAddress.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isEmailSending ? 'Enviando...' : 'Enviar'}
              </button>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
