import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { validateRNC } from '@/utils/dominican-validators'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rnc = searchParams.get('rnc')

    if (!rnc) {
      return NextResponse.json({ error: 'RNC es requerido' }, { status: 400 })
    }

    // Validate RNC format first
    if (!validateRNC(rnc)) {
      return NextResponse.json({
        success: false,
        error: 'Formato de RNC inválido',
        data: null
      })
    }

    // Check in DGII registry
    const rncRecord = await prisma.rncRegistry.findUnique({
      where: { rnc: rnc.trim() },
      select: {
        rnc: true,
        name: true,
        status: true,
        category: true,
        lastSync: true
      }
    })

    if (!rncRecord) {
      return NextResponse.json({
        success: false,
        error: 'RNC no encontrado en la base de datos de la DGII',
        data: null
      })
    }

    if (rncRecord.status !== 'ACTIVO') {
      return NextResponse.json({
        success: false,
        error: `RNC está ${rncRecord.status.toLowerCase()} en la DGII`,
        data: rncRecord
      })
    }

    return NextResponse.json({
      success: true,
      message: 'RNC válido y activo',
      data: rncRecord
    })

  } catch (error) {
    console.error('RNC validation error:', error)
    return NextResponse.json({
      error: 'Error validando RNC'
    }, { status: 500 })
  }
}

// Search RNC by name or partial RNC
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { query, limit = 20 } = await request.json()

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ 
        error: 'Query debe tener al menos 3 caracteres' 
      }, { status: 400 })
    }

    const searchTerm = query.trim()
    
    // Search by RNC or company name
    const results = await prisma.rncRegistry.findMany({
      where: {
        OR: [
          {
            rnc: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ],
        status: 'ACTIVO'
      },
      select: {
        rnc: true,
        name: true,
        status: true,
        category: true
      },
      take: Math.min(limit, 50), // Max 50 results
      orderBy: [
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length
    })

  } catch (error) {
    console.error('RNC search error:', error)
    return NextResponse.json({
      error: 'Error buscando en base de datos de RNC'
    }, { status: 500 })
  }
}
