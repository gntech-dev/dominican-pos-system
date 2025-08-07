import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

const prisma = new PrismaClient()

interface JWTPayload {
  userId: string
  role: string
}

export async function GET(request: NextRequest) {
  try {
    // Extract authorization token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload

    // Check user permissions
    if (!['ADMIN', 'MANAGER'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly'

    // Calculate date range based on period
    let startDate: Date
    let endDate: Date = new Date()

    switch (period) {
      case 'daily':
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'weekly':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'monthly':
        startDate = startOfMonth(new Date())
        endDate = endOfMonth(new Date())
        break
      case 'quarterly':
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case 'yearly':
        startDate = new Date()
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        startDate = startOfMonth(new Date())
        endDate = endOfMonth(new Date())
    }

    // Get sales data for revenue calculation
    const salesData = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Calculate revenue metrics
    const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.total), 0)
    const totalCogs = salesData.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum: number, item: any) => {
        // Assuming cost is 60% of selling price if not available
        const cost = Number(item.product.cost) || (Number(item.unitPrice) * 0.6)
        return itemSum + (cost * item.quantity)
      }, 0)
    }, 0)
    const grossProfit = totalRevenue - totalCogs
    const itbisCollected = salesData.reduce((sum, sale) => sum + Number(sale.itbis), 0)

    // Mock expense data (in a real system, this would come from an expenses table)
    const mockExpenses = [
      { id: '1', category: 'Salarios', description: 'Pago de empleados', amount: 45000, date: new Date().toISOString(), type: 'SALARIES' as const, paymentMethod: 'Transferencia' },
      { id: '2', category: 'Alquiler', description: 'Renta del local', amount: 25000, date: new Date().toISOString(), type: 'RENT' as const, paymentMethod: 'Efectivo' },
      { id: '3', category: 'Servicios', description: 'Electricidad y agua', amount: 8500, date: new Date().toISOString(), type: 'UTILITIES' as const, paymentMethod: 'Transferencia' },
      { id: '4', category: 'Inventario', description: 'Compra de productos', amount: 35000, date: new Date().toISOString(), type: 'INVENTORY' as const, paymentMethod: 'Efectivo' },
      { id: '5', category: 'Marketing', description: 'Publicidad online', amount: 5500, date: new Date().toISOString(), type: 'OTHER' as const, paymentMethod: 'Tarjeta' },
      { id: '6', category: 'Mantenimiento', description: 'Reparaciones', amount: 3200, date: new Date().toISOString(), type: 'OPERATIONAL' as const, paymentMethod: 'Efectivo' }
    ]

    const totalExpenses = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const netProfit = grossProfit - totalExpenses
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Calculate expense breakdown
    const expenseBreakdown = mockExpenses.reduce((acc, expense) => {
      const existing = acc.find(item => item.category === expense.category)
      if (existing) {
        existing.amount += expense.amount
        existing.count += 1
      } else {
        acc.push({
          category: expense.category,
          amount: expense.amount,
          percentage: 0, // Will calculate below
          count: 1
        })
      }
      return acc
    }, [] as Array<{ category: string; amount: number; percentage: number; count: number }>)

    // Calculate percentages
    expenseBreakdown.forEach(item => {
      item.percentage = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0
    })

    // Generate monthly comparison (mock data for previous months)
    const monthlyComparison = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i)
      const monthRevenue = totalRevenue * (0.8 + Math.random() * 0.4) // Simulate variation
      const monthExpenses = totalExpenses * (0.8 + Math.random() * 0.4)
      const monthProfit = monthRevenue - monthExpenses
      
      monthlyComparison.push({
        month: format(monthDate, 'MMM'),
        revenue: Math.round(monthRevenue),
        expenses: Math.round(monthExpenses),
        profit: Math.round(monthProfit),
        profitMargin: monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0
      })
    }

    // Mock bank accounts data
    const bankAccounts = [
      {
        id: '1',
        accountName: 'Cuenta Corriente Principal',
        bankName: 'Banco Popular',
        accountType: 'Corriente',
        balance: 125000,
        lastTransaction: new Date().toISOString(),
        currency: 'DOP' as const
      },
      {
        id: '2',
        accountName: 'Cuenta de Ahorros',
        bankName: 'Banco BHD',
        accountType: 'Ahorros',
        balance: 75000,
        lastTransaction: new Date().toISOString(),
        currency: 'DOP' as const
      }
    ]

    const totalCashPosition = bankAccounts.reduce((sum, account) => sum + account.balance, 0)

    // Tax calculations
    const itbisPaid = totalExpenses * 0.18 * 0.3 // Estimate 30% of expenses had ITBIS
    const itbisBalance = itbisCollected - itbisPaid
    const withholdingTax = totalRevenue * 0.01 // 1% withholding estimate
    
    // Next filing date (typically 20th of following month in DR)
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const nextFilingDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 20)

    // Financial ratios
    const operatingMargin = totalRevenue > 0 ? ((grossProfit - (totalExpenses * 0.7)) / totalRevenue) * 100 : 0
    const workingCapital = totalCashPosition - (totalExpenses * 0.3) // Estimate current liabilities
    const currentRatio = workingCapital > 0 ? totalCashPosition / (totalExpenses * 0.3) : 0
    const debtToEquity = 0.25 // Mock ratio

    const response = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      cashFlow: {
        totalIncome: totalRevenue,
        totalExpenses: totalExpenses,
        netCashFlow: totalRevenue - totalExpenses,
        operatingCashFlow: grossProfit - (totalExpenses * 0.8),
        projectedCashFlow: (totalRevenue - totalExpenses) * 1.1 // 10% growth projection
      },
      profitLoss: {
        grossRevenue: totalRevenue,
        totalCogs: totalCogs,
        grossProfit: grossProfit,
        totalOperatingExpenses: totalExpenses,
        netProfit: netProfit,
        grossProfitMargin: grossProfitMargin,
        netProfitMargin: netProfitMargin
      },
      expenses: mockExpenses,
      taxSummary: {
        itbisCollected: itbisCollected,
        itbisPaid: itbisPaid,
        itbisBalance: itbisBalance,
        withholdingTax: withholdingTax,
        monthlyTaxDue: itbisBalance + withholdingTax,
        nextFilingDate: nextFilingDate.toISOString()
      },
      bankAccounts: bankAccounts,
      monthlyComparison: monthlyComparison,
      expenseBreakdown: expenseBreakdown,
      summary: {
        totalRevenue: totalRevenue,
        totalExpenses: totalExpenses,
        netIncome: netProfit,
        cashPosition: totalCashPosition,
        operatingMargin: operatingMargin,
        debtToEquity: debtToEquity,
        workingCapital: workingCapital,
        currentRatio: currentRatio
      },
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Financial dashboard error:', error)
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
