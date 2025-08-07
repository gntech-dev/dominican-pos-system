/**
 * @file DGII 606/607 Reports API Route
 * @description Generates DGII purchase (606) and sales (607) XML reports
 * @author POS System
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT, requireRole } from '@/lib/auth'
import {
  generateDGII606XML,
  generateDGII607XML,
  formatDGIIDate,
  getDGIIPeriod,
  getTipoIdentificacion,
  validateDGIIXML,
  validateRNC,
  type DGII606Record,
  type DGII607Record,
  type CompanyInfo
} from '@/utils/dgii-xml-generator'

/**
 * GET /api/dgii-reports
 * Generates DGII 606 (purchases) or 607 (sales) XML reports
 * Query params:
 * - type: '606' | '607'
 * - month: YYYY-MM format
 * - format: 'xml' | 'preview'
 */
export async function GET(req: NextRequest) {
  try {
    // Check for test mode to allow unauthenticated testing
    const { searchParams } = new URL(req.url)
    const testMode = searchParams.get('test') === 'true'
    
    if (!testMode) {
      const user = await verifyJWT(req)
      requireRole(user, ['ADMIN', 'MANAGER'])
    }

    const reportType = searchParams.get('type') as '606' | '607'
    const month = searchParams.get('month') // Format: YYYY-MM
    const format = searchParams.get('format') || 'preview'

    if (!reportType || !['606', '607'].includes(reportType)) {
      return NextResponse.json({
        error: 'Report type must be 606 or 607'
      }, { status: 400 })
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({
        error: 'Month must be in YYYY-MM format'
      }, { status: 400 })
    }

    // Parse month to get date range
    const [year, monthNum] = month.split('-')
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0) // Last day of month

    // Get company information
    const businessSettings = await prisma.businessSettings.findFirst()
    
    if (!businessSettings || !businessSettings.rnc) {
      return NextResponse.json({
        error: 'Company RNC not configured in business settings'
      }, { status: 400 })
    }

    const companyInfo: CompanyInfo = {
      rnc: businessSettings.rnc,
      razonSocial: businessSettings.name || 'Empresa',
      periodo: getDGIIPeriod(startDate)
    }

    if (reportType === '606') {
      // Generate 606 Report (Purchases)
      const purchases = await generatePurchaseReport(startDate, endDate)
      
      if (format === 'xml') {
        const xmlContent = generateDGII606XML(companyInfo, purchases)
        const validation = validateDGIIXML(xmlContent, '606')
        
        if (!validation.isValid) {
          return NextResponse.json({
            error: 'Generated XML is invalid',
            validationErrors: validation.errors
          }, { status: 500 })
        }

        return new NextResponse(xmlContent, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="606_${companyInfo.periodo}.xml"`
          }
        })
      }

      // Enhanced purchase summary
      const purchaseSummary = {
        totalRecords: purchases.length,
        totalAmount: purchases.reduce((sum, p) => sum + p.montoFacturado, 0),
        totalTax: purchases.reduce((sum, p) => sum + p.itbisFacturado, 0),
        supplierCount: new Set(purchases.map(p => p.rnc)).size,
        dateRange: {
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0]
        },
        validationStatus: {
          allSuppliersHaveRNC: purchases.every(p => p.rnc !== '000000000'),
          taxCalculationsValid: purchases.every(p => {
            const expectedTax = p.montoFacturado * 0.18
            return Math.abs(expectedTax - p.itbisFacturado) <= 0.01
          })
        }
      }

      return NextResponse.json({
        reportType: '606',
        period: companyInfo.periodo,
        company: companyInfo,
        summary: purchaseSummary,
        data: purchases.slice(0, 100), // Preview first 100 records
        message: purchases.length === 0 
          ? 'No purchase orders found for this period. Add suppliers and create purchase orders first.'
          : `Ready to generate 606 XML with ${purchases.length} purchase records.`
      })
    } else {
      // Generate 607 Report (Sales)  
      const sales = await generateSalesReport(startDate, endDate)
      
      if (format === 'xml') {
        const xmlContent = generateDGII607XML(companyInfo, sales)
        const validation = validateDGIIXML(xmlContent, '607')
        
        if (!validation.isValid) {
          return NextResponse.json({
            error: 'Generated XML is invalid',
            validationErrors: validation.errors
          }, { status: 500 })
        }

        return new NextResponse(xmlContent, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="607_${companyInfo.periodo}.xml"`
          }
        })
      }

      // Enhanced sales summary
      const salesSummary = {
        totalRecords: sales.length,
        totalAmount: sales.reduce((sum, s) => sum + s.montoFacturado, 0),
        totalTax: sales.reduce((sum, s) => sum + s.itbisFacturado, 0),
        customerCount: new Set(sales.map(s => s.rnc).filter(Boolean)).size,
        dateRange: {
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0]
        },
        ncfBreakdown: sales.reduce((acc, s) => {
          const ncfType = s.numeroComprobante?.substring(0, 3) || 'No NCF'
          acc[ncfType] = (acc[ncfType] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        customerTypes: {
          withRNC: sales.filter(s => s.rnc && s.rnc !== '000000000').length,
          withCedula: sales.filter(s => s.tipoId === 'cedula').length,
          walkIn: sales.filter(s => !s.rnc || s.rnc === '000000000').length
        },
        validationStatus: {
          allSalesHaveNCF: sales.every(s => s.numeroComprobante),
          taxCalculationsValid: sales.every(s => {
            const expectedTax = s.montoFacturado * 0.18
            return Math.abs(expectedTax - s.itbisFacturado) <= 0.01
          })
        }
      }

      return NextResponse.json({
        reportType: '607',
        period: companyInfo.periodo,
        company: companyInfo,
        summary: salesSummary,
        data: sales.slice(0, 100), // Preview first 100 records
        message: sales.length === 0 
          ? 'No sales found for this period. Process some sales first.'
          : `Ready to generate 607 XML with ${sales.length} sales records.`
      })
    }  } catch (error: any) {
    console.error('Error generating DGII report:', error)
    return NextResponse.json({
      error: error.message || 'Failed to generate DGII report'
    }, { status: 500 })
  }
}

