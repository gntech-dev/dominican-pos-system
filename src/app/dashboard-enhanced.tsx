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
  total: number
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

export default function EnhancedDashboard() {
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

      const dailySalesTotal = todaySales.reduce((sum: number, sale: RecentSale) => sum + sale.total, 0)
      const weeklySalesTotal = weeklySales.reduce((sum: number, sale: RecentSale) => sum + sale.total, 0)
      const monthlySalesTotal = monthlySales.reduce((sum: number, sale: RecentSale) => sum + sale.total, 0)
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto absolute top-0"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Cargando panel de control...</p>
          <p className="text-sm text-gray-500">Obteniendo datos del sistema</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation currentPage="dashboard" />

      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Panel de Control
              </h1>
              <p className="text-gray-600 mt-2">Sistema POS - República Dominicana | {formatDate(new Date())}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${refreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                  {refreshing ? 'Actualizando...' : 'Sistema Activo'}
                </div>
                <span>•</span>
                <div>Última actualización: {new Date().toLocaleTimeString('es-DO')}</div>
              </div>
              <button
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{refreshing ? 'Actualizando' : 'Actualizar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Stats Grid with Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Daily Sales */}
          <div className="bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-white group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-emerald-100 text-sm font-medium">Ventas del Día</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.dailySales)}</p>
                <div className="flex items-center mt-3">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-emerald-100">+12% vs ayer</span>
                </div>
              </div>
              <div className="p-4 bg-white bg-opacity-20 rounded-xl group-hover:bg-opacity-30 transition-all">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Daily Transactions */}
          <div className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-white group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-blue-100 text-sm font-medium">Transacciones</p>
                <p className="text-3xl font-bold mt-2">{stats.dailyTransactions}</p>
                <div className="flex items-center mt-3">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-blue-100">+8% vs ayer</span>
                </div>
              </div>
              <div className="p-4 bg-white bg-opacity-20 rounded-xl group-hover:bg-opacity-30 transition-all">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-white group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-purple-100 text-sm font-medium">Ticket Promedio</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.averageOrderValue)}</p>
                <div className="flex items-center mt-3">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-purple-100">+15% vs ayer</span>
                </div>
              </div>
              <div className="p-4 bg-white bg-opacity-20 rounded-xl group-hover:bg-opacity-30 transition-all">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className={`bg-gradient-to-br p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-white group ${
            stats.lowStockProducts > 0 
              ? 'from-red-400 via-red-500 to-red-600' 
              : 'from-green-400 via-green-500 to-green-600'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  stats.lowStockProducts > 0 ? 'text-red-100' : 'text-green-100'
                }`}>Stock Bajo</p>
                <p className="text-3xl font-bold mt-2">{stats.lowStockProducts}</p>
                <div className="flex items-center mt-3">
                  {stats.lowStockProducts > 0 ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-red-100">Requiere atención</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-green-100">Todo en orden</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-4 bg-white bg-opacity-20 rounded-xl group-hover:bg-opacity-30 transition-all">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats with Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ventas Semanales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.weeklySales)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ventas Mensuales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlySales)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Enhanced Recent Sales */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Ventas Recientes</h3>
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {recentSales.length} ventas
                </div>
              </div>
            </div>
            <div className="p-6">
              {recentSales.length > 0 ? (
                <div className="space-y-4">
                  {recentSales.map((sale, index) => (
                    <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            NCF: {sale.ncf}
                          </p>
                          <p className="text-sm text-gray-500">
                            {sale.customer?.name || 'Cliente General'} • {new Date(sale.createdAt).toLocaleTimeString('es-DO')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(sale.total)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(sale.createdAt).toLocaleDateString('es-DO')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No hay ventas recientes</p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Low Stock Products */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`p-6 border-b border-gray-100 ${
              stats.lowStockProducts > 0 
                ? 'bg-gradient-to-r from-red-50 to-orange-50' 
                : 'bg-gradient-to-r from-green-50 to-emerald-50'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Productos con Stock Bajo</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  stats.lowStockProducts > 0 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {stats.lowStockProducts} productos
                </div>
              </div>
            </div>
            <div className="p-6">
              {lowStockProducts.length > 0 ? (
                <div className="space-y-4">
                  {lowStockProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Stock mínimo: {product.minStock}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-red-600">
                          {product.stock}
                        </div>
                        <div className="text-xs text-red-500">
                          {product.stock === 0 ? 'Sin stock' : 'Stock bajo'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-green-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500">Todos los productos tienen stock suficiente</p>
                  <p className="text-sm text-green-600 mt-1">¡Excelente gestión de inventario!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/sales/new"
              className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="text-center">
                <div className="inline-flex p-3 bg-white bg-opacity-20 rounded-lg mb-3 group-hover:bg-opacity-30 transition-all">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-1">Nueva Venta</h4>
                <p className="text-sm text-blue-100">Procesar venta</p>
              </div>
            </a>
            
            <a
              href="/products"
              className="group bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="text-center">
                <div className="inline-flex p-3 bg-white bg-opacity-20 rounded-lg mb-3 group-hover:bg-opacity-30 transition-all">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-1">Productos</h4>
                <p className="text-sm text-green-100">Gestionar inventario</p>
              </div>
            </a>
            
            <a
              href="/customers"
              className="group bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="text-center">
                <div className="inline-flex p-3 bg-white bg-opacity-20 rounded-lg mb-3 group-hover:bg-opacity-30 transition-all">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-1">Clientes</h4>
                <p className="text-sm text-purple-100">Gestionar clientes</p>
              </div>
            </a>
            
            <a
              href="/categories"
              className="group bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="text-center">
                <div className="inline-flex p-3 bg-white bg-opacity-20 rounded-lg mb-3 group-hover:bg-opacity-30 transition-all">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-1">Categorías</h4>
                <p className="text-sm text-indigo-100">Organizar productos</p>
              </div>
            </a>
          </div>
        </div>

        {/* System Status Footer */}
        <div className="mt-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-300 text-sm">Productos en inventario</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
            <div>
              <p className="text-gray-300 text-sm">Categorías disponibles</p>
              <p className="text-2xl font-bold">{stats.totalCategories}</p>
            </div>
            <div>
              <p className="text-gray-300 text-sm">DGII Compliance</p>
              <div className="flex items-center justify-center mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <p className="text-green-400 font-medium">Activo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
