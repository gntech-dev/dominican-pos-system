'use client'

import { useRole } from '@/contexts/RoleContext'
import { useRouter } from 'next/navigation'

export default function AdvancedInventoryPage() {
  const { user } = useRole()
  const router = useRouter()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Advanced Inventory</h1>
          <p className="text-gray-600 mb-8">
            Advanced inventory management features are not yet implemented.
          </p>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              This module will include:
            </p>
            <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
              <li>• Inventory alerts and notifications</li>
              <li>• Supplier management</li>
              <li>• Purchase order tracking</li>
              <li>• Stock analytics</li>
              <li>• Automated reordering</li>
            </ul>
          </div>
          <div className="mt-8 space-x-4">
            <button
              onClick={() => router.push('/inventory')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Inventory
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
