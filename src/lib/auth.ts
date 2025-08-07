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
    let token: string | null = null
    
    // Check Authorization header first (for API calls)
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
      console.log('🔍 Found token in Authorization header')
    }
    
    // If no authorization header, check cookies (for page requests)
    if (!token) {
      token = req.cookies.get('token')?.value || null
      console.log('🔍 Checking cookies for token:', !!token)
    }
    
    if (!token) {
      console.log('❌ No token found in headers or cookies')
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string; role: string }
    
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

export async function verifyJWT(req: NextRequest): Promise<AuthUser> {
  const user = await verifyAuth(req)
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export function requireRole(user: AuthUser, roles: string[]): void {
  if (!roles.includes(user.role)) {
    throw new Error('Insufficient permissions')
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

// Client-side helper function to get auth headers
export function getAuthHeaders(): { Authorization?: string } {
  if (typeof window === 'undefined') {
    return {}
  }
  
  const token = localStorage.getItem('token')
  if (!token) {
    return {}
  }
  
  return {
    Authorization: `Bearer ${token}`
  }
}

// Client-side helper to check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  const token = localStorage.getItem('token')
  return !!token
}

// Client-side helper to get current user from token
export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  const token = localStorage.getItem('token')
  if (!token) {
    return null
  }
  
  try {
    // Simple JWT decode without verification (client-side only)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    
    if (!decoded || !decoded.userId) {
      return null
    }
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      localStorage.removeItem('token')
      return null
    }
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }
  } catch (error) {
    console.error('Error decoding token:', error)
    localStorage.removeItem('token') // Remove invalid token
    return null
  }
}

// Client-side logout helper
export function logout(): void {
  if (typeof window !== 'undefined') {
    // Call logout API to clear server-side cookie
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders()
    }).finally(() => {
      // Clear local storage and redirect regardless of API call result
      localStorage.removeItem('token')
      window.location.href = '/login'
    })
  }
}
