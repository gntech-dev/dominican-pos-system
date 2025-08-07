import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(['ADMIN', 'MANAGER', 'CASHIER'])(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const employees = await prisma.employeeProfile.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(['ADMIN', 'MANAGER'])(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      role,
      employeeCode,
      position,
      department,
      salaryType,
      baseSalary,
      hourlyRate,
      commissionRate,
      targetSales,
      emergencyContact,
      emergencyPhone,
      address,
      hireDate
    } = body

    // Generate username from first and last name
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '')

    // First create the user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        username,
        password: 'temp123', // Temporary password - should be changed on first login
        role: role || 'CASHIER' // Use provided role or default to CASHIER
      }
    })

    // Then create the employee profile
    const employee = await prisma.employeeProfile.create({
      data: {
        userId: user.id,
        employeeCode,
        position,
        department,
        salaryType,
        baseSalary: baseSalary ? parseFloat(baseSalary) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        commissionRate: commissionRate ? parseFloat(commissionRate) : 0,
        targetSales: targetSales ? parseFloat(targetSales) : null,
        emergencyContact,
        emergencyPhone,
        address,
        hireDate: new Date(hireDate)
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    const employee = await prisma.employeeProfile.update({
      where: { id },
      data: {
        ...updateData,
        baseSalary: updateData.baseSalary ? parseFloat(updateData.baseSalary) : null,
        hourlyRate: updateData.hourlyRate ? parseFloat(updateData.hourlyRate) : null,
        commissionRate: updateData.commissionRate ? parseFloat(updateData.commissionRate) : 0,
        targetSales: updateData.targetSales ? parseFloat(updateData.targetSales) : null,
        hireDate: updateData.hireDate ? new Date(updateData.hireDate) : undefined
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // Get the employee to find the user ID
    const employee = await prisma.employeeProfile.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Delete the employee profile (this will cascade to delete the user due to onDelete: Cascade in schema)
    await prisma.employeeProfile.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}
