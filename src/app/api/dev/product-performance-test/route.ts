/**
 * @file Product Performance Analytics API (Test Version)
 * @description Test version with correct table names and simplified auth
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

    // Default date range (last 30 days if not specified)
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    console.log(`📊 Product Performance Analysis: ${period} from ${start.toISOString()} to ${end.toISOString()}`)

    // Get top performing products
    const topProducts = await getTopPerformingProducts(start, end, limit)
    const summary = await calculateProductSummary(start, end)

    return NextResponse.json({
      period,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      topProducts,
      summary,
      generatedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Product analytics error:', error)
    return NextResponse.json(
      { error: 'Product analytics failed', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

async function getTopPerformingProducts(startDate: Date, endDate: Date, limit: number) {
  const topProducts = await prisma.$queryRaw`
    SELECT 
      p.id,
      p.name,
      p.code,
      p.price,
      p.cost,
      p.stock,
      p."minStock",
      c.name as category_name,
      COUNT(si.id)::integer as units_sold,
      SUM(si.quantity)::integer as total_quantity_sold,
      SUM(si.quantity * si."unitPrice")::numeric as total_revenue,
      SUM(si.quantity * p.cost)::numeric as total_cost,
      SUM(si.quantity * (si."unitPrice" - p.cost))::numeric as total_profit,
      AVG(si."unitPrice")::numeric as average_selling_price,
      (SUM(si.quantity * (si."unitPrice" - p.cost)) / NULLIF(SUM(si.quantity * si."unitPrice"), 0) * 100)::numeric as profit_margin_percent
    FROM "products" p
    LEFT JOIN "categories" c ON p."categoryId" = c.id
    LEFT JOIN "sale_items" si ON p.id = si."productId"
    LEFT JOIN "sales" s ON si."saleId" = s.id
    WHERE s."createdAt" >= ${startDate}
      AND s."createdAt" <= ${endDate}
      AND s.status = 'COMPLETED'
    GROUP BY p.id, p.name, p.code, p.price, p.cost, p.stock, p."minStock", c.name
    HAVING COUNT(si.id) > 0
    ORDER BY total_revenue DESC
    LIMIT ${limit}
  `

  return (topProducts as any[]).map(product => ({
    id: product.id,
    name: product.name,
    code: product.code,
    price: Number(product.price),
    cost: Number(product.cost),
    currentStock: Number(product.stock),
    minStock: Number(product.minStock),
    categoryName: product.category_name,
    unitsSold: Number(product.units_sold),
    totalQuantitySold: Number(product.total_quantity_sold),
    totalRevenue: Number(product.total_revenue),
    totalCost: Number(product.total_cost),
    totalProfit: Number(product.total_profit),
    averageSellingPrice: Number(product.average_selling_price),
    profitMarginPercent: Number(product.profit_margin_percent) || 0,
    stockTurnover: Number(product.total_quantity_sold) / Math.max(Number(product.stock), 1),
    stockStatus: Number(product.stock) <= Number(product.minStock) ? 'LOW' : 'NORMAL'
  }))
}

async function calculateProductSummary(startDate: Date, endDate: Date) {
  const summary = await prisma.$queryRaw`
    SELECT 
      COUNT(DISTINCT p.id)::integer as total_products,
      COUNT(DISTINCT CASE WHEN si.id IS NOT NULL THEN p.id END)::integer as products_sold,
      SUM(CASE WHEN p.stock <= p."minStock" THEN 1 ELSE 0 END)::integer as low_stock_count,
      SUM(CASE WHEN p.stock = 0 THEN 1 ELSE 0 END)::integer as out_of_stock_count,
      COALESCE(SUM(si.quantity), 0)::integer as total_units_sold,
      COALESCE(SUM(si.quantity * si."unitPrice"), 0)::numeric as total_revenue,
      COALESCE(SUM(si.quantity * p.cost), 0)::numeric as total_cost,
      SUM(p.stock * p.cost)::numeric as total_inventory_value
    FROM "products" p
    LEFT JOIN "sale_items" si ON p.id = si."productId"
    LEFT JOIN "sales" s ON si."saleId" = s.id AND s."createdAt" >= ${startDate} AND s."createdAt" <= ${endDate} AND s.status = 'COMPLETED'
  `

  const result = (summary as any[])[0]
  const totalProducts = Number(result.total_products)
  const productsSold = Number(result.products_sold)
  const totalRevenue = Number(result.total_revenue)
  const totalCost = Number(result.total_cost)
  
  return {
    totalProducts,
    productsSold,
    lowStockCount: Number(result.low_stock_count),
    outOfStockCount: Number(result.out_of_stock_count),
    totalUnitsSold: Number(result.total_units_sold),
    totalRevenue,
    totalCost,
    totalProfit: totalRevenue - totalCost,
    totalInventoryValue: Number(result.total_inventory_value),
    sellThroughRate: totalProducts > 0 ? (productsSold / totalProducts) * 100 : 0
  }
}
