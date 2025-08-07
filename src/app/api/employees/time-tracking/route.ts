import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const clockInSchema = z.object({
  employeeId: z.string().cuid('ID de empleado inválido'),
  location: z.string().optional(),
})

const clockOutSchema = z.object({
  employeeId: z.string().cuid('ID de empleado inválido'),
  notes: z.string().optional(),
})

const breakSchema = z.object({
  employeeId: z.string().cuid('ID de empleado inválido'),
  breakType: z.enum(['START', 'END'], {
    message: 'Tipo de descanso inválido'
  }),
})

/**
 * GET /api/employees/time-tracking
 * Get current time entries and employee status
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER', 'CASHIER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId')
    const date = searchParams.get('date')

    const where: any = {}

    if (employeeId) {
      where.employeeId = employeeId
    }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      
      where.clockIn = {
        gte: startDate,
        lt: endDate,
      }
    } else {
      // Default to today if no date specified
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      where.clockIn = {
        gte: today,
        lt: tomorrow,
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        employee: {
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
        },
      },
      orderBy: { clockIn: 'desc' },
    })

    // Get active (not clocked out) entries
    const activeEntries = timeEntries.filter(entry => !entry.clockOut)

    return NextResponse.json({
      success: true,
      data: {
        timeEntries,
        activeEntries,
        totalActive: activeEntries.length,
      },
    })
  } catch (error) {
    console.error('Get time tracking error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/employees/time-tracking/clock-in
 * Clock in an employee
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER', 'CASHIER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await req.json()
    const { action, ...data } = body

    if (action === 'CLOCK_IN') {
      const clockInData = clockInSchema.parse(data)

      // Check if employee exists
      const employee = await prisma.employeeProfile.findUnique({
        where: { id: clockInData.employeeId },
        include: { user: true },
      })

      if (!employee) {
        return NextResponse.json(
          { error: 'Empleado no encontrado' },
          { status: 404 }
        )
      }

      // Check if employee is already clocked in today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const existingEntry = await prisma.timeEntry.findFirst({
        where: {
          employeeId: clockInData.employeeId,
          clockIn: {
            gte: today,
            lt: tomorrow,
          },
          clockOut: null,
        },
      })

      if (existingEntry) {
        return NextResponse.json(
          { error: 'El empleado ya está registrado para hoy' },
          { status: 400 }
        )
      }

      const timeEntry = await prisma.timeEntry.create({
        data: {
          employeeId: clockInData.employeeId,
          clockIn: new Date(),
          location: clockInData.location,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          status: 'ACTIVE',
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

      // Log the clock in
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'TimeEntry',
          entityId: timeEntry.id,
          newValue: {
            action: 'CLOCK_IN',
            employeeCode: employee.employeeCode,
            time: timeEntry.clockIn,
            location: timeEntry.location,
          },
          userId: authResult.user.userId,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        },
      })

      return NextResponse.json({
        success: true,
        data: timeEntry,
        message: `${employee.user.firstName} ${employee.user.lastName} registrado exitosamente`,
      })
    }

    if (action === 'CLOCK_OUT') {
      const clockOutData = clockOutSchema.parse(data)

      // Find active time entry
      const activeEntry = await prisma.timeEntry.findFirst({
        where: {
          employeeId: clockOutData.employeeId,
          clockOut: null,
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

      if (!activeEntry) {
        return NextResponse.json(
          { error: 'No se encontró un registro activo para este empleado' },
          { status: 404 }
        )
      }

      const clockOutTime = new Date()
      const totalMinutes = Math.floor((clockOutTime.getTime() - activeEntry.clockIn.getTime()) / (1000 * 60))
      const totalHours = Math.round((totalMinutes / 60) * 100) / 100

      // Calculate break time if any
      let breakMinutes = 0
      if (activeEntry.breakStart && activeEntry.breakEnd) {
        breakMinutes = Math.floor((activeEntry.breakEnd.getTime() - activeEntry.breakStart.getTime()) / (1000 * 60))
      }

      const workMinutes = totalMinutes - breakMinutes
      const workHours = Math.round((workMinutes / 60) * 100) / 100
      const overtimeHours = Math.max(0, workHours - 8) // Overtime after 8 hours

      const updatedEntry = await prisma.timeEntry.update({
        where: { id: activeEntry.id },
        data: {
          clockOut: clockOutTime,
          totalHours: workHours,
          overtimeHours,
          notes: clockOutData.notes,
          status: 'COMPLETED',
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

      // Log the clock out
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'TimeEntry',
          entityId: updatedEntry.id,
          newValue: {
            action: 'CLOCK_OUT',
            employeeCode: activeEntry.employee.employeeCode,
            clockOutTime,
            totalHours: workHours,
            overtimeHours,
            notes: clockOutData.notes,
          },
          userId: authResult.user.userId,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        },
      })

      return NextResponse.json({
        success: true,
        data: updatedEntry,
        message: `${activeEntry.employee.user.firstName} ${activeEntry.employee.user.lastName} salida registrada exitosamente`,
      })
    }

    if (action === 'BREAK') {
      const breakData = breakSchema.parse(data)

      // Find active time entry
      const activeEntry = await prisma.timeEntry.findFirst({
        where: {
          employeeId: breakData.employeeId,
          clockOut: null,
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

      if (!activeEntry) {
        return NextResponse.json(
          { error: 'No se encontró un registro activo para este empleado' },
          { status: 404 }
        )
      }

      const now = new Date()
      let updateData: any = {}
      let message = ''

      if (breakData.breakType === 'START') {
        if (activeEntry.breakStart && !activeEntry.breakEnd) {
          return NextResponse.json(
            { error: 'El empleado ya está en descanso' },
            { status: 400 }
          )
        }
        updateData = {
          breakStart: now,
          breakEnd: null,
          status: 'BREAK',
        }
        message = `${activeEntry.employee.user.firstName} ${activeEntry.employee.user.lastName} inició descanso`
      } else {
        if (!activeEntry.breakStart || activeEntry.breakEnd) {
          return NextResponse.json(
            { error: 'El empleado no está en descanso' },
            { status: 400 }
          )
        }
        updateData = {
          breakEnd: now,
          status: 'ACTIVE',
        }
        message = `${activeEntry.employee.user.firstName} ${activeEntry.employee.user.lastName} terminó descanso`
      }

      const updatedEntry = await prisma.timeEntry.update({
        where: { id: activeEntry.id },
        data: updateData,
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

      return NextResponse.json({
        success: true,
        data: updatedEntry,
        message,
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Time tracking action error:', error)
    
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
