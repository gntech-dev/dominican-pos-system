'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ThermalReceiptModal from '@/components/receipts/ThermalReceiptModal'
import FormalInvoiceModal from '@/components/receipts/FormalInvoiceModal'
import { formatCurrency, formatDate } from '@/utils/dominican-validators'

interface Sale {
  id: string
  saleNumber: string
  ncf: string
  total: number | string
  subtotal: number | string
  itbis: number | string
  customerRnc?: string
  customerName?: string
  customer: {
    name: string
    rnc?: string
    cedula?: string
  } | null
  cashier: {
    firstName: string
    lastName: string
  }
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    unitPrice: number | string
    total: number | string
    product: {
      name: string
      code: string
    }
  }>
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })
  const [stats, setStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    totalTax: 0,
    averageTicket: 0
  })
  
  // Receipt and invoice viewing state
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showThermalModal, setShowThermalModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedSaleData, setSelectedSaleData] = useState<any>(null)

  useEffect(() => {
    fetchSales()
  }, [dateFilter])

  // Filter sales based on search term
  const filteredSales = sales.filter(sale => {
    if (!searchTerm.trim()) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      sale.saleNumber.toLowerCase().includes(searchLower) ||
      sale.ncf.toLowerCase().includes(searchLower) ||
      (sale.customer?.name && sale.customer.name.toLowerCase().includes(searchLower)) ||
      (sale.customer?.rnc && sale.customer.rnc.includes(searchLower)) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(searchLower)) ||
      (sale.customerRnc && sale.customerRnc.includes(searchLower))
    )
  })

  const fetchSales = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      if (dateFilter.from) params.append('from', dateFilter.from)
      if (dateFilter.to) params.append('to', dateFilter.to)
      
      const response = await fetch(`/api/sales?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setSales(data.data.sales || [])
        
        // Calculate stats
        const totalSales = data.data.sales?.length || 0
        const totalAmount = data.data.sales?.reduce((sum: number, sale: Sale) => sum + parseFloat(sale.total.toString()), 0) || 0
        const totalTax = data.data.sales?.reduce((sum: number, sale: Sale) => sum + parseFloat(sale.itbis.toString()), 0) || 0
        const averageTicket = totalSales > 0 ? totalAmount / totalSales : 0
        
        setStats({
          totalSales,
          totalAmount,
          totalTax,
          averageTicket
        })
      } else {
        setError('Error al cargar las ventas')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const getSaleStatus = (sale: Sale) => {
    return 'Completada'
  }

  const handleViewReceipt = async (saleId: string) => {
    console.log('Thermal receipt button clicked for sale ID:', saleId);
    try {
      const response = await fetch(`/api/receipts/${saleId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const apiData = await response.json();
        console.log('Fetched API data for thermal:', apiData);
        
        // Transform API response to match ThermalReceiptModal interface
        const receiptData = {
          id: apiData.sale.id,
          saleNumber: apiData.sale.saleNumber,
          ncf: apiData.sale.ncf || '',
          ncfType: apiData.sale.ncfType || undefined,
          createdAt: apiData.sale.createdAt,
          subtotal: apiData.sale.subtotal,
          tax: apiData.sale.itbis, // API uses 'itbis', modal expects 'tax'
          total: apiData.sale.total,
          paymentMethod: apiData.sale.paymentMethod,
          cashierName: apiData.cashierName,
          business: apiData.business,
          customer: apiData.customer, // Use the full customer object from API
          items: apiData.sale.items.map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.total,
            product: {
              name: item.product.name,
              code: item.product.code,
              description: item.product.description
            }
          }))
        };
        
        console.log('Transformed thermal receipt data:', receiptData);
        setSelectedSaleData(receiptData);
        setShowThermalModal(true);
      } else {
        console.error('Error fetching receipt data');
        alert('Error al cargar los datos del recibo');
      }
    } catch (error) {
      console.error('Error fetching receipt data:', error);
      alert('Error al cargar los datos del recibo');
    }
  }

  const handleViewInvoice = async (saleId: string) => {
    console.log('Invoice button clicked for sale ID:', saleId);
    setSelectedSaleId(saleId);
    setShowInvoiceModal(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Gestión de Ventas
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Administrar ventas y comprobantes fiscales</p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Sistema activo</span>
                <span>•</span>
                <span>Última actualización: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
            <Link
              href="/sales/new"
              className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span className="text-xl group-hover:animate-bounce">🛒</span>
              <span>Nueva Venta</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative overflow-hidden bg-white backdrop-blur-lg bg-opacity-80 rounded-2xl border border-white/30 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Ventas Hoy</p>
                <p className="text-gray-900 text-3xl font-bold">
                  {sales.filter(s => 
                    new Date(s.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
                <div className="flex items-center space-x-1 text-xs">
                  <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600 font-medium">Objetivo diario</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white backdrop-blur-lg bg-opacity-80 rounded-2xl border border-white/30 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Total Ventas</p>
                <p className="text-gray-900 text-3xl font-bold">{sales.length}</p>
                <div className="flex items-center space-x-1 text-xs">
                  <div className="w-full bg-gray-200 rounded-full h-2 max-w-20">
                    <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-green-600 font-medium">85%</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white backdrop-blur-lg bg-opacity-80 rounded-2xl border border-white/30 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Ingresos Hoy</p>
                <p className="text-gray-900 text-2xl font-bold">
                  {formatCurrency(sales
                    .filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString())
                    .reduce((sum, s) => sum + Number(s.total), 0)
                  )}
                </p>
                <div className="flex items-center space-x-1 text-xs text-purple-600">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="font-medium">+15% vs ayer</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white backdrop-blur-lg bg-opacity-80 rounded-2xl border border-white/30 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Últimas 24h</p>
                <p className="text-gray-900 text-3xl font-bold">
                  {sales.filter(s => 
                    new Date(s.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
                  ).length}
                </p>
                <div className="flex items-center space-x-1 text-xs">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-orange-600 font-medium">Tiempo real</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">⏰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/30 p-6 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="text-xl mr-2">🔍</span>
              Filtros de Búsqueda
            </h3>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Búsqueda inteligente activada</span>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por número de venta, NCF, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 px-4 py-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <label className="text-gray-700 text-sm font-medium">Desde:</label>
                </div>
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                  className="flex-1 py-1 border-0 bg-transparent focus:ring-0 text-sm"
                />
              </div>
              
              <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 px-4 py-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <label className="text-gray-700 text-sm font-medium">Hasta:</label>
                </div>
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                  className="flex-1 py-1 border-0 bg-transparent focus:ring-0 text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setDateFilter({ from: '', to: '' })
                }}
                className="group bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Limpiar Filtros</span>
              </button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Mostrando: <span className="font-semibold text-gray-900">{filteredSales.length}</span> ventas</span>
                {searchTerm && (
                  <span className="text-blue-600">
                    Filtrado por: &quot;<span className="font-medium">{searchTerm}</span>&quot;
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1 text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs">Actualizado: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

                {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Sales Table */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-white/30 overflow-hidden shadow-xl">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="text-2xl mr-3">📋</span>
                Registro de Ventas
                <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {filteredSales.length}
                </span>
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Todo sincronizado</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Número de Venta</span>
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ITBIS
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    NCF
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 absolute top-0 left-0"></div>
                        </div>
                        <div className="space-y-1">
                          <span className="font-semibold text-gray-900 text-lg">Cargando ventas...</span>
                          <p className="text-sm text-gray-500">Obteniendo datos del servidor</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xl font-bold text-gray-900">
                            {searchTerm.trim() ? 'No se encontraron ventas que coincidan' : 'No se encontraron ventas'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {searchTerm.trim() ? 'Prueba con otros términos de búsqueda' : 'No hay ventas para el período seleccionado'}
                          </p>
                        </div>
                        <Link
                          href="/sales/new"
                          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                        >
                          <span>🛒</span>
                          <span>Crear Primera Venta</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale, index) => (
                    <tr key={sale.id} className="hover:bg-blue-50/50 transition-colors duration-200 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <code className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-mono font-bold border border-blue-200 shadow-sm">
                            {sale.saleNumber}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {sale.customer ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900 text-sm">{sale.customer.name}</div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block">
                              {sale.customer.rnc || sale.customer.cedula || 'Sin documento'}
                            </div>
                          </div>
                        ) : sale.customerName ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900 text-sm">{sale.customerName}</div>
                            {sale.customerRnc && (
                              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block">
                                RNC: {sale.customerRnc}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-500 text-xs">👤</span>
                            </div>
                            <span className="text-gray-600 text-sm">Cliente General</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-lg">
                          {formatCurrency(parseFloat(sale.total.toString()))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600 font-medium">
                            {formatCurrency(parseFloat(sale.itbis.toString()))}
                          </span>
                          <span className="text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full font-medium">
                            18%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold border border-gray-200 shadow-sm">
                          {sale.ncf}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {sale.cashier.firstName.charAt(0)}{sale.cashier.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="text-gray-900 text-sm font-medium">
                            {sale.cashier.firstName} {sale.cashier.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-gray-900 text-sm font-medium">
                            {formatDate(new Date(sale.createdAt))}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(sale.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewReceipt(sale.id)}
                            className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                            title="Ver Recibo"
                          >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Recibo</span>
                          </button>
                          <button 
                            onClick={() => handleViewInvoice(sale.id)}
                            className="group flex items-center gap-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                            title="Ver Factura"
                          >
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Factura</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Thermal Receipt Modal */}
      {showThermalModal && selectedSaleData && (
        <ThermalReceiptModal
          receiptData={selectedSaleData}
          onClose={() => {
            setShowThermalModal(false);
            setSelectedSaleData(null);
          }}
        />
      )}

      {/* Formal Invoice Modal */}
      {showInvoiceModal && selectedSaleId && (
        <FormalInvoiceModal
          isOpen={showInvoiceModal}
          saleId={selectedSaleId!}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedSaleId(null);
          }}
        />
      )}
    </div>
  )
}
