import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface AuthUser {
  userId: string
  email: string
  role: string
}

export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return null
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

export function requireAuth(allowedRoles?: string[]) {
  return async (req: NextRequest) => {
    const user = await verifyAuth(req)
    
    if (!user) {
      return { error: 'No autorizado', status: 401 }
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return { error: 'Permisos insuficientes', status: 403 }
    }

    return { user }
  }
}