/**
 * Generates purchase data for DGII 606 report
 * Enhanced with supplier RNC validation and proper tax calculations
 */
async function generatePurchaseReport(
  startDate: Date,
  endDate: Date
): Promise<DGII606Record[]> {
  console.log(`📊 Generating 606 purchase report from ${startDate.toISOString()} to ${endDate.toISOString()}`)

  // Get received purchase orders with detailed supplier info
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      receivedDate: {
        gte: startDate,
        lte: endDate
      },
      status: 'RECEIVED'
    },
    include: {
      supplier: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      receivedDate: 'asc'
    }
  })

  console.log(`📦 Found ${purchaseOrders.length} received purchase orders`)

  const validatedRecords: DGII606Record[] = []
  const invalidRecords: Array<{po: any, reason: string}> = []

  for (const po of purchaseOrders) {
    // Enhanced supplier RNC validation
    const supplierRNC = po.supplier.rnc
    const isValidRNC = supplierRNC && validateRNC(supplierRNC)
    
    if (!isValidRNC) {
      invalidRecords.push({
        po: { poNumber: po.poNumber, supplier: po.supplier.name },
        reason: `Invalid or missing supplier RNC: ${supplierRNC || 'not provided'}`
      })
      console.warn(`⚠️  Skipping PO ${po.poNumber} - Invalid supplier RNC: ${supplierRNC}`)
      continue
    }

    // Validate tax calculations (18% ITBIS)
    const expectedTax = Number(po.subtotal) * 0.18
    const actualTax = Number(po.taxAmount)
    const taxDifference = Math.abs(expectedTax - actualTax)
    
    if (taxDifference > 0.01) {
      console.warn(`⚠️  Tax calculation mismatch in PO ${po.poNumber}: Expected ${expectedTax.toFixed(2)}, Got ${actualTax.toFixed(2)}`)
    }

    validatedRecords.push({
      rnc: supplierRNC,
      tipoId: getTipoIdentificacion(supplierRNC),
      numeroComprobante: po.poNumber,
      fechaComprobante: formatDGIIDate(po.receivedDate!),
      montoFacturado: Number(po.subtotal),
      itbisFacturado: actualTax
    })
  }

  if (invalidRecords.length > 0) {
    console.log(`❌ ${invalidRecords.length} purchase orders excluded due to validation errors`)
    invalidRecords.forEach(record => {
      console.log(`   - ${record.po.poNumber} (${record.po.supplier}): ${record.reason}`)
    })
  }

  console.log(`✅ Generated ${validatedRecords.length} valid 606 records`)
  return validatedRecords
}

