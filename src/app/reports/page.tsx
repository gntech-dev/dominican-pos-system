'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/utils/dominican-validators'

// Helper function for NCF type descriptions
function getNCFDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'B01': 'Crédito Fiscal - Ventas gravadas con ITBIS',
    'B02': 'Consumidor Final - Ventas al consumidor final',
    'B03': 'Nota de Débito - Aumentos en facturas',
    'B04': 'Nota de Crédito - Devoluciones y descuentos',
    'B11': 'Proveedores Informales - Compras sin NCF',
    'B12': 'Registro Único - Compras especiales',
    'B13': 'Gastos Menores - Gastos sin NCF',
    'B14': 'Régimen Especial - Contribuyentes especiales',
    'B15': 'Gubernamental - Ventas al sector público',
    'B16': 'Exportaciones - Ventas al exterior'
  }
  return descriptions[type] || `Tipo NCF: ${type}`
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState('daily')
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })

  const [reportData, setReportData] = useState<any>({
    salesSummary: {
      totalSales: 0,
      totalAmount: 0,
      totalTax: 0,
      averageTicket: 0
    },
    topProducts: [],
    topCustomers: [],
    salesByDay: [],
    alerts: {
      criticalStock: 0,
      lowStock: 0,
      reorderNeeded: 0,
      highValueSlowMoving: 0
    }
  })

  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const generateReport = async () => {
    setLoading(true)
    try {
      if (reportType === 'dgii') {
        // Handle DGII reports separately
        console.log('🏛️ Generating DGII reports for period:', dateRange)
        
        const response = await fetch('/api/dgii-reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            reportType: 'both', // Get both sales and purchase reports
            period: `${dateRange.from.replace(/-/g, '')}-${dateRange.to.replace(/-/g, '')}`,
            fromDate: dateRange.from,
            toDate: dateRange.to
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('✅ DGII data received:', data)
          setReportData(data || {
            salesReport: null,
            purchaseReport: null,
            error: 'No DGII data available'
          })
        } else {
          const errorText = await response.text()
          console.error('❌ DGII API Error:', response.status, errorText)
          setReportData({
            salesReport: null,
            purchaseReport: null,
            error: `Error loading DGII reports: ${response.status} ${response.statusText}`
          })
        }
      } else {
        // Handle regular reports using GET with query parameters
        const params = new URLSearchParams({
          type: reportType,
          from: dateRange.from,
          to: dateRange.to
        })
        
        const response = await fetch(`/api/reports?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Report response:', data) // Debug log
          setReportData(data.data || data || {
            salesSummary: {
              totalSales: 0,
              totalAmount: 0,
              totalTax: 0,
              averageTicket: 0
            },
            topProducts: [],
            topCustomers: [],
            salesByDay: [],
            alerts: {
              criticalStock: 0,
              lowStock: 0,
              reorderNeeded: 0,
              highValueSlowMoving: 0
            }
          })
        } else {
          console.error('Report API error:', response.status, response.statusText)
          // Fallback to placeholder data for regular reports
          setReportData({
            salesSummary: {
              totalSales: 0,
              totalAmount: 0,
              totalTax: 0,
              averageTicket: 0
            },
            topProducts: [],
            topCustomers: [],
            salesByDay: [],
            alerts: {
              criticalStock: 0,
              lowStock: 0,
              reorderNeeded: 0,
              highValueSlowMoving: 0
            }
          })
        }
      }
      setLoading(false)
    } catch (error) {
      console.error('Error generating report:', error)
      if (reportType === 'dgii') {
        setReportData({
          salesReport: null,
          purchaseReport: null,
          error: 'Error connecting to DGII service'
        })
      } else {
        // Fallback to placeholder data for regular reports
        setReportData({
          salesSummary: {
            totalSales: 0,
            totalAmount: 0,
            totalTax: 0,
            averageTicket: 0
          },
          topProducts: [],
          topCustomers: [],
          salesByDay: [],
          alerts: {
            criticalStock: 0,
            lowStock: 0,
            reorderNeeded: 0,
            highValueSlowMoving: 0
          }
        })
      }
      setLoading(false)
    }
  }

  const exportReport = async (format: 'pdf' | 'csv') => {
    try {
      setExporting(true)
      
      if (reportType === 'dgii') {
        // Handle DGII XML export
        const response = await fetch('/api/dgii-reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reportType: 'xml',
            period: `${dateRange.from.replace(/-/g, '')}-${dateRange.to.replace(/-/g, '')}`,
            fromDate: dateRange.from,
            toDate: dateRange.to
          })
        })

        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `dgii_${reportType}_${dateRange.from}_${dateRange.to}.xml`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } else {
          alert('Error exporting DGII report')
        }
      } else {
        // Handle regular report export
        const response = await fetch('/api/reports/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            format,
            reportType,
            dateRange,
            data: reportData
          })
        })

        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${reportType}_report_${dateRange.from}_${dateRange.to}.${format}`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        } else {
          alert('Error exporting report')
        }
      }
      
      setExporting(false)
    } catch (error) {
      console.error('Export error:', error)
      setExporting(false)
      alert('Error exporting report')
    }
  }

  useEffect(() => {
    generateReport()
  }, [reportType, dateRange])

  const getReportTitle = () => {
    switch (reportType) {
      case 'daily': return 'Reporte de Ventas Diarias'
      case 'itbis': return 'Reporte de ITBIS'
      case 'ncf': return 'Reporte de Control NCF'
      case 'inventory': return 'Reporte de Inventario'
      case 'customers': return 'Reporte de Clientes'
      case 'audit': return 'Reporte de Auditoría'
      case 'dgii': return 'Reportes DGII'
      default: return 'Reporte'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced styling for better contrast and readability */}
      <style jsx>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          background-color: #1d4ed8;
          border-radius: 4px;
          cursor: pointer;
          padding: 2px;
        }
        select option {
          background-color: white;
          color: #1f2937;
          font-weight: 500;
        }
        select:focus option:checked {
          background-color: #1d4ed8;
          color: white;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Sistema de Reportes</h1>
          <p className="text-gray-600">Genere y visualice reportes detallados del negocio con cumplimiento DGII</p>
        </div>

        {/* Report Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">🔧 Configuración de Reportes</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">Tipo de Reporte</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-gray-500 transition-colors font-medium"
              >
                <option value="daily">📈 Ventas Diarias</option>
                <option value="itbis">💰 ITBIS</option>
                <option value="ncf">🧾 Control NCF</option>
                <option value="inventory">📦 Inventario</option>
                <option value="customers">👥 Clientes</option>
                <option value="audit">🔍 Auditoría</option>
                <option value="dgii">🏛️ DGII</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">Fecha Desde</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-gray-500 transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">Fecha Hasta</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 hover:border-gray-500 transition-colors font-medium"
              />
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={generateReport}
                disabled={loading}
                className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-bold transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando...
                  </span>
                ) : (
                  '🔄 Generar Reporte'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Report Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{getReportTitle()}</h2>
              <p className="text-lg text-gray-700 font-medium mt-2">
                📅 Período: <span className="text-blue-700 font-bold">{dateRange.from}</span> - <span className="text-blue-700 font-bold">{dateRange.to}</span>
              </p>
            </div>
            
            <div className="flex space-x-4">
              {reportType !== 'dgii' ? (
                <>
                  <button
                    onClick={() => exportReport('pdf')}
                    disabled={exporting || loading}
                    className="bg-red-700 hover:bg-red-800 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{exporting ? 'Exportando...' : 'PDF'}</span>
                  </button>
                  <button
                    onClick={() => exportReport('csv')}
                    disabled={exporting || loading}
                    className="bg-green-700 hover:bg-green-800 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>CSV</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => exportReport('pdf')}
                  disabled={exporting || loading}
                  className="bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{exporting ? 'Exportando...' : 'XML DGII'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generando reporte...</p>
          </div>
        ) : (
          <>
            {/* DGII Reports */}
            {reportType === 'dgii' && (
              <div className="space-y-6">
                {reportData.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-red-100">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-red-800">Error en Reporte DGII</h3>
                        <p className="text-red-600">{reportData.error}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Report */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Reporte de Ventas (606)</h3>
                      {reportData.salesReport ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-900">
                                {reportData.salesReport.records?.length || 0}
                              </div>
                              <div className="text-sm text-blue-600">Registros</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-900">
                                {formatCurrency(reportData.salesReport.totalAmount || 0)}
                              </div>
                              <div className="text-sm text-green-600">Total Ventas</div>
                            </div>
                          </div>
                          {reportData.salesReport.xml && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 mb-2">Vista previa XML:</p>
                              <pre className="text-xs text-gray-800 bg-white p-2 rounded border overflow-x-auto">
                                {reportData.salesReport.xml.substring(0, 200)}...
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>No hay datos de ventas disponibles</p>
                        </div>
                      )}
                    </div>

                    {/* Purchase Report */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Reporte de Compras (607)</h3>
                      {reportData.purchaseReport ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <div className="text-2xl font-bold text-purple-900">
                                {reportData.purchaseReport.records?.length || 0}
                              </div>
                              <div className="text-sm text-purple-600">Registros</div>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                              <div className="text-2xl font-bold text-orange-900">
                                {formatCurrency(reportData.purchaseReport.totalAmount || 0)}
                              </div>
                              <div className="text-sm text-orange-600">Total Compras</div>
                            </div>
                          </div>
                          {reportData.purchaseReport.xml && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-600 mb-2">Vista previa XML:</p>
                              <pre className="text-xs text-gray-800 bg-white p-2 rounded border overflow-x-auto">
                                {reportData.purchaseReport.xml.substring(0, 200)}...
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>No hay datos de compras disponibles</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Regular Reports */}
            {reportType !== 'dgii' && (
              <div className="space-y-8">
                {/* Sales Summary Cards */}
                {reportType === 'daily' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-blue-100">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-800">Total Ventas</p>
                          <p className="text-2xl font-bold text-gray-900">{reportData.salesSummary?.totalSales || 0}</p>
                          <p className="text-xs text-gray-600">transacciones</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-green-100">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-800">Ingresos Totales</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.salesSummary?.totalAmount || 0)}</p>
                          <p className="text-xs text-gray-600">pesos dominicanos</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-purple-100">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-800">ITBIS Recaudado</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.salesSummary?.totalTax || 0)}</p>
                          <p className="text-xs text-gray-600">18% impuesto</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-lg ${(reportData.alerts?.criticalStock || 0) > 0 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                          <svg className={`w-6 h-6 ${(reportData.alerts?.criticalStock || 0) > 0 ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-800">Alertas de Stock</p>
                          <p className="text-2xl font-bold text-gray-900">{(reportData.alerts?.criticalStock || 0) + (reportData.alerts?.lowStock || 0)}</p>
                          <p className="text-xs text-gray-600">{reportData.alerts?.criticalStock || 0} agotados</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inventory Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Products */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Productos Más Vendidos</h3>
                    {reportData.topProducts && reportData.topProducts.length > 0 ? (
                      <div className="space-y-3">
                        {reportData.topProducts.slice(0, 5).map((product: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-600">{product.category} • Stock: {product.stock}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-blue-600">{product.totalSold || product.quantity} vendidos</div>
                              <div className="text-sm text-gray-600">{formatCurrency(product.revenue || product.total)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">Sin ventas en el período</div>
                    )}
                  </div>

                  {/* Stock Alerts */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Alertas de Stock</h3>
                    <div className="space-y-3">
                      {(reportData.alerts?.criticalStock || 0) > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                            <div>
                              <div className="font-medium text-red-800">Stock Crítico</div>
                              <div className="text-sm text-red-600">{reportData.alerts?.criticalStock || 0} productos agotados</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {(reportData.alerts?.lowStock || 0) > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                            <div>
                              <div className="font-medium text-yellow-800">Stock Bajo</div>
                              <div className="text-sm text-yellow-600">{reportData.alerts?.lowStock || 0} productos necesitan reorden</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {(reportData.alerts?.reorderNeeded || 0) > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                            <div>
                              <div className="font-medium text-blue-800">Reorden Pronto</div>
                              <div className="text-sm text-blue-600">{reportData.alerts?.reorderNeeded || 0} productos próximos a agotar</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {(reportData.alerts?.highValueSlowMoving || 0) > 0 && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                            <div>
                              <div className="font-medium text-purple-800">Inventario Lento</div>
                              <div className="text-sm text-purple-600">{reportData.alerts?.highValueSlowMoving || 0} productos de alto valor sin movimiento</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {Object.values(reportData.alerts || {}).every((alert: any) => alert === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-2">✅</div>
                          <p>No hay alertas de inventario</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inventory Report Details */}
                {reportType === 'inventory' && (
                  <div className="space-y-6">
                    {/* Inventory Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-blue-100">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Total Productos</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.summary?.totalProducts || 0}</p>
                            <p className="text-xs text-gray-600">en {reportData.summary?.totalCategories || 0} categorías</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-green-100">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Valor Total</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary?.totalInventoryValue || 0)}</p>
                            <p className="text-xs text-gray-600">inventario actual</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-purple-100">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Margen Promedio</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.summary?.averageMargin || 0}%</p>
                            <p className="text-xs text-gray-600">ganancia bruta</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-orange-100">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Rotación</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.summary?.inventoryTurnover || 0}</p>
                            <p className="text-xs text-gray-600">veces por año</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className={`p-3 rounded-lg ${(reportData.summary?.outOfStockCount || 0) > 0 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                            <svg className={`w-6 h-6 ${(reportData.summary?.outOfStockCount || 0) > 0 ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Total Alertas</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {(reportData.summary?.outOfStockCount || 0) + (reportData.summary?.lowStockCount || 0) + (reportData.summary?.reorderSoonCount || 0)}
                            </p>
                            <p className="text-xs text-gray-600">{reportData.summary?.outOfStockCount || 0} agotados</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stock Status Overview */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 Estado General del Stock</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-red-100">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <div className="text-2xl font-bold text-red-900">{reportData.summary?.outOfStockCount || 0}</div>
                          <div className="text-sm text-red-600 font-medium">Sin Stock</div>
                          <div className="text-xs text-red-500 mt-1">Productos agotados</div>
                        </div>

                        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-yellow-100">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div className="text-2xl font-bold text-yellow-900">{reportData.summary?.lowStockCount || 0}</div>
                          <div className="text-sm text-yellow-600 font-medium">Stock Bajo</div>
                          <div className="text-xs text-yellow-500 mt-1">Debajo del mínimo</div>
                        </div>

                        <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-orange-100">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-2xl font-bold text-orange-900">{reportData.summary?.reorderSoonCount || 0}</div>
                          <div className="text-sm text-orange-600 font-medium">Reorden Pronto</div>
                          <div className="text-xs text-orange-500 mt-1">Próximos a agotar</div>
                        </div>

                        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-green-100">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-2xl font-bold text-green-900">
                            {(reportData.summary?.totalProducts || 0) - (reportData.summary?.outOfStockCount || 0) - (reportData.summary?.lowStockCount || 0) - (reportData.summary?.reorderSoonCount || 0)}
                          </div>
                          <div className="text-sm text-green-600 font-medium">Stock Normal</div>
                          <div className="text-xs text-green-500 mt-1">Niveles saludables</div>
                        </div>
                      </div>
                    </div>

                    {/* Top Performers and Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Top Selling Products */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Productos Más Vendidos</h3>
                        {reportData.insights?.topSelling && reportData.insights.topSelling.length > 0 ? (
                          <div className="space-y-3">
                            {reportData.insights.topSelling.slice(0, 5).map((product: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{product.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {product.category} • Stock: {product.stock} • Código: {product.code}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Precio: {formatCurrency(product.price)} • Margen: {product.margin}%
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-blue-600">{product.totalSold30Days} vendidos</div>
                                  <div className="text-sm text-green-600">{formatCurrency(product.revenue30Days)}</div>
                                  <div className="text-xs text-gray-500">últimos 30 días</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">Sin datos de ventas</div>
                        )}
                      </div>

                      {/* Top Revenue Products */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Mayor Facturación</h3>
                        {reportData.insights?.topRevenue && reportData.insights.topRevenue.length > 0 ? (
                          <div className="space-y-3">
                            {reportData.insights.topRevenue.slice(0, 5).map((product: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{product.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {product.category} • Stock: {product.stock}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Vendidos: {product.totalSold30Days} • Rotación: {product.turnoverRate}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-600">{formatCurrency(product.revenue30Days)}</div>
                                  <div className="text-sm text-blue-600">{formatCurrency(product.price)}/unidad</div>
                                  <div className="text-xs text-gray-500">30 días</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">Sin datos de facturación</div>
                        )}
                      </div>
                    </div>

                    {/* Categories Analysis */}
                    {reportData.categories && reportData.categories.length > 0 && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📂 Análisis por Categorías</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Inventario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos 30d</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margen Prom.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Bajo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sin Stock</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {reportData.categories.map((category: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.productCount}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                    {formatCurrency(category.totalValue)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatCurrency(category.totalRevenue30Days)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.averageMargin}%</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      category.lowStockCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                      {category.lowStockCount}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      category.outOfStockCount > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                      {category.outOfStockCount}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Critical Stock Alerts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Out of Stock Products */}
                      {reportData.insights?.outOfStock && reportData.insights.outOfStock.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                          <h3 className="text-lg font-semibold text-red-900 mb-4">🚫 Productos Sin Stock</h3>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {reportData.insights.outOfStock.map((product: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-red-900">{product.name}</div>
                                  <div className="text-sm text-red-700">{product.category} • {product.code}</div>
                                  <div className="text-xs text-red-600">
                                    Última venta: {product.lastSold ? new Date(product.lastSold).toLocaleDateString('es-DO') : 'Sin ventas'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-red-800">Stock: 0</div>
                                  <div className="text-xs text-red-600">{formatCurrency(product.price)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Low Stock Products */}
                      {reportData.insights?.lowStock && reportData.insights.lowStock.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-6">
                          <h3 className="text-lg font-semibold text-yellow-900 mb-4">⚠️ Stock Bajo</h3>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {reportData.insights.lowStock.slice(0, 10).map((product: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-yellow-900">{product.name}</div>
                                  <div className="text-sm text-yellow-700">{product.category}</div>
                                  <div className="text-xs text-yellow-600">
                                    Mínimo: {product.minStock} • Días restantes: {product.stockDays}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-yellow-800">Stock: {product.stock}</div>
                                  <div className="text-xs text-yellow-600">Rotación: {product.turnoverRate}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Slow Moving and High Margin Products */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Slow Moving Products */}
                      {reportData.insights?.slowMoving && reportData.insights.slowMoving.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">🐌 Productos de Lento Movimiento</h3>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {reportData.insights.slowMoving.slice(0, 5).map((product: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{product.name}</div>
                                  <div className="text-sm text-gray-600">{product.category}</div>
                                  <div className="text-xs text-gray-500">
                                    Sin ventas últimos 30 días • Stock: {product.stock}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-red-600">{formatCurrency(product.value)}</div>
                                  <div className="text-xs text-gray-500">valor inmovilizado</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Top Margin Products */}
                      {reportData.insights?.topMargin && reportData.insights.topMargin.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
                          <h3 className="text-lg font-semibold text-green-900 mb-4">💎 Mejores Márgenes</h3>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {reportData.insights.topMargin.slice(0, 5).map((product: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-green-900">{product.name}</div>
                                  <div className="text-sm text-green-700">{product.category}</div>
                                  <div className="text-xs text-green-600">
                                    Stock: {product.stock} • Vendidos: {product.totalSold30Days}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-800">{product.margin}%</div>
                                  <div className="text-xs text-green-600">{formatCurrency(product.price)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Business Intelligence Insights */}
                    {reportData.summary && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">🔍 Inteligencia de Negocios</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="bg-white rounded-lg p-4">
                            <h4 className="font-medium text-gray-800 mb-3">📊 Métricas Financieras</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Valor Total Inventario:</span>
                                <span className="text-sm font-bold text-green-600">{formatCurrency(reportData.summary.totalInventoryValue)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Costo Total:</span>
                                <span className="text-sm font-bold text-blue-600">{formatCurrency(reportData.summary.totalCostValue)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Ganancia Potencial:</span>
                                <span className="text-sm font-bold text-purple-600">
                                  {formatCurrency((reportData.summary.totalInventoryValue - reportData.summary.totalCostValue))}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Rotación Anual:</span>
                                <span className="text-sm font-bold text-indigo-600">{reportData.summary.inventoryTurnover}x</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <h4 className="font-medium text-gray-800 mb-3">⚡ Rendimiento Operativo</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Productos Activos:</span>
                                <span className="text-sm font-bold text-blue-600">{reportData.summary.totalProducts}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Categorías:</span>
                                <span className="text-sm font-bold text-purple-600">{reportData.summary.totalCategories}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Margen Promedio:</span>
                                <span className="text-sm font-bold text-green-600">{reportData.summary.averageMargin}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Ventas 30 días:</span>
                                <span className="text-sm font-bold text-orange-600">{formatCurrency(reportData.summary.totalRevenue30Days)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <h4 className="font-medium text-gray-800 mb-3">🎯 Recomendaciones</h4>
                            <div className="space-y-2 text-sm">
                              {(reportData.summary.outOfStockCount > 0) && (
                                <div className="flex items-start">
                                  <span className="text-red-500 mr-2">•</span>
                                  <span className="text-gray-700">Reponer {reportData.summary.outOfStockCount} productos agotados</span>
                                </div>
                              )}
                              {(reportData.summary.lowStockCount > 0) && (
                                <div className="flex items-start">
                                  <span className="text-yellow-500 mr-2">•</span>
                                  <span className="text-gray-700">Reabastecer {reportData.summary.lowStockCount} productos con stock bajo</span>
                                </div>
                              )}
                              {(reportData.summary.inventoryTurnover < 2) && (
                                <div className="flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  <span className="text-gray-700">Mejorar rotación de inventario con promociones</span>
                                </div>
                              )}
                              {(reportData.summary.averageMargin < 20) && (
                                <div className="flex items-start">
                                  <span className="text-purple-500 mr-2">•</span>
                                  <span className="text-gray-700">Revisar precios para mejorar márgenes</span>
                                </div>
                              )}
                              {(reportData.summary.outOfStockCount === 0 && reportData.summary.lowStockCount === 0) && (
                                <div className="flex items-start">
                                  <span className="text-green-500 mr-2">•</span>
                                  <span className="text-gray-700">Excelente gestión de inventario</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ITBIS Report Details */}
                {reportType === 'itbis' && (
                  <div className="space-y-6">
                    {/* Core ITBIS Metrics */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">💰 Métricas Principales ITBIS</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.taxableBase || 0)}</div>
                          <div className="text-sm text-blue-600">Base Gravable</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-900">{formatCurrency(reportData.totalITBIS || 0)}</div>
                          <div className="text-sm text-green-600">ITBIS Total</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-900">{reportData.effectiveRate?.toFixed(2) || '0.00'}%</div>
                          <div className="text-sm text-purple-600">Tasa Efectiva</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-900">{reportData.transactionCount || 0}</div>
                          <div className="text-sm text-orange-600">Transacciones</div>
                        </div>
                      </div>
                      
                      {/* Additional metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="text-center p-4 bg-indigo-50 rounded-lg">
                          <div className="text-xl font-bold text-indigo-900">{formatCurrency(reportData.avgITBISPerTransaction || 0)}</div>
                          <div className="text-sm text-indigo-600">ITBIS Promedio/Transacción</div>
                        </div>
                        <div className="text-center p-4 bg-teal-50 rounded-lg">
                          <div className="text-xl font-bold text-teal-900">{formatCurrency(reportData.totalWithTax || 0)}</div>
                          <div className="text-sm text-teal-600">Total con ITBIS</div>
                        </div>
                      </div>
                    </div>

                    {/* DGII Compliance Status */}
                    {reportData.complianceMetrics && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏛️ Estado de Cumplimiento DGII</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-xl font-bold text-green-900">{reportData.complianceMetrics.standardRate}%</div>
                            <div className="text-sm text-green-600">Tasa Estándar</div>
                          </div>
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-xl font-bold text-blue-900">{reportData.complianceMetrics.compliancePercentage?.toFixed(1) || '0.0'}%</div>
                            <div className="text-sm text-blue-600">Cumplimiento</div>
                          </div>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-xl font-bold text-yellow-900">{reportData.complianceMetrics.exemptTransactions || 0}</div>
                            <div className="text-sm text-yellow-600">Trans. Exentas</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-xl font-bold text-purple-900">{reportData.complianceMetrics.regularTransactions || 0}</div>
                            <div className="text-sm text-purple-600">Trans. Regulares</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tax Breakdown by NCF Type */}
                    {reportData.taxByNCF && reportData.taxByNCF.length > 0 && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 ITBIS por Tipo de NCF</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo NCF</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Gravable</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ITBIS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transacciones</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% del ITBIS</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {reportData.taxByNCF.map((ncf: any, index: number) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ncf.ncfType}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(ncf.base || 0)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">{formatCurrency(ncf.tax || 0)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(ncf.total || 0)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ncf.transactions || 0}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{ncf.percentage?.toFixed(1) || '0.0'}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Tax Breakdown by Payment Method */}
                    {reportData.taxByPaymentMethod && reportData.taxByPaymentMethod.length > 0 && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 ITBIS por Método de Pago</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {reportData.taxByPaymentMethod.map((payment: any, index: number) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{payment.method}</div>
                                <div className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(payment.tax || 0)}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {payment.transactions || 0} transacciones ({payment.percentage?.toFixed(1) || '0.0'}%)
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Base: {formatCurrency(payment.base || 0)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Daily Trends */}
                    {reportData.dailyTrends && reportData.dailyTrends.length > 0 && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Tendencias Diarias de ITBIS</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ITBIS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Gravable</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transacciones</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {reportData.dailyTrends.map((day: any, index: number) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {new Date(day.date).toLocaleDateString('es-DO')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                    {formatCurrency(day.itbis || 0)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatCurrency(day.subtotal || 0)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatCurrency(day.total || 0)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {day.transactions || 0}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Business Insights */}
                    {reportData.insights && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Inteligencia de Negocios - ITBIS</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <span className="text-sm font-medium text-gray-700">Día de Mayor Recaudación:</span>
                              <span className="text-sm font-bold text-blue-600">
                                {reportData.insights.peakTaxDay?.date ? 
                                  new Date(reportData.insights.peakTaxDay.date).toLocaleDateString('es-DO') : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <span className="text-sm font-medium text-gray-700">Recaudación Pico:</span>
                              <span className="text-sm font-bold text-green-600">
                                {formatCurrency(reportData.insights.peakTaxDay?.itbis || 0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <span className="text-sm font-medium text-gray-700">NCF Dominante:</span>
                              <span className="text-sm font-bold text-purple-600">
                                {reportData.insights.dominantNCFType || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <span className="text-sm font-medium text-gray-700">Método de Pago Preferido:</span>
                              <span className="text-sm font-bold text-indigo-600">
                                {reportData.insights.preferredPaymentMethod || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <span className="text-sm font-medium text-gray-700">Tendencia de Recaudación:</span>
                              <span className={`text-sm font-bold ${
                                reportData.insights.taxCollectionTrend === 'increasing' ? 'text-green-600' :
                                reportData.insights.taxCollectionTrend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {reportData.insights.taxCollectionTrend === 'increasing' ? '📈 Creciente' :
                                 reportData.insights.taxCollectionTrend === 'decreasing' ? '📉 Decreciente' : '➡️ Estable'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* NCF Report Details */}
                {reportType === 'ncf' && (
                  <div className="space-y-6">
                    {/* NCF Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-blue-100">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Secuencias Activas</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.summary?.totalSequences || 0}</p>
                            <p className="text-xs text-gray-600">autorizadas</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-green-100">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">NCF Utilizados</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.summary?.totalUsedInPeriod || 0}</p>
                            <p className="text-xs text-gray-600">en el período</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-purple-100">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Facturación Total</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary?.totalSalesAmount || 0)}</p>
                            <p className="text-xs text-gray-600">con NCF</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className={`p-3 rounded-lg ${(reportData.summary?.alertSequences || 0) > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                            <svg className={`w-6 h-6 ${(reportData.summary?.alertSequences || 0) > 0 ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Alertas</p>
                            <p className={`text-2xl font-bold ${(reportData.summary?.alertSequences || 0) > 0 ? 'text-red-900' : 'text-green-900'}`}>
                              {reportData.summary?.alertSequences || 0}
                            </p>
                            <p className="text-xs text-gray-600">secuencias bajas</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* NCF Sequences Control Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">🧾 Control Detallado de Secuencias NCF</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo NCF</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Máximo</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponibles</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Usado</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas Período</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.sequences && reportData.sequences.map((sequence: any, index: number) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sequence.type}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                  {sequence.description || getNCFDescription(sequence.type)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sequence.current || sequence.currentNumber || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sequence.to || sequence.maxNumber || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {sequence.remaining || (sequence.to && sequence.current ? sequence.to - sequence.current : 'N/A')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {sequence.percentage?.toFixed(1) || '0.0'}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    sequence.status === 'low' ? 'bg-red-100 text-red-800' :
                                    sequence.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {sequence.status === 'low' ? 'Crítico' :
                                     sequence.status === 'warning' ? 'Advertencia' : 'OK'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {sequence.salesInPeriod || sequence.used || 0}
                                  {sequence.revenueInPeriod && (
                                    <div className="text-xs text-gray-400">{formatCurrency(sequence.revenueInPeriod)}</div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* NCF Usage Patterns */}
                    {reportData.usagePatterns && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Patrones de Uso de NCF</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Usage by Type */}
                          <div>
                            <h4 className="text-md font-medium text-gray-800 mb-3">Uso por Tipo de NCF</h4>
                            <div className="space-y-3">
                              {reportData.usagePatterns.byType && Object.entries(reportData.usagePatterns.byType).map(([type, data]: [string, any]) => (
                                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <div className="font-medium text-gray-900">{type}</div>
                                    <div className="text-sm text-gray-600">{data.count} facturas</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-blue-600">{data.percentage?.toFixed(1) || '0.0'}%</div>
                                    <div className="text-sm text-gray-600">{formatCurrency(data.revenue || 0)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Daily Usage Chart */}
                          <div>
                            <h4 className="text-md font-medium text-gray-800 mb-3">Consumo Diario</h4>
                            {reportData.dailyUsage && reportData.dailyUsage.length > 0 ? (
                              <div className="space-y-2">
                                {reportData.dailyUsage.slice(-7).map((day: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm text-gray-600">
                                      {new Date(day.date).toLocaleDateString('es-DO')}
                                    </span>
                                    <div className="text-right">
                                      <span className="text-sm font-medium text-gray-900">{day.totalNCF || 0} NCF</span>
                                      <div className="text-xs text-gray-500">{formatCurrency(day.revenue || 0)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">Sin datos de uso diario</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Compliance and Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Compliance Metrics */}
                      {reportData.complianceMetrics && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏛️ Cumplimiento DGII</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700">Puntuación de Cumplimiento:</span>
                              <span className="text-lg font-bold text-green-600">
                                {reportData.complianceMetrics.complianceScore?.toFixed(1) || '100.0'}%
                              </span>
                            </div>
                            
                            {reportData.complianceMetrics.issues && reportData.complianceMetrics.issues.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-800 mb-2">Alertas de Cumplimiento:</h4>
                                <div className="space-y-2">
                                  {reportData.complianceMetrics.issues.map((issue: string, index: number) => (
                                    <div key={index} className="flex items-center p-2 bg-yellow-50 border border-yellow-200 rounded">
                                      <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                      </svg>
                                      <span className="text-sm text-yellow-800">{issue}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Business Insights */}
                      {reportData.insights && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Insights de Negocio</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <span className="text-sm font-medium text-gray-700">NCF Más Utilizado:</span>
                              <span className="text-sm font-bold text-blue-600">
                                {reportData.insights.mostUsedNCFType || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <span className="text-sm font-medium text-gray-700">Consumo Promedio Diario:</span>
                              <span className="text-sm font-bold text-green-600">
                                {reportData.insights.averageDailyConsumption?.toFixed(1) || '0.0'} NCF/día
                              </span>
                            </div>
                            {reportData.insights.estimatedDaysRemaining > 0 && (
                              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Días Estimados Restantes:</span>
                                <span className={`text-sm font-bold ${
                                  reportData.insights.estimatedDaysRemaining < 30 ? 'text-red-600' :
                                  reportData.insights.estimatedDaysRemaining < 90 ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                  {reportData.insights.estimatedDaysRemaining} días
                                </span>
                              </div>
                            )}
                            
                            {/* Urgent Actions */}
                            {reportData.insights.urgentActions && reportData.insights.urgentActions.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-red-800 mb-2">🚨 Acciones Urgentes:</h4>
                                <div className="space-y-1">
                                  {reportData.insights.urgentActions.map((action: string, index: number) => (
                                    <div key={index} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                                      • {action}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Recommendations */}
                            {reportData.insights.recommendations && reportData.insights.recommendations.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Recomendaciones:</h4>
                                <div className="space-y-1">
                                  {reportData.insights.recommendations.map((recommendation: string, index: number) => (
                                    <div key={index} className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
                                      • {recommendation}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Customers Report */}
                {reportType === 'customers' && (
                  <div className="space-y-6">
                    {/* Customer Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-blue-100">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Total Clientes</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.summary?.totalCustomers || 0}</p>
                            <p className="text-xs text-gray-600">registrados</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-green-100">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Clientes Activos</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.summary?.activeCustomers || 0}</p>
                            <p className="text-xs text-gray-600">con compras</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-purple-100">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Ingresos Totales</p>
                            <p className="text-2xl font-bold text-gray-900">RD$ {(reportData.summary?.totalRevenue || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-gray-600">período actual</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-orange-100">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Valor Promedio</p>
                            <p className="text-2xl font-bold text-gray-900">RD$ {(reportData.summary?.averageCustomerValue || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-gray-600">por cliente</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Segmentation */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Segmentación por Tipo</h3>
                        <div className="space-y-4">
                          {reportData.segmentation?.byType?.map((segment: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900">{segment.type}</span>
                                  <span className="text-sm text-gray-600">{segment.percentage}%</span>
                                </div>
                                <div className="mt-2">
                                  <div className="text-sm text-gray-600">
                                    {segment.count} total • {segment.activeCount} activos
                                  </div>
                                  <div className="text-sm font-medium text-green-600">
                                    RD$ {segment.revenue?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                  <div 
                                    className={`h-2 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-purple-600'}`}
                                    style={{ width: `${segment.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 Métodos de Pago Preferidos</h3>
                        <div className="space-y-3">
                          {reportData.segmentation?.paymentMethods?.slice(0, 5).map((method: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900">{method.method}</span>
                                  <span className="text-sm text-gray-600">{method.percentage}%</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {method.customers} clientes • {method.transactions} transacciones
                                </div>
                                <div className="text-sm font-medium text-green-600">
                                  RD$ {method.amount?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Top Customers Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Clientes Principales</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promedio</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Compra</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lealtad</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.topCustomers?.map((customer: any, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-sm font-medium text-blue-600">
                                          {customer.name?.charAt(0)?.toUpperCase() || '?'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                      <div className="text-sm text-gray-500">{customer.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    customer.type === 'BUSINESS' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {customer.type === 'BUSINESS' ? 'Empresa' : 'Individual'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div>{customer.documentType}: {customer.documentNumber}</div>
                                  <div className="text-xs text-gray-500">{customer.phone}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="font-medium">{customer.totalSales}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                  RD$ {customer.totalAmount?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  RD$ {customer.averageOrderValue?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString('es-DO') : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-1 mr-2">
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full ${
                                            customer.loyaltyScore >= 70 ? 'bg-green-600' :
                                            customer.loyaltyScore >= 40 ? 'bg-yellow-600' :
                                            'bg-red-600'
                                          }`}
                                          style={{ width: `${customer.loyaltyScore}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-600">{customer.loyaltyScore}/100</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Business Insights */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">🧠 Insights de Negocio</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">📈 Retención de Clientes</h4>
                          <p className="text-2xl font-bold text-blue-700">{reportData.insights?.customerRetention?.rate}%</p>
                          <p className="text-sm text-blue-600 mt-1">{reportData.insights?.customerRetention?.trend}</p>
                          <p className="text-xs text-blue-600 mt-2">{reportData.insights?.customerRetention?.recommendation}</p>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-2">🎯 Oportunidades</h4>
                          <p className="text-sm text-green-700 mb-2">{reportData.insights?.growthOpportunity?.businessCustomers}</p>
                          <p className="text-xs text-green-600 mb-1">{reportData.insights?.growthOpportunity?.averageSpending}</p>
                          <p className="text-xs text-green-600">{reportData.insights?.growthOpportunity?.recommendation}</p>
                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-medium text-purple-900 mb-2">📋 Cumplimiento DGII</h4>
                          <p className="text-sm text-purple-700 mb-1">{reportData.insights?.complianceStatus?.rncCoverage}</p>
                          <p className="text-sm text-purple-700 mb-2">{reportData.insights?.complianceStatus?.businessDocumentation}</p>
                          <p className="text-xs text-purple-600">{reportData.insights?.complianceStatus?.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Report Details */}
                {reportType === 'audit' && (
                  <div className="space-y-6">
                    {/* Audit Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-blue-100">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Total Transacciones</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.summary?.totalTransactions || 0}</p>
                            <p className="text-xs text-gray-600">auditadas</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-green-100">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Ingresos Totales</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary?.totalRevenue || 0)}</p>
                            <p className="text-xs text-gray-600">registrados</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-purple-100">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Usuarios Activos</p>
                            <p className="text-2xl font-bold text-gray-900">{reportData.userActivity?.activeUsers || 0}</p>
                            <p className="text-xs text-gray-600">de {reportData.userActivity?.totalUsers || 0} total</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <div className={`p-3 rounded-lg ${
                            (reportData.securityAnalysis?.complianceScore || 0) >= 90 ? 'bg-green-100' :
                            (reportData.securityAnalysis?.complianceScore || 0) >= 70 ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            <svg className={`w-6 h-6 ${
                              (reportData.securityAnalysis?.complianceScore || 0) >= 90 ? 'text-green-600' :
                              (reportData.securityAnalysis?.complianceScore || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-800">Cumplimiento</p>
                            <p className={`text-2xl font-bold ${
                              (reportData.securityAnalysis?.complianceScore || 0) >= 90 ? 'text-green-900' :
                              (reportData.securityAnalysis?.complianceScore || 0) >= 70 ? 'text-yellow-900' : 'text-red-900'
                            }`}>
                              {(reportData.securityAnalysis?.complianceScore || 0).toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-600">DGII compliance</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security and Compliance Overview */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">🛡️ Estado de Seguridad y Cumplimiento</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-blue-100">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="text-2xl font-bold text-blue-900">{(reportData.ncfUsage?.complianceRate || 0).toFixed(1)}%</div>
                          <div className="text-sm text-blue-600 font-medium">NCF Compliance</div>
                          <div className="text-xs text-blue-500 mt-1">Cumplimiento fiscal</div>
                        </div>

                        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-green-100">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="text-2xl font-bold text-green-900">{(reportData.securityAnalysis?.checks?.userTracking || 0).toFixed(1)}%</div>
                          <div className="text-sm text-green-600 font-medium">Usuario Tracking</div>
                          <div className="text-xs text-green-500 mt-1">Trazabilidad usuarios</div>
                        </div>

                        <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-purple-100">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div className="text-2xl font-bold text-purple-900">{(reportData.securityAnalysis?.checks?.customerDocumentation || 0).toFixed(1)}%</div>
                          <div className="text-sm text-purple-600 font-medium">Doc. Clientes</div>
                          <div className="text-xs text-purple-500 mt-1">Documentación clientes</div>
                        </div>

                        <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-orange-100">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <div className="text-2xl font-bold text-orange-900">{(reportData.securityAnalysis?.checks?.paymentValidation || 0).toFixed(1)}%</div>
                          <div className="text-sm text-orange-600 font-medium">Validación Pagos</div>
                          <div className="text-xs text-orange-500 mt-1">Métodos de pago</div>
                        </div>
                      </div>
                    </div>

                    {/* User Activity Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Actividad de Usuarios</h3>
                        {reportData.userActivity?.userPerformance && reportData.userActivity.userPerformance.length > 0 ? (
                          <div className="space-y-3">
                            {reportData.userActivity.userPerformance.slice(0, 5).map((user: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-600">{user.role}</div>
                                  <div className="text-xs text-gray-500">
                                    {user.transactions} transacciones • Promedio: {formatCurrency(user.avgTransactionValue || 0)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-600">{formatCurrency(user.revenue || 0)}</div>
                                  <div className="text-sm text-gray-600">{user.transactions} ventas</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">Sin actividad de usuarios</div>
                        )}
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Análisis de Pagos</h3>
                        {reportData.paymentAnalysis?.methods ? (
                          <div className="space-y-3">
                            {Object.entries(reportData.paymentAnalysis.methods).map(([method, data]: [string, any], index: number) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{method}</div>
                                  <div className="text-sm text-gray-600">{data.count} transacciones</div>
                                  <div className="text-xs text-gray-500">
                                    Promedio: {formatCurrency(data.averageTicket || 0)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-blue-600">{formatCurrency(data.amount || 0)}</div>
                                  <div className="text-sm text-gray-600">{(data.percentage || 0).toFixed(1)}%</div>
                                </div>
                              </div>
                            ))}
                            
                            {/* Payment Risk Assessment */}
                            <div className={`p-3 rounded-lg border ${
                              reportData.paymentAnalysis.riskLevel === 'HIGH' ? 'bg-red-50 border-red-200' :
                              reportData.paymentAnalysis.riskLevel === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200' :
                              'bg-green-50 border-green-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Nivel de Riesgo:</span>
                                <span className={`text-sm font-bold ${
                                  reportData.paymentAnalysis.riskLevel === 'HIGH' ? 'text-red-600' :
                                  reportData.paymentAnalysis.riskLevel === 'MEDIUM' ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {reportData.paymentAnalysis.riskLevel === 'HIGH' ? 'Alto' :
                                   reportData.paymentAnalysis.riskLevel === 'MEDIUM' ? 'Medio' : 'Bajo'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Efectivo: {(reportData.paymentAnalysis.cashPercentage || 0).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">Sin análisis de pagos</div>
                        )}
                      </div>
                    </div>

                    {/* Transaction Log */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Registro de Transacciones</h3>
                      {reportData.transactions && reportData.transactions.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NCF</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cajero</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {reportData.transactions.slice(0, 20).map((transaction: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(transaction.createdAt).toLocaleString('es-DO')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {transaction.ncf || 'N/A'}
                                    {transaction.ncfType && (
                                      <div className="text-xs text-gray-500">{transaction.ncfType}</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {transaction.customer?.name || 'Cliente General'}
                                    {transaction.customer?.document && (
                                      <div className="text-xs text-gray-500">{transaction.customer.document}</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {transaction.cashier?.name || 'N/A'}
                                    {transaction.cashier?.role && (
                                      <div className="text-xs text-gray-500">{transaction.cashier.role}</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {transaction.paymentMethod || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                    {formatCurrency(transaction.total || 0)}
                                    {transaction.tax > 0 && (
                                      <div className="text-xs text-gray-500">ITBIS: {formatCurrency(transaction.tax)}</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                      transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {transaction.status === 'COMPLETED' ? 'Completado' :
                                       transaction.status === 'PENDING' ? 'Pendiente' : 'Error'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">Sin transacciones en el período</div>
                      )}
                    </div>

                    {/* Risk Analysis and Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Risk Analysis */}
                      {reportData.riskAnalysis && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Análisis de Riesgos</h3>
                          <div className="space-y-4">
                            <div className={`p-4 rounded-lg ${
                              reportData.riskAnalysis.riskScore > 50 ? 'bg-red-50 border border-red-200' :
                              reportData.riskAnalysis.riskScore > 25 ? 'bg-yellow-50 border border-yellow-200' :
                              'bg-green-50 border border-green-200'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Puntuación de Riesgo:</span>
                                <span className={`text-lg font-bold ${
                                  reportData.riskAnalysis.riskScore > 50 ? 'text-red-600' :
                                  reportData.riskAnalysis.riskScore > 25 ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {reportData.riskAnalysis.riskScore}/100
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">
                                Nivel: {reportData.riskAnalysis.riskLevel === 'HIGH' ? 'Alto' :
                                       reportData.riskAnalysis.riskLevel === 'MEDIUM' ? 'Medio' : 'Bajo'}
                              </div>
                            </div>

                            {reportData.riskAnalysis.highValueTransactions > 0 && (
                              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="text-sm font-medium text-orange-800">
                                  {reportData.riskAnalysis.highValueTransactions} Transacciones de Alto Valor
                                </div>
                                <div className="text-xs text-orange-600 mt-1">
                                  Promedio: {formatCurrency(reportData.riskAnalysis.averageTransactionValue || 0)}
                                </div>
                              </div>
                            )}

                            {reportData.riskAnalysis.alerts && reportData.riskAnalysis.alerts.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-800">Alertas de Riesgo:</h4>
                                {reportData.riskAnalysis.alerts.map((alert: any, index: number) => (
                                  <div key={index} className="flex items-center p-2 bg-red-50 border border-red-200 rounded">
                                    <svg className="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <span className="text-sm text-red-800">{alert.message || alert}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Audit Insights */}
                      {reportData.insights && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Insights de Auditoría</h3>
                          <div className="space-y-4">
                            <div className="p-4 bg-white rounded-lg">
                              <h4 className="font-medium text-gray-800 mb-2">Estado General</h4>
                              <p className="text-sm text-gray-700 mb-2">{reportData.insights.summary}</p>
                              <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                reportData.insights.complianceStatus === 'EXCELLENT' ? 'bg-green-100 text-green-800' :
                                reportData.insights.complianceStatus === 'GOOD' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {reportData.insights.complianceStatus === 'EXCELLENT' ? 'Excelente' :
                                 reportData.insights.complianceStatus === 'GOOD' ? 'Bueno' : 'Requiere Atención'}
                              </div>
                            </div>

                            {reportData.insights.keyFindings && reportData.insights.keyFindings.length > 0 && (
                              <div className="bg-white rounded-lg p-4">
                                <h4 className="font-medium text-gray-800 mb-2">Hallazgos Clave</h4>
                                <div className="space-y-1">
                                  {reportData.insights.keyFindings.map((finding: string, index: number) => (
                                    <div key={index} className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      <span className="text-sm text-gray-700">{finding}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {reportData.insights.recommendations && reportData.insights.recommendations.length > 0 && (
                              <div className="bg-white rounded-lg p-4">
                                <h4 className="font-medium text-gray-800 mb-2">Recomendaciones</h4>
                                <div className="space-y-1">
                                  {reportData.insights.recommendations.map((recommendation: string, index: number) => (
                                    <div key={index} className="flex items-start">
                                      <span className="text-green-500 mr-2">✓</span>
                                      <span className="text-sm text-gray-700">{recommendation}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {reportData.insights.nextActions && reportData.insights.nextActions.length > 0 && (
                              <div className="bg-white rounded-lg p-4">
                                <h4 className="font-medium text-gray-800 mb-2">Próximas Acciones</h4>
                                <div className="space-y-1">
                                  {reportData.insights.nextActions.map((action: string, index: number) => (
                                    <div key={index} className="flex items-start">
                                      <span className="text-orange-500 mr-2">→</span>
                                      <span className="text-sm text-gray-700">{action}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}