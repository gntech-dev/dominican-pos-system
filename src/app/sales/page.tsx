'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/ui/Navigation'
import ReceiptPrintDialog from '@/components/receipts/ReceiptPrintDialog'
import { formatCurrency, formatDate } from '@/utils/dominican-validators'

interface Sale {
  id: string
  ncf: string
  total: number | string
  subtotal: number | string
  itbis: number | string
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
  
  // Receipt printing state
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)

  useEffect(() => {
    fetchSales()
  }, [dateFilter])

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

  const handlePrintReceipt = (saleId: string) => {
    setSelectedSaleId(saleId)
    setShowPrintDialog(true)
  }

  const handleClosePrintDialog = () => {
    setShowPrintDialog(false)
    setSelectedSaleId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="sales" />

      <div className="px-6 py-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Ventas</h1>
              <p className="text-sm text-gray-900">Administrar ventas y comprobantes fiscales</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/sales/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Nueva Venta</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Desde</label>
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                  className="px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Hasta</label>
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                  className="px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Monto Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageTicket)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">ITBIS Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalTax)}</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    NCF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    ITBIS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-900">
                      Cargando ventas...
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-900">
                      No se encontraron ventas para el período seleccionado
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {sale.ncf}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {sale.customer ? (
                          <div>
                            <div className="font-semibold text-gray-900">{sale.customer.name}</div>
                            <div className="text-sm font-medium text-gray-900">{sale.customer.rnc || sale.customer.cedula || 'Sin documento'}</div>
                          </div>
                        ) : (
                          <span className="font-medium text-gray-900">Cliente General</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(parseFloat(sale.total.toString()))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(parseFloat(sale.itbis.toString()))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {sale.cashier.firstName} {sale.cashier.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(new Date(sale.createdAt))}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {getSaleStatus(sale)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Ver</span>
                          </button>
                          <button 
                            onClick={() => handlePrintReceipt(sale.id)}
                            className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>Imprimir</span>
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

      {/* Receipt Print Dialog */}
      <ReceiptPrintDialog
        isOpen={showPrintDialog}
        onClose={handleClosePrintDialog}
        saleId={selectedSaleId || undefined}
        title="Reimprimir Recibo"
      />
    </div>
  )
}
