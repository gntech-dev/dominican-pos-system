import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { hasPermission, canAccessModule, UserRole } from '@/lib/roles'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function addSecurityHeaders(response: NextResponse) {
  // Security headers for production
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // Only add HSTS in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  // Content Security Policy (adjust as needed)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  return response
}

function checkRateLimit(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true // Skip rate limiting in development
  }
  
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 100 // requests per window
  
  const key = `rate_limit_${ip}`
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= maxRequests) {
    return false
  }
  
  current.count += 1
  return true
}

// Define protected routes and their required permissions
const PROTECTED_ROUTES: Record<string, {
  roles?: UserRole[]
  module?: keyof import('@/lib/roles').RolePermissions
  action?: string
  requireAuth?: boolean
}> = {
  // Home/Dashboard - All authenticated users
  '/': { requireAuth: true },
  '/dashboard': { requireAuth: true },
  
  // User Management - Admin/Manager only
  '/users': { roles: ['ADMIN', 'MANAGER'], module: 'users', action: 'view' },
  '/api/users': { roles: ['ADMIN', 'MANAGER'], module: 'users', action: 'view' },
  
  // Employee Management - Admin/Manager only
  '/employees': { roles: ['ADMIN', 'MANAGER'], module: 'employees', action: 'view' },
  '/api/employees': { roles: ['ADMIN', 'MANAGER'], module: 'employees', action: 'view' },
  
  // Sales Management - All except Reporter
  '/sales': { roles: ['ADMIN', 'MANAGER', 'CASHIER'], module: 'sales', action: 'view' },
  '/api/sales': { roles: ['ADMIN', 'MANAGER', 'CASHIER'], module: 'sales', action: 'view' },
  
  // Inventory Management - Admin/Manager only
  '/inventory': { roles: ['ADMIN', 'MANAGER'], module: 'inventory', action: 'view' },
  '/products': { roles: ['ADMIN', 'MANAGER'], module: 'inventory', action: 'view' },
  '/categories': { roles: ['ADMIN', 'MANAGER'], module: 'inventory', action: 'view' },
  '/api/products': { roles: ['ADMIN', 'MANAGER'], module: 'inventory', action: 'view' },
  '/api/categories': { roles: ['ADMIN', 'MANAGER'], module: 'inventory', action: 'view' },
  
  // Customer Management - All except Reporter
  '/customers': { roles: ['ADMIN', 'MANAGER', 'CASHIER'], module: 'sales', action: 'view' },
  '/api/customers': { roles: ['ADMIN', 'MANAGER', 'CASHIER'], module: 'sales', action: 'view' },
  
  // Financial Reports - All authenticated users
  '/reports': { requireAuth: true, module: 'financial', action: 'view' },
  '/api/reports': { requireAuth: true, module: 'financial', action: 'view' },
  
  // System Settings - Admin only
  '/settings': { roles: ['ADMIN'], module: 'system', action: 'view' },
  '/ncf-sequences': { roles: ['ADMIN'], module: 'system', action: 'view' },
  '/api/business-settings': { roles: ['ADMIN'], module: 'system', action: 'view' },
  '/api/ncf-sequences': { roles: ['ADMIN'], module: 'system', action: 'view' },
  
  // Hardware Management - Admin/Manager only
  '/hardware': { roles: ['ADMIN', 'MANAGER'], module: 'system', action: 'view' },
  
  // Profile - All authenticated users
  '/profile': { requireAuth: true },
}

// Routes that should bypass middleware completely
const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout', 
  '/api/auth/signin',
  '/api/auth/signout',
  '/favicon.ico',
  '/_next',
  '/api/health',
  '/api/dgii-test',
  '/api/dgii-status'
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

function getRouteConfig(pathname: string) {
  // Exact match first
  if (PROTECTED_ROUTES[pathname]) {
    return PROTECTED_ROUTES[pathname]
  }
  
  // Pattern matching for API routes
  for (const [route, config] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return config
    }
  }
  
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log('🔒 MIDDLEWARE CALLED for:', pathname)
  
  // Apply rate limiting
  if (!checkRateLimit(request)) {
    console.log('❌ Rate limit exceeded')
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }
  
  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    console.log('✅ Public route, adding security headers only')
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }
  
  // Get route configuration
  const routeConfig = getRouteConfig(pathname)
  console.log('🔍 Route config:', routeConfig)
  
  // If no specific config found, require basic auth for any protected route
  if (!routeConfig && !pathname.startsWith('/api/')) {
    // For non-API routes without specific config, require authentication
    const user = await verifyAuth(request)
    console.log('🔍 Verify auth result for protected route:', !!user)
    if (!user) {
      console.log('❌ No user found, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }
  
  // If no config and it's an API route, let it through (individual API routes should handle auth)
  if (!routeConfig) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }
  
  // Verify authentication
  const user = await verifyAuth(request)
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  const userRole = user.role as UserRole
  
  // Check role-based access
  if (routeConfig.roles && !routeConfig.roles.includes(userRole)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { 
          error: 'Forbidden - Insufficient permissions',
          required: routeConfig.roles,
          current: userRole
        },
        { status: 403 }
      )
    }
    return NextResponse.redirect(new URL('/?error=access-denied', request.url))
  }
  
  // Check permission-based access
  if (routeConfig.module && routeConfig.action) {
    if (!hasPermission(userRole, routeConfig.module, routeConfig.action)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { 
            error: 'Forbidden - Insufficient permissions',
            required: `${routeConfig.module}.${routeConfig.action}`,
            role: userRole
          },
          { status: 403 }
        )
      }
      return NextResponse.redirect(new URL('/?error=permission-denied', request.url))
    }
  }
  
  // Add user info to request headers for downstream use and security headers
  const response = NextResponse.next()
  response.headers.set('x-user-id', user.userId)
  response.headers.set('x-user-email', user.email)
  response.headers.set('x-user-role', user.role)
  
  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
