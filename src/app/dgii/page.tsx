'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/utils/dominican-validators'

interface DGIIReport {
  reportType: '606' | '607'
  period: string
  company: {
    rnc: string
    razonSocial: string
    periodo: string
  }
  summary: {
    totalRecords: number
    totalAmount: number
    totalTax: number
    customerCount?: number
    supplierCount?: number
    dateRange: {
      from: string
      to: string
    }
    ncfBreakdown?: Record<string, number>
    customerTypes?: {
      withRNC: number
      withCedula: number
      walkIn: number
    }
    validationStatus: {
      allSalesHaveNCF: boolean
      allSuppliersHaveRNC?: boolean
      taxCalculationsValid: boolean
    }
  }
  data: any[]
  message: string
}

export default function DGIIReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  const [report606, setReport606] = useState<DGIIReport | null>(null)
  const [report607, setReport607] = useState<DGIIReport | null>(null)
  const [loading606, setLoading606] = useState(false)
  const [loading607, setLoading607] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReport = async (type: '606' | '607') => {
    const setLoading = type === '606' ? setLoading606 : setLoading607
    const setReport = type === '606' ? setReport606 : setReport607
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/dgii-reports?type=${type}&month=${selectedMonth}&format=preview&test=true`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data: DGIIReport = await response.json()
      setReport(data)
    } catch (err) {
      console.error(`Error generating ${type} report:`, err)
      setError(err instanceof Error ? err.message : `Error generando reporte ${type}`)
    } finally {
      setLoading(false)
    }
  }

  const downloadXML = async (type: '606' | '607') => {
    try {
      const response = await fetch(`/api/dgii-reports?type=${type}&month=${selectedMonth}&format=xml&test=true`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_${selectedMonth.replace('-', '')}.xml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(`Error downloading ${type} XML:`, err)
      setError(err instanceof Error ? err.message : `Error descargando XML ${type}`)
    }
  }

  const ReportCard = ({ report, type }: { report: DGIIReport | null, type: '606' | '607' }) => {
    const isLoading = type === '606' ? loading606 : loading607
    const bgColor = type === '606' ? 'bg-blue-50' : 'bg-green-50'
    const textColor = type === '606' ? 'text-blue-900' : 'text-green-900'
    const borderColor = type === '606' ? 'border-blue-200' : 'border-green-200'
    const title = type === '606' ? '📋 Reporte 606 (Compras)' : '📈 Reporte 607 (Ventas)'
    
    return (
      <div className={`${bgColor} rounded-xl ${borderColor} border p-6 shadow-sm`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${textColor}`}>{title}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => generateReport(type)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isLoading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : type === '606' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isLoading ? 'Generando...' : 'Generar Vista Previa'}
            </button>
            <button
              onClick={() => downloadXML(type)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                isLoading 
                  ? 'border-gray-300 text-gray-500 cursor-not-allowed'
                  : type === '606'
                    ? 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                    : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
              }`}
            >
              Descargar XML
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Generando reporte...</span>
          </div>
        )}

        {!isLoading && report && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${textColor}`}>
                  {report.summary.totalRecords}
                </div>
                <div className="text-sm text-gray-600">Registros</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className={`text-xl font-bold ${textColor}`}>
                  {formatCurrency(report.summary.totalAmount)}
                </div>
                <div className="text-sm text-gray-600">Monto Total</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className={`text-xl font-bold ${textColor}`}>
                  {formatCurrency(report.summary.totalTax)}
                </div>
                <div className="text-sm text-gray-600">ITBIS Total</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className={`text-2xl font-bold ${textColor}`}>
                  {type === '607' ? report.summary.customerCount : report.summary.supplierCount}
                </div>
                <div className="text-sm text-gray-600">
                  {type === '607' ? 'Clientes' : 'Proveedores'}
                </div>
              </div>
            </div>

            {/* Validation Status */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Estado de Validación</h4>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    report.summary.validationStatus.taxCalculationsValid ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm">Cálculos ITBIS</span>
                </div>
                {type === '607' && (
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      report.summary.validationStatus.allSalesHaveNCF ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm">NCF Completos</span>
                  </div>
                )}
                {type === '606' && (
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      report.summary.validationStatus.allSuppliersHaveRNC ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm">RNC Proveedores</span>
                  </div>
                )}
              </div>
            </div>

            {/* NCF Breakdown for Sales (607) */}
            {type === '607' && report.summary.ncfBreakdown && Object.keys(report.summary.ncfBreakdown).length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Tipos de NCF</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(report.summary.ncfBreakdown).map(([ncfType, count]) => (
                    <div key={ncfType} className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-600">{ncfType}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Types for Sales (607) */}
            {type === '607' && report.summary.customerTypes && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Tipos de Clientes</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-900">
                      {report.summary.customerTypes.withRNC}
                    </div>
                    <div className="text-sm text-blue-600">Con RNC</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-lg font-bold text-yellow-900">
                      {report.summary.customerTypes.withCedula}
                    </div>
                    <div className="text-sm text-yellow-600">Con Cédula</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-gray-900">
                      {report.summary.customerTypes.walkIn}
                    </div>
                    <div className="text-sm text-gray-600">Sin Documento</div>
                  </div>
                </div>
              </div>
            )}

            {/* Message */}
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-700">{report.message}</p>
              <p className="text-xs text-gray-500 mt-2">
                Periodo: {report.summary.dateRange.from} al {report.summary.dateRange.to}
              </p>
            </div>

            {/* Data Preview */}
            {report.data.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Vista Previa de Datos (primeros 5 registros)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">RNC</th>
                        <th className="px-3 py-2 text-left">NCF/Comprobante</th>
                        <th className="px-3 py-2 text-left">Fecha</th>
                        <th className="px-3 py-2 text-right">Monto</th>
                        <th className="px-3 py-2 text-right">ITBIS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {report.data.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-gray-900">
                            {row.rnc || 'N/A'}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {row.numeroComprobante || 'N/A'}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {new Date(row.fechaComprobante).toLocaleDateString('es-DO')}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatCurrency(row.montoFacturado)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-600">
                            {formatCurrency(row.itbisFacturado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {!isLoading && !report && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Haz clic en &quot;Generar Vista Previa&quot; para ver los datos del reporte</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏛️ Reportes DGII
        </h1>
        <p className="text-gray-600">
          Genere reportes XML 606 (Compras) y 607 (Ventas) para cumplimiento con la DGII
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label htmlFor="month" className="text-sm font-medium text-gray-700">
              Seleccionar Período:
            </label>
            <input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="text-sm text-gray-500">
            Formato: YYYY-MM (ej: 2025-08 para Agosto 2025)
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <ReportCard report={report606} type="606" />
        <ReportCard report={report607} type="607" />
      </div>

      {/* Footer Info */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Información sobre los Reportes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Reporte 606 (Compras)</h4>
            <ul className="space-y-1">
              <li>• Incluye todas las órdenes de compra recibidas</li>
              <li>• Valida RNC de proveedores</li>
              <li>• Calcula ITBIS automáticamente (18%)</li>
              <li>• Formato XML compatible con DGII RC606</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Reporte 607 (Ventas)</h4>
            <ul className="space-y-1">
              <li>• Incluye todas las ventas con NCF</li>
              <li>• Categoriza clientes por tipo de documento</li>
              <li>• Analiza tipos de NCF utilizados</li>
              <li>• Formato XML compatible con DGII RC607</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