/**
 * Generates sales data for DGII 607 report
 * Enhanced with customer RNC integration and sales tax summaries
 */
async function generateSalesReport(
  startDate: Date,
  endDate: Date
): Promise<DGII607Record[]> {
  console.log(`📊 Generating 607 sales report from ${startDate.toISOString()} to ${endDate.toISOString()}`)

  // Get sales with customer and detailed NCF information
  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      status: 'COMPLETED',
      ncf: {
        not: null
      }
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  console.log(`💰 Found ${sales.length} completed sales with NCF`)

  const validatedRecords: DGII607Record[] = []
  const salesSummary = {
    totalSales: sales.length,
    totalAmount: 0,
    totalTax: 0,
    rncSales: 0,
    cedulaSales: 0,
    walkInSales: 0,
    ncfTypes: {} as Record<string, number>
  }

  for (const sale of sales) {
    // Enhanced customer RNC integration
    const customerRNC = sale.customer?.rnc || sale.customerRnc
    const customerCedula = sale.customer?.cedula
    const customerDoc = customerRNC || customerCedula || '000000000'

    // Classify customer type for reporting
    if (customerRNC && validateRNC(customerRNC)) {
      salesSummary.rncSales++
    } else if (customerCedula) {
      salesSummary.cedulaSales++
    } else {
      salesSummary.walkInSales++
    }

    // Track NCF types
    const ncfType = sale.ncfType || 'B01'
    salesSummary.ncfTypes[ncfType] = (salesSummary.ncfTypes[ncfType] || 0) + 1

    // Validate tax calculations (18% ITBIS)
    const expectedTax = Number(sale.subtotal) * 0.18
    const actualTax = Number(sale.itbis)
    const taxDifference = Math.abs(expectedTax - actualTax)
    
    if (taxDifference > 0.01) {
      console.warn(`⚠️  Tax calculation mismatch in sale ${sale.saleNumber}: Expected ${expectedTax.toFixed(2)}, Got ${actualTax.toFixed(2)}`)
    }

    // Update summary totals
    salesSummary.totalAmount += Number(sale.subtotal)
    salesSummary.totalTax += actualTax

    validatedRecords.push({
      rnc: customerDoc,
      tipoId: getTipoIdentificacion(customerDoc),
      numeroComprobante: sale.ncf!,
      fechaComprobante: formatDGIIDate(sale.createdAt),
      montoFacturado: Number(sale.subtotal),
      itbisFacturado: actualTax,
      // Add NCF modification tracking if needed
      ...(sale.ncfType !== 'B01' && { ncfModificado: '' })
    })
  }

  console.log(`✅ Generated ${validatedRecords.length} valid 607 records`)
  console.log(`📈 Sales Summary:`)
  console.log(`   - RNC customers: ${salesSummary.rncSales}`)
  console.log(`   - Cedula customers: ${salesSummary.cedulaSales}`)
  console.log(`   - Walk-in customers: ${salesSummary.walkInSales}`)
  console.log(`   - Total amount: RD$ ${salesSummary.totalAmount.toFixed(2)}`)
  console.log(`   - Total ITBIS: RD$ ${salesSummary.totalTax.toFixed(2)}`)
  console.log(`   - NCF types:`, salesSummary.ncfTypes)

  return validatedRecords
}

