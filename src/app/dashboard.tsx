'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/ui/Navigation'
import { formatCurrency, formatDate } from '@/utils/dominican-validators'

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

export default function Dashboard() {
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
        window.location.href = '/login'
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
      }

      // Fetch dashboard stats
      const [salesRes, customersRes, productsRes, categoriesRes] = await Promise.all([
        fetch('/api/sales', { headers }),
        fetch('/api/customers', { headers }),
        fetch('/api/products', { headers }),
        fetch('/api/categories', { headers }),
      ])

      // Check for 401 responses (invalid token)
      if (salesRes.status === 401 || customersRes.status === 401 || 
          productsRes.status === 401 || categoriesRes.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return
      }

      const [salesData, customersData, productsData, categoriesData] = await Promise.all([
        salesRes.json(),
        customersRes.json(),
        productsRes.json(),
        categoriesRes.json(),
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto absolute top-0"></div>
          </div>
          <p className="mt-6 text-gray-800 font-medium">Cargando panel de control...</p>
          <p className="text-sm text-gray-700">Obteniendo datos del sistema</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Control</h1>
                <p className="text-gray-800">Resumen de ventas y operaciones del día</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-0">
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${refreshing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></div>
                    {refreshing ? 'Actualizando...' : 'Sistema Activo'}
                  </div>
                  <span>•</span>
                  <div>{new Date().toLocaleTimeString('es-DO')}</div>
                </div>
                <button
                  onClick={() => fetchDashboardData(true)}
                  disabled={refreshing}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 space-x-2"
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

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Daily Sales */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-800">Ventas del Día</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.dailySales)}</p>
                <div className="flex items-center mt-1">
                  <svg className="w-4 h-4 text-emerald-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-emerald-600 font-medium">+12%</span>
                  <span className="text-sm text-gray-700 ml-1">vs ayer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Transactions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-800">Transacciones</p>
                <p className="text-2xl font-bold text-gray-900">{stats.dailyTransactions}</p>
                <div className="flex items-center mt-1">
                  <svg className="w-4 h-4 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-blue-600 font-medium">+8%</span>
                  <span className="text-sm text-gray-700 ml-1">vs ayer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-800">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageOrderValue)}</p>
                <div className="flex items-center mt-1">
                  <svg className="w-4 h-4 text-purple-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-purple-600 font-medium">+15%</span>
                  <span className="text-sm text-gray-700 ml-1">vs ayer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${
                stats.lowStockProducts > 0 ? 'bg-red-100' : 'bg-emerald-100'
              }`}>
                <svg className={`w-6 h-6 ${
                  stats.lowStockProducts > 0 ? 'text-red-600' : 'text-emerald-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-800">Stock Bajo</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
                <div className="flex items-center mt-1">
                  {stats.lowStockProducts > 0 ? (
                    <>
                      <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-red-600 font-medium">Requiere atención</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-emerald-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-emerald-600 font-medium">Todo en orden</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-800">Ventas Semanales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.weeklySales)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 12v-4m0 0l-3-3m3 3l3-3" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-800">Ventas Mensuales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlySales)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-800">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Ventas Recientes</h3>
              </div>
            </div>
            <div className="p-6">
              {recentSales.length > 0 ? (
                <div className="space-y-4">
                  {recentSales.map((sale, index) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{sale.ncf || 'Sin NCF'}</p>
                          <p className="text-xs text-gray-500">
                            {sale.customer?.name || 'Cliente General'} • {new Date(sale.createdAt).toLocaleDateString('es-DO')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(parseFloat(sale.total.toString()))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500">No hay ventas recientes</p>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Productos con Stock Bajo</h3>
              </div>
            </div>
            <div className="p-6">
              {lowStockProducts.length > 0 ? (
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">Mínimo: {product.minStock}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-600">{product.stock} unid.</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-500">Todos los productos tienen stock suficiente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acciones Rápidas</h3>
              <p className="text-gray-600">Operaciones frecuentes del sistema</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => window.location.href = '/sales/new'}
                className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 border border-blue-200"
              >
                <div className="p-3 bg-blue-100 rounded-lg mb-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-blue-700">Nueva Venta</span>
              </button>

              <button 
                onClick={() => window.location.href = '/products'}
                className="flex flex-col items-center p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors duration-200 border border-emerald-200"
              >
                <div className="p-3 bg-emerald-100 rounded-lg mb-2">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-emerald-700">Productos</span>
              </button>

              <button 
                onClick={() => window.location.href = '/customers'}
                className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 border border-purple-200"
              >
                <div className="p-3 bg-purple-100 rounded-lg mb-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-purple-700">Clientes</span>
              </button>

              <button 
                onClick={() => window.location.href = '/categories'}
                className="flex flex-col items-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200 border border-indigo-200"
              >
                <div className="p-3 bg-indigo-100 rounded-lg mb-2">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-indigo-700">Categorías</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
