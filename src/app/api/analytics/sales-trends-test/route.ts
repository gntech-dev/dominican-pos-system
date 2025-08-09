/**
 * @file Sales Trends Analytics API (Test Version)
 * @description Test version with simplified auth for demonstration
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'daily'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const comparison = searchParams.get('comparison') || 'none'

    // Default date range (use current date if not specified)
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    console.log(`📊 Generating sales trends analysis for ${period} from ${start.toISOString()} to ${end.toISOString()}`)

    // Get the main sales data
    const salesData = await getSalesTrendData(start, end, period)
    
    // Get comparison data if requested
    let comparisonData = null
    if (comparison !== 'none') {
      comparisonData = await getComparisonData(start, end, period, comparison)
    }

    // Get peak hours analysis
    const peakHours = await getPeakHoursAnalysis(start, end)

    // Get seasonal trends (last 12 months for context)
    const seasonalStart = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate())
    const seasonalTrends = await getSeasonalTrends(seasonalStart, end)

    // Calculate summary statistics
    const summary = calculateSummaryStats(salesData)

    return NextResponse.json({
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      salesData,
      comparisonData,
      peakHours,
      seasonalTrends,
      summary,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Sales trends analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to generate sales trends analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function getSalesTrendData(startDate: Date, endDate: Date, period: string) {
  let groupBy: string
  
  switch (period) {
    case 'daily':
      groupBy = "DATE(s.\"createdAt\")"
      break
    case 'weekly':
      groupBy = "DATE_TRUNC('week', s.\"createdAt\")"
      break
    case 'monthly':
      groupBy = "DATE_TRUNC('month', s.\"createdAt\")"
      break
    case 'yearly':
      groupBy = "DATE_TRUNC('year', s.\"createdAt\")"
      break
    default:
      groupBy = "DATE(s.\"createdAt\")"
  }

  const salesData = await prisma.$queryRaw`
    SELECT 
      ${groupBy} as period,
      COUNT(*)::integer as transaction_count,
      SUM(s.total)::numeric as total_sales,
      SUM(s.subtotal)::numeric as subtotal,
      SUM(s.itbis)::numeric as total_tax,
      AVG(s.total)::numeric as average_transaction,
      MIN(s.total)::numeric as min_transaction,
      MAX(s.total)::numeric as max_transaction,
      COUNT(DISTINCT s."customerId")::integer as unique_customers,
      COUNT(DISTINCT CASE WHEN s."customerId" IS NULL THEN s.id END)::integer as walk_in_sales
    FROM "sales" s
    WHERE s."createdAt" >= ${startDate}
      AND s."createdAt" <= ${endDate}
      AND s.status = 'COMPLETED'
    GROUP BY ${groupBy}
    ORDER BY ${groupBy}
  `

  return (salesData as any[]).map(row => ({
    period: row.period,
    transactionCount: Number(row.transaction_count),
    totalSales: Number(row.total_sales),
    subtotal: Number(row.subtotal),
    totalTax: Number(row.total_tax),
    averageTransaction: Number(row.average_transaction),
    minTransaction: Number(row.min_transaction),
    maxTransaction: Number(row.max_transaction),
    uniqueCustomers: Number(row.unique_customers),
    walkInSales: Number(row.walk_in_sales)
  }))
}

async function getComparisonData(startDate: Date, endDate: Date, period: string, comparison: string) {
  let comparisonStart: Date
  let comparisonEnd: Date

  if (comparison === 'year-over-year') {
    comparisonStart = new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate())
    comparisonEnd = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate())
  } else {
    const periodLength = endDate.getTime() - startDate.getTime()
    comparisonEnd = new Date(startDate.getTime() - 1)
    comparisonStart = new Date(comparisonEnd.getTime() - periodLength)
  }

  return await getSalesTrendData(comparisonStart, comparisonEnd, period)
}

async function getPeakHoursAnalysis(startDate: Date, endDate: Date) {
  const hourlyData = await prisma.$queryRaw`
    SELECT 
      EXTRACT(hour FROM s."createdAt")::integer as hour,
      EXTRACT(dow FROM s."createdAt")::integer as day_of_week,
      COUNT(*)::integer as transaction_count,
      SUM(s.total)::numeric as total_sales,
      AVG(s.total)::numeric as average_transaction
    FROM "sales" s
    WHERE s."createdAt" >= ${startDate}
      AND s."createdAt" <= ${endDate}
      AND s.status = 'COMPLETED'
    GROUP BY EXTRACT(hour FROM s."createdAt"), EXTRACT(dow FROM s."createdAt")
    ORDER BY transaction_count DESC
  `

  // Process hourly data
  const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    transactionCount: 0,
    totalSales: 0,
    averageTransaction: 0
  }))

  const dailyStats = Array.from({ length: 7 }, (_, day) => ({
    day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
    dayNumber: day,
    transactionCount: 0,
    totalSales: 0,
    averageTransaction: 0
  }))

  ;(hourlyData as any[]).forEach(row => {
    const hour = Number(row.hour)
    const dayOfWeek = Number(row.day_of_week)
    const transactionCount = Number(row.transaction_count)
    const totalSales = Number(row.total_sales)

    hourlyStats[hour].transactionCount += transactionCount
    hourlyStats[hour].totalSales += totalSales
    hourlyStats[hour].averageTransaction = hourlyStats[hour].totalSales / hourlyStats[hour].transactionCount || 0

    dailyStats[dayOfWeek].transactionCount += transactionCount
    dailyStats[dayOfWeek].totalSales += totalSales
    dailyStats[dayOfWeek].averageTransaction = dailyStats[dayOfWeek].totalSales / dailyStats[dayOfWeek].transactionCount || 0
  })

  const peakHour = hourlyStats.reduce((max, curr) => 
    curr.transactionCount > max.transactionCount ? curr : max
  )

  const peakDay = dailyStats.reduce((max, curr) => 
    curr.transactionCount > max.transactionCount ? curr : max
  )

  return {
    hourlyBreakdown: hourlyStats,
    dailyBreakdown: dailyStats,
    peakHour: {
      hour: peakHour.hour,
      timeRange: `${peakHour.hour}:00 - ${peakHour.hour + 1}:00`,
      transactionCount: peakHour.transactionCount,
      totalSales: peakHour.totalSales
    },
    peakDay: {
      day: peakDay.day,
      transactionCount: peakDay.transactionCount,
      totalSales: peakDay.totalSales
    }
  }
}

async function getSeasonalTrends(startDate: Date, endDate: Date) {
  const monthlyData = await prisma.$queryRaw`
    SELECT 
      EXTRACT(month FROM s."createdAt")::integer as month,
      EXTRACT(year FROM s."createdAt")::integer as year,
      COUNT(*)::integer as transaction_count,
      SUM(s.total)::numeric as total_sales,
      AVG(s.total)::numeric as average_transaction
    FROM "sales" s
    WHERE s."createdAt" >= ${startDate}
      AND s."createdAt" <= ${endDate}
      AND s.status = 'COMPLETED'
    GROUP BY EXTRACT(month FROM s."createdAt"), EXTRACT(year FROM s."createdAt")
    ORDER BY year, month
  `

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const trends = (monthlyData as any[]).map(row => ({
    month: Number(row.month),
    year: Number(row.year),
    monthName: monthNames[Number(row.month) - 1],
    transactionCount: Number(row.transaction_count),
    totalSales: Number(row.total_sales),
    averageTransaction: Number(row.average_transaction)
  }))

  const seasonalAverages = {
    spring: { months: [3, 4, 5], totalSales: 0, transactionCount: 0 },
    summer: { months: [6, 7, 8], totalSales: 0, transactionCount: 0 },
    fall: { months: [9, 10, 11], totalSales: 0, transactionCount: 0 },
    winter: { months: [12, 1, 2], totalSales: 0, transactionCount: 0 }
  }

  trends.forEach(trend => {
    for (const [season, data] of Object.entries(seasonalAverages)) {
      if (data.months.includes(trend.month)) {
        data.totalSales += trend.totalSales
        data.transactionCount += trend.transactionCount
      }
    }
  })

  return {
    monthlyTrends: trends,
    seasonalAverages: Object.fromEntries(
      Object.entries(seasonalAverages).map(([season, data]) => [
        season,
        {
          totalSales: data.totalSales,
          transactionCount: data.transactionCount,
          averageTransaction: data.totalSales / data.transactionCount || 0
        }
      ])
    )
  }
}

function calculateSummaryStats(salesData: any[]) {
  if (salesData.length === 0) {
    return {
      totalSales: 0,
      totalTransactions: 0,
      averageTransactionValue: 0,
      growthRate: 0,
      bestPeriod: null,
      worstPeriod: null
    }
  }

  const totalSales = salesData.reduce((sum, period) => sum + period.totalSales, 0)
  const totalTransactions = salesData.reduce((sum, period) => sum + period.transactionCount, 0)
  const averageTransactionValue = totalSales / totalTransactions

  const growthRate = salesData.length > 1 
    ? ((salesData[salesData.length - 1].totalSales - salesData[0].totalSales) / salesData[0].totalSales) * 100
    : 0

  const bestPeriod = salesData.reduce((max, curr) => 
    curr.totalSales > max.totalSales ? curr : max
  )

  const worstPeriod = salesData.reduce((min, curr) => 
    curr.totalSales < min.totalSales ? curr : min
  )

  return {
    totalSales,
    totalTransactions,
    averageTransactionValue,
    growthRate,
    bestPeriod,
    worstPeriod
  }
}
