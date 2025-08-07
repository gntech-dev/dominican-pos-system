/**
 * @file Customer Insights Analytics API (Test Version)
 * @description Test version with simplified auth for demonstration
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'monthly'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Default date range (last 90 days if not specified)
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    console.log(`📊 Customer Insights Analysis: ${period} from ${start.toISOString()} to ${end.toISOString()}`)

    // Get customer segmentation (simplified)
    const customerSegmentation = await getCustomerSegmentation(start, end, limit)
    const rncAnalysis = await getRncVsWalkInAnalysis(start, end)
    const summary = await calculateCustomerSummary(start, end)

    return NextResponse.json({
      period,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      customerSegmentation,
      rncAnalysis,
      summary,
      generatedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Customer insights error:', error)
    return NextResponse.json(
      { error: 'Customer insights failed', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

async function getCustomerSegmentation(startDate: Date, endDate: Date, limit: number) {
  const segmentation = await prisma.$queryRaw`
    SELECT 
      c.id,
      c.name,
      c.email,
      c.phone,
      c.rnc,
      COUNT(s.id)::integer as total_transactions,
      SUM(s.total)::numeric as total_spent,
      AVG(s.total)::numeric as average_transaction_value,
      MIN(s."createdAt") as first_purchase_date,
      MAX(s."createdAt") as last_purchase_date,
      CASE 
        WHEN COUNT(s.id) >= 10 THEN 'VIP'
        WHEN COUNT(s.id) >= 5 THEN 'FREQUENT'
        WHEN COUNT(s.id) >= 2 THEN 'REGULAR'
        ELSE 'NEW'
      END as customer_segment,
      CASE 
        WHEN MAX(s."createdAt") >= CURRENT_DATE - INTERVAL '30 days' THEN 'ACTIVE'
        WHEN MAX(s."createdAt") >= CURRENT_DATE - INTERVAL '90 days' THEN 'DORMANT'
        ELSE 'INACTIVE'
      END as activity_status
    FROM "customers" c
    LEFT JOIN "sales" s ON c.id = s."customerId"
    WHERE s."createdAt" >= ${startDate}
      AND s."createdAt" <= ${endDate}
      AND s.status = 'COMPLETED'
    GROUP BY c.id, c.name, c.email, c.phone, c.rnc
    HAVING COUNT(s.id) > 0
    ORDER BY total_spent DESC
    LIMIT ${limit}
  `

  return (segmentation as any[]).map(customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    rnc: customer.rnc,
    totalTransactions: Number(customer.total_transactions),
    totalSpent: Number(customer.total_spent),
    averageTransactionValue: Number(customer.average_transaction_value),
    firstPurchaseDate: customer.first_purchase_date,
    lastPurchaseDate: customer.last_purchase_date,
    customerSegment: customer.customer_segment,
    activityStatus: customer.activity_status
  }))
}

async function getRncVsWalkInAnalysis(startDate: Date, endDate: Date) {
  const rncAnalysis = await prisma.$queryRaw`
    SELECT 
      CASE 
        WHEN s."customerId" IS NOT NULL THEN 'RNC_CUSTOMER'
        ELSE 'WALK_IN'
      END as customer_type,
      COUNT(s.id)::integer as transaction_count,
      SUM(s.total)::numeric as total_revenue,
      AVG(s.total)::numeric as average_transaction_value,
      COUNT(DISTINCT CASE WHEN s."customerId" IS NOT NULL THEN s."customerId" END)::integer as unique_customers
    FROM "sales" s
    WHERE s."createdAt" >= ${startDate}
      AND s."createdAt" <= ${endDate}
      AND s.status = 'COMPLETED'
    GROUP BY CASE WHEN s."customerId" IS NOT NULL THEN 'RNC_CUSTOMER' ELSE 'WALK_IN' END
    ORDER BY total_revenue DESC
  `

  const totalRevenue = (rncAnalysis as any[]).reduce((sum, segment) => sum + Number(segment.total_revenue), 0)

  return (rncAnalysis as any[]).map(segment => ({
    customerType: segment.customer_type,
    transactionCount: Number(segment.transaction_count),
    totalRevenue: Number(segment.total_revenue),
    averageTransactionValue: Number(segment.average_transaction_value),
    uniqueCustomers: Number(segment.unique_customers),
    marketShare: totalRevenue > 0 ? (Number(segment.total_revenue) / totalRevenue * 100) : 0
  }))
}

async function calculateCustomerSummary(startDate: Date, endDate: Date) {
  const summary = await prisma.$queryRaw`
    SELECT 
      COUNT(DISTINCT c.id)::integer as total_customers,
      COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN c.id END)::integer as active_customers,
      COUNT(DISTINCT CASE WHEN c.rnc IS NOT NULL AND LENGTH(c.rnc) > 0 THEN c.id END)::integer as rnc_customers,
      COUNT(s.id)::integer as total_transactions,
      COUNT(DISTINCT CASE WHEN s."customerId" IS NULL THEN s.id END)::integer as walk_in_transactions,
      SUM(s.total)::numeric as total_revenue,
      AVG(s.total)::numeric as average_transaction_value,
      COUNT(s.id) / NULLIF(COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN s."customerId" END), 0)::numeric as avg_transactions_per_customer,
      SUM(s.total) / NULLIF(COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN s."customerId" END), 0)::numeric as avg_revenue_per_customer
    FROM "customers" c
    LEFT JOIN "sales" s ON c.id = s."customerId" AND s."createdAt" >= ${startDate} AND s."createdAt" <= ${endDate} AND s.status = 'COMPLETED'
  `

  const result = (summary as any[])[0]
  const totalCustomers = Number(result.total_customers)
  const activeCustomers = Number(result.active_customers)
  const rncCustomers = Number(result.rnc_customers)
  const totalTransactions = Number(result.total_transactions)
  const walkInTransactions = Number(result.walk_in_transactions)
  
  return {
    totalCustomers,
    activeCustomers,
    rncCustomers,
    walkInCustomers: totalCustomers - rncCustomers,
    totalTransactions,
    walkInTransactions,
    rncTransactions: totalTransactions - walkInTransactions,
    totalRevenue: Number(result.total_revenue),
    averageTransactionValue: Number(result.average_transaction_value),
    avgTransactionsPerCustomer: Number(result.avg_transactions_per_customer) || 0,
    avgRevenuePerCustomer: Number(result.avg_revenue_per_customer) || 0,
    customerActivationRate: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0,
    rncAdoptionRate: totalCustomers > 0 ? (rncCustomers / totalCustomers) * 100 : 0
  }
}
