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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    dailySales: 0,
    dailyTransactions: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalCategories: 0,
  })
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
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

      setStats({
        dailySales: todaySales.reduce((sum: number, sale: RecentSale) => sum + sale.total, 0),
        dailyTransactions: todaySales.length,
        lowStockProducts: productsData.success ? productsData.data.products.filter((p: any) => p.stock <= p.minStock).length : 0,
        totalCustomers: customersData.success ? customersData.data.pagination?.total || 0 : 0,
        totalProducts: productsData.success ? productsData.data.pagination?.total || 0 : 0,
        totalCategories: categoriesData.success ? categoriesData.data.categories?.length || 0 : 0,
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
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="dashboard" />

      <div className="px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-600">Sistema POS - República Dominicana | {formatDate(new Date())}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Daily Sales */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ventas del Día</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.dailySales)}</p>
              </div>
            </div>
          </div>

          {/* Daily Transactions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Transacciones</p>
                <p className="text-2xl font-bold text-gray-900">{stats.dailyTransactions}</p>
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
              </div>
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>

          {/* Total Products */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Productos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          {/* Total Categories */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-teal-100 rounded-lg">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categorías</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Ventas Recientes</h3>
            </div>
            <div className="p-6">
              {recentSales.length > 0 ? (
                <div className="space-y-4">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          NCF: {sale.ncf}
                        </p>
                        <p className="text-sm text-gray-500">
                          {sale.customer?.name || 'Cliente General'} • {new Date(sale.createdAt).toLocaleTimeString('es-DO')}
                        </p>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(sale.total)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay ventas recientes</p>
              )}
            </div>
          </div>

          {/* Low Stock Products */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Productos con Stock Bajo</h3>
            </div>
            <div className="p-6">
              {lowStockProducts.length > 0 ? (
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Stock mínimo: {product.minStock}
                        </p>
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
                <p className="text-gray-500 text-center py-4">Todos los productos tienen stock suficiente</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <a
              href="/sales/new"
              className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
              </svg>
              Nueva Venta
            </a>
            
            <a
              href="/products"
              className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-center"
            >
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Productos
            </a>
            
            <a
              href="/customers"
              className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-center"
            >
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Clientes
            </a>
            
            <a
              href="/categories"
              className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Categorías
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
