import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const commissionCalculationSchema = z.object({
  employeeId: z.string().cuid('ID de empleado inválido'),
  startDate: z.string().datetime('Fecha de inicio inválida'),
  endDate: z.string().datetime('Fecha de fin inválida'),
})

/**
 * GET /api/employees/commissions
 * Calculate commissions for employees
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!employeeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Parámetros requeridos: employeeId, startDate, endDate' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Get employee profile
    const employee = await prisma.employeeProfile.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    // Get sales made by this employee in the period
    const sales = await prisma.sale.findMany({
      where: {
        cashierId: employee.userId,
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate commission breakdown
    const breakdown = sales.map(sale => {
      const commissionEarned = (sale.total.toNumber() * employee.commissionRate.toNumber()) / 100
      return {
        saleId: sale.id,
        saleNumber: sale.saleNumber,
        saleAmount: sale.total.toNumber(),
        commissionRate: employee.commissionRate.toNumber(),
        commissionEarned,
        date: sale.createdAt,
      }
    })

    // Calculate totals
    const totalSales = sales.reduce((sum, sale) => sum + sale.total.toNumber(), 0)
    const totalCommission = breakdown.reduce((sum, item) => sum + item.commissionEarned, 0)

    // Get time worked in the period
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId,
        clockIn: {
          gte: start,
          lte: end,
        },
        status: 'COMPLETED',
      },
    })

    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.totalHours.toNumber(), 0)
    const totalOvertimeHours = timeEntries.reduce((sum, entry) => sum + entry.overtimeHours.toNumber(), 0)

    // Calculate base salary portion (if applicable)
    let baseSalaryPortion = 0
    if (employee.salaryType === 'FIXED' || employee.salaryType === 'HYBRID') {
      // Assuming monthly salary, calculate daily rate
      const dailyRate = employee.baseSalary ? employee.baseSalary.toNumber() / 30 : 0
      const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      baseSalaryPortion = dailyRate * daysInPeriod
    } else if (employee.salaryType === 'HOURLY') {
      baseSalaryPortion = (employee.hourlyRate?.toNumber() || 0) * totalHours
    }

    const commissionCalculation = {
      employee: {
        id: employee.id,
        code: employee.employeeCode,
        name: `${employee.user.firstName} ${employee.user.lastName}`,
        position: employee.position,
        salaryType: employee.salaryType,
        commissionRate: employee.commissionRate.toNumber(),
      },
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      metrics: {
        totalSales: sales.length,
        totalSalesAmount: totalSales,
        totalHours,
        totalOvertimeHours,
        averageSaleAmount: sales.length > 0 ? totalSales / sales.length : 0,
      },
      compensation: {
        baseSalary: baseSalaryPortion,
        commission: totalCommission,
        overtimePay: (employee.hourlyRate?.toNumber() || 0) * totalOvertimeHours * 1.5, // 1.5x for overtime
        totalCompensation: baseSalaryPortion + totalCommission + ((employee.hourlyRate?.toNumber() || 0) * totalOvertimeHours * 1.5),
      },
      breakdown,
    }

    return NextResponse.json({
      success: true,
      data: commissionCalculation,
    })
  } catch (error) {
    console.error('Calculate commission error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/employees/commissions
 * Generate performance record for employee
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await req.json()
    const performanceData = commissionCalculationSchema.parse(body)

    const start = new Date(performanceData.startDate)
    const end = new Date(performanceData.endDate)

    // Check if performance record already exists for this period
    const existingRecord = await prisma.employeePerformance.findFirst({
      where: {
        employeeId: performanceData.employeeId,
        periodStart: start,
        periodEnd: end,
      },
    })

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Ya existe un registro de rendimiento para este período' },
        { status: 400 }
      )
    }

    // Get employee profile
    const employee = await prisma.employeeProfile.findUnique({
      where: { id: performanceData.employeeId },
      include: { user: true },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    // Calculate metrics
    const sales = await prisma.sale.findMany({
      where: {
        cashierId: employee.userId,
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    })

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: performanceData.employeeId,
        clockIn: {
          gte: start,
          lte: end,
        },
        status: 'COMPLETED',
      },
    })

    const totalSales = sales.reduce((sum, sale) => sum + sale.total.toNumber(), 0)
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.totalHours.toNumber(), 0)
    const totalCommission = (totalSales * employee.commissionRate.toNumber()) / 100

    // Calculate targets met (assuming target is per period)
    const targetSales = employee.targetSales?.toNumber() || 0
    const targetsMet = targetSales > 0 ? (totalSales >= targetSales ? 1 : 0) : 0

    // Calculate performance score (simple formula)
    let performanceScore = 0
    if (targetSales > 0) {
      performanceScore = Math.min(100, (totalSales / targetSales) * 100)
    }

    const performanceRecord = await prisma.employeePerformance.create({
      data: {
        employeeId: performanceData.employeeId,
        periodStart: start,
        periodEnd: end,
        salesCount: sales.length,
        salesAmount: totalSales,
        commissionEarned: totalCommission,
        hoursWorked: totalHours,
        targetsMet,
        performanceScore,
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    // Log the performance record creation
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'EmployeePerformance',
        entityId: performanceRecord.id,
        newValue: {
          employeeCode: employee.employeeCode,
          period: `${start.toISOString()} - ${end.toISOString()}`,
          salesCount: sales.length,
          salesAmount: totalSales,
          commissionEarned: totalCommission,
          performanceScore,
        },
        userId: authResult.user.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      data: performanceRecord,
      message: 'Registro de rendimiento creado exitosamente',
    })
  } catch (error) {
    console.error('Create performance record error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
