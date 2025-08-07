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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Ventas</h1>
              <p className="text-gray-600 mt-2">Administrar ventas y comprobantes fiscales</p>
            </div>
            <Link
              href="/sales/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <span>🛒</span>
              <span>Nueva Venta</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Ventas Hoy</p>
                <p className="text-gray-900 text-2xl font-bold">{sales.filter(s => 
                  new Date(s.createdAt).toDateString() === new Date().toDateString()
                ).length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Ventas</p>
                <p className="text-gray-900 text-2xl font-bold">{sales.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Ingresos Hoy</p>
                <p className="text-gray-900 text-2xl font-bold">
                  {formatCurrency(sales
                    .filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString())
                    .reduce((sum, s) => sum + Number(s.total), 0)
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Últimas 24h</p>
                <p className="text-gray-900 text-2xl font-bold">
                  {sales.filter(s => 
                    new Date(s.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
                  ).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-xl">⏰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por número de venta, NCF, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-gray-700 text-sm font-medium">Desde:</label>
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-gray-700 text-sm font-medium">Hasta:</label>
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setDateFilter({ from: '', to: '' })
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Limpiar Filtros
              </button>
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

        {/* Sales Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Ventas ({filteredSales.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número de Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ITBIS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NCF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 font-medium text-gray-600">Cargando ventas...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-semibold text-gray-900">
                        {searchTerm.trim() ? 'No se encontraron ventas que coincidan' : 'No se encontraron ventas'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {searchTerm.trim() ? 'Prueba con otros términos de búsqueda' : 'No hay ventas para el período seleccionado'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono font-semibold border border-blue-200">
                          {sale.saleNumber}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        {sale.customer ? (
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{sale.customer.name}</div>
                            <div className="text-xs text-gray-500">{sale.customer.rnc || sale.customer.cedula || 'Sin documento'}</div>
                          </div>
                        ) : sale.customerName ? (
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{sale.customerName}</div>
                            {sale.customerRnc && (
                              <div className="text-xs text-gray-500">RNC: {sale.customerRnc}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600 text-sm">Cliente General</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900 text-sm">
                          {formatCurrency(parseFloat(sale.total.toString()))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600 text-sm">
                          {formatCurrency(parseFloat(sale.itbis.toString()))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono font-semibold border border-gray-200">
                          {sale.ncf}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 text-sm">
                          {sale.cashier.firstName} {sale.cashier.lastName}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-600 text-sm">
                          {formatDate(new Date(sale.createdAt))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewReceipt(sale.id)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg transition-colors text-xs"
                            title="Ver Recibo"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Recibo</span>
                          </button>
                          <button 
                            onClick={() => handleViewInvoice(sale.id)}
                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition-colors text-xs"
                            title="Ver Factura"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
