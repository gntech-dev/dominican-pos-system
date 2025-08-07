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
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

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

interface FinancialData {
  period: string
  dateRange: {
    start: string
    end: string
  }
  cashFlow: {
    totalIncome: number
    totalExpenses: number
    netCashFlow: number
    operatingCashFlow: number
    projectedCashFlow: number
  }
  profitLoss: {
    grossRevenue: number
    totalCogs: number
    grossProfit: number
    totalOperatingExpenses: number
    netProfit: number
    grossProfitMargin: number
    netProfitMargin: number
  }
  expenses: Array<{
    id: string
    category: string
    description: string
    amount: number
    date: string
    type: 'OPERATIONAL' | 'INVENTORY' | 'UTILITIES' | 'RENT' | 'SALARIES' | 'OTHER'
    paymentMethod: string
    vendor?: string
    reference?: string
  }>
  taxSummary: {
    itbisCollected: number
    itbisPaid: number
    itbisBalance: number
    withholdingTax: number
    monthlyTaxDue: number
    nextFilingDate: string
  }
  bankAccounts: Array<{
    id: string
    accountName: string
    bankName: string
    accountType: string
    balance: number
    lastTransaction: string
    currency: 'DOP' | 'USD'
  }>
  monthlyComparison: Array<{
    month: string
    revenue: number
    expenses: number
    profit: number
    profitMargin: number
  }>
  expenseBreakdown: Array<{
    category: string
    amount: number
    percentage: number
    count: number
  }>
  summary: {
    totalRevenue: number
    totalExpenses: number
    netIncome: number
    cashPosition: number
    operatingMargin: number
    debtToEquity: number
    workingCapital: number
    currentRatio: number
  }
  generatedAt: string
}

export default function FinancialDashboard() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('monthly')
  const [view, setView] = useState<'overview' | 'cashflow' | 'expenses' | 'taxes'>('overview')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/finance/dashboard?period=${period}`, {
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
      console.error('Financial data fetch error:', err)
      setError(err.message || 'Error al cargar datos financieros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period])

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
            <h3 className="text-lg font-bold text-red-900 mb-2">Error al Cargar Panel Financiero</h3>
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
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y || context.parsed
            return `${context.dataset.label}: RD$${value.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return `RD$${value.toLocaleString()}`
          }
        }
      }
    }
  }

  const monthlyData = {
    labels: data.monthlyComparison.map(item => item.month),
    datasets: [
      {
        label: 'Ingresos',
        data: data.monthlyComparison.map(item => item.revenue),
        backgroundColor: '#10b981',
        borderRadius: 8
      },
      {
        label: 'Gastos',
        data: data.monthlyComparison.map(item => item.expenses),
        backgroundColor: '#ef4444',
        borderRadius: 8
      },
      {
        label: 'Ganancia Neta',
        data: data.monthlyComparison.map(item => item.profit),
        backgroundColor: '#3b82f6',
        borderRadius: 8
      }
    ]
  }

  const expenseData = {
    labels: data.expenseBreakdown.map(item => item.category),
    datasets: [{
      data: data.expenseBreakdown.map(item => item.amount),
      backgroundColor: [
        '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', 
        '#3b82f6', '#f97316', '#84cc16', '#ec4899'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }

  const cashFlowData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [{
      label: 'Flujo de Efectivo',
      data: [45000, 52000, 48000, 61000, 55000, data.cashFlow.netCashFlow],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  }

  const getFinancialHealthColor = (ratio: number) => {
    if (ratio >= 75) return 'text-green-600'
    if (ratio >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFinancialHealthStatus = (ratio: number) => {
    if (ratio >= 75) return 'Excelente'
    if (ratio >= 50) return 'Bueno'
    return 'Necesita Atención'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel Financiero</h1>
              <p className="text-gray-700 font-medium">
                Gestiona las finanzas del negocio • {format(new Date(data.dateRange.start), 'MMM d')} - {format(new Date(data.dateRange.end), 'MMM d, yyyy')}
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
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6">
            {[
              { key: 'overview', label: 'Resumen', icon: '📊' },
              { key: 'cashflow', label: 'Flujo de Efectivo', icon: '💰' },
              { key: 'expenses', label: 'Gastos', icon: '💸' },
              { key: 'taxes', label: 'Impuestos', icon: '🏛️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  view === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-600 text-sm font-semibold">Ingresos Totales</div>
              <div className="text-2xl">💵</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              RD${data.summary.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-green-700 font-medium">
              Margen: {data.profitLoss.grossProfitMargin.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-600 text-sm font-semibold">Gastos Totales</div>
              <div className="text-2xl">💸</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              RD${data.summary.totalExpenses.toLocaleString()}
            </div>
            <div className="text-sm text-blue-700 font-medium">
              {data.expenseBreakdown.length} categorías
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-600 text-sm font-semibold">Ganancia Neta</div>
              <div className="text-2xl">📈</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              RD${data.summary.netIncome.toLocaleString()}
            </div>
            <div className={`text-sm font-medium ${
              data.profitLoss.netProfitMargin >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              Margen: {data.profitLoss.netProfitMargin.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-600 text-sm font-semibold">Posición de Efectivo</div>
              <div className="text-2xl">🏦</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              RD${data.summary.cashPosition.toLocaleString()}
            </div>
            <div className="text-sm text-purple-700 font-medium">
              {data.bankAccounts.length} cuentas
            </div>
          </div>
        </div>

        {/* Content based on selected view */}
        {view === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Rendimiento Mensual</h3>
              <div className="h-80">
                <Bar data={monthlyData} options={chartOptions} />
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribución de Gastos</h3>
              <div className="h-80 flex items-center justify-center">
                <Doughnut data={expenseData} options={chartOptions} />
              </div>
            </div>

            {/* Financial Health Indicators */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Indicadores de Salud Financiera</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">Margen Operativo</div>
                    <div className="text-sm text-gray-600">Eficiencia operacional</div>
                  </div>
                  <div className={`text-right ${getFinancialHealthColor(data.summary.operatingMargin)}`}>
                    <div className="font-bold text-lg">{data.summary.operatingMargin.toFixed(1)}%</div>
                    <div className="text-sm">{getFinancialHealthStatus(data.summary.operatingMargin)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">Capital de Trabajo</div>
                    <div className="text-sm text-gray-600">Liquidez a corto plazo</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-blue-600">
                      RD${data.summary.workingCapital.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Disponible</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">Ratio Corriente</div>
                    <div className="text-sm text-gray-600">Capacidad de pago</div>
                  </div>
                  <div className={`text-right ${getFinancialHealthColor(data.summary.currentRatio * 25)}`}>
                    <div className="font-bold text-lg">{data.summary.currentRatio.toFixed(2)}</div>
                    <div className="text-sm">{data.summary.currentRatio >= 2 ? 'Saludable' : 'Bajo'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Resumen Fiscal</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <div className="font-semibold text-blue-900">ITBIS Recolectado</div>
                    <div className="text-sm text-blue-700">Impuesto sobre ventas</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-blue-900">
                      RD${data.taxSummary.itbisCollected.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <div className="font-semibold text-red-900">ITBIS Pagado</div>
                    <div className="text-sm text-red-700">Impuesto sobre compras</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-red-900">
                      RD${data.taxSummary.itbisPaid.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <div className="font-semibold text-green-900">Balance ITBIS</div>
                    <div className="text-sm text-green-700">A pagar este mes</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-green-900">
                      RD${data.taxSummary.itbisBalance.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <div className="text-yellow-600">⏰</div>
                    <div>
                      <div className="font-semibold text-yellow-900">Próxima Declaración</div>
                      <div className="text-sm text-yellow-700">
                        {format(new Date(data.taxSummary.nextFilingDate), 'MMMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'cashflow' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Cash Flow Trend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Tendencia de Flujo de Efectivo</h3>
              <div className="h-80">
                <Line data={cashFlowData} options={chartOptions} />
              </div>
            </div>

            {/* Cash Flow Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Flujo de Efectivo Actual</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-green-900">Ingresos Totales</div>
                    <div className="text-sm text-green-700">Ventas del período</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-green-900">
                      RD${data.cashFlow.totalIncome.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-red-900">Gastos Totales</div>
                    <div className="text-sm text-red-700">Costos operativos</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-red-900">
                      RD${data.cashFlow.totalExpenses.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-blue-900">Flujo Neto</div>
                    <div className="text-sm text-blue-700">Resultado del período</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${data.cashFlow.netCashFlow >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                      RD${data.cashFlow.netCashFlow.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Accounts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Cuentas Bancarias</h3>
              <div className="space-y-4">
                {data.bankAccounts.map((account) => (
                  <div key={account.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900">{account.accountName}</div>
                      <div className="text-sm text-gray-600">{account.currency}</div>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm text-gray-600">{account.bankName}</div>
                      <div className="font-bold text-gray-900">
                        RD${account.balance.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Última transacción: {format(new Date(account.lastTransaction), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'expenses' && (
          <div className="space-y-6">
            {/* Expense Management Link */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Gestión Completa de Gastos</h3>
                  <p className="text-green-100">Administra y controla todos los gastos operativos del negocio</p>
                </div>
                <a
                  href="/finance/expenses"
                  className="px-6 py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors"
                >
                  Abrir Gestión de Gastos →
                </a>
              </div>
            </div>

            {/* Recent Expenses Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Gastos por Categoría</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.expenseBreakdown.map((category, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900">{category.category}</div>
                      <div className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</div>
                    </div>
                    <div className="font-bold text-lg text-gray-900 mb-1">
                      RD${category.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {category.count} transacciones
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'taxes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* ITBIS Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Resumen ITBIS</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-blue-900">ITBIS por Cobrar (Ventas)</div>
                    <div className="text-blue-600">📈</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    RD${data.taxSummary.itbisCollected.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">18% sobre ventas gravadas</div>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-red-900">ITBIS por Pagar (Compras)</div>
                    <div className="text-red-600">📉</div>
                  </div>
                  <div className="text-2xl font-bold text-red-900">
                    RD${data.taxSummary.itbisPaid.toLocaleString()}
                  </div>
                  <div className="text-sm text-red-700 mt-1">Crédito fiscal disponible</div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-green-900">Balance a Pagar</div>
                    <div className="text-green-600">💰</div>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    RD${data.taxSummary.itbisBalance.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 mt-1">Obligación mensual DGII</div>
                </div>
              </div>
            </div>

            {/* Tax Calendar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Calendario Fiscal</h3>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📅</div>
                    <div>
                      <div className="font-semibold text-yellow-900">Declaración IT-1</div>
                      <div className="text-sm text-yellow-700">
                        Vencimiento: {format(new Date(data.taxSummary.nextFilingDate), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        Impuesto sobre la renta mensual
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📋</div>
                    <div>
                      <div className="font-semibold text-purple-900">Reporte 606/607</div>
                      <div className="text-sm text-purple-700">
                        Vencimiento: 20 de cada mes
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        Compras y ventas a la DGII
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🏛️</div>
                    <div>
                      <div className="font-semibold text-indigo-900">Retenciones</div>
                      <div className="text-sm text-indigo-700">
                        RD${data.taxSummary.withholdingTax.toLocaleString()}
                      </div>
                      <div className="text-xs text-indigo-600 mt-1">
                        Impuestos retenidos por pagar
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-700 font-medium">
          Última actualización: {format(new Date(data.generatedAt), 'MMM d, yyyy • h:mm a')}
        </div>
      </div>
    </div>
  )
}
