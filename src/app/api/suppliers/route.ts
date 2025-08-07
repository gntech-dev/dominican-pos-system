/**
 * @file Suppliers API Route
 * @description Handles CRUD operations for suppliers in inventory management.
 * @author POS System
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT, requireRole } from '@/lib/auth'
import type { Supplier } from '@/types/enhanced'

/**
 * GET /api/suppliers
 * Returns a list of suppliers with their contact and status info.
 * Requires Admin or Manager role.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyJWT(req)
    requireRole(user, ['ADMIN', 'MANAGER'])

    const suppliers = await prisma.supplier.findMany({
      include: {
        products: true,
        purchaseOrders: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ suppliers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

/**
 * POST /api/suppliers
 * Creates a new supplier.
 * Requires Admin or Manager role.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyJWT(req)
    requireRole(user, ['ADMIN', 'MANAGER'])
    const data = await req.json()

    // Validate required fields
    if (!data.name || !data.contactName || !data.phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate RNC format if provided (9 or 11 digits)
    if (data.rnc && !/^\d{9}(\d{2})?$/.test(data.rnc)) {
      return NextResponse.json({ error: 'Invalid RNC format' }, { status: 400 })
    }

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        contactName: data.contactName,
        contactPhone: data.phone,
        contactEmail: data.email,
        rnc: data.rnc,
        address: data.address,
        status: 'ACTIVE',
        paymentTerms: data.paymentTerms || 'NET30',
      },
    })
    return NextResponse.json({ supplier })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

/**
 * PUT /api/suppliers
 * Updates a supplier.
 * Requires Admin or Manager role.
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await verifyJWT(req)
    requireRole(user, ['ADMIN', 'MANAGER'])
    const data = await req.json()

    if (!data.id) {
      return NextResponse.json({ error: 'Missing supplier ID' }, { status: 400 })
    }

    const supplier = await prisma.supplier.update({
      where: { id: data.id },
      data: {
        name: data.name,
        contactName: data.contactName,
        contactPhone: data.phone,
        contactEmail: data.email,
        rnc: data.rnc,
        address: data.address,
        status: data.status,
        paymentTerms: data.paymentTerms,
      },
    })
    return NextResponse.json({ supplier })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

/**
 * DELETE /api/suppliers
 * Deletes a supplier.
 * Requires Admin role.
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyJWT(req)
    requireRole(user, ['ADMIN'])
    const data = await req.json()

    if (!data.id) {
      return NextResponse.json({ error: 'Missing supplier ID' }, { status: 400 })
    }

    await prisma.supplier.delete({ where: { id: data.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
