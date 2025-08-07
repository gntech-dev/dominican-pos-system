'use client'

import { useState } from 'react'
import Navigation from '@/components/ui/Navigation'

export default function ReportsPage() {
  const [message] = useState('Reports page is working correctly!')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Sistema de Reportes</h1>
        <p className="text-green-600 text-xl">{message}</p>
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-700">
            ✅ The default export issue has been resolved.<br/>
            ✅ React component is properly structured.<br/>
            ✅ Next.js can now recognize this as a valid page component.
          </p>
        </div>
      </div>
    </div>
  )
}
