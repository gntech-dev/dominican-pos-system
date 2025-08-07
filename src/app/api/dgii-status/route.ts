/**
 * @file DGII Reports Status and Troubleshooting
 * @description Provides status information and troubleshooting for DGII reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRNC, getDGIIPeriod, formatDGIIDate } from '@/utils/dgii-xml-generator'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const check = searchParams.get('check') || 'all'

    const result: any = {
      timestamp: new Date().toISOString(),
      system: 'DGII Reports Status Check',
      version: '1.0'
    }

    if (check === 'all' || check === 'business') {
      // Check business configuration
      try {
        const businessSettings = await prisma.businessSettings.findFirst()
        result.businessConfig = {
          exists: !!businessSettings,
          hasRNC: !!(businessSettings?.rnc),
          rncValid: businessSettings?.rnc ? validateRNC(businessSettings.rnc) : false,
          companyName: businessSettings?.name || 'Not configured',
          rnc: businessSettings?.rnc || 'Not configured'
        }
      } catch (error) {
        result.businessConfig = {
          error: 'Failed to check business settings',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    if (check === 'all' || check === 'sales') {
      // Check sales data for 607 reports
      try {
        const now = new Date()
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

        const salesThisMonth = await prisma.sale.count({
          where: {
            createdAt: {
              gte: currentMonth,
              lt: nextMonth
            },
            status: 'COMPLETED'
          }
        })

        const salesWithNCF = await prisma.sale.count({
          where: {
            createdAt: {
              gte: currentMonth,
              lt: nextMonth
            },
            status: 'COMPLETED',
            ncf: {
              not: null
            }
          }
        })

        const salesWithCustomerRNC = await prisma.sale.count({
          where: {
            createdAt: {
              gte: currentMonth,
              lt: nextMonth
            },
            status: 'COMPLETED',
            customer: {
              rnc: {
                not: null
              }
            }
          }
        })

        result.salesData = {
          currentMonth: getDGIIPeriod(now),
          totalSales: salesThisMonth,
          salesWithNCF: salesWithNCF,
          salesWithCustomerRNC: salesWithCustomerRNC,
          ncfComplianceRate: salesThisMonth > 0 ? ((salesWithNCF / salesThisMonth) * 100).toFixed(1) + '%' : 'N/A',
          rncCaptureRate: salesThisMonth > 0 ? ((salesWithCustomerRNC / salesThisMonth) * 100).toFixed(1) + '%' : 'N/A',
          ready607: salesWithNCF > 0
        }
      } catch (error) {
        result.salesData = {
          error: 'Failed to check sales data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    if (check === 'all' || check === 'purchases') {
      // Check purchase data for 606 reports
      try {
        const now = new Date()
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

        const purchaseOrders = await prisma.purchaseOrder.count({
          where: {
            createdAt: {
              gte: currentMonth,
              lt: nextMonth
            }
          }
        })

        const receivedPurchaseOrders = await prisma.purchaseOrder.count({
          where: {
            receivedDate: {
              gte: currentMonth,
              lt: nextMonth
            },
            status: 'RECEIVED'
          }
        })

        const suppliersWithRNC = await prisma.supplier.count({
          where: {
            rnc: {
              not: null
            }
          }
        })

        const totalSuppliers = await prisma.supplier.count()

        result.purchaseData = {
          currentMonth: getDGIIPeriod(now),
          totalPurchaseOrders: purchaseOrders,
          receivedPurchaseOrders: receivedPurchaseOrders,
          suppliersWithRNC: suppliersWithRNC,
          totalSuppliers: totalSuppliers,
          supplierRNCRate: totalSuppliers > 0 ? ((suppliersWithRNC / totalSuppliers) * 100).toFixed(1) + '%' : 'N/A',
          ready606: receivedPurchaseOrders > 0 && suppliersWithRNC > 0
        }
      } catch (error) {
        result.purchaseData = {
          error: 'Failed to check purchase data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    if (check === 'all' || check === 'ncf') {
      // Check NCF sequences status
      try {
        const ncfSequences = await prisma.nCFSequence.findMany({
          orderBy: {
            type: 'asc'
          }
        })

        result.ncfStatus = ncfSequences.map(seq => ({
          type: seq.type,
          currentNumber: seq.currentNumber,
          endNumber: seq.endNumber,
          remaining: seq.endNumber - seq.currentNumber,
          percentUsed: ((seq.currentNumber / seq.endNumber) * 100).toFixed(1) + '%',
          active: seq.isActive
        }))
      } catch (error) {
        result.ncfStatus = {
          error: 'Failed to check NCF sequences',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    if (check === 'all' || check === 'dependencies') {
      // Check system dependencies
      result.dependencies = {
        prisma: 'OK',
        xmlParser: 'OK',
        dateUtils: {
          currentPeriod: getDGIIPeriod(new Date()),
          formatTest: formatDGIIDate(new Date()),
          rncValidation: {
            valid: validateRNC('130123456'),
            invalid: !validateRNC('invalid')
          }
        }
      }
    }

    // Overall system health
    const issues: string[] = []
    
    if (result.businessConfig && !result.businessConfig.rncValid) {
      issues.push('Company RNC not configured or invalid')
    }
    
    if (result.salesData && !result.salesData.ready607) {
      issues.push('No sales with NCF available for 607 report')
    }
    
    if (result.purchaseData && !result.purchaseData.ready606) {
      issues.push('No received purchase orders or suppliers without RNC for 606 report')
    }

    result.systemHealth = {
      status: issues.length === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION',
      issues: issues,
      recommendations: issues.length > 0 ? [
        'Configure company RNC in business settings',
        'Ensure all sales have NCF numbers assigned',
        'Add supplier RNC information',
        'Process and receive purchase orders'
      ] : ['System is ready for DGII report generation']
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Error checking DGII status:', error)
    return NextResponse.json({
      error: 'Failed to check DGII system status',
      details: error.message
    }, { status: 500 })
  }
}
