'use client'

import { useEffect, useState } from 'react'
import LogoSection from '@/components/ui/LogoSection'

interface ReceiptData {
  business: {
    name: string
    logo?: string
  }
}

export default function TestReceipt() {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  useEffect(() => {
    fetch('/api/receipts/cme25x7by00017a0yw7pyg925', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    })
    .then(res => res.json())
    .then(data => {
      console.log('Receipt data:', data)
      setReceiptData(data)
    })
    .catch(err => console.error('Error:', err))
  }, [])

  if (!receiptData) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Receipt Logo Test</h1>
      
      <div className="mb-4">
        <h2 className="text-lg mb-2">Business Logo from API: {receiptData.business.logo}</h2>
        <LogoSection 
          businessLogo={receiptData.business.logo} 
          className="h-16 mb-4" 
          size="medium"
          fallbackText={receiptData.business.name}
          showFallback={true}
        />
      </div>

      <div className="mb-4">
        <h2 className="text-lg mb-2">Small Size (thermal receipt style):</h2>
        <LogoSection 
          businessLogo={receiptData.business.logo} 
          className="h-8 mb-1 justify-center" 
          size="small"
          fallbackText={receiptData.business.name}
          showFallback={true}
        />
      </div>

      <div className="mb-4">
        <h2 className="text-lg mb-2">Large Size (invoice style):</h2>
        <LogoSection 
          businessLogo={receiptData.business.logo} 
          className="h-20 mb-4" 
          size="large"
          fallbackText={receiptData.business.name}
          showFallback={true}
        />
      </div>
    </div>
  )
}
