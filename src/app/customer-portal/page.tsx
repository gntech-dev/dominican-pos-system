// Placeholder page for customer portal
// This component is not yet implemented but is reserved for future use

'use client'

import Link from 'next/link'

export default function CustomerPortalPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Customer Portal</h1>
        <p className="text-gray-600 mb-6">
          This feature is not yet implemented.
        </p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
