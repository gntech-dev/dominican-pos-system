import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * Business Settings Validation Schema
 */
const businessSettingsSchema = z.object({
  name: z.string().min(1, 'Nombre del negocio es requerido'),
  rnc: z.string().min(9, 'RNC debe tener al menos 9 dígitos').max(11, 'RNC debe tener máximo 11 dígitos'),
  address: z.string().min(1, 'Dirección es requerida'),
  phone: z.string().min(1, 'Teléfono es requerido'),
  email: z.string().email('Email inválido'),
  website: z.string().url('Sitio web inválido').optional().or(z.literal('')),
  slogan: z.string().optional(),
  city: z.string().min(1, 'Ciudad es requerida'),
  province: z.string().min(1, 'Provincia es requerida'),
  country: z.string().default('República Dominicana'),
  postalCode: z.string().optional(),
  taxRegime: z.string().default('Régimen Ordinario'),
  economicActivity: z.string().optional(),
  receiptFooter: z.string().optional(),
  invoiceTerms: z.string().optional(),
  warrantyInfo: z.string().optional()
})

/**
 * GET /api/business-settings - Get current business settings
 */
export async function GET() {
  try {
    // Get the default business settings
    const businessSettings = await prisma.businessSettings.findFirst({
      where: {
        isDefault: true,
        isActive: true
      }
    })

    if (!businessSettings) {
      return NextResponse.json(
        { error: 'No se encontraron configuraciones del negocio' },
        { status: 404 }
      )
    }

    return NextResponse.json(businessSettings)
  } catch (error) {
    console.error('Error fetching business settings:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/business-settings - Update business settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validationResult = businessSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Find the current default business settings
    const currentSettings = await prisma.businessSettings.findFirst({
      where: {
        isDefault: true,
        isActive: true
      }
    })

    let updatedSettings

    if (currentSettings) {
      // Update existing settings
      updatedSettings = await prisma.businessSettings.update({
        where: { id: currentSettings.id },
        data: {
          ...data,
          // Convert empty strings to null for optional fields
          website: data.website || null,
          slogan: data.slogan || null,
          postalCode: data.postalCode || null,
          economicActivity: data.economicActivity || null,
          receiptFooter: data.receiptFooter || null,
          invoiceTerms: data.invoiceTerms || null,
          warrantyInfo: data.warrantyInfo || null
        }
      })
    } else {
      // Create new default settings
      updatedSettings = await prisma.businessSettings.create({
        data: {
          ...data,
          // Convert empty strings to null for optional fields
          website: data.website || null,
          slogan: data.slogan || null,
          postalCode: data.postalCode || null,
          economicActivity: data.economicActivity || null,
          receiptFooter: data.receiptFooter || null,
          invoiceTerms: data.invoiceTerms || null,
          warrantyInfo: data.warrantyInfo || null,
          isDefault: true,
          isActive: true
        }
      })
    }

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Error updating business settings:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/business-settings - Create new business settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validationResult = businessSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // If this is set as default, update all other settings to not be default
    if (body.isDefault) {
      await prisma.businessSettings.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    const newSettings = await prisma.businessSettings.create({
      data: {
        ...data,
        // Convert empty strings to null for optional fields
        website: data.website || null,
        slogan: data.slogan || null,
        postalCode: data.postalCode || null,
        economicActivity: data.economicActivity || null,
        receiptFooter: data.receiptFooter || null,
        invoiceTerms: data.invoiceTerms || null,
        warrantyInfo: data.warrantyInfo || null,
        isDefault: body.isDefault || false,
        isActive: true
      }
    })

    return NextResponse.json(newSettings, { status: 201 })
  } catch (error) {
    console.error('Error creating business settings:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
