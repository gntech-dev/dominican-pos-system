import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      
      // Log the logout
      await prisma.auditLog.create({
        data: {
          action: 'LOGOUT',
          entityType: 'User',
          entityId: decoded.userId,
          userId: decoded.userId,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        },
      })
    } catch (jwtError) {
      // Token is invalid, but we still want to return success for logout
      console.error('Invalid token during logout:', jwtError)
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso',
    })

    // Clear the token cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
