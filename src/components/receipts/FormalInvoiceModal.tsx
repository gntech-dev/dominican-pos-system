'use client';

import React, { useState, useEffect } from 'react';
import FormalInvoice from './FormalInvoice';
import { ReceiptData } from '@/types';

interface FormalInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
}

export default function FormalInvoiceModal({ 
  isOpen, 
  onClose, 
  saleId 
}: FormalInvoiceModalProps) {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReceiptData = async () => {
    if (!saleId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/receipts/${saleId}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('FormalInvoiceModal - Receipt data received:', data)
      console.log('FormalInvoiceModal - Customer data:', data.customer)
      setReceiptData(data)
    } catch (err) {
      console.error('Error fetching receipt data:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && saleId) {
      fetchReceiptData()
    }
  }, [isOpen, saleId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Factura Formal</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4">
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">Cargando datos de la factura...</div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Error: {error}
            </div>
          )}
          
          {receiptData && !isLoading && (
            <FormalInvoice receiptData={receiptData} />
          )}
        </div>
      </div>
    </div>
  )
}
