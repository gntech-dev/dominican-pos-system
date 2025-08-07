/**
 * @file Product Performance Analytics Page
 * @description Protected page for product performance analytics with role-based access
 */

'use client'

import { useRole } from '@/contexts/RoleContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ProductPerformanceAnalysis from '@/components/analytics/ProductPerformanceAnalysis'

export default function ProductPerformanceAnalyticsPage() {
  const { user, loading } = useRole()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !['ADMIN', 'MANAGER', 'REPORTER'].includes(user.role))) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !['ADMIN', 'MANAGER', 'REPORTER'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You don't have permission to view product analytics.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Product Performance Analytics</h1>
                <p className="text-sm text-gray-600">Role: {user.role} | User: {user.email}</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Analytics Dashboard
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductPerformanceAnalysis />
      </div>
    </div>
  )
}
