'use client'

import React, { useState, useEffect } from 'react'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { format } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
)

interface CustomerInsightsData {
  period: string
  dateRange: {
    start: string
    end: string
  }
  customerSegmentation: Array<{
    id: string
    name: string
    email?: string
    phone?: string
    rnc?: string
    totalTransactions: number
    totalSpent: number
    averageTransactionValue: number
    firstPurchaseDate: string
    lastPurchaseDate: string
    customerSegment: 'VIP' | 'FREQUENT' | 'REGULAR' | 'NEW'
    activityStatus: 'ACTIVE' | 'DORMANT' | 'INACTIVE'
  }>
  purchaseBehavior?: {
    hourlyPatterns: Array<{ hour: number; transactions: number; revenue: number }>
    dailyPatterns: Array<{ dayOfWeek: number; transactions: number; revenue: number }>
    monthlyPatterns: Array<{ month: number; transactions: number; revenue: number }>
  }
  loyaltyAnalysis?: {
    tierDistribution: Array<{ tier: string; customerCount: number; totalRevenue: number }>
    retentionRates: Array<{ period: string; retentionRate: number }>
  }
  rncAnalysis: Array<{
    customerType: string
    transactionCount: number
    totalRevenue: number
    averageTransactionValue: number
    uniqueCustomers: number
    marketShare: number
  }>
  valueSegmentation?: {
    segments: Array<{ segment: string; customerCount: number; totalRevenue: number; avgRevenue: number }>
  }
  purchaseFrequency?: {
    frequencyGroups: Array<{ group: string; customerCount: number; totalTransactions: number }>
  }
  geographicAnalysis?: {
    rncDistribution: Array<{ hasRnc: boolean; customerCount: number; avgTransactionValue: number }>
  }
  summary: {
    totalCustomers: number
    activeCustomers: number
    rncCustomers: number
    walkInCustomers: number
    totalTransactions: number
    walkInTransactions: number
    rncTransactions: number
    totalRevenue: number
    averageTransactionValue: number
    avgTransactionsPerCustomer: number
    avgRevenuePerCustomer: number
    customerActivationRate: number
    rncAdoptionRate: number
  }
  generatedAt: string
}