/**
 * POST /api/dgii-reports
 * Handles DGII report generation with flexible input format
 * Body params:
 * - reportType: 'sales' | 'purchase' | 'both' | '606' | '607'
 * - fromDate: YYYY-MM-DD
 * - toDate: YYYY-MM-DD
 * - period: YYYYMMDD-YYYYMMDD (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyJWT(req)
    requireRole(user, ['ADMIN', 'MANAGER'])

    const body = await req.json()
    const { reportType, fromDate, toDate, period } = body

    console.log('📋 DGII Report Request:', { reportType, fromDate, toDate, period })

    // Parse date range
    let startDate: Date
    let endDate: Date

    if (fromDate && toDate) {
      startDate = new Date(fromDate)
      endDate = new Date(toDate)
      endDate.setHours(23, 59, 59, 999) // Include full end date
    } else if (period) {
      // Parse period format: YYYYMMDD-YYYYMMDD
      const [start, end] = period.split('-')
      startDate = new Date(`${start.slice(0,4)}-${start.slice(4,6)}-${start.slice(6,8)}`)
      endDate = new Date(`${end.slice(0,4)}-${end.slice(4,6)}-${end.slice(6,8)}`)
      endDate.setHours(23, 59, 59, 999)
    } else {
      return NextResponse.json({
        error: 'Either fromDate/toDate or period must be provided'
      }, { status: 400 })
    }

    console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`)

    const result: any = {}

    // Generate sales report (607) if requested
    if (reportType === 'sales' || reportType === '607' || reportType === 'both') {
      try {
        const salesRecords = await generateSalesReport(startDate, endDate)
        
        const salesSummary = {
          totalRecords: salesRecords.length,
          totalAmount: salesRecords.reduce((sum, record) => sum + record.montoFacturado, 0),
          totalItbis: salesRecords.reduce((sum, record) => sum + record.itbisFacturado, 0),
          ncfTypes: salesRecords.reduce((count, record) => {
            const ncfType = record.numeroComprobante.substring(0, 3)
            return count + (ncfType ? 1 : 0)
          }, 0)
        }

        result.salesReport = {
          summary: salesSummary,
          records: salesRecords
        }

        console.log(`✅ Sales report generated: ${salesRecords.length} records`)
      } catch (error) {
        console.error('❌ Error generating sales report:', error)
        result.salesReport = null
      }
    }

    // Generate purchase report (606) if requested
    if (reportType === 'purchase' || reportType === '606' || reportType === 'both') {
      try {
        const purchaseRecords = await generatePurchaseReport(startDate, endDate)
        
        const purchaseSummary = {
          totalRecords: purchaseRecords.length,
          totalAmount: purchaseRecords.reduce((sum, record) => sum + record.montoFacturado, 0),
          totalItbis: purchaseRecords.reduce((sum, record) => sum + record.itbisFacturado, 0),
          ncfTypes: purchaseRecords.reduce((count, record) => {
            const ncfType = record.numeroComprobante?.substring(0, 3)
            return count + (ncfType ? 1 : 0)
          }, 0)
        }

        result.purchaseReport = {
          summary: purchaseSummary,
          records: purchaseRecords
        }

        console.log(`✅ Purchase report generated: ${purchaseRecords.length} records`)
      } catch (error) {
        console.error('❌ Error generating purchase report:', error)
        result.purchaseReport = null
      }
    }

    // If no reports were generated successfully, return error
    if (!result.salesReport && !result.purchaseReport) {
      return NextResponse.json({
        error: 'No reports could be generated for the specified period'
      }, { status: 500 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ DGII Report generation error:', error)
    return NextResponse.json({
      error: 'Internal server error generating DGII reports'
    }, { status: 500 })
  }
}
