import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    // Search for business names containing the query
    const records = await prisma.rncRegistry.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        rnc: true,
        name: true,
        status: true
      },
      take: 10 // Limit to 10 results
    })
    
    return NextResponse.json({
      success: true,
      results: records,
      count: records.length
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Error en la búsqueda' },
      { status: 500 }
    )
  }
}
