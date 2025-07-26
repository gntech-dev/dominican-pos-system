import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const updateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  firstName: z.string().min(1, 'Nombre requerido').optional(),
  lastName: z.string().min(1, 'Apellido requerido').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER'], {
    message: 'Rol inválido'
  }).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(['ADMIN', 'MANAGER'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { 
            sales: true,
            auditLogs: true,
          },
        },
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            total: true,
            ncf: true,
            createdAt: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            action: true,
            entityType: true,
            createdAt: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Get user error:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(['ADMIN'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Prevent self-editing in certain scenarios
    if (params.id === authResult.user.userId) {
      const body = await req.json()
      if (body.role && body.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No puedes cambiar tu propio rol de administrador' },
          { status: 400 }
        )
      }
      if (body.isActive === false) {
        return NextResponse.json(
          { error: 'No puedes desactivar tu propia cuenta' },
          { status: 400 }
        )
      }
    }

    const body = await req.json()
    const updateData = updateUserSchema.parse(body)

    // Check if email already exists for another user
    if (updateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          NOT: { id: params.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Ya existe otro usuario con este email' },
          { status: 400 }
        )
      }
    }

    // Get current user for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Hash password if provided
    const dataToUpdate: any = { ...updateData }
    if (updateData.password) {
      dataToUpdate.password = await bcrypt.hash(updateData.password, 12)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Log the update
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'User',
        entityId: params.id,
        oldValue: {
          email: currentUser.email,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          role: currentUser.role,
          isActive: currentUser.isActive,
        },
        newValue: {
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
        },
        userId: authResult.user.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error('Update user error:', error)
    
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(['ADMIN'])(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Prevent self-deletion
    if (params.id === authResult.user.userId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    // Check if user has sales or audit logs
    const userActivity = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        _count: {
          select: {
            salesAsUser: true,
            auditLogs: true,
          },
        },
      },
    })

    if (!userActivity) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (userActivity._count.salesAsUser > 0 || userActivity._count.auditLogs > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un usuario con actividad registrada. Considera desactivarlo en su lugar.' },
        { status: 400 }
      )
    }

    // Get current user for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    })

    await prisma.user.delete({
      where: { id: params.id },
    })

    // Log the deletion
    if (currentUser) {
      await prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'User',
          entityId: params.id,
          oldValue: {
            email: currentUser.email,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            role: currentUser.role,
          },
          userId: authResult.user.userId,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    })
  } catch (error) {
    console.error('Delete user error:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