export default function CustomerInsightsDashboard() {
  const [data, setData] = useState<CustomerInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('monthly')
  const [limit, setLimit] = useState(20)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/analytics/customer-insights?period=${period}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err: any) {
      console.error('Customer insights fetch error:', err)
      setError(err.message || 'Failed to fetch customer insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period, limit])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg h-32"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg h-96"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <h3 className="text-lg font-bold text-red-900 mb-2">Error al Cargar Insights de Clientes</h3>
            <p className="text-red-800 font-medium">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-6 py-2 bg-red-700 text-white font-semibold rounded hover:bg-red-800 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  // Chart configurations
  const segmentColors = {
    VIP: '#7c3aed',
    FREQUENT: '#1d4ed8', 
    REGULAR: '#047857',
    NEW: '#b91c1c'
  }

  const segmentData = {
    labels: ['VIP', 'FRECUENTE', 'REGULAR', 'NUEVO'],
    datasets: [{
      data: [
        data.customerSegmentation.filter(c => c.customerSegment === 'VIP').length,
        data.customerSegmentation.filter(c => c.customerSegment === 'FREQUENT').length,
        data.customerSegmentation.filter(c => c.customerSegment === 'REGULAR').length,
        data.customerSegmentation.filter(c => c.customerSegment === 'NEW').length
      ],
      backgroundColor: Object.values(segmentColors),
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }

  const rncData = {
    labels: data.rncAnalysis.map(item => item.customerType === 'RNC_CUSTOMER' ? 'Clientes RNC' : 'Clientes Ocasionales'),
    datasets: [{
      label: 'Ingresos (RD$)',
      data: data.rncAnalysis.map(item => item.totalRevenue),
      backgroundColor: ['#1e40af', '#dc2626'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }

  const revenueBySegmentData = {
    labels: ['VIP', 'FRECUENTE', 'REGULAR', 'NUEVO'],
    datasets: [{
      label: 'Ingresos Totales (RD$)',
      data: [
        data.customerSegmentation.filter(c => c.customerSegment === 'VIP').reduce((sum, c) => sum + c.totalSpent, 0),
        data.customerSegmentation.filter(c => c.customerSegment === 'FREQUENT').reduce((sum, c) => sum + c.totalSpent, 0),
        data.customerSegmentation.filter(c => c.customerSegment === 'REGULAR').reduce((sum, c) => sum + c.totalSpent, 0),
        data.customerSegmentation.filter(c => c.customerSegment === 'NEW').reduce((sum, c) => sum + c.totalSpent, 0)
      ],
      backgroundColor: Object.values(segmentColors),
      borderRadius: 8
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        }
      }
    }
  }

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'VIP': return '👑'
      case 'FREQUENT': return '⭐'
      case 'REGULAR': return '👤'
      case 'NEW': return '🆕'
      default: return '👤'
    }
  }

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '🟢'
      case 'DORMANT': return '🟡'
      case 'INACTIVE': return '🔴'
      default: return '⚪'
    }
  }

  const getActivityLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'ACTIVO'
      case 'DORMANT': return 'INACTIVO'
      case 'INACTIVE': return 'INACTIVO'
      default: return 'DESCONOCIDO'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Insights de Clientes</h1>
              <p className="text-gray-700 font-medium">
                Analiza el comportamiento y patrones de compra de clientes • {format(new Date(data.dateRange.start), 'MMM d')} - {format(new Date(data.dateRange.end), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white font-medium"
              >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
              </select>
              <select 
                value={limit} 
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white font-medium"
              >
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
                <option value="50">Top 50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-600 text-sm font-semibold">Total de Clientes</div>
              <div className="text-2xl">👥</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {data.summary.totalCustomers.toLocaleString()}
            </div>
            <div className="text-sm text-green-700 font-medium">
              {data.summary.activeCustomers} activos ({data.summary.customerActivationRate.toFixed(1)}%)
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-600 text-sm font-semibold">Adopción RNC</div>
              <div className="text-2xl">📋</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {data.summary.rncAdoptionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-blue-700 font-medium">
              {data.summary.rncCustomers} clientes RNC
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-600 text-sm font-semibold">Transacción Promedio</div>
              <div className="text-2xl">💰</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              RD${data.summary.averageTransactionValue.toFixed(0)}
            </div>
            <div className="text-sm text-purple-700 font-medium">
              {data.summary.totalTransactions} transacciones totales
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-600 text-sm font-semibold">Valor Promedio por Cliente</div>
              <div className="text-2xl">📊</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              RD${data.summary.avgRevenuePerCustomer.toFixed(0)}
            </div>
            <div className="text-sm text-green-700 font-medium">
              {data.summary.avgTransactionsPerCustomer.toFixed(1)} transacciones promedio
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Customer Segmentation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Segmentación de Clientes</h3>
            <div className="h-80 flex items-center justify-center">
              <Doughnut data={segmentData} options={chartOptions} />
            </div>
          </div>

          {/* RNC vs Walk-in Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Ingresos: RNC vs Ocasionales</h3>
            <div className="h-80">
              <Bar data={rncData} options={chartOptions} />
            </div>
          </div>

          {/* Revenue by Segment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Ingresos por Segmento de Cliente</h3>
            <div className="h-80">
              <Bar data={revenueBySegmentData} options={chartOptions} />
            </div>
          </div>

          {/* Customer Type Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Análisis por Tipo de Cliente</h3>
            <div className="space-y-4">
              {data.rncAnalysis.map((segment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {segment.customerType === 'RNC_CUSTOMER' ? '📋' : '🚶'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {segment.customerType === 'RNC_CUSTOMER' ? 'Clientes RNC' : 'Clientes Ocasionales'}
                      </div>
                      <div className="text-sm text-gray-700 font-medium">
                        {segment.transactionCount} transacciones • {segment.uniqueCustomers} clientes
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      RD${segment.totalRevenue.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-700 font-medium">
                      {segment.marketShare.toFixed(1)}% participación
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Customers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Mejores Clientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cliente</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Segmento</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Transacciones</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Gastado</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Valor Promedio</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Última Compra</th>
                </tr>
              </thead>
              <tbody>
                {data.customerSegmentation.slice(0, 15).map((customer, index) => (
                  <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-600 font-medium">
                          {customer.rnc ? `RNC: ${customer.rnc}` : 'Cliente ocasional'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1">
                        <span>{getSegmentIcon(customer.customerSegment)}</span>
                        <span className="text-sm font-semibold" style={{ color: segmentColors[customer.customerSegment] }}>
                          {customer.customerSegment}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1">
                        <span>{getActivityIcon(customer.activityStatus)}</span>
                        <span className="text-sm font-medium">{getActivityLabel(customer.activityStatus)}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {customer.totalTransactions}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      RD${customer.totalSpent.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      RD${customer.averageTransactionValue.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 font-medium">
                      {format(new Date(customer.lastPurchaseDate), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-700 font-medium">
          Última actualización: {format(new Date(data.generatedAt), 'MMM d, yyyy • h:mm a')}
        </div>
      </div>
    </div>
  )
}
