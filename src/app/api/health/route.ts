import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`
    
    // Get basic system stats
    const userCount = await prisma.user.count()
    const productCount = await prisma.product.count()
    const salesCount = await prisma.sale.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
        }
      }
    })

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        users: userCount,
        products: productCount,
        recentSales: salesCount
      },
      services: {
        api: 'operational',
        database: 'operational',
        reports: 'operational',
        dgii: 'operational'
      },
      uptime: process.uptime()
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        status: 'disconnected'
      },
      services: {
        api: 'degraded',
        database: 'failed',
        reports: 'unknown',
        dgii: 'unknown'
      }
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}
