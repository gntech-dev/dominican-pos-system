'use client'

import { useRole } from '@/contexts/RoleContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ExpenseManagement from '@/components/finance/ExpenseManagement'

export default function ExpensesPage() {
  const { user, loading } = useRole()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Only allow ADMIN and MANAGER roles
    if (user && !['ADMIN', 'MANAGER'].includes(user.role)) {
      router.push('/dashboard')
      return
    }
  }, [user, loading, router])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando gestión de gastos...</p>
        </div>
      </div>
    )
  }

  if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ExpenseManagement />
    </div>
  )
}
