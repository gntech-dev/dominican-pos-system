import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

/**
 * POST /api/upload/logo - Upload business logo
 * Supports multiple image formats: PNG, JPG, JPEG, SVG, WebP, GIF
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file: File | null = formData.get('logo') as unknown as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'image/png',
      'image/jpeg', 
      'image/jpg',
      'image/svg+xml',
      'image/webp',
      'image/gif'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Formato no soportado: ${file.type}. Formatos permitidos: PNG, JPG, JPEG, SVG, WebP, GIF` 
        },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El archivo es demasiado grande. Tamaño máximo: 5MB' 
        },
        { status: 400 }
      )
    }

    // Determine file extension
    const getExtension = (mimeType: string): string => {
      switch (mimeType) {
        case 'image/png': return 'png'
        case 'image/jpeg':
        case 'image/jpg': return 'jpg'
        case 'image/svg+xml': return 'svg'
        case 'image/webp': return 'webp'
        case 'image/gif': return 'gif'
        default: return 'png'
      }
    }

    const extension = getExtension(file.type)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Clean up existing logos first
    const publicPath = path.join(process.cwd(), 'public')
    const existingFormats = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif']
    
    for (const format of existingFormats) {
      const existingPath = path.join(publicPath, `logo.${format}`)
      if (existsSync(existingPath)) {
        try {
          await unlink(existingPath)
          console.log(`Removed existing logo: logo.${format}`)
        } catch (error) {
          console.log(`Could not remove logo.${format}:`, error)
        }
      }
    }

    // Write new logo file
    const logoPath = path.join(publicPath, `logo.${extension}`)
    await writeFile(logoPath, buffer)

    console.log(`Logo uploaded successfully: logo.${extension}`)

    // Update business settings with logo path
    try {
      const { prisma } = await import('@/lib/prisma')
      
      await prisma.businessSettings.updateMany({
        where: { isActive: true, isDefault: true },
        data: { logo: `/logo.${extension}` }
      })
      
      console.log('Business settings updated with new logo path')
    } catch (dbError) {
      console.log('Could not update database with logo path:', dbError)
      // Continue anyway, file upload was successful
    }

    return NextResponse.json({
      success: true,
      message: 'Logo subido exitosamente',
      data: {
        filename: `logo.${extension}`,
        path: `/logo.${extension}`,
        size: file.size,
        type: file.type
      }
    })

  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor al subir logo' 
      },
      { status: 500 }
    )
  }
}