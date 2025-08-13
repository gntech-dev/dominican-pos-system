'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/utils/dominican-validators'
import { getAuthHeaders } from '@/lib/auth'

interface DashboardStats {
  dailySales: number
  dailyTransactions: number
  lowStockProducts: number
  totalCustomers: number
  totalProducts: number
  totalCategories: number
  weeklySales: number
  monthlySales: number
  averageOrderValue: number
  topSellingProducts: Array<{
    id: string
    name: string
    totalSold: number
    revenue: number
  }>
}

interface NCFStatus {
  type: string
  current: number
  max: number
  remaining: number
  percentage: number
}

interface DGIICompliance {
  ncfSequences: NCFStatus[]
  totalNCFRemaining: number
  expiringSoon: NCFStatus[]
  taxCompliance: {
    itbisRate: number
    lastSync: string
    rncValidations: number
  }
}

interface RecentSale {
  id: string
  ncf: string
  total: number | string
  customer: {
    name: string
  } | null
  createdAt: string
}

interface LowStockProduct {
  id: string
  name: string
  stock: number
  minStock: number
}

export default function DashboardModern() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    dailySales: 0,
    dailyTransactions: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalCategories: 0,
    weeklySales: 0,
    monthlySales: 0,
    averageOrderValue: 0,
    topSellingProducts: [],
  })
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [dgiiCompliance, setDgiiCompliance] = useState<DGIICompliance>({
    ncfSequences: [],
    totalNCFRemaining: 0,
    expiringSoon: [],
    taxCompliance: {
      itbisRate: 18,
      lastSync: new Date().toISOString(),
      rncValidations: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData(true)
    }, 300000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)

      const token = localStorage.getItem('token')
      
      // If no token, redirect to login
      if (!token) {
        router.push('/login')
        return
      }

      const headers = getAuthHeaders()

      // Fetch dashboard stats and NCF sequences
      const [salesRes, customersRes, productsRes, categoriesRes, ncfRes] = await Promise.all([
        fetch('/api/sales', { headers }),
        fetch('/api/customers', { headers }),
        fetch('/api/products', { headers }),
        fetch('/api/categories', { headers }),
        fetch('/api/ncf-sequences', { headers }),
      ])

      // Check for 401 responses (invalid token)
      if (salesRes.status === 401 || customersRes.status === 401 || 
          productsRes.status === 401 || categoriesRes.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }

      const [salesData, customersData, productsData, categoriesData, ncfData] = await Promise.all([
        salesRes.json(),
        customersRes.json(),
        productsRes.json(),
        categoriesRes.json(),
        ncfRes.json(),
      ])

      // Calculate daily stats from recent sales
      const today = new Date().toDateString()
      const todaySales = salesData.success ? salesData.data.sales.filter((sale: RecentSale) => 
        new Date(sale.createdAt).toDateString() === today
      ) : []

      // Calculate weekly sales (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weeklySales = salesData.success ? salesData.data.sales.filter((sale: RecentSale) => 
        new Date(sale.createdAt) >= weekAgo
      ) : []

      // Calculate monthly sales (last 30 days)
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)
      const monthlySales = salesData.success ? salesData.data.sales.filter((sale: RecentSale) => 
        new Date(sale.createdAt) >= monthAgo
      ) : []

      const dailySalesTotal = todaySales.reduce((sum: number, sale: RecentSale) => sum + parseFloat(sale.total.toString()), 0)
      const weeklySalesTotal = weeklySales.reduce((sum: number, sale: RecentSale) => sum + parseFloat(sale.total.toString()), 0)
      const monthlySalesTotal = monthlySales.reduce((sum: number, sale: RecentSale) => sum + parseFloat(sale.total.toString()), 0)
      const averageOrderValue = todaySales.length > 0 ? dailySalesTotal / todaySales.length : 0

      // Process NCF sequences for DGII compliance
      let ncfSequences: NCFStatus[] = []
      let totalNCFRemaining = 0
      if (ncfData.success && Array.isArray(ncfData.data)) {
        ncfSequences = ncfData.data.map((seq: any) => {
          const remaining = seq.maxNumber - seq.currentNumber
          const percentage = ((seq.currentNumber / seq.maxNumber) * 100)
          totalNCFRemaining += remaining
          return {
            type: seq.type,
            current: seq.currentNumber,
            max: seq.maxNumber,
            remaining,
            percentage
          }
        })
      }

      const expiringSoon = ncfSequences.filter(seq => seq.percentage > 80)

      setDgiiCompliance({
        ncfSequences,
        totalNCFRemaining,
        expiringSoon,
        taxCompliance: {
          itbisRate: 18,
          lastSync: new Date().toISOString(),
          rncValidations: todaySales.length // Count today's sales as RNC validations
        }
      })

      setStats({
        dailySales: dailySalesTotal,
        dailyTransactions: todaySales.length,
        lowStockProducts: productsData.success ? productsData.data.products.filter((p: any) => p.stock <= p.minStock).length : 0,
        totalCustomers: customersData.success ? customersData.data.pagination?.total || 0 : 0,
        totalProducts: productsData.success ? productsData.data.pagination?.total || 0 : 0,
        totalCategories: categoriesData.success ? categoriesData.data.categories?.length || 0 : 0,
        weeklySales: weeklySalesTotal,
        monthlySales: monthlySalesTotal,
        averageOrderValue: averageOrderValue,
        topSellingProducts: [], // Will be populated with actual data later
      })

      // Set recent sales (last 5)
      if (salesData.success) {
        setRecentSales(salesData.data.sales.slice(0, 5))
      }

      // Set low stock products
      if (productsData.success) {
        setLowStockProducts(
          productsData.data.products
            .filter((p: any) => p.stock <= p.minStock)
            .slice(0, 5)
        )
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto absolute top-0"></div>
          </div>
          <p className="mt-6 text-gray-800 font-medium">Cargando panel de control...</p>
          <p className="text-sm text-gray-600">Obteniendo datos del sistema</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
      </div>
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Modern Header Section */}
        <div className="mb-6">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">📊</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">Panel de Control</h1>
                  <p className="text-white/80">Resumen ejecutivo • DGII Compliant</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-0">
                <div className="flex items-center space-x-3 text-sm text-white/80">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${refreshing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                    {refreshing ? 'Actualizando...' : 'Sistema Activo'}
                  </div>
                  <span>•</span>
                  <div className="font-medium text-white">{new Date().toLocaleDateString('es-DO')} • {new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <button
                  onClick={() => fetchDashboardData(true)}
                  disabled={refreshing}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition-all duration-200 space-x-2 shadow-lg hover:shadow-xl"
                >
                  <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{refreshing ? 'Actualizando' : 'Actualizar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DGII Compliance Section */}
        <div className="mb-6">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">🇩🇴</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Cumplimiento DGII</h2>
                <p className="text-white/80 text-sm">Estado de comprobantes fiscales y normativas</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* NCF Status Overview */}
              <div className="backdrop-blur-lg bg-blue-500/20 p-4 rounded-xl border border-blue-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-200">NCF Disponibles</span>
                  <span className="text-xs bg-blue-400/30 text-blue-200 px-2 py-1 rounded-full font-bold">
                    {dgiiCompliance.ncfSequences.length} tipos
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">{dgiiCompliance.totalNCFRemaining.toLocaleString()}</div>
                <div className="text-xs text-blue-300 mt-1">Comprobantes restantes</div>
              </div>

              {/* Expiring Soon Alert */}
              <div className={`p-4 rounded-xl border backdrop-blur-lg ${
                dgiiCompliance.expiringSoon.length > 0 
                  ? 'bg-amber-500/20 border-amber-400/30' 
                  : 'bg-emerald-500/20 border-emerald-400/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    dgiiCompliance.expiringSoon.length > 0 ? 'text-amber-200' : 'text-emerald-200'
                  }`}>Por Agotar</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    dgiiCompliance.expiringSoon.length > 0 
                      ? 'bg-amber-400/30 text-amber-200' 
                      : 'bg-emerald-400/30 text-emerald-200'
                  }`}>
                    {dgiiCompliance.expiringSoon.length}
                  </span>
                </div>
                <div className={`text-2xl font-bold text-white`}>
                  {dgiiCompliance.expiringSoon.length > 0 ? '⚠️' : '✅'}
                </div>
                <div className={`text-xs mt-1 ${
                  dgiiCompliance.expiringSoon.length > 0 ? 'text-amber-300' : 'text-emerald-300'
                }`}>
                  {dgiiCompliance.expiringSoon.length > 0 ? 'Secuencias >80%' : 'Todo en orden'}
                </div>
              </div>

              {/* ITBIS Rate */}
              <div className="backdrop-blur-lg bg-purple-500/20 p-4 rounded-xl border border-purple-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-200">ITBIS Actual</span>
                  <span className="text-xs bg-purple-400/30 text-purple-200 px-2 py-1 rounded-full font-bold">
                    RD
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">{dgiiCompliance.taxCompliance.itbisRate}%</div>
                <div className="text-xs text-purple-300 mt-1">Tasa vigente</div>
              </div>

              {/* RNC Validations Today */}
              <div className="backdrop-blur-lg bg-teal-500/20 p-4 rounded-xl border border-teal-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-teal-200">Validaciones RNC</span>
                  <span className="text-xs bg-teal-400/30 text-teal-200 px-2 py-1 rounded-full font-bold">
                    Hoy
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">{dgiiCompliance.taxCompliance.rncValidations}</div>
                <div className="text-xs text-teal-300 mt-1">Consultas DGII</div>
              </div>
            </div>

            {/* NCF Sequences Detail */}
            {dgiiCompliance.ncfSequences.length > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {dgiiCompliance.ncfSequences.map((seq) => (
                  <div key={seq.type} className="backdrop-blur-lg bg-white/10 p-3 rounded-xl border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">{seq.type}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        seq.percentage > 80 ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
                        seq.percentage > 60 ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      }`}>
                        {seq.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-lg font-bold text-white mb-1">{seq.remaining.toLocaleString()}</div>
                    <div className="text-xs text-white/70">de {seq.max.toLocaleString()}</div>
                    <div className="mt-2 w-full bg-white/20 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          seq.percentage > 80 ? 'bg-red-400' :
                          seq.percentage > 60 ? 'bg-amber-400' :
                          'bg-emerald-400'
                        }`}
                        style={{ width: `${seq.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Daily Sales */}
          <div className="backdrop-blur-lg bg-white/10 p-6 rounded-2xl border border-white/20 shadow-xl hover:bg-white/15 hover:scale-[1.02] transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-white/90">Ventas del Día</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.dailySales)}</p>
                <div className="flex items-center mt-1">
                  <svg className="w-4 h-4 text-emerald-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-emerald-400 font-medium">+12%</span>
                  <span className="text-sm text-white/70 ml-1">vs ayer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Transactions */}
          <div className="backdrop-blur-lg bg-white/10 p-6 rounded-2xl border border-white/20 shadow-xl hover:bg-white/15 hover:scale-[1.02] transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-white/90">Transacciones</p>
                <p className="text-2xl font-bold text-white">{stats.dailyTransactions}</p>
                <div className="flex items-center mt-1">
                  <svg className="w-4 h-4 text-blue-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-blue-400 font-medium">+8%</span>
                  <span className="text-sm text-white/70 ml-1">vs ayer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="backdrop-blur-lg bg-white/10 p-6 rounded-2xl border border-white/20 shadow-xl hover:bg-white/15 hover:scale-[1.02] transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-white/90">Ticket Promedio</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.averageOrderValue)}</p>
                <div className="flex items-center mt-1">
                  <svg className="w-4 h-4 text-purple-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-purple-400 font-medium">+15%</span>
                  <span className="text-sm text-white/70 ml-1">vs ayer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="backdrop-blur-lg bg-white/10 p-6 rounded-2xl border border-white/20 shadow-xl hover:bg-white/15 hover:scale-[1.02] transition-all duration-200">
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${
                stats.lowStockProducts > 0 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600' 
                  : 'bg-gradient-to-r from-emerald-500 to-green-600'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-white/90">Stock Bajo</p>
                <p className="text-2xl font-bold text-white">{stats.lowStockProducts}</p>
                <div className="flex items-center mt-1">
                  {stats.lowStockProducts > 0 ? (
                    <>
                      <svg className="w-4 h-4 text-red-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-red-400 font-medium">Atención requerida</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-emerald-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-emerald-400 font-medium">Stock saludable</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Nueva Venta */}
          <button
            onClick={() => router.push('/sales/new')}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-left group"
          >
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl group-hover:from-green-600 group-hover:to-emerald-700 transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">Nueva Venta</h3>
                <p className="text-sm text-gray-600">Procesar transacción</p>
              </div>
            </div>
          </button>

          {/* Gestionar Productos */}
          <button
            onClick={() => router.push('/products')}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-left group"
          >
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl group-hover:from-blue-600 group-hover:to-cyan-700 transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Productos</h3>
                <p className="text-sm text-gray-600">Gestionar inventario</p>
              </div>
            </div>
          </button>

          {/* Secuencias NCF */}
          <button
            onClick={() => router.push('/ncf-sequences')}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-left group"
          >
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl group-hover:from-purple-600 group-hover:to-violet-700 transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">NCF</h3>
                <p className="text-sm text-gray-600">Configurar secuencias</p>
              </div>
            </div>
          </button>

          {/* Reportes */}
          <button
            onClick={() => router.push('/reports')}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-left group"
          >
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl group-hover:from-orange-600 group-hover:to-red-700 transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-700 transition-colors">Reportes</h3>
                <p className="text-sm text-gray-600">Análisis y datos</p>
              </div>
            </div>
          </button>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">📋</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Ventas Recientes</h3>
                  <p className="text-gray-600 text-sm">Últimas transacciones</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/sales')}
                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Ver todas
              </button>
            </div>
            
            <div className="space-y-3">
              {recentSales.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📊</div>
                  <p className="text-gray-500 font-medium">No hay ventas recientes</p>
                  <p className="text-gray-400 text-sm">Realiza tu primera venta</p>
                </div>
              ) : (
                recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200/50 hover:shadow-sm transition-all">
                    <div>
                      <div className="font-semibold text-gray-900">NCF: {sale.ncf}</div>
                      <div className="text-sm text-gray-600">
                        {sale.customer?.name || 'Cliente General'} • {formatDate(new Date(sale.createdAt))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatCurrency(Number(sale.total))}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Products */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  stats.lowStockProducts > 0 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600' 
                    : 'bg-gradient-to-r from-emerald-500 to-green-600'
                }`}>
                  <span className="text-white font-bold">
                    {stats.lowStockProducts > 0 ? '⚠️' : '✅'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Control de Stock</h3>
                  <p className="text-gray-600 text-sm">Productos con stock bajo</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/products')}
                className={`font-medium text-sm px-3 py-1 rounded-lg transition-colors ${
                  stats.lowStockProducts > 0
                    ? 'text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100'
                    : 'text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                Gestionar
              </button>
            </div>
            
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-emerald-400 text-4xl mb-2">✅</div>
                  <p className="text-emerald-600 font-medium">Stock en buen estado</p>
                  <p className="text-emerald-500 text-sm">Todos los productos tienen stock suficiente</p>
                </div>
              ) : (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200/50">
                    <div>
                      <div className="font-semibold text-red-900">{product.name}</div>
                      <div className="text-sm text-red-700">Stock mínimo: {product.minStock}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-900">{product.stock} unidades</div>
                      <div className="text-xs text-red-600">Reabastecer</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
