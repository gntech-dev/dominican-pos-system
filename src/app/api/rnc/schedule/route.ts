import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RncScheduleSettings {
  enabled: boolean
  scheduleTime: string // Format: "HH:MM" (24-hour format)
  timezone: string
  lastScheduledRun: string | null
  autoSyncEnabled: boolean
}

// GET /api/rnc/schedule - Get RNC sync schedule settings
export async function GET(request: NextRequest) {
  try {
    // For now, allow without auth for testing - add auth back in production
    // const user = await verifyAuth(request)
    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    // }

    // Get schedule settings from business settings
    const settings = await prisma.businessSettings.findFirst({
      where: {
        isDefault: true,
        isActive: true
      },
      select: {
        slogan: true, // We'll store schedule info here temporarily
        warrantyInfo: true, // We'll store additional schedule data here
        updatedAt: true
      }
    })

    let scheduleSettings: RncScheduleSettings = {
      enabled: false,
      scheduleTime: "02:00", // Default to 2 AM
      timezone: "America/Santo_Domingo",
      lastScheduledRun: null,
      autoSyncEnabled: false
    }

    // Parse schedule settings from slogan field (temporary solution)
    if (settings?.slogan) {
      try {
        const parsed = JSON.parse(settings.slogan)
        if (parsed.rncSchedule) {
          scheduleSettings = { ...scheduleSettings, ...parsed.rncSchedule }
        }
      } catch (e) {
        // If parsing fails, use defaults
      }
    }

    return NextResponse.json({
      success: true,
      settings: scheduleSettings
    })

  } catch (error) {
    console.error('Error getting RNC schedule settings:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración de horario' },
      { status: 500 }
    )
  }
}

// POST /api/rnc/schedule - Update RNC sync schedule settings
export async function POST(request: NextRequest) {
  try {
    // For now, allow without auth for testing - add auth back in production
    // const user = await verifyAuth(request)
    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    // }

    const body = await request.json()
    const { enabled, scheduleTime, timezone, autoSyncEnabled } = body

    // Validate schedule time format (HH:MM)
    if (scheduleTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(scheduleTime)) {
      return NextResponse.json(
        { error: 'Formato de hora inválido. Use HH:MM (24 horas)' },
        { status: 400 }
      )
    }

    // Get current business settings
    let businessSettings = await prisma.businessSettings.findFirst({
      where: {
        isDefault: true,
        isActive: true
      }
    })

    // Create default business settings if none exist
    if (!businessSettings) {
      businessSettings = await prisma.businessSettings.create({
        data: {
          name: 'POS System',
          rnc: '000000000',
          address: 'Dirección no configurada',
          phone: '000-000-0000',
          email: 'admin@possystem.com',
          city: 'Santo Domingo',
          province: 'Distrito Nacional',
          isDefault: true,
          isActive: true,
          slogan: JSON.stringify({
            rncSchedule: {
              enabled: enabled || false,
              scheduleTime: scheduleTime || "02:00",
              timezone: timezone || "America/Santo_Domingo",
              autoSyncEnabled: autoSyncEnabled || false,
              lastScheduledRun: null
            }
          })
        }
      })
    } else {
      // Update existing settings
      let currentSlogan = {}
      try {
        currentSlogan = JSON.parse(businessSettings.slogan || '{}')
      } catch (e) {
        currentSlogan = {}
      }

      const updatedSlogan = {
        ...currentSlogan,
        rncSchedule: {
          enabled: enabled !== undefined ? enabled : false,
          scheduleTime: scheduleTime || "02:00",
          timezone: timezone || "America/Santo_Domingo",
          autoSyncEnabled: autoSyncEnabled !== undefined ? autoSyncEnabled : false,
          lastScheduledRun: null
        }
      }

      await prisma.businessSettings.update({
        where: { id: businessSettings.id },
        data: {
          slogan: JSON.stringify(updatedSlogan),
          updatedAt: new Date()
        }
      })
    }

    // If auto sync is enabled, provide setup instructions
    let setupInstructions = null
    if (enabled && autoSyncEnabled) {
      setupInstructions = {
        cronExpression: generateCronExpression(scheduleTime),
        setupSteps: [
          "1. Asegúrese de que el servidor tenga cron instalado",
          "2. Ejecute: crontab -e",
          `3. Agregue la línea: ${generateCronExpression(scheduleTime)} /path/to/rnc-sync-script.sh`,
          "4. Guarde y cierre el editor",
          "5. El script se ejecutará automáticamente a las " + scheduleTime + " todos los días"
        ]
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración de horario actualizada exitosamente',
      settings: {
        enabled: enabled || false,
        scheduleTime: scheduleTime || "02:00",
        timezone: timezone || "America/Santo_Domingo",
        autoSyncEnabled: autoSyncEnabled || false,
        lastScheduledRun: null
      },
      setupInstructions
    })

  } catch (error) {
    console.error('Error updating RNC schedule settings:', error)
    return NextResponse.json(
      { error: 'Error al actualizar configuración de horario' },
      { status: 500 }
    )
  }
}

// Helper function to generate cron expression from time
function generateCronExpression(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':')
  return `${minutes} ${hours} * * *`
}
