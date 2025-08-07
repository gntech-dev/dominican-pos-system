'use client'

import React, { useState, useEffect } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface SalesTrendsData {
  period: string
  dateRange: {
    start: string
    end: string
  }
  salesData: Array<{
    period: string
    transactionCount: number
    totalSales: number
    subtotal: number
    totalTax: number
    averageTransaction: number
    minTransaction: number
    maxTransaction: number
    uniqueCustomers: number
    walkInSales: number
  }>
  comparisonData?: Array<any>
  peakHours: {
    hourlyBreakdown: Array<{
      hour: number
      transactionCount: number
      totalSales: number
      averageTransaction: number
    }>
    dailyBreakdown: Array<{
      day: string
      dayNumber: number
      transactionCount: number
      totalSales: number
      averageTransaction: number
    }>
    peakHour: {
      hour: number
      timeRange: string
      transactionCount: number
      totalSales: number
    }
    peakDay: {
      day: string
      transactionCount: number
      totalSales: number
    }
  }
  seasonalTrends: {
    monthlyTrends: Array<{
      month: number
      year: number
      monthName: string
      transactionCount: number
      totalSales: number
      averageTransaction: number
    }>
    seasonalAverages: Record<string, {
      totalSales: number
      transactionCount: number
      averageTransaction: number
    }>
  }
  summary: {
    totalSales: number
    totalTransactions: number
    averageTransactionValue: number
    growthRate: number
    bestPeriod: any
    worstPeriod: any
  }
}

export default function SalesTrendsAnalysis() {
  const [data, setData] = useState<SalesTrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('monthly')
  const [comparison, setComparison] = useState('none')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const fetchSalesTrends = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period,
        comparison,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })

      const response = await fetch(`/api/analytics/sales-trends?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token'}`
        }
      })

      if (response.ok) {
        const trendsData = await response.json()
        setData(trendsData)
      } else {
        console.error('Failed to fetch sales trends')
      }
    } catch (error) {
      console.error('Error fetching sales trends:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesTrends()
  }, [period, comparison, dateRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO')
  }

  // Prepare chart data
  const salesTrendChartData = data ? {
    labels: data.salesData.map(item => formatDate(item.period)),
    datasets: [
      {
        label: 'Total Sales',
        data: data.salesData.map(item => item.totalSales),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      ...(data.comparisonData ? [{
        label: comparison === 'year-over-year' ? 'Previous Year' : 'Previous Period',
        data: data.comparisonData.map((item: any) => item.totalSales),
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        fill: false,
        borderDash: [5, 5],
        tension: 0.4
      }] : [])
    ]
  } : null

  const peakHoursChartData = data ? {
    labels: data.peakHours.hourlyBreakdown.map(item => `${item.hour}:00`),
    datasets: [{
      label: 'Transactions by Hour',
      data: data.peakHours.hourlyBreakdown.map(item => item.transactionCount),
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 1
    }]
  } : null

  const dailyBreakdownChartData = data ? {
    labels: data.peakHours.dailyBreakdown.map(item => item.day),
    datasets: [{
      label: 'Sales by Day',
      data: data.peakHours.dailyBreakdown.map(item => item.totalSales),
      backgroundColor: [
        '#FF6384',
        '#36A2EB', 
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40',
        '#FF6384'
      ]
    }]
  } : null

  const seasonalTrendsChartData = data ? {
    labels: data.seasonalTrends.monthlyTrends.map(item => `${item.monthName} ${item.year}`),
    datasets: [{
      label: 'Monthly Sales',
      data: data.seasonalTrends.monthlyTrends.map(item => item.totalSales),
      backgroundColor: 'rgba(168, 85, 247, 0.8)',
      borderColor: 'rgb(168, 85, 247)',
      borderWidth: 2
    }]
  } : null

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">📊 Sales Trends Analysis</h1>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          
          <select
            value={comparison}
            onChange={(e) => setComparison(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">No Comparison</option>
            <option value="previous">Previous Period</option>
            <option value="year-over-year">Year-over-Year</option>
          </select>
          
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(data.summary.totalSales)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {data.summary.totalTransactions.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(data.summary.averageTransactionValue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${data.summary.growthRate >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <svg className={`w-6 h-6 ${data.summary.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={data.summary.growthRate >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                  <p className={`text-2xl font-semibold ${data.summary.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.summary.growthRate > 0 ? '+' : ''}{data.summary.growthRate.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Trend Chart */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend Over Time</h3>
            {salesTrendChartData && (
              <div className="h-80">
                <Line 
                  data={salesTrendChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false
                      }
                    },
                    interaction: {
                      mode: 'index' as const,
                      intersect: false,
                    },
                    scales: {
                      x: {
                        display: true,
                        title: {
                          display: true,
                          text: 'Period'
                        }
                      },
                      y: {
                        display: true,
                        title: {
                          display: true,
                          text: 'Sales (DOP)'
                        },
                        ticks: {
                          callback: function(value: any) {
                            return formatCurrency(Number(value))
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Peak Hours Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours Analysis</h3>
              {peakHoursChartData && (
                <div className="h-64">
                  <Bar 
                    data={peakHoursChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Hour of Day'
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Number of Transactions'
                          }
                        }
                      }
                    }}
                  />
                </div>
              )}
              
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Peak Hour:</strong> {data.peakHours.peakHour.timeRange} 
                  ({data.peakHours.peakHour.transactionCount} transactions, {formatCurrency(data.peakHours.peakHour.totalSales)})
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Performance</h3>
              {dailyBreakdownChartData && (
                <div className="h-64">
                  <Doughnut 
                    data={dailyBreakdownChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const
                        }
                      }
                    }}
                  />
                </div>
              )}
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Best Day:</strong> {data.peakHours.peakDay.day} 
                  ({data.peakHours.peakDay.transactionCount} transactions, {formatCurrency(data.peakHours.peakDay.totalSales)})
                </p>
              </div>
            </div>
          </div>

          {/* Seasonal Trends */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Trends (Last 12 Months)</h3>
            {seasonalTrendsChartData && (
              <div className="h-80">
                <Bar 
                  data={seasonalTrendsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Month'
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Sales (DOP)'
                        },
                        ticks: {
                          callback: function(value: any) {
                            return formatCurrency(Number(value))
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* Seasonal Averages */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.seasonalTrends.seasonalAverages).map(([season, stats]) => (
                <div key={season} className="p-3 bg-gray-50 rounded-lg text-center">
                  <h4 className="font-semibold text-gray-900 capitalize">{season}</h4>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(stats.totalSales)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.transactionCount} transactions
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-600 mb-2">🏆 Best Performing Period</h4>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm">
                    <strong>Date:</strong> {formatDate(data.summary.bestPeriod?.period)}
                  </p>
                  <p className="text-sm">
                    <strong>Sales:</strong> {formatCurrency(data.summary.bestPeriod?.totalSales || 0)}
                  </p>
                  <p className="text-sm">
                    <strong>Transactions:</strong> {data.summary.bestPeriod?.transactionCount || 0}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-red-600 mb-2">📉 Lowest Performing Period</h4>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm">
                    <strong>Date:</strong> {formatDate(data.summary.worstPeriod?.period)}
                  </p>
                  <p className="text-sm">
                    <strong>Sales:</strong> {formatCurrency(data.summary.worstPeriod?.totalSales || 0)}
                  </p>
                  <p className="text-sm">
                    <strong>Transactions:</strong> {data.summary.worstPeriod?.transactionCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
