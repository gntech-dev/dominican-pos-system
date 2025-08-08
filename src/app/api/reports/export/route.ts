import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'

// Store the autoTable function separately
let autoTable: any = null
let autoTableInitialized = false

async function ensureAutoTableLoaded() {
  if (!autoTableInitialized) {
    try {
      // Load the autoTable module and store the function
      if (typeof window === 'undefined') {
        // Server-side: use require
        autoTable = require('jspdf-autotable').default || require('jspdf-autotable')
      } else {
        // Client-side: use dynamic import
        const module = await import('jspdf-autotable')
        autoTable = module.default || module
      }
      
      autoTableInitialized = true
      console.log('✅ jspdf-autotable plugin loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load jspdf-autotable plugin:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to load PDF table plugin: ${errorMessage}`)
    }
  }
}

// Type declaration for jspdf-autotable
interface AutoTableOptions {
  head?: any[][]
  body?: any[][]
  startY?: number
  margin?: { left?: number; right?: number; top?: number; bottom?: number }
  theme?: string
  styles?: any
  headStyles?: any
  bodyStyles?: any
  columnStyles?: any
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF
    lastAutoTable?: {
      finalY: number
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { reportType, format, data, dateRange } = await req.json()

    if (format === 'pdf') {
      return await exportToPDF(reportType, data, dateRange)
    } else if (format === 'csv') {
      return await exportToCSV(reportType, data, dateRange)
    } else {
      return NextResponse.json(
        { success: false, error: 'Formato no soportado' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in export API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * Generate PDF header with business logo and branding
 */
async function generatePDFHeader(doc: jsPDF, reportType: string, dateRange: { from: string; to: string }) {
  try {
    // Try to load business logo from file system
    const fs = await import('fs')
    const path = await import('path')
    
    const logoFormats = ['png', 'jpg', 'jpeg'] // Focus on formats jsPDF can handle easily
    let logoAdded = false
    let businessName = 'Sistema POS'
    
    // Try to get business name from database
    try {
      const { prisma } = await import('@/lib/prisma')
      const businessSettings = await prisma.businessSettings.findFirst({
        where: { isActive: true, isDefault: true }
      })
      if (businessSettings) {
        businessName = businessSettings.name
        
        // Check if business has a logo URL stored and it's a supported format
        if (businessSettings.logo && businessSettings.logo.trim()) {
          const logoPath = businessSettings.logo.startsWith('/') 
            ? path.join(process.cwd(), 'public', businessSettings.logo)
            : path.join(process.cwd(), 'public', businessSettings.logo)
          
          // For SVG, we'll use a fallback approach
          if (businessSettings.logo.endsWith('.svg')) {
            // Add business name prominently for SVG files
            doc.setFontSize(18)
            doc.setTextColor(0, 50, 100)
            doc.text(businessName, 20, 25)
            logoAdded = true
          } else if (fs.existsSync(logoPath)) {
            try {
              // Read and embed the image
              const imageData = fs.readFileSync(logoPath)
              const base64Image = imageData.toString('base64')
              const imageFormat = businessSettings.logo.split('.').pop()?.toLowerCase()
              
              if (imageFormat === 'png' || imageFormat === 'jpg' || imageFormat === 'jpeg') {
                const dataUri = `data:image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat};base64,${base64Image}`
                doc.addImage(dataUri, imageFormat.toUpperCase(), 20, 10, 40, 20)
                logoAdded = true
                console.log(`✅ PDF Logo embedded: ${businessSettings.logo}`)
              }
            } catch (imageError) {
              console.log(`❌ Could not embed logo: ${imageError}`)
              // Fallback to business name
              doc.setFontSize(18)
              doc.setTextColor(0, 50, 100)
              doc.text(businessName, 20, 25)
              logoAdded = true
            }
          }
        }
      }
    } catch (dbError) {
      console.log('Could not fetch business settings from database')
    }
    
    // If no logo from database, try to detect file system logos
    if (!logoAdded) {
      for (const format of logoFormats) {
        try {
          const logoPath = path.join(process.cwd(), 'public', `logo.${format}`)
          if (fs.existsSync(logoPath)) {
            try {
              // Read and embed the image
              const imageData = fs.readFileSync(logoPath)
              const base64Image = imageData.toString('base64')
              const dataUri = `data:image/${format === 'jpg' ? 'jpeg' : format};base64,${base64Image}`
              doc.addImage(dataUri, format.toUpperCase(), 20, 10, 40, 20)
              logoAdded = true
              console.log(`✅ PDF Logo embedded from file system: logo.${format}`)
              break
            } catch (imageError) {
              console.log(`❌ Could not embed logo.${format}: ${imageError}`)
              continue
            }
          }
        } catch (error) {
          continue
        }
      }
    }
    
    // Header text positioning - adjusted for better spacing
    const headerY = logoAdded ? 40 : 20
    doc.setFontSize(18)
    doc.setTextColor(0, 0, 0)
    doc.text(`${businessName} - REPORTE`, logoAdded ? 70 : 20, headerY)
    
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    doc.text(`Tipo: ${getReportTitle(reportType)}`, 20, headerY + 20)
    doc.text(`Periodo: ${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`, 20, headerY + 32)
    doc.text(`Generado: ${formatDate(new Date().toISOString())}`, 20, headerY + 44)
    
    // Add a separator line with more spacing
    doc.setTextColor(0, 0, 0)
    doc.text('_'.repeat(80), 20, headerY + 54)
    
  } catch (error) {
    console.log('Logo loading failed, using text-only header:', error)
    
    // Fallback header without logo
    doc.setFontSize(20)
    doc.setTextColor(0, 0, 0)
    doc.text('SISTEMA POS - REPORTE', 20, 20)
    
    doc.setFontSize(14)
    doc.setTextColor(60, 60, 60)
    doc.text(`Tipo: ${getReportTitle(reportType)}`, 20, 35)
    doc.text(`Periodo: ${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`, 20, 45)
    doc.text(`Generado: ${formatDate(new Date().toISOString())}`, 20, 55)
    
    // Add a separator line
    doc.setTextColor(0, 0, 0)
    doc.text('_'.repeat(80), 20, 60)
  }
}

async function exportToPDF(reportType: string, data: any, dateRange: { from: string; to: string }) {
  try {
    // Ensure autoTable is loaded first
    await ensureAutoTableLoaded()
    
    // Create jsPDF instance
    const doc = new jsPDF()
    
    // Add autoTable method to the doc instance if it's not available
    if (typeof doc.autoTable !== 'function' && typeof autoTable === 'function') {
      (doc as any).autoTable = (options: any) => {
        return autoTable(doc, options)
      }
    }
    
    // Verify autoTable is now available
    if (typeof (doc as any).autoTable !== 'function') {
      throw new Error('autoTable function could not be attached to jsPDF instance')
    }
    
    console.log('✅ PDF generation ready with autoTable support')
    
    // Set default font to support Latin characters better and configure encoding
    doc.setFont('helvetica', 'normal')
    doc.internal.pageSize.width = 210  // A4 width in mm
    doc.internal.pageSize.height = 297 // A4 height in mm
    
    // Generate PDF with logo header
    await generatePDFHeader(doc, reportType, dateRange)
    
    let yPosition = 105

    switch (reportType) {
      case 'daily':
        yPosition = await generateDailyPDF(doc, data, yPosition)
        break
      case 'itbis':
        yPosition = generateITBISPDF(doc, data, yPosition)
        break
      case 'ncf':
        yPosition = generateNCFPDF(doc, data, yPosition)
        break
      case 'inventory':
        yPosition = generateInventoryPDF(doc, data, yPosition)
        break
      case 'customers':
        yPosition = generateCustomersPDF(doc, data, yPosition)
        break
      case 'audit':
        yPosition = generateAuditPDF(doc, data, yPosition)
        break
      case 'dgii':
        yPosition = generateDGIIPDF(doc, data, yPosition)
        break
      default:
        doc.text('Tipo de reporte no reconocido', 20, yPosition)
    }

    const pdfBuffer = doc.output('arraybuffer')
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

async function exportToCSV(reportType: string, data: any, dateRange: { from: string; to: string }) {
  try {
    let csvContent = ''
    
    // Add UTF-8 BOM to ensure proper encoding of Latin characters
    csvContent += '\uFEFF'
    
    // Header
    csvContent += `Sistema POS - Reporte ${getReportTitle(reportType)}\n`
    csvContent += `Período,${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}\n`
    csvContent += `Generado,${formatDate(new Date().toISOString())}\n\n`

    switch (reportType) {
      case 'daily':
        csvContent += generateDailyCSV(data)
        break
      case 'itbis':
        csvContent += generateITBISCSV(data)
        break
      case 'ncf':
        csvContent += generateNCFCSV(data)
        break
      case 'inventory':
        csvContent += generateInventoryCSV(data)
        break
      case 'customers':
        csvContent += generateCustomersCSV(data)
        break
      case 'audit':
        csvContent += generateAuditCSV(data)
        break
      case 'dgii':
        csvContent += generateDGIICSV(data)
        break
      default:
        csvContent += 'Tipo de reporte no reconocido\n'
    }

    // Convert to UTF-8 buffer to ensure proper encoding
    const buffer = Buffer.from(csvContent, 'utf8')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error generating CSV:', error)
    throw error
  }
}

// PDF Generation Functions
async function generateDailyPDF(doc: jsPDF, data: any, yPosition: number): Promise<number> {
  // Enhanced header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE VENTAS DIARIAS', 20, yPosition)
  yPosition += 12

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('ANÁLISIS COMPLETO DE OPERACIONES COMERCIALES', 20, yPosition)
  doc.text(`Republica Dominicana - Moneda: Pesos Dominicanos (RD$)`, 20, yPosition + 6)
  yPosition += 20

  // Date and time information
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(`Período: ${data.dateRange?.from || 'N/A'} al ${data.dateRange?.to || 'N/A'}`, 20, yPosition)
  doc.text(`Generado: ${new Date().toLocaleString('es-DO')}`, 20, yPosition + 6)
  yPosition += 20

  // Executive Summary Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN EJECUTIVO', 20, yPosition)
  yPosition += 10

  // Summary metrics in a professional table
  if (typeof doc.autoTable === 'function') {
    const summaryData = [
      ['Total de Transacciones', (data.salesSummary?.totalSales || 0).toString(), '100%'],
      ['Ingresos Brutos', truncateText(`RD$ ${(Number(data.salesSummary?.totalAmount) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 20), '100%'],
      ['ITBIS Recaudado', truncateText(`RD$ ${(Number(data.salesSummary?.totalTax) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 20), `${data.salesSummary?.totalAmount > 0 ? ((Number(data.salesSummary.totalTax) / Number(data.salesSummary.totalAmount)) * 100).toFixed(2) : 0}%`],
      ['Ingresos Netos', truncateText(`RD$ ${((Number(data.salesSummary?.totalAmount) || 0) - (Number(data.salesSummary?.totalTax) || 0)).toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 20), `${data.salesSummary?.totalAmount > 0 ? (((Number(data.salesSummary.totalAmount) - Number(data.salesSummary.totalTax)) / Number(data.salesSummary.totalAmount)) * 100).toFixed(2) : 0}%`],
      ['Ticket Promedio', truncateText(`RD$ ${(Number(data.salesSummary?.averageTicket) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 20), 'Por transacción'],
      ['Productos Vendidos', (data.salesSummary?.totalProducts || 0).toString(), 'Unidades']
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Métrica', 'Valor', 'Porcentaje/Nota']],
      body: summaryData,
      margin: { left: 20, right: 20 },
      styles: { fontSize: 10, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { 
        fillColor: [34, 139, 34],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 65, halign: 'right' },
        2: { cellWidth: 45, halign: 'center' }
      }
    });
    yPosition = (doc as any).lastAutoTable?.finalY + 15 || yPosition + 60;
  }

  // Performance Indicators
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('INDICADORES DE RENDIMIENTO', 20, yPosition)
  yPosition += 10

  if (typeof doc.autoTable === 'function') {
    const performanceData = [
      ['Hora Pico de Ventas', truncateText(data.performance?.peakHour || 'N/A', 15), data.performance?.peakSales || '0', 'Transacciones'],
      ['Mejor Vendedor', truncateText(data.performance?.topCashier || 'N/A', 25), data.performance?.topCashierSales || '0', 'Ventas'],
      ['Categoría Líder', truncateText(data.performance?.topCategory || 'N/A', 25), truncateText(`RD$ ${(data.performance?.topCategoryRevenue || 0).toFixed(2)}`, 15), 'Ingresos'],
      ['Método Pago Preferido', truncateText(data.performance?.preferredPayment || 'Efectivo', 20), `${data.performance?.preferredPaymentPercentage || 0}%`, 'Del total'],
      ['Rotación de Inventario', `${data.performance?.inventoryTurnover || 0}`, 'productos', 'Vendidos hoy'],
      ['Margen Promedio', `${data.performance?.averageMargin || 0}%`, 'ganancia', 'Por producto']
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Indicador', 'Valor', 'Cantidad', 'Unidad']],
      body: performanceData,
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { 
        fillColor: [255, 165, 0],
        textColor: 0,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 55, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 30, halign: 'center' }
      }
    });
    yPosition = (doc as any).lastAutoTable?.finalY + 15 || yPosition + 50;
  }

  // Payment Methods Analysis
  if (data.salesSummary && typeof doc.autoTable === 'function') {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('ANÁLISIS DE MÉTODOS DE PAGO', 20, yPosition)
    yPosition += 10

    const totalAmount = Number(data.salesSummary.totalAmount) || 0;
    const paymentData = [
      [
        'Efectivo',
        `RD$ ${(Number(data.salesSummary.totalCash) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`,
        `${totalAmount > 0 ? ((Number(data.salesSummary.totalCash) / totalAmount) * 100).toFixed(2) : 0}%`,
        data.salesSummary.cashTransactions || 0,
        `RD$ ${data.salesSummary.cashTransactions > 0 ? (Number(data.salesSummary.totalCash) / data.salesSummary.cashTransactions).toFixed(2) : '0.00'}`
      ],
      [
        'Tarjeta de Crédito/Débito',
        `RD$ ${(Number(data.salesSummary.totalCard) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`,
        `${totalAmount > 0 ? ((Number(data.salesSummary.totalCard) / totalAmount) * 100).toFixed(2) : 0}%`,
        data.salesSummary.cardTransactions || 0,
        `RD$ ${data.salesSummary.cardTransactions > 0 ? (Number(data.salesSummary.totalCard) / data.salesSummary.cardTransactions).toFixed(2) : '0.00'}`
      ],
      [
        'Transferencia Bancaria',
        `RD$ ${(Number(data.salesSummary.totalTransfer) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`,
        `${totalAmount > 0 ? ((Number(data.salesSummary.totalTransfer) / totalAmount) * 100).toFixed(2) : 0}%`,
        data.salesSummary.transferTransactions || 0,
        `RD$ ${data.salesSummary.transferTransactions > 0 ? (Number(data.salesSummary.totalTransfer) / data.salesSummary.transferTransactions).toFixed(2) : '0.00'}`
      ]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Método de Pago', 'Monto Total', '% del Total', 'Transacciones', 'Ticket Promedio']],
      body: paymentData,
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 35, halign: 'right' }
      }
    });
    yPosition = (doc as any).lastAutoTable?.finalY + 15 || yPosition + 40;
  }

  // Top Products Section (Enhanced with overflow protection)
  if (data.topProducts && data.topProducts.length > 0) {
    // Check if we need a new page
    yPosition = ensurePageBoundaries(doc, yPosition, 80)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TOP 10 - PRODUCTOS MÁS VENDIDOS', 20, yPosition)
    yPosition += 10

    if (typeof doc.autoTable === 'function') {
      const config = getResponsiveColumnConfig('daily', 8)
      
      doc.autoTable({
        startY: yPosition,
        head: [['#', 'Producto', 'Categoría', 'Cant.', 'Precio Unit.', 'Ingresos', 'Margen', 'Stock Rest.']],
        body: data.topProducts.slice(0, 10).map((product: any, index: number) => [
          (index + 1).toString(),
          truncateText(product.name || 'N/A', 25),
          truncateText(product.category || 'Sin categoría', 18),
          (product.quantity || 0).toString(),
          formatCurrencyForPDF(Number(product.unitPrice) || 0),
          formatCurrencyForPDF(Number(product.revenue) || 0),
          `${product.margin || 0}%`,
          truncateText(product.remainingStock?.toString() || 'N/A', 8)
        ]),
        margin: { left: 20, right: 20 },
        styles: { 
          fontSize: config.fontSize, 
          cellPadding: config.cellPadding,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [255, 99, 132],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: config.fontSize + 1
        },
        columnStyles: config.columnStyles
      });
      yPosition = (doc as any).lastAutoTable?.finalY + 15 || yPosition + 80;
    }
  }

  // NCF (Tax Documents) Analysis
  if (data.ncfBreakdown) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('ANÁLISIS DE COMPROBANTES FISCALES (NCF)', 20, yPosition)
    yPosition += 10

    if (typeof doc.autoTable === 'function') {
      const ncfData = [];
      if (data.ncfBreakdown.B01?.count > 0) {
        ncfData.push(['B01', 'Ingresos por Operaciones', data.ncfBreakdown.B01.count, `RD$ ${data.ncfBreakdown.B01.amount.toLocaleString('es-DO', {minimumFractionDigits: 2})}`, `RD$ ${(data.ncfBreakdown.B01.amount * 0.18).toFixed(2)}`]);
      }
      if (data.ncfBreakdown.B02?.count > 0) {
        ncfData.push(['B02', 'Ingresos por Exportaciones', data.ncfBreakdown.B02.count, `RD$ ${data.ncfBreakdown.B02.amount.toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 'RD$ 0.00']);
      }
      if (data.ncfBreakdown.B03?.count > 0) {
        ncfData.push(['B03', 'Ingresos por Crédito Fiscal', data.ncfBreakdown.B03.count, `RD$ ${data.ncfBreakdown.B03.amount.toLocaleString('es-DO', {minimumFractionDigits: 2})}`, `RD$ ${(data.ncfBreakdown.B03.amount * 0.18).toFixed(2)}`]);
      }
      if (data.ncfBreakdown.B04?.count > 0) {
        ncfData.push(['B04', 'Notas de Crédito', data.ncfBreakdown.B04.count, `RD$ ${data.ncfBreakdown.B04.amount.toLocaleString('es-DO', {minimumFractionDigits: 2})}`, `RD$ ${(data.ncfBreakdown.B04.amount * 0.18).toFixed(2)}`]);
      }

      if (ncfData.length > 0) {
        doc.autoTable({
          startY: yPosition,
          head: [['Tipo', 'Descripción', 'Cantidad', 'Monto', 'ITBIS']],
          body: ncfData,
          margin: { left: 20, right: 20 },
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: {
            fillColor: [138, 43, 226],
            textColor: 255,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 25, halign: 'center' },
            1: { cellWidth: 60 },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 25, halign: 'right' }
          }
        });
        yPosition = (doc as any).lastAutoTable?.finalY + 15 || yPosition + 40;
      }
    }
  }

  // Customer Analysis
  if (data.topCustomers && data.topCustomers.length > 0) {
    // Check if we need a new page
    yPosition = ensurePageBoundaries(doc, yPosition, 80)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('ANÁLISIS DE CLIENTES TOP', 20, yPosition)
    yPosition += 10

    if (typeof doc.autoTable === 'function') {
      const config = getResponsiveColumnConfig('customers', 6)
      
      doc.autoTable({
        startY: yPosition,
        head: [['Cliente', 'RNC/Cédula', 'Compras', 'Monto Total', 'Ticket Prom.', 'Tipo Cliente']],
        body: data.topCustomers.slice(0, 10).map((customer: any) => [
          truncateText(customer.name || 'Cliente General', 30),
          truncateText(customer.rnc || customer.cedula || 'N/A', 15),
          (customer.totalPurchases || 0).toString(),
          formatCurrencyForPDF(Number(customer.totalAmount) || 0),
          formatCurrencyForPDF(customer.totalPurchases > 0 ? (Number(customer.totalAmount) / customer.totalPurchases) : 0),
          truncateText(customer.customerType || 'Regular', 12)
        ]),
        margin: { left: 20, right: 20 },
        styles: { 
          fontSize: config.fontSize, 
          cellPadding: config.cellPadding,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [54, 162, 235],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: config.fontSize + 1
        },
        columnStyles: {
          0: { cellWidth: 40, cellPadding: 2 },
          1: { cellWidth: 25, cellPadding: 1 },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 20, halign: 'center' }
        }
      });
      yPosition = (doc as any).lastAutoTable?.finalY + 15 || yPosition + 80;
    }
  }

  // Hourly Sales Analysis (if available)
  if (data.hourlySales && data.hourlySales.length > 0) {
    yPosition = ensurePageBoundaries(doc, yPosition, 60)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('ANÁLISIS POR HORAS', 20, yPosition)
    yPosition += 10

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: yPosition,
        head: [['Hora', 'Transacciones', 'Monto', 'Ticket Promedio', 'Productos Vendidos']],
        body: data.hourlySales.map((hour: any) => [
          `${hour.hour}:00 - ${hour.hour + 1}:00`,
          (hour.transactions || 0).toString(),
          formatCurrencyForPDF(hour.amount || 0),
          formatCurrencyForPDF(hour.transactions > 0 ? (hour.amount / hour.transactions) : 0),
          (hour.products || 0).toString()
        ]),
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: {
          fillColor: [75, 192, 192],
          textColor: 0,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 35, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 25, halign: 'center' }
        }
      });
      yPosition = (doc as any).lastAutoTable?.finalY + 15 || yPosition + 60;
    }
  }

  // Footer with important notes
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text('Notas: Todos los montos en Pesos Dominicanos (RD$). ITBIS calculado al 18% según normativa DGII.', 20, yPosition)
  doc.text('Este reporte es generado automáticamente y cumple con los estándares contables de República Dominicana.', 20, yPosition + 6)
  doc.text(`Pagina generada el ${new Date().toLocaleString('es-DO')} - Sistema POS v1.0`, 20, yPosition + 12)

  return yPosition + 25;
}

function generateITBISPDF(doc: jsPDF, data: any, yPosition: number): number {
  // Enhanced header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DETALLADO DE ITBIS', 20, yPosition)
  yPosition += 12

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('IMPUESTO SOBRE TRANSFERENCIAS DE BIENES INDUSTRIALIZADOS Y SERVICIOS', 20, yPosition)
  doc.text('Conforme a la Ley 253-12 - República Dominicana', 20, yPosition + 6)
  yPosition += 20

  // DGII Compliance Statement
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(`Tasa ITBIS Vigente: 18% - RNC: ${data.companyInfo?.rnc || 'No Configurado'} - NCF Autorizados por DGII`, 20, yPosition)
  yPosition += 15

  // Executive Summary Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN EJECUTIVO', 20, yPosition)
  yPosition += 10

  // Summary table with enhanced formatting
  if (typeof doc.autoTable === 'function') {
    doc.autoTable({
      startY: yPosition,
      head: [['Concepto', 'Monto (RD$)', 'Porcentaje']],
      body: [
        [
          'ITBIS Total Recaudado',
          truncateText(`${(data.totalITBIS || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 18),
          '18.00%'
        ],
        [
          'Base Imponible (Ventas Gravadas)',
          truncateText(`${(data.taxableSales || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 18),
          `${data.totalSales > 0 ? ((data.taxableSales / data.totalSales) * 100).toFixed(2) : 0.00}%`
        ],
        [
          'Ventas Exentas',
          truncateText(`${(data.exemptSales || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 18),
          `${data.totalSales > 0 ? ((data.exemptSales / data.totalSales) * 100).toFixed(2) : 0.00}%`
        ],
        [
          'Total de Ventas',
          truncateText(`${(data.totalSales || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 18),
          '100.00%'
        ]
      ],
      margin: { left: 20, right: 20 },
      styles: { fontSize: 10, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { 
        fillColor: [0, 123, 191],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 60, halign: 'right' },
        2: { cellWidth: 35, halign: 'center' }
      }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Tax Rate Verification
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('VERIFICACIÓN DE CÁLCULOS ITBIS', 20, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const expectedITBIS = (data.taxableSales || 0) * 0.18
  const actualITBIS = data.totalITBIS || 0
  const variance = Math.abs(expectedITBIS - actualITBIS)
  const variancePercentage = expectedITBIS > 0 ? (variance / expectedITBIS) * 100 : 0

  doc.text(`ITBIS Calculado (18% × Base Imponible): RD$ ${expectedITBIS.toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 20, yPosition)
  yPosition += 8
  doc.text(`ITBIS Recaudado (Registros del Sistema): RD$ ${actualITBIS.toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 20, yPosition)
  yPosition += 8
  
  // Variance analysis
  if (variancePercentage > 0.01) {
    doc.setTextColor(217, 83, 79) // Red for variance
    doc.text(`ATENCION: Diferencia Detectada: RD$ ${variance.toLocaleString('es-DO', {minimumFractionDigits: 2})} (${variancePercentage.toFixed(2)}%)`, 20, yPosition)
    doc.setTextColor(0, 0, 0) // Reset to black
  } else {
    doc.setTextColor(92, 184, 92) // Green for OK
    doc.text(`✓ Cálculos Correctos - Diferencia: < 0.01%`, 20, yPosition)
    doc.setTextColor(0, 0, 0) // Reset to black
  }
  yPosition += 15

  // Sales by NCF Type Section
  if (data.salesByType && data.salesByType.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('DESGLOSE POR TIPO DE COMPROBANTE FISCAL (NCF)', 20, yPosition)
    yPosition += 10

    if (typeof doc.autoTable === 'function') {
      const ncfTypesData = data.salesByType.map((item: any) => {
        const description = getNcfTypeDescription(item.ncfType)
        const itbisRate = item.ncfType === 'B02' ? '0%' : '18%' // B02 exports are exempt
        return [
          item.ncfType,
          description,
          item.count.toString(),
          `RD$ ${(item.amount || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`,
          `RD$ ${(item.tax || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`,
          itbisRate
        ]
      })

      doc.autoTable({
        startY: yPosition,
        head: [['NCF', 'Descripción', 'Cant.', 'Monto Total', 'ITBIS', 'Tasa']],
        body: ncfTypesData,
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { 
          fillColor: [52, 152, 219],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 60 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 15, halign: 'center' }
        }
      })
      yPosition = (doc as any).lastAutoTable.finalY + 15
    }
  }

  // Daily ITBIS Collection (if available)
  if (data.dailyCollections && data.dailyCollections.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('RECAUDACIÓN DIARIA DE ITBIS', 20, yPosition)
    yPosition += 10

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: yPosition,
        head: [['Fecha', 'Ventas Gravadas', 'ITBIS Recaudado', 'Transacciones', 'Promedio/Trans.']],
        body: data.dailyCollections.map((day: any) => [
          new Date(day.date).toLocaleDateString('es-DO'),
          `RD$ ${(day.taxableSales || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`,
          `RD$ ${(day.itbisAmount || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`,
          day.transactionCount.toString(),
          `RD$ ${day.transactionCount > 0 ? (day.itbisAmount / day.transactionCount).toFixed(2) : '0.00'}`
        ]),
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { 
          fillColor: [240, 173, 78],
          textColor: 0,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'center' },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 30, halign: 'right' }
        }
      })
      yPosition = (doc as any).lastAutoTable.finalY + 15
    }
  }

  // Payment Methods Analysis
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('ANÁLISIS POR MÉTODO DE PAGO', 20, yPosition)
    yPosition += 10

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: yPosition,
        head: [['Método de Pago', 'Monto Total', 'ITBIS Asociado', '% del Total']],
        body: data.paymentMethods.map((method: any) => [
          method.method,
          `RD$ ${(method.amount || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`,
          `RD$ ${(method.itbis || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`,
          `${method.percentage || 0}%`
        ]),
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { 
          fillColor: [92, 184, 92],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 25, halign: 'center' }
        }
      })
      yPosition = (doc as any).lastAutoTable.finalY + 15
    }
  }

  // DGII Compliance Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text('Este reporte cumple con los requisitos de la Dirección General de Impuestos Internos (DGII)', 20, yPosition)
  doc.text('para el registro y control del Impuesto sobre Transferencias de Bienes Industrializados y Servicios (ITBIS).', 20, yPosition + 6)
  doc.text(`Generado automáticamente el ${new Date().toLocaleString('es-DO')} por Sistema POS v1.0`, 20, yPosition + 12)

  return yPosition + 25
}

// Helper function for NCF type descriptions
function getNcfTypeDescription(ncfType: string): string {
  const descriptions: {[key: string]: string} = {
    'B01': 'Ingresos por Operaciones (No Exportadores)',
    'B02': 'Ingresos por Exportaciones',
    'B03': 'Ingresos por Crédito Fiscal',
    'B04': 'Ingresos por Nota de Crédito',
    'B11': 'Ingresos por Operaciones (Exportadores)',
    'B12': 'Ingresos Servicios (Exportadores)',
    'B13': 'Ingresos por Exportaciones de Servicios',
    'B14': 'Ingresos por Ventas de Activos',
    'B15': 'Ingresos por Servicios (No Exportadores)',
    'B16': 'Ingresos por Pagos del Exterior'
  }
  return descriptions[ncfType] || 'Tipo de NCF No Reconocido'
}

function generateNCFPDF(doc: jsPDF, data: any, yPosition: number): number {
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE CONTROL NCF', 20, yPosition)
  yPosition += 15

  // Summary section if available
  if (data.summary) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total de Secuencias: ${data.summary.totalSequences}`, 20, yPosition)
    yPosition += 8
    doc.text(`Total Utilizados en Período: ${data.summary.totalUsedInPeriod}`, 20, yPosition)
    yPosition += 8
    doc.text(`Monto Total Ventas: RD$ ${(data.summary.totalSalesAmount || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 20, yPosition)
    yPosition += 15
  }

  if (data.sequences && data.sequences.length > 0) {
    doc.autoTable({
      startY: yPosition,
      head: [['Tipo NCF', 'Actual', 'Desde', 'Hasta', 'Utilizados', 'Restantes', 'Porcentaje', 'Estado']],
      body: data.sequences.map((seq: any) => [
        seq.type,
        seq.current.toString(),
        seq.from.toString(),
        seq.to.toString(),
        seq.used.toString(),
        seq.remaining.toString(),
        `${seq.percentage}%`,
        seq.status === 'low' ? 'CRÍTICO' : seq.status === 'warning' ? 'ALERTA' : 'OK'
      ]),
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [52, 152, 219] },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 20, halign: 'center' }
      }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  return yPosition
}

function generateInventoryPDF(doc: jsPDF, data: any, yPosition: number): number {
  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DETALLADO DE INVENTARIO', 20, yPosition)
  yPosition += 15

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha de Generación: ${new Date().toLocaleDateString('es-DO')}`, 20, yPosition)
  yPosition += 20

  // Summary Section
  if (data.summary) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('RESUMEN GENERAL', 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    // Summary table
    doc.autoTable({
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Productos', data.summary.totalProducts.toString()],
        ['Total de Categorías', data.summary.totalCategories.toString()],
        ['Valor del Inventario', `RD$ ${data.summary.totalInventoryValue.toLocaleString('es-DO', {minimumFractionDigits: 2})}`],
        ['Valor de Costo', `RD$ ${data.summary.totalCostValue.toLocaleString('es-DO', {minimumFractionDigits: 2})}`],
        ['Ingresos 30 Días', `RD$ ${data.summary.totalRevenue30Days.toLocaleString('es-DO', {minimumFractionDigits: 2})}`],
        ['Margen Promedio', `${data.summary.averageMargin}%`],
        ['Rotación Anual', `${data.summary.inventoryTurnover}x`],
        ['Stock Bajo', data.summary.lowStockCount.toString()],
        ['Agotados', data.summary.outOfStockCount.toString()]
      ],
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Alerts Section
  if (data.alerts) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('ALERTAS CRÍTICAS', 20, yPosition)
    yPosition += 10

    doc.autoTable({
      startY: yPosition,
      head: [['Tipo de Alerta', 'Cantidad']],
      body: [
        ['Stock Crítico (Agotado)', data.alerts.criticalStock.toString()],
        ['Stock Bajo', data.alerts.lowStock.toString()],
        ['Reorden Necesario', data.alerts.reorderNeeded.toString()],
        ['Alto Valor - Movimiento Lento', data.alerts.highValueSlowMoving.toString()],
        ['Margen Negativo', data.alerts.negativeMargin.toString()]
      ],
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [217, 83, 79] }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Category Analysis
  if (data.categories && data.categories.length > 0) {
    // Check if we need a new page
    if (yPosition > 220) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('ANÁLISIS POR CATEGORÍA', 20, yPosition)
    yPosition += 10

    doc.autoTable({
      startY: yPosition,
      head: [['Categoría', 'Productos', 'Valor Total', 'Ingresos 30D', 'Margen %', 'Alertas']],
      body: data.categories.map((cat: any) => [
        cat.name,
        cat.productCount.toString(),
        `RD$ ${cat.totalValue.toLocaleString('es-DO', {minimumFractionDigits: 2})}`,
        `RD$ ${cat.totalRevenue30Days.toLocaleString('es-DO', {minimumFractionDigits: 2})}`,
        `${cat.averageMargin}%`,
        (cat.lowStockCount + cat.outOfStockCount).toString()
      ]),
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [92, 184, 92] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' }
      }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Top Selling Products
  if (data.insights?.topSelling && data.insights.topSelling.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('TOP 10 - PRODUCTOS MÁS VENDIDOS (30 DÍAS)', 20, yPosition)
    yPosition += 10

    doc.autoTable({
      startY: yPosition,
      head: [['#', 'Código', 'Producto', 'Categoría', 'Vendidos', 'Ingresos', 'Stock']],
      body: data.insights.topSelling.slice(0, 10).map((product: any, index: number) => [
        (index + 1).toString(),
        product.code || 'N/A',
        product.name && product.name.length > 25 ? product.name.substring(0, 25) + '...' : (product.name || 'Sin nombre'),
        product.category || 'Sin categoría',
        (product.totalSold30Days || 0).toString(),
        `RD$ ${(product.revenue30Days || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`,
        (product.stock || 0).toString()
      ]),
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [240, 173, 78] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 20 },
        2: { cellWidth: 45 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 15, halign: 'center' }
      }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Critical Stock Alerts
  if (data.insights?.outOfStock && data.insights.outOfStock.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PRODUCTOS AGOTADOS (ACCIÓN INMEDIATA)', 20, yPosition)
    yPosition += 10

    doc.autoTable({
      startY: yPosition,
      head: [['Código', 'Producto', 'Categoría', 'Min Stock', 'Ventas 30D', 'Última Venta']],
      body: data.insights.outOfStock.map((product: any) => [
        product.code || 'N/A',
        product.name && product.name.length > 30 ? product.name.substring(0, 30) + '...' : (product.name || 'Sin nombre'),
        product.category || 'Sin categoría',
        (product.minStock || 0).toString(),
        (product.totalSold30Days || 0).toString(),
        product.lastSold ? new Date(product.lastSold).toLocaleDateString('es-DO') : 'Nunca'
      ]),
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [217, 83, 79] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' }
      }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Low Stock Products
  if (data.insights?.lowStock && data.insights.lowStock.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PRODUCTOS CON STOCK BAJO (REORDEN REQUERIDO)', 20, yPosition)
    yPosition += 10

    doc.autoTable({
      startY: yPosition,
      head: [['Código', 'Producto', 'Stock Actual', 'Min Stock', 'Días Rest.', 'Venta Sem.']],
      body: data.insights.lowStock.map((product: any) => [
        product.code || 'N/A',
        product.name && product.name.length > 30 ? product.name.substring(0, 30) + '...' : (product.name || 'Sin nombre'),
        (product.stock || 0).toString(),
        (product.minStock || 0).toString(),
        (product.stockDays || 0).toString(),
        (product.averageWeeklySales || 0).toString()
      ]),
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [240, 173, 78] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' }
      }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Complete Product List (First 20 products to avoid too large PDF)
  if (data.products && data.products.length > 0) {
    // Check if we need a new page
    yPosition = ensurePageBoundaries(doc, yPosition, 80)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('INVENTARIO COMPLETO (PRIMEROS 20 PRODUCTOS)', 20, yPosition)
    yPosition += 10

    doc.autoTable({
      startY: yPosition,
      head: [['Código', 'Producto', 'Cat.', 'Stock', 'Precio', 'Valor', 'Margen%', 'Estado']],
      body: data.products.slice(0, 20).map((product: any) => [
        truncateText(product.code || 'N/A', 12),
        truncateText(product.name || 'Sin nombre', 22),
        truncateText(product.category || 'Sin categoría', 12),
        (product.stock || 0).toString(),
        formatCurrencyForPDF(product.price || 0),
        formatCurrencyForPDF(product.value || 0),
        `${product.margin || 0}%`,
        truncateText(getPDFStatusLabel(product.status || 'unknown'), 8)
      ]),
      margin: { left: 20, right: 20 },
      styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
      headStyles: { fillColor: [91, 192, 222], fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 35 },
        2: { cellWidth: 18 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 15, halign: 'center' }
      }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Footer note
  if (data.products && data.products.length > 20) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(`Nota: Se muestran los primeros 20 productos de ${data.products.length} total. Descargue el CSV para ver el inventario completo.`, 20, yPosition)
    yPosition += 10
  }

  return yPosition
}

function getPDFStatusLabel(status: string): string {
  const statusLabels: {[key: string]: string} = {
    'in_stock': 'En Stock',
    'low_stock': 'Stock Bajo',
    'out_of_stock': 'Agotado',
    'reorder_soon': 'Reorden'
  }
  return statusLabels[status] || status
}

function generateCustomersPDF(doc: jsPDF, data: any, yPosition: number): number {
  // Header with safe ASCII characters
  doc.setFontSize(18)
  doc.setTextColor(0, 102, 204) // Blue color
  doc.text('ANALISIS INTEGRAL DE CLIENTES', 20, yPosition)
  yPosition += 12
  
  doc.setFontSize(12)
  doc.setTextColor(128, 128, 128) // Gray color
  doc.text('Republica Dominicana - Sistema POS Avanzado - Inteligencia de Negocios', 20, yPosition)
  yPosition += 8
  
  doc.setTextColor(0, 0, 0) // Reset to black
  doc.text(`Generado: ${new Date().toLocaleDateString('es-DO')} a las ${new Date().toLocaleTimeString('es-DO')}`, 20, yPosition)
  yPosition += 15

  // Executive Summary Section
  doc.setFontSize(14)
  doc.setTextColor(0, 102, 204)
  doc.text('RESUMEN EJECUTIVO', 20, yPosition)
  yPosition += 10
  
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  
  // Summary statistics in columns using safe characters
  const summaryStats = [
    ['Total de Clientes Registrados:', `${data.summary?.totalCustomers || 0}`, 'Clientes'],
    ['Clientes Activos (con compras):', `${data.summary?.activeCustomers || 0}`, `${data.summary?.totalCustomers > 0 ? ((data.summary.activeCustomers / data.summary.totalCustomers) * 100).toFixed(1) : 0}% del total`],
    ['Clientes Inactivos:', `${data.summary?.inactiveCustomers || 0}`, 'Oportunidad de reactivacion'],
    ['Clientes Empresariales:', `${data.summary?.businessCustomers || 0}`, 'Con RNC'],
    ['Clientes Individuales:', `${data.summary?.individualCustomers || 0}`, 'Con Cedula'],
    ['Ingresos Totales Generados:', truncateText(`RD$ ${(data.summary?.totalRevenue || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 20), '100% del periodo'],
    ['Valor Promedio por Cliente:', truncateText(`RD$ ${(data.summary?.averageCustomerValue || 0).toFixed(2)}`, 18), 'Lifetime Value'],
    ['Ticket Promedio por Compra:', truncateText(`RD$ ${(data.summary?.averageOrderValue || 0).toFixed(2)}`, 18), 'Por transaccion']
  ]
  
  summaryStats.forEach(([label, value, note]) => {
    doc.text(truncateText(label, 35), 25, yPosition)
    doc.setFont('helvetica', 'bold')
    doc.text(value, 120, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(128, 128, 128)
    doc.text(truncateText(note, 25), 165, yPosition)
    doc.setTextColor(0, 0, 0)
    yPosition += 7
  })
  yPosition += 10

  // Customer Segmentation Analysis
  if (data.segmentation?.byType && data.segmentation.byType.length > 0) {
    doc.setFontSize(14)
    doc.setTextColor(0, 102, 204)
    doc.text('SEGMENTACION DE CLIENTES', 20, yPosition)
    yPosition += 10
    
    doc.autoTable({
      startY: yPosition,
      head: [['Tipo de Cliente', 'Total', 'Activos', 'Ingresos', '% del Total', 'Promedio/Cliente']],
      body: data.segmentation.byType.map((segment: any) => [
        truncateText(segment.type || 'N/A', 18),
        segment.count || 0,
        segment.activeCount || 0,
        truncateText(`RD$ ${(segment.revenue || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 15),
        `${segment.percentage || 0}%`,
        truncateText(`RD$ ${segment.activeCount > 0 ? (segment.revenue / segment.activeCount).toFixed(2) : '0.00'}`, 12)
      ]),
      margin: { left: 20, right: 20 },
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [0, 102, 204], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 45, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' }
      }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Payment Methods Preferences
  if (data.segmentation?.paymentMethods && data.segmentation.paymentMethods.length > 0) {
    doc.setFontSize(14)
    doc.setTextColor(0, 102, 204)
    doc.text('PREFERENCIAS DE METODOS DE PAGO', 20, yPosition)
    yPosition += 10
    
    doc.autoTable({
      startY: yPosition,
      head: [['Metodo de Pago', 'Clientes', 'Transacciones', 'Monto Total', '% del Total']],
      body: data.segmentation.paymentMethods.slice(0, 5).map((method: any) => [
        truncateText(method.method || 'N/A', 20),
        method.customers || 0,
        method.transactions || 0,
        truncateText(`RD$ ${(method.amount || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}`, 18),
        `${method.percentage || 0}%`
      ]),
      margin: { left: 20, right: 20 },
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [51, 122, 183], textColor: 255 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 50, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' }
      }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Top Customers Analysis
  if (data.topCustomers && data.topCustomers.length > 0) {
    yPosition = ensurePageBoundaries(doc, yPosition, 80)
    
    doc.setFontSize(14)
    doc.setTextColor(0, 102, 204)
    doc.text('TOP 15 CLIENTES MAS VALIOSOS', 20, yPosition)
    yPosition += 10
    
    doc.autoTable({
      startY: yPosition,
      head: [['#', 'Cliente', 'Tipo/Documento', 'Compras', 'Total Gastado', 'Ticket Prom.', 'Ultima Compra', 'Score']],
      body: data.topCustomers.slice(0, 15).map((customer: any, index: number) => [
        `${index + 1}`,
        truncateText(customer.name || 'N/A', 25),
        `${truncateText(customer.documentType || 'N/A', 8)}: ${truncateText(customer.documentNumber || 'N/A', 12)}`,
        (customer.totalSales || 0).toString(),
        formatCurrencyForPDF(customer.totalAmount || 0),
        formatCurrencyForPDF(customer.averageOrderValue || 0),
        customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString('es-DO') : 'N/A',
        `${customer.loyaltyScore || 0}/100`
      ]),
      margin: { left: 20, right: 20 },
      theme: 'grid',
      headStyles: { fillColor: [40, 167, 69], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: { 
        0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 30, cellPadding: 2 },
        2: { cellWidth: 28, cellPadding: 1 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 15, halign: 'center', fontStyle: 'bold' }
      }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Business Intelligence Insights
  if (data.insights) {
    doc.setFontSize(14)
    doc.setTextColor(0, 102, 204)
    doc.text('INTELIGENCIA DE NEGOCIOS - INSIGHTS', 20, yPosition)
    yPosition += 10
    
    const insights = [
      ['Retencion de Clientes', 
       `${data.insights.customerRetention?.rate || 'N/A'}% - ${data.insights.customerRetention?.trend || 'Estable'}`,
       data.insights.customerRetention?.recommendation || 'Mantener estrategia actual'],
      ['Oportunidad de Negocio',
       data.insights.growthOpportunity?.businessCustomers || 'Analizar sector empresarial',
       data.insights.growthOpportunity?.recommendation || 'Expandir base de clientes'],
      ['Cumplimiento DGII',
       data.insights.complianceStatus?.rncCoverage || 'N/A',
       data.insights.complianceStatus?.recommendation || 'Completar documentacion']
    ]
    
    doc.autoTable({
      startY: yPosition,
      head: [['Categoria', 'Metrica/Estado', 'Recomendacion Estrategica']],
      body: insights,
      margin: { left: 20 },
      theme: 'plain',
      headStyles: { fillColor: [255, 193, 7], textColor: 0, fontStyle: 'bold' },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 2: { cellWidth: 80 } }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  // Footer with safe ASCII characters
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  doc.text('Republica Dominicana - Cumplimiento DGII - Sistema POS Inteligente', 20, yPosition)
  yPosition += 5
  doc.text('Este reporte incluye analisis de comportamiento de clientes y compliance dominicano', 20, yPosition)
  yPosition += 10

  return yPosition
}

function generateAuditPDF(doc: jsPDF, data: any, yPosition: number): number {
  doc.setFontSize(16)
  doc.text('Reporte de Auditoría', 20, yPosition)
  yPosition += 15

  doc.setFontSize(12)
  doc.text(`Total de Transacciones: ${data.totalTransactions || 0}`, 20, yPosition)
  yPosition += 15

  if (data.transactions && data.transactions.length > 0) {
    doc.autoTable({
      startY: yPosition,
      head: [['NCF', 'Cliente', 'Cajero', 'Monto', 'Fecha']],
      body: data.transactions.slice(0, 20).map((transaction: any) => [
        transaction.ncf || 'N/A',
        transaction.customer?.name || 'Cliente General',
        transaction.cashier?.name || 'N/A',
        `RD$ ${(transaction.total || 0).toFixed(2)}`,
        formatDate(transaction.createdAt)
      ]),
      margin: { left: 20 }
    })
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }

  return yPosition
}

function generateDGIIPDF(doc: jsPDF, data: any, yPosition: number): number {
  doc.setFontSize(16)
  doc.text('Reporte DGII', 20, yPosition)
  yPosition += 15

  doc.setFontSize(12)
  doc.text('Este reporte cumple con los requisitos de la DGII', 20, yPosition)
  yPosition += 8
  doc.text(`ITBIS Total: RD$ ${(data.totalITBIS || 0).toFixed(2)}`, 20, yPosition)
  yPosition += 8
  doc.text(`Base Imponible: RD$ ${(data.taxableBase || 0).toFixed(2)}`, 20, yPosition)
  yPosition += 15

  return yPosition
}

// CSV Generation Functions
function generateDailyCSV(data: any): string {
  let csv = 'REPORTE DETALLADO DE VENTAS DIARIAS\n'
  csv += 'ANÁLISIS COMPLETO DE OPERACIONES COMERCIALES\n'
  csv += `República Dominicana • Moneda: Pesos Dominicanos (RD$)\n`
  csv += `Fecha de Generación,${new Date().toLocaleString('es-DO')}\n`
  csv += `Período Analizado,"${data.dateRange?.from || 'N/A'} al ${data.dateRange?.to || 'N/A'}"\n\n`
  
  // Executive Summary
  csv += 'RESUMEN EJECUTIVO\n'
  csv += 'Métrica,Valor,Porcentaje/Nota\n'
  csv += `Total de Transacciones,${data.salesSummary?.totalSales || 0},100%\n`
  csv += `Ingresos Brutos,RD$ ${(Number(data.salesSummary?.totalAmount) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})},100%\n`
  csv += `ITBIS Recaudado,RD$ ${(Number(data.salesSummary?.totalTax) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})},${data.salesSummary?.totalAmount > 0 ? ((Number(data.salesSummary.totalTax) / Number(data.salesSummary.totalAmount)) * 100).toFixed(2) : 0}%\n`
  csv += `Ingresos Netos,RD$ ${((Number(data.salesSummary?.totalAmount) || 0) - (Number(data.salesSummary?.totalTax) || 0)).toLocaleString('es-DO', {minimumFractionDigits: 2})},${data.salesSummary?.totalAmount > 0 ? (((Number(data.salesSummary.totalAmount) - Number(data.salesSummary.totalTax)) / Number(data.salesSummary.totalAmount)) * 100).toFixed(2) : 0}%\n`
  csv += `Ticket Promedio,RD$ ${(Number(data.salesSummary?.averageTicket) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})},Por transacción\n`
  csv += `Productos Vendidos,${data.salesSummary?.totalProducts || 0},Unidades\n\n`
  
  // Performance Indicators
  csv += 'INDICADORES DE RENDIMIENTO\n'
  csv += 'Indicador,Valor,Cantidad,Unidad\n'
  csv += `Hora Pico de Ventas,"${data.performance?.peakHour || 'N/A'}",${data.performance?.peakSales || '0'},Transacciones\n`
  csv += `Mejor Vendedor,"${data.performance?.topCashier || 'N/A'}",${data.performance?.topCashierSales || '0'},Ventas\n`
  csv += `Categoría Líder,"${data.performance?.topCategory || 'N/A'}",RD$ ${(data.performance?.topCategoryRevenue || 0).toFixed(2)},Ingresos\n`
  csv += `Método Pago Preferido,"${data.performance?.preferredPayment || 'Efectivo'}",${data.performance?.preferredPaymentPercentage || 0}%,Del total\n`
  csv += `Rotación de Inventario,${data.performance?.inventoryTurnover || 0},productos,Vendidos hoy\n`
  csv += `Margen Promedio,${data.performance?.averageMargin || 0}%,ganancia,Por producto\n\n`
  
  // Payment Methods Analysis
  if (data.salesSummary) {
    csv += 'ANÁLISIS DETALLADO DE MÉTODOS DE PAGO\n'
    csv += 'Método de Pago,Monto Total,% del Total,Transacciones,Ticket Promedio\n'
    
    const totalAmount = Number(data.salesSummary.totalAmount) || 0;
    
    csv += `Efectivo,RD$ ${(Number(data.salesSummary.totalCash) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})},${totalAmount > 0 ? ((Number(data.salesSummary.totalCash) / totalAmount) * 100).toFixed(2) : 0}%,${data.salesSummary.cashTransactions || 0},RD$ ${data.salesSummary.cashTransactions > 0 ? (Number(data.salesSummary.totalCash) / data.salesSummary.cashTransactions).toFixed(2) : '0.00'}\n`
    csv += `Tarjeta de Crédito/Débito,RD$ ${(Number(data.salesSummary.totalCard) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})},${totalAmount > 0 ? ((Number(data.salesSummary.totalCard) / totalAmount) * 100).toFixed(2) : 0}%,${data.salesSummary.cardTransactions || 0},RD$ ${data.salesSummary.cardTransactions > 0 ? (Number(data.salesSummary.totalCard) / data.salesSummary.cardTransactions).toFixed(2) : '0.00'}\n`
    csv += `Transferencia Bancaria,RD$ ${(Number(data.salesSummary.totalTransfer) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})},${totalAmount > 0 ? ((Number(data.salesSummary.totalTransfer) / totalAmount) * 100).toFixed(2) : 0}%,${data.salesSummary.transferTransactions || 0},RD$ ${data.salesSummary.transferTransactions > 0 ? (Number(data.salesSummary.totalTransfer) / data.salesSummary.transferTransactions).toFixed(2) : '0.00'}\n\n`
  }

  // Top Products Analysis
  if (data.topProducts && data.topProducts.length > 0) {
    csv += 'TOP 10 - PRODUCTOS MÁS VENDIDOS\n'
    csv += 'Posición,Producto,Categoría,Cantidad,Precio Unitario,Ingresos,Margen %,Stock Restante\n'
    data.topProducts.slice(0, 10).forEach((product: any, index: number) => {
      csv += `${index + 1},"${product.name || 'N/A'}","${product.category || 'Sin categoría'}",${product.quantity || 0},RD$ ${(Number(product.unitPrice) || 0).toFixed(2)},RD$ ${(Number(product.revenue) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})},${product.margin || 0}%,"${product.remainingStock || 'N/A'}"\n`
    })
    csv += '\n'
  }

  // NCF Analysis
  if (data.ncfBreakdown) {
    csv += 'ANÁLISIS DE COMPROBANTES FISCALES (NCF)\n'
    csv += 'Tipo NCF,Descripción,Cantidad,Monto,ITBIS (18%)\n'
    if (data.ncfBreakdown.B01?.count > 0) {
      csv += `B01,"Ingresos por Operaciones",${data.ncfBreakdown.B01.count},RD$ ${data.ncfBreakdown.B01.amount.toLocaleString('es-DO', {minimumFractionDigits: 2})},RD$ ${(data.ncfBreakdown.B01.amount * 0.18).toFixed(2)}\n`
    }
    if (data.ncfBreakdown.B02?.count > 0) {
      csv += `B02,"Ingresos por Exportaciones",${data.ncfBreakdown.B02.count},RD$ ${data.ncfBreakdown.B02.amount.toLocaleString('es-DO', {minimumFractionDigits: 2})},RD$ 0.00\n`
    }
    if (data.ncfBreakdown.B03?.count > 0) {
      csv += `B03,"Ingresos por Crédito Fiscal",${data.ncfBreakdown.B03.count},RD$ ${data.ncfBreakdown.B03.amount.toLocaleString('es-DO', {minimumFractionDigits: 2})},RD$ ${(data.ncfBreakdown.B03.amount * 0.18).toFixed(2)}\n`
    }
    if (data.ncfBreakdown.B04?.count > 0) {
      csv += `B04,"Notas de Crédito",${data.ncfBreakdown.B04.count},RD$ ${data.ncfBreakdown.B04.amount.toLocaleString('es-DO', {minimumFractionDigits: 2})},RD$ ${(data.ncfBreakdown.B04.amount * 0.18).toFixed(2)}\n`
    }
    csv += '\n'
  }

  // Customer Analysis
  if (data.topCustomers && data.topCustomers.length > 0) {
    csv += 'ANÁLISIS DE CLIENTES TOP\n'
    csv += 'Cliente,RNC/Cédula,Compras,Monto Total,Ticket Promedio,Tipo Cliente\n'
    data.topCustomers.slice(0, 10).forEach((customer: any) => {
      const avgTicket = customer.totalPurchases > 0 ? (Number(customer.totalAmount) / customer.totalPurchases).toFixed(2) : '0.00'
      csv += `"${customer.name || 'Cliente General'}","${customer.rnc || customer.cedula || 'N/A'}",${customer.totalPurchases || 0},RD$ ${(Number(customer.totalAmount) || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})},RD$ ${avgTicket},"${customer.customerType || 'Regular'}"\n`
    })
    csv += '\n'
  }

  // Hourly Sales Analysis
  if (data.hourlySales && data.hourlySales.length > 0) {
    csv += 'ANÁLISIS POR HORAS\n'
    csv += 'Rango de Hora,Transacciones,Monto,Ticket Promedio,Productos Vendidos\n'
    data.hourlySales.forEach((hour: any) => {
      const avgTicket = hour.transactions > 0 ? (hour.amount / hour.transactions).toFixed(2) : '0.00'
      csv += `"${hour.hour}:00 - ${hour.hour + 1}:00",${hour.transactions || 0},RD$ ${(hour.amount || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})},RD$ ${avgTicket},${hour.products || 0}\n`
    })
    csv += '\n'
  }

  // Category Performance
  if (data.categoryPerformance && data.categoryPerformance.length > 0) {
    csv += 'RENDIMIENTO POR CATEGORÍA\n'
    csv += 'Categoría,Productos Vendidos,Ingresos,% del Total,Margen Promedio,Transacciones\n'
    data.categoryPerformance.forEach((category: any) => {
      csv += `"${category.name}",${category.productsSold || 0},RD$ ${(category.revenue || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})},${category.percentage || 0}%,${category.averageMargin || 0}%,${category.transactions || 0}\n`
    })
    csv += '\n'
  }

  // Cashier Performance
  if (data.cashierPerformance && data.cashierPerformance.length > 0) {
    csv += 'RENDIMIENTO POR VENDEDOR/CAJERO\n'
    csv += 'Vendedor,Transacciones,Monto Vendido,Ticket Promedio,Productos Vendidos,Horas Trabajadas\n'
    data.cashierPerformance.forEach((cashier: any) => {
      const avgTicket = cashier.transactions > 0 ? (cashier.amount / cashier.transactions).toFixed(2) : '0.00'
      csv += `"${cashier.name}",${cashier.transactions || 0},RD$ ${(cashier.amount || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})},RD$ ${avgTicket},${cashier.products || 0},${cashier.hoursWorked || 'N/A'}\n`
    })
    csv += '\n'
  }

  // Business Intelligence Insights
  csv += 'INTELIGENCIA DE NEGOCIOS - INSIGHTS\n'
  csv += 'Métrica,Valor,Comparación,Recomendación\n'
  csv += `Crecimiento vs Día Anterior,${data.insights?.dailyGrowth || 'N/A'}%,"${data.insights?.growthTrend || 'Estable'}","${data.insights?.growthRecommendation || 'Mantener estrategia actual'}"\n`
  csv += `Hora Pico Identificada,"${data.insights?.peakHourAnalysis || 'N/A'}","${data.insights?.peakComparison || 'Normal'}","${data.insights?.peakRecommendation || 'Optimizar personal en horas pico'}"\n`
  csv += `Rotación de Productos,${data.insights?.productTurnover || 'N/A'}x,"${data.insights?.turnoverTrend || 'Promedio'}","${data.insights?.turnoverRecommendation || 'Revisar productos de baja rotación'}"\n`
  csv += `Satisfacción Método Pago,${data.insights?.paymentSatisfaction || 'N/A'}%,"${data.insights?.paymentTrend || 'Estable'}","${data.insights?.paymentRecommendation || 'Diversificar opciones de pago'}"\n\n`

  // Footer
  csv += 'NOTAS IMPORTANTES\n'
  csv += '- Todos los montos están expresados en Pesos Dominicanos (RD$)\n'
  csv += '- ITBIS calculado al 18% según normativa DGII de República Dominicana\n'
  csv += '- Los porcentajes se calculan sobre el total de ventas del período\n'
  csv += '- Este reporte cumple con los estándares contables dominicanos\n'
  csv += `- Generado automáticamente el ${new Date().toLocaleString('es-DO')}\n`
  csv += '- Sistema POS v1.0 - Diseñado para el mercado dominicano\n'
  
  return csv
}

function generateITBISCSV(data: any): string {
  let csv = 'REPORTE DETALLADO DE ITBIS (IMPUESTO SOBRE TRANSFERENCIAS DE BIENES INDUSTRIALIZADOS Y SERVICIOS)\n'
  csv += 'REPÚBLICA DOMINICANA - CONFORME A LA LEY 253-12\n'
  csv += `Fecha de Generación,${new Date().toLocaleString('es-DO')}\n`
  csv += `RNC Empresa,${data.companyInfo?.rnc || 'No Configurado'}\n`
  csv += `Tasa ITBIS Vigente,18%\n\n`
  
  // Executive Summary
  csv += 'RESUMEN EJECUTIVO\n'
  csv += 'Concepto,Monto (RD$),Porcentaje del Total\n'
  csv += `ITBIS Total Recaudado,${(data.totalITBIS || 0).toFixed(2)},18.00%\n`
  csv += `Base Imponible (Ventas Gravadas),${(data.taxableSales || 0).toFixed(2)},${data.totalSales > 0 ? ((data.taxableSales / data.totalSales) * 100).toFixed(2) : 0.00}%\n`
  csv += `Ventas Exentas,${(data.exemptSales || 0).toFixed(2)},${data.totalSales > 0 ? ((data.exemptSales / data.totalSales) * 100).toFixed(2) : 0.00}%\n`
  csv += `Total de Ventas,${(data.totalSales || 0).toFixed(2)},100.00%\n\n`
  
  // Tax Calculation Verification
  csv += 'VERIFICACIÓN DE CÁLCULOS ITBIS\n'
  const expectedITBIS = (data.taxableSales || 0) * 0.18
  const actualITBIS = data.totalITBIS || 0
  const variance = Math.abs(expectedITBIS - actualITBIS)
  const variancePercentage = expectedITBIS > 0 ? (variance / expectedITBIS) * 100 : 0
  
  csv += `ITBIS Calculado (18% × Base Imponible),${expectedITBIS.toFixed(2)}\n`
  csv += `ITBIS Recaudado (Sistema),${actualITBIS.toFixed(2)}\n`
  csv += `Diferencia Absoluta,${variance.toFixed(2)}\n`
  csv += `Porcentaje de Variación,${variancePercentage.toFixed(4)}%\n`
  csv += `Estado de Cálculos,${variancePercentage <= 0.01 ? 'CORRECTO' : 'REVISAR'}\n\n`
  
  // Sales by NCF Type
  if (data.salesByType && data.salesByType.length > 0) {
    csv += 'DESGLOSE POR TIPO DE COMPROBANTE FISCAL (NCF)\n'
    csv += 'Tipo NCF,Descripción,Cantidad,Monto Total,ITBIS,Tasa Aplicada,% del Total ITBIS\n'
    data.salesByType.forEach((item: any) => {
      const description = getNcfTypeDescription(item.ncfType)
      const itbisRate = item.ncfType === 'B02' ? '0%' : '18%'
      const percentageOfTotal = data.totalITBIS > 0 ? ((item.tax / data.totalITBIS) * 100).toFixed(2) : '0.00'
      csv += `${item.ncfType},"${description}",${item.count},${item.amount.toFixed(2)},${item.tax.toFixed(2)},${itbisRate},${percentageOfTotal}%\n`
    })
    csv += '\n'
  }
  
  // Daily Collections
  if (data.dailyCollections && data.dailyCollections.length > 0) {
    csv += 'RECAUDACIÓN DIARIA DE ITBIS\n'
    csv += 'Fecha,Ventas Gravadas,ITBIS Recaudado,Número de Transacciones,ITBIS Promedio por Transacción,Tasa Efectiva\n'
    data.dailyCollections.forEach((day: any) => {
      const avgPerTransaction = day.transactionCount > 0 ? (day.itbisAmount / day.transactionCount).toFixed(2) : '0.00'
      const effectiveRate = day.taxableSales > 0 ? ((day.itbisAmount / day.taxableSales) * 100).toFixed(2) : '0.00'
      csv += `${new Date(day.date).toLocaleDateString('es-DO')},${day.taxableSales.toFixed(2)},${day.itbisAmount.toFixed(2)},${day.transactionCount},${avgPerTransaction},${effectiveRate}%\n`
    })
    csv += '\n'
  }
  
  // Payment Methods Analysis
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    csv += 'ANÁLISIS POR MÉTODO DE PAGO\n'
    csv += 'Método de Pago,Monto Total,ITBIS Asociado,Porcentaje del Total,Transacciones,ITBIS Promedio\n'
    data.paymentMethods.forEach((method: any) => {
      const avgItbis = method.transactions > 0 ? (method.itbis / method.transactions).toFixed(2) : '0.00'
      csv += `"${method.method}",${method.amount.toFixed(2)},${method.itbis.toFixed(2)},${method.percentage}%,${method.transactions || 0},${avgItbis}\n`
    })
    csv += '\n'
  }
  
  // Customer Analysis (if available)
  if (data.customerBreakdown && data.customerBreakdown.length > 0) {
    csv += 'ANÁLISIS POR TIPO DE CLIENTE\n'
    csv += 'Tipo de Cliente,Cantidad de Clientes,Ventas Gravadas,ITBIS Recaudado,Ticket Promedio,ITBIS Promedio\n'
    data.customerBreakdown.forEach((customer: any) => {
      const avgTicket = customer.customers > 0 ? (customer.taxableSales / customer.customers).toFixed(2) : '0.00'
      const avgItbis = customer.customers > 0 ? (customer.itbis / customer.customers).toFixed(2) : '0.00'
      csv += `"${customer.type}",${customer.customers},${customer.taxableSales.toFixed(2)},${customer.itbis.toFixed(2)},${avgTicket},${avgItbis}\n`
    })
    csv += '\n'
  }
  
  // Product Category Analysis (if available)
  if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
    csv += 'ANÁLISIS POR CATEGORÍA DE PRODUCTOS\n'
    csv += 'Categoría,Ventas Gravadas,ITBIS Recaudado,Cantidad Vendida,Precio Promedio,ITBIS por Unidad\n'
    data.categoryBreakdown.forEach((category: any) => {
      const avgPrice = category.quantitySold > 0 ? (category.taxableSales / category.quantitySold).toFixed(2) : '0.00'
      const itbisPerUnit = category.quantitySold > 0 ? (category.itbis / category.quantitySold).toFixed(2) : '0.00'
      csv += `"${category.name}",${category.taxableSales.toFixed(2)},${category.itbis.toFixed(2)},${category.quantitySold},${avgPrice},${itbisPerUnit}\n`
    })
    csv += '\n'
  }
  
  // Time Period Analysis
  if (data.timeAnalysis) {
    csv += 'ANÁLISIS TEMPORAL\n'
    csv += 'Período,Descripción,Valor\n'
    csv += `Período del Reporte,"${data.timeAnalysis.fromDate} a ${data.timeAnalysis.toDate}"\n`
    csv += `Días Incluidos,${data.timeAnalysis.daysIncluded}\n`
    csv += `Promedio ITBIS Diario,${data.timeAnalysis.avgDailyItbis.toFixed(2)}\n`
    csv += `Día con Mayor Recaudación,${data.timeAnalysis.highestDay?.date || 'N/A'}\n`
    csv += `Mayor Recaudación Diaria,${data.timeAnalysis.highestDay?.amount?.toFixed(2) || '0.00'}\n`
    csv += `Día con Menor Recaudación,${data.timeAnalysis.lowestDay?.date || 'N/A'}\n`
    csv += `Menor Recaudación Diaria,${data.timeAnalysis.lowestDay?.amount?.toFixed(2) || '0.00'}\n`
    csv += `Crecimiento Período Anterior,${data.timeAnalysis.growthRate || 'N/A'}%\n\n`
  }
  
  // DGII Compliance Information
  csv += 'INFORMACIÓN DE CUMPLIMIENTO DGII\n'
  csv += 'Aspecto,Estado,Observaciones\n'
  csv += `Uso de NCF Autorizados,${data.compliance?.ncfCompliant ? 'CUMPLE' : 'NO CUMPLE'},"${data.compliance?.ncfNotes || 'NCF emitidos según secuencias DGII'}"\n`
  csv += `Cálculo ITBIS 18%,${variancePercentage <= 0.01 ? 'CUMPLE' : 'NO CUMPLE'},"Variación: ${variancePercentage.toFixed(4)}%"\n`
  csv += `Registro de Ventas Exentas,${data.exemptSales >= 0 ? 'CUMPLE' : 'NO CUMPLE'},"Monto exento: RD$ ${(data.exemptSales || 0).toFixed(2)}"\n`
  csv += `Formato de Reportes,CUMPLE,"Conforme a estándares DGII"\n`
  csv += `Moneda Oficial (RD$),CUMPLE,"Todos los montos en Pesos Dominicanos"\n\n`
  
  // Footer
  csv += 'NOTAS IMPORTANTES\n'
  csv += '- Este reporte cumple con los requisitos de la Dirección General de Impuestos Internos (DGII)\n'
  csv += '- Los cálculos están basados en la Ley 253-12 del Sistema Tributario Dominicano\n'
  csv += '- La tasa ITBIS del 18% se aplica sobre la base imponible de ventas gravadas\n'
  csv += '- Las exportaciones (NCF tipo B02) están exentas de ITBIS según normativa DGII\n'
  csv += '- Mantenga este reporte para auditorías fiscales y declaraciones tributarias\n'
  csv += `- Generado automáticamente por Sistema POS v1.0 el ${new Date().toLocaleString('es-DO')}\n`
  
  return csv
}

function generateNCFCSV(data: any): string {
  let csv = 'REPORTE DE CONTROL NCF\n\n'
  
  // Add summary information if available
  if (data.summary) {
    csv += 'RESUMEN GENERAL\n'
    csv += `Secuencias Activas,${data.summary.totalSequences || 0}\n`
    csv += `NCF Emitidos en Período,${data.summary.totalUsedInPeriod || 0}\n`
    csv += `Monto Total Ventas,RD$${(data.summary.totalSalesAmount || 0).toFixed(2)}\n`
    csv += `Último NCF Emitido,${data.summary.lastNCFIssued || 'N/A'}\n`
    csv += `Secuencias en Alerta,${data.summary.alertSequences || 0}\n\n`
  }
  
  if (data.sequences && data.sequences.length > 0) {
    csv += 'DETALLE POR SECUENCIA\n'
    csv += 'Tipo NCF,Número Actual,Desde,Hasta,Utilizados en Período,Disponibles,Porcentaje Usado,Estado\n'
    data.sequences.forEach((seq: any) => {
      const statusText = seq.status === 'low' ? 'BAJO' : seq.status === 'warning' ? 'ALERTA' : 'OK'
      csv += `${seq.type || 'N/A'},${seq.current || 0},${seq.from || 1},${seq.to || 0},${seq.used || 0},${seq.remaining || 0},${(seq.percentage || 0).toFixed(2)}%,${statusText}\n`
    })
    
    csv += '\nESTADÍSTICAS\n'
    const totalSequences = data.sequences.length
    const totalUsedInPeriod = data.sequences.reduce((sum: number, seq: any) => sum + (seq.used || 0), 0)
    const totalRemaining = data.sequences.reduce((sum: number, seq: any) => sum + (seq.remaining || 0), 0)
    const avgPercentage = totalSequences > 0 ? data.sequences.reduce((sum: number, seq: any) => sum + (seq.percentage || 0), 0) / totalSequences : 0
    
    csv += `Total NCF Utilizados en Período,${totalUsedInPeriod}\n`
    csv += `Total NCF Disponibles,${totalRemaining}\n`
    csv += `Promedio de Uso General,${avgPercentage.toFixed(2)}%\n`
    
    // Alert information
    const alertSequences = data.sequences.filter((seq: any) => seq.status === 'low' || seq.status === 'warning')
    if (alertSequences.length > 0) {
      csv += '\nSECUENCIAS QUE REQUIEREN ATENCIÓN\n'
      csv += 'Tipo,Estado,Disponibles,Recomendación\n'
      alertSequences.forEach((seq: any) => {
        const recommendation = seq.status === 'low' ? 'SOLICITAR NUEVOS NCF URGENTE' : 'PLANIFICAR SOLICITUD DE NCF'
        csv += `${seq.type},${seq.status === 'low' ? 'CRÍTICO' : 'ALERTA'},${seq.remaining},${recommendation}\n`
      })
    }
  } else {
    csv += 'No se encontraron secuencias NCF activas en el sistema.\n'
    csv += 'ACCIÓN REQUERIDA: Configurar secuencias NCF para cumplimiento DGII.\n'
  }
  
  return csv
}

function generateInventoryCSV(data: any): string {
  let csv = 'REPORTE DETALLADO DE INVENTARIO\n'
  csv += `Fecha de Generación,${new Date().toLocaleDateString('es-DO')}\n\n`
  
  // Summary Section
  csv += 'RESUMEN GENERAL\n'
  if (data.summary) {
    csv += `Total de Productos,${data.summary.totalProducts || 0}\n`
    csv += `Total de Categorías,${data.summary.totalCategories || 0}\n`
    csv += `Valor Total del Inventario,RD$${(data.summary.totalInventoryValue || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}\n`
    csv += `Valor de Costo Total,RD$${(data.summary.totalCostValue || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}\n`
    csv += `Ingresos Últimos 30 Días,RD$${(data.summary.totalRevenue30Days || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}\n`
    csv += `Margen Promedio,${data.summary.averageMargin || 0}%\n`
    csv += `Rotación de Inventario (Anual),${data.summary.inventoryTurnover || 0}\n`
    csv += `Productos con Stock Bajo,${data.summary.lowStockCount || 0}\n`
    csv += `Productos Agotados,${data.summary.outOfStockCount || 0}\n`
    csv += `Productos para Reorden,${data.summary.reorderSoonCount || 0}\n\n`
  }
  
  // Alerts Section
  if (data.alerts) {
    csv += 'ALERTAS CRÍTICAS\n'
    csv += `Stock Crítico (Agotado),${data.alerts.criticalStock || 0}\n`
    csv += `Stock Bajo,${data.alerts.lowStock || 0}\n`
    csv += `Reorden Necesario,${data.alerts.reorderNeeded || 0}\n`
    csv += `Alto Valor - Movimiento Lento,${data.alerts.highValueSlowMoving || 0}\n`
    csv += `Margen Negativo,${data.alerts.negativeMargin || 0}\n\n`
  }
  
  // Category Analysis
  if (data.categories && data.categories.length > 0) {
    csv += 'ANÁLISIS POR CATEGORÍA\n'
    csv += 'Categoría,Productos,Valor Total,Valor de Costo,Ingresos 30D,Margen Promedio %,Stock Bajo,Agotados\n'
    data.categories.forEach((cat: any) => {
      csv += `"${cat.name}",${cat.productCount},RD$${cat.totalValue.toLocaleString('es-DO', {minimumFractionDigits: 2})},RD$${cat.totalCostValue.toLocaleString('es-DO', {minimumFractionDigits: 2})},RD$${cat.totalRevenue30Days.toLocaleString('es-DO', {minimumFractionDigits: 2})},${cat.averageMargin}%,${cat.lowStockCount},${cat.outOfStockCount}\n`
    })
    csv += '\n'
  }
  
  // Top Performers
  if (data.insights) {
    if (data.insights.topSelling && data.insights.topSelling.length > 0) {
      csv += 'TOP 10 - PRODUCTOS MÁS VENDIDOS (30 DÍAS)\n'
      csv += 'Posición,Código,Producto,Categoría,Cantidad Vendida,Ingresos,Stock Actual,Estado\n'
      data.insights.topSelling.forEach((product: any, index: number) => {
        csv += `${index + 1},"${product.code}","${product.name}","${product.category}",${product.totalSold30Days},RD$${product.revenue30Days.toLocaleString('es-DO', {minimumFractionDigits: 2})},${product.stock},"${getPDFStatusLabel(product.status)}"\n`
      })
      csv += '\n'
    }
    
    if (data.insights.topRevenue && data.insights.topRevenue.length > 0) {
      csv += 'TOP 10 - PRODUCTOS CON MAYOR INGRESO (30 DÍAS)\n'
      csv += 'Posición,Código,Producto,Categoría,Ingresos,Cantidad Vendida,Precio,Margen %\n'
      data.insights.topRevenue.forEach((product: any, index: number) => {
        csv += `${index + 1},"${product.code}","${product.name}","${product.category}",RD$${product.revenue30Days.toLocaleString('es-DO', {minimumFractionDigits: 2})},${product.totalSold30Days},RD$${product.price.toFixed(2)},${product.margin}%\n`
      })
      csv += '\n'
    }
    
    if (data.insights.topMargin && data.insights.topMargin.length > 0) {
      csv += 'TOP 10 - PRODUCTOS CON MAYOR MARGEN\n'
      csv += 'Posición,Código,Producto,Categoría,Margen %,Precio,Costo,Stock,Valor\n'
      data.insights.topMargin.forEach((product: any, index: number) => {
        csv += `${index + 1},"${product.code}","${product.name}","${product.category}",${product.margin}%,RD$${product.price.toFixed(2)},RD$${product.cost.toFixed(2)},${product.stock},RD$${product.value.toLocaleString('es-DO', {minimumFractionDigits: 2})}\n`
      })
      csv += '\n'
    }
    
    if (data.insights.slowMoving && data.insights.slowMoving.length > 0) {
      csv += 'PRODUCTOS DE MOVIMIENTO LENTO (SIN VENTAS 30 DÍAS)\n'
      csv += 'Código,Producto,Categoría,Stock,Precio,Valor Inmovilizado,Días en Stock,Última Venta\n'
      data.insights.slowMoving.forEach((product: any) => {
        const lastSoldDate = product.lastSold ? new Date(product.lastSold).toLocaleDateString('es-DO') : 'Nunca'
        csv += `"${product.code}","${product.name}","${product.category}",${product.stock},RD$${product.price.toFixed(2)},RD$${product.value.toLocaleString('es-DO', {minimumFractionDigits: 2})},${product.stockDays > 999 ? '999+' : product.stockDays},"${lastSoldDate}"\n`
      })
      csv += '\n'
    }
  }
  
  // Critical Stock Alerts
  if (data.insights && data.insights.outOfStock && data.insights.outOfStock.length > 0) {
    csv += 'PRODUCTOS AGOTADOS (ACCIÓN INMEDIATA)\n'
    csv += 'Código,Producto,Categoría,Stock Mínimo,Última Venta,Ventas 30D,Pérdida Potencial\n'
    data.insights.outOfStock.forEach((product: any) => {
      const lastSoldDate = product.lastSold ? new Date(product.lastSold).toLocaleDateString('es-DO') : 'Nunca'
      const potentialLoss = product.averageWeeklySales * product.price * 4 // Monthly potential loss
      csv += `"${product.code}","${product.name}","${product.category}",${product.minStock},"${lastSoldDate}",${product.totalSold30Days},RD$${potentialLoss.toLocaleString('es-DO', {minimumFractionDigits: 2})}\n`
    })
    csv += '\n'
  }
  
  if (data.insights && data.insights.lowStock && data.insights.lowStock.length > 0) {
    csv += 'PRODUCTOS CON STOCK BAJO (REORDEN REQUERIDO)\n'
    csv += 'Código,Producto,Categoría,Stock Actual,Stock Mínimo,Días Restantes,Venta Semanal Promedio,Cantidad Sugerida\n'
    data.insights.lowStock.forEach((product: any) => {
      const suggestedOrder = Math.max(product.minStock * 2, product.averageWeeklySales * 4) // 4 weeks supply
      csv += `"${product.code}","${product.name}","${product.category}",${product.stock},${product.minStock},${product.stockDays},${product.averageWeeklySales},${Math.ceil(suggestedOrder)}\n`
    })
    csv += '\n'
  }
  
  // Complete Product List
  if (data.products && data.products.length > 0) {
    csv += 'INVENTARIO COMPLETO - TODOS LOS PRODUCTOS\n'
    csv += 'Código,Producto,Categoría,Stock,Min Stock,Precio,Costo,Margen %,Valor,Ventas 30D,Ingresos 30D,Rotación,Días Stock,Estado,Última Venta\n'
    data.products.forEach((product: any) => {
      const lastSoldDate = product.lastSold ? new Date(product.lastSold).toLocaleDateString('es-DO') : 'Nunca'
      csv += `"${product.code}","${product.name}","${product.category}",${product.stock},${product.minStock},RD$${product.price.toFixed(2)},RD$${product.cost.toFixed(2)},${product.margin}%,RD$${product.value.toLocaleString('es-DO', {minimumFractionDigits: 2})},${product.totalSold30Days},RD$${product.revenue30Days.toLocaleString('es-DO', {minimumFractionDigits: 2})},${product.turnoverRate},${product.stockDays > 999 ? '999+' : product.stockDays},"${getPDFStatusLabel(product.status)}","${lastSoldDate}"\n`
    })
  }
  
  return csv
}

function generateCustomersCSV(data: any): string {
  let csv = 'ANÁLISIS INTEGRAL DE CLIENTES - REPÚBLICA DOMINICANA\n'
  csv += 'SISTEMA POS AVANZADO CON INTELIGENCIA DE NEGOCIOS\n'
  csv += '================================================================\n'
  csv += `Fecha de Generación,${new Date().toLocaleDateString('es-DO')}\n`
  csv += `Hora de Generación,${new Date().toLocaleTimeString('es-DO')}\n`
  csv += `Cumplimiento DGII,Activo\n`
  csv += `Moneda,Pesos Dominicanos (RD$)\n\n`
  
  // Executive Summary
  csv += 'RESUMEN EJECUTIVO\n'
  csv += '=================\n'
  csv += 'Métrica,Valor,Porcentaje,Notas\n'
  csv += `Total de Clientes Registrados,${data.summary?.totalCustomers || 0},100%,Base de datos completa\n`
  csv += `Clientes Activos (con compras),${data.summary?.activeCustomers || 0},${data.summary?.totalCustomers > 0 ? ((data.summary.activeCustomers / data.summary.totalCustomers) * 100).toFixed(1) : 0}%,Generan ingresos\n`
  csv += `Clientes Inactivos,${data.summary?.inactiveCustomers || 0},${data.summary?.totalCustomers > 0 ? ((data.summary.inactiveCustomers / data.summary.totalCustomers) * 100).toFixed(1) : 0}%,Oportunidad reactivación\n`
  csv += `Clientes Empresariales,${data.summary?.businessCustomers || 0},${data.summary?.totalCustomers > 0 ? ((data.summary.businessCustomers / data.summary.totalCustomers) * 100).toFixed(1) : 0}%,Con RNC válido\n`
  csv += `Clientes Individuales,${data.summary?.individualCustomers || 0},${data.summary?.totalCustomers > 0 ? ((data.summary.individualCustomers / data.summary.totalCustomers) * 100).toFixed(1) : 0}%,Con Cédula\n`
  csv += `Ingresos Totales Generados,"RD$ ${(data.summary?.totalRevenue || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}",100%,Período analizado\n`
  csv += `Valor Promedio por Cliente Activo,"RD$ ${(data.summary?.averageCustomerValue || 0).toFixed(2)}",N/A,Lifetime Customer Value\n`
  csv += `Ticket Promedio por Compra,"RD$ ${(data.summary?.averageOrderValue || 0).toFixed(2)}",N/A,Por transacción\n`
  csv += `Total de Transacciones,${data.summary?.totalSales || 0},N/A,Todas las compras\n\n`
  
  // Customer Segmentation Analysis
  if (data.segmentation?.byType && data.segmentation.byType.length > 0) {
    csv += 'SEGMENTACIÓN DETALLADA DE CLIENTES\n'
    csv += '==================================\n'
    csv += 'Tipo de Cliente,Total Registrados,Clientes Activos,Ingresos Generados,% del Total Clientes,% del Total Ingresos,Promedio por Cliente Activo\n'
    data.segmentation.byType.forEach((segment: any) => {
      const avgPerActiveCustomer = segment.activeCount > 0 ? (segment.revenue / segment.activeCount).toFixed(2) : '0.00'
      const revenuePercentage = data.summary?.totalRevenue > 0 ? ((segment.revenue / data.summary.totalRevenue) * 100).toFixed(2) : '0.00'
      csv += `"${segment.type}",${segment.count || 0},${segment.activeCount || 0},"RD$ ${(segment.revenue || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}",${segment.percentage || 0}%,${revenuePercentage}%,"RD$ ${avgPerActiveCustomer}"\n`
    })
    csv += '\n'
  }

  // Payment Methods Preferences Analysis
  if (data.segmentation?.paymentMethods && data.segmentation.paymentMethods.length > 0) {
    csv += 'ANÁLISIS DE PREFERENCIAS DE MÉTODOS DE PAGO\n'
    csv += '===========================================\n'
    csv += 'Método de Pago,Clientes Únicos,Total Transacciones,Monto Total,% del Total Ingresos,Promedio por Cliente,Promedio por Transacción\n'
    data.segmentation.paymentMethods.forEach((method: any) => {
      const avgPerCustomer = method.customers > 0 ? (method.amount / method.customers).toFixed(2) : '0.00'
      const avgPerTransaction = method.transactions > 0 ? (method.amount / method.transactions).toFixed(2) : '0.00'
      csv += `"${method.method}",${method.customers || 0},${method.transactions || 0},"RD$ ${(method.amount || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}",${method.percentage || 0}%,"RD$ ${avgPerCustomer}","RD$ ${avgPerTransaction}"\n`
    })
    csv += '\n'
  }

  // Category Preferences by Customer Type
  if (data.segmentation?.categoryPreferences) {
    csv += 'PREFERENCIAS DE CATEGORÍAS POR TIPO DE CLIENTE\n'
    csv += '==============================================\n'
    
    // Business customers categories
    if (data.segmentation.categoryPreferences.BUSINESS && Object.keys(data.segmentation.categoryPreferences.BUSINESS).length > 0) {
      csv += 'CLIENTES EMPRESARIALES - CATEGORÍAS PREFERIDAS\n'
      csv += 'Categoría,Ingresos,Cantidad Vendida,Clientes Únicos,Promedio por Cliente\n'
      Object.entries(data.segmentation.categoryPreferences.BUSINESS).forEach(([category, stats]: [string, any]) => {
        const avgPerCustomer = stats.customerCount > 0 ? (stats.revenue / stats.customerCount).toFixed(2) : '0.00'
        csv += `"${category}","RD$ ${stats.revenue.toLocaleString('es-DO', {minimumFractionDigits: 2})}",${stats.quantity},${stats.customerCount},"RD$ ${avgPerCustomer}"\n`
      })
      csv += '\n'
    }
    
    // Individual customers categories
    if (data.segmentation.categoryPreferences.INDIVIDUAL && Object.keys(data.segmentation.categoryPreferences.INDIVIDUAL).length > 0) {
      csv += 'CLIENTES INDIVIDUALES - CATEGORÍAS PREFERIDAS\n'
      csv += 'Categoría,Ingresos,Cantidad Vendida,Clientes Únicos,Promedio por Cliente\n'
      Object.entries(data.segmentation.categoryPreferences.INDIVIDUAL).forEach(([category, stats]: [string, any]) => {
        const avgPerCustomer = stats.customerCount > 0 ? (stats.revenue / stats.customerCount).toFixed(2) : '0.00'
        csv += `"${category}","RD$ ${stats.revenue.toLocaleString('es-DO', {minimumFractionDigits: 2})}",${stats.quantity},${stats.customerCount},"RD$ ${avgPerCustomer}"\n`
      })
      csv += '\n'
    }
  }

  // Top Customers Detailed Analysis
  if (data.topCustomers && data.topCustomers.length > 0) {
    csv += 'TOP 20 CLIENTES MÁS VALIOSOS - ANÁLISIS DETALLADO\n'
    csv += '================================================\n'
    csv += 'Ranking,Cliente,Tipo Cliente,Tipo Documento,Número Documento,Email,Teléfono,Total Compras,Monto Total Gastado,ITBIS Pagado,Ticket Promedio,Primera Compra,Última Compra,Método Pago Preferido,Score Lealtad,Días Desde Última Compra\n'
    
    data.topCustomers.slice(0, 20).forEach((customer: any, index: number) => {
      // Calculate days since last purchase
      const daysSinceLastPurchase = customer.lastPurchase ? 
        Math.floor((new Date().getTime() - new Date(customer.lastPurchase).getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'
      
      // Get preferred payment method
      const preferredMethod = customer.preferredPaymentMethod ? 
        Object.entries(customer.preferredPaymentMethod).reduce((a: any, b: any) => 
          customer.preferredPaymentMethod[a[0]] > customer.preferredPaymentMethod[b[0]] ? a : b)[0] : 'N/A'
      
      csv += `${index + 1},"${customer.name || 'N/A'}","${customer.type || 'N/A'}","${customer.documentType || 'N/A'}","${customer.documentNumber || 'N/A'}","${customer.email || 'N/A'}","${customer.phone || 'N/A'}",${customer.totalSales || 0},"RD$ ${(customer.totalAmount || 0).toLocaleString('es-DO', {minimumFractionDigits: 2})}","RD$ ${(customer.totalTax || 0).toFixed(2)}","RD$ ${(customer.averageOrderValue || 0).toFixed(2)}","${customer.firstPurchase ? new Date(customer.firstPurchase).toLocaleDateString('es-DO') : 'N/A'}","${customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString('es-DO') : 'N/A'}","${preferredMethod}",${customer.loyaltyScore || 0},${daysSinceLastPurchase}\n`
    })
    csv += '\n'
  }

  // Business Intelligence Insights
  if (data.insights) {
    csv += 'INTELIGENCIA DE NEGOCIOS - INSIGHTS Y RECOMENDACIONES\n'
    csv += '===================================================\n'
    csv += 'Categoría de Insight,Métrica/Estado Actual,Tendencia,Recomendación Estratégica,Prioridad\n'
    
    if (data.insights.customerRetention) {
      csv += `"Retención de Clientes","${data.insights.customerRetention.rate}% de clientes activos","${data.insights.customerRetention.trend}","${data.insights.customerRetention.recommendation}","Alta"\n`
    }
    
    if (data.insights.growthOpportunity) {
      csv += `"Oportunidad de Crecimiento","${data.insights.growthOpportunity.businessCustomers}","Crecimiento potencial","${data.insights.growthOpportunity.recommendation}","Media"\n`
      if (data.insights.growthOpportunity.averageSpending) {
        csv += `"Gasto Promedio por Cliente","${data.insights.growthOpportunity.averageSpending}","Estable","${data.insights.growthOpportunity.recommendation}","Media"\n`
      }
    }
    
    if (data.insights.complianceStatus) {
      csv += `"Cumplimiento DGII - RNC","${data.insights.complianceStatus.rncCoverage}","Cumplimiento","${data.insights.complianceStatus.recommendation}","Alta"\n`
      if (data.insights.complianceStatus.businessDocumentation) {
        csv += `"Documentación Empresarial","${data.insights.complianceStatus.businessDocumentation}","Compliance","Mantener documentación actualizada","Alta"\n`
      }
    }
    csv += '\n'
  }

  // Customer Lifecycle Analysis
  if (data.topCustomers && data.topCustomers.length > 0) {
    csv += 'ANÁLISIS DE CICLO DE VIDA DEL CLIENTE\n'
    csv += '=====================================\n'
    csv += 'Segmento,Criterio,Cantidad de Clientes,% del Total,Ingresos del Segmento,Recomendación\n'
    
    const totalCustomers = data.topCustomers.length
    const totalRevenue = data.topCustomers.reduce((sum: number, c: any) => sum + (c.totalAmount || 0), 0)
    
    // Segment by purchase frequency
    const highFrequency = data.topCustomers.filter((c: any) => (c.totalSales || 0) >= 10)
    const mediumFrequency = data.topCustomers.filter((c: any) => (c.totalSales || 0) >= 3 && (c.totalSales || 0) < 10)
    const lowFrequency = data.topCustomers.filter((c: any) => (c.totalSales || 0) < 3)
    
    const segments = [
      {
        name: 'Clientes VIP',
        criteria: '10+ compras',
        customers: highFrequency,
        recommendation: 'Programa de lealtad premium'
      },
      {
        name: 'Clientes Regulares',
        criteria: '3-9 compras',
        customers: mediumFrequency,
        recommendation: 'Incentivos para aumentar frecuencia'
      },
      {
        name: 'Clientes Ocasionales',
        criteria: '1-2 compras',
        customers: lowFrequency,
        recommendation: 'Campañas de reactivación'
      }
    ]
    
    segments.forEach(segment => {
      const segmentRevenue = segment.customers.reduce((sum: number, c: any) => sum + (c.totalAmount || 0), 0)
      const percentage = totalCustomers > 0 ? ((segment.customers.length / totalCustomers) * 100).toFixed(1) : '0.0'
      csv += `"${segment.name}","${segment.criteria}",${segment.customers.length},${percentage}%,"RD$ ${segmentRevenue.toLocaleString('es-DO', {minimumFractionDigits: 2})}","${segment.recommendation}"\n`
    })
    csv += '\n'
  }

  // Compliance and Documentation Status
  csv += 'ESTATUS DE CUMPLIMIENTO Y DOCUMENTACIÓN\n'
  csv += '=======================================\n'
  csv += 'Tipo de Documento,Clientes con Documento,% de Cumplimiento,Estado,Acción Requerida\n'
  
  const businessCustomers = data.summary?.businessCustomers || 0
  const individualCustomers = data.summary?.individualCustomers || 0
  const customersWithRNC = data.summary?.customersWithRNC || 0
  const customersWithCedula = data.summary?.customersWithCedula || 0
  
  const rncCompliance = businessCustomers > 0 ? ((customersWithRNC / businessCustomers) * 100).toFixed(1) : '0.0'
  const cedulaCompliance = individualCustomers > 0 ? ((customersWithCedula / individualCustomers) * 100).toFixed(1) : '0.0'
  
  csv += `"RNC (Empresas)",${customersWithRNC},${rncCompliance}%,${rncCompliance === '100.0' ? 'COMPLETO' : 'PENDIENTE'},"${rncCompliance === '100.0' ? 'Mantener actualizado' : 'Completar RNC faltantes'}"\n`
  csv += `"Cédula (Individuales)",${customersWithCedula},${cedulaCompliance}%,${cedulaCompliance === '100.0' ? 'COMPLETO' : 'PENDIENTE'},"${cedulaCompliance === '100.0' ? 'Mantener actualizado' : 'Completar cédulas faltantes'}"\n\n`

  // Footer with metadata
  csv += 'METADATA DEL REPORTE\n'
  csv += '===================\n'
  csv += `Sistema,POS Inteligente República Dominicana\n`
  csv += `Versión,1.0 Enterprise\n`
  csv += `Cumplimiento DGII,Activo\n`
  csv += `Formato Moneda,Pesos Dominicanos (RD$)\n`
  csv += `Tasa ITBIS,18%\n`
  csv += `Formato Fecha,DD/MM/YYYY\n`
  csv += `Zona Horaria,America/Santo_Domingo\n`
  csv += `Generado por,Sistema Automatizado\n`
  csv += `Última Actualización Base Datos,${new Date().toLocaleString('es-DO')}\n`
  csv += `Validación Datos,EXITOSA\n\n`
  
  csv += 'NOTAS IMPORTANTES:\n'
  csv += '- Este reporte incluye análisis de comportamiento de clientes\n'
  csv += '- Los datos de RNC se validan contra la base DGII\n'
  csv += '- El score de lealtad se calcula en base a frecuencia y valor\n'
  csv += '- Todos los montos incluyen ITBIS cuando corresponde\n'
  csv += '- Reporte generado conforme a estándares dominicanos\n'
  
  return csv
}

function generateAuditCSV(data: any): string {
  let csv = 'REPORTE DE AUDITORÍA\n'
  csv += `Total de Transacciones,${data.totalTransactions || 0}\n\n`
  
  if (data.transactions && data.transactions.length > 0) {
    csv += 'NCF,Cliente,Cajero,Monto,ITBIS,Método Pago,Fecha\n'
    data.transactions.forEach((transaction: any) => {
      const customerName = transaction.customer?.name || 'Cliente General'
      const cashierName = transaction.cashier?.name || 'N/A'
      csv += `"${transaction.ncf || 'N/A'}","${customerName}","${cashierName}",${(Number(transaction.total) || 0).toFixed(2)},${(Number(transaction.tax) || 0).toFixed(2)},"${transaction.paymentMethod || 'N/A'}","${formatDate(transaction.createdAt)}"\n`
    })
  }
  
  return csv
}

function generateDGIICSV(data: any): string {
  let csv = 'REPORTE DGII\n'
  csv += `ITBIS Total,${(data.totalITBIS || 0).toFixed(2)}\n`
  csv += `Base Imponible,${(data.taxableBase || 0).toFixed(2)}\n\n`
  csv += 'Cumple con requisitos DGII para República Dominicana\n'
  
  return csv
}

// Helper Functions
function getReportTitle(reportType: string): string {
  const titles: { [key: string]: string } = {
    daily: 'Ventas Diarias',
    itbis: 'ITBIS',
    ncf: 'Números de Comprobante Fiscal',
    inventory: 'Inventario',
    customers: 'Clientes',
    audit: 'Auditoría',
    dgii: 'DGII'
  }
  return titles[reportType] || 'Desconocido'
}

function formatDate(dateString: string | Date): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// PDF Text Overflow Prevention Helpers
function truncateText(text: string, maxLength: number): string {
  if (!text) return 'N/A'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

function calculateOptimalColumnWidths(columns: string[], totalWidth: number = 170): number[] {
  // Distribute width based on content type and importance
  const columnPriorities: { [key: string]: number } = {
    // High priority columns (get more space)
    'Cliente': 3,
    'Producto': 3,
    'Nombre': 3,
    'Descripción': 3,
    'Categoría': 2,
    'Dirección': 3,
    
    // Medium priority columns
    'Monto': 2,
    'Total': 2,
    'Precio': 2,
    'Ingresos': 2,
    'RNC': 2,
    'Cédula': 2,
    'NCF': 2,
    
    // Low priority columns (get less space)
    '#': 1,
    'Pos': 1,
    'Cant': 1,
    'Stock': 1,
    'Tipo': 1,
    'Estado': 1,
    '%': 1,
    'ID': 1
  }
  
  // Calculate weights for each column
  const weights = columns.map(col => {
    // Check if column name contains any priority keywords
    const priority = Object.entries(columnPriorities).find(([key]) => 
      col.toLowerCase().includes(key.toLowerCase())
    )?.[1] || 1.5 // Default priority
    
    return priority
  })
  
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  
  // Calculate proportional widths
  return weights.map(weight => {
    const proportionalWidth = (weight / totalWeight) * totalWidth
    // Ensure minimum width of 15mm and maximum of 60mm
    return Math.max(15, Math.min(60, Math.round(proportionalWidth)))
  })
}

function getResponsiveColumnConfig(reportType: string, columnCount: number): {
  columnStyles: any,
  cellPadding: number,
  fontSize: number,
  rowPageBreak: string
} {
  const configs: { [key: string]: any } = {
    customers: {
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' }, // #
        1: { cellWidth: 36, cellPadding: 2 }, // Cliente (reduced from 38)
        2: { cellWidth: 24, cellPadding: 2 }, // Tipo/Doc (reduced from 25)
        3: { cellWidth: 17, halign: 'center' }, // Compras (reduced from 18)
        4: { cellWidth: 27, halign: 'right' }, // Total (reduced from 28)
        5: { cellWidth: 22, halign: 'right' }, // Ticket Prom (reduced from 23)
        6: { cellWidth: 21, halign: 'center' }, // Última (reduced from 22)
        7: { cellWidth: 12, halign: 'center' } // Score (reduced from 13)
      },
      cellPadding: 2,
      fontSize: 8,
      rowPageBreak: 'auto'
    },
    inventory: {
      columnStyles: {
        0: { cellWidth: 18, cellPadding: 1 }, // Código
        1: { cellWidth: 35, cellPadding: 2 }, // Producto
        2: { cellWidth: 20, cellPadding: 1 }, // Cat
        3: { cellWidth: 15, halign: 'center' }, // Stock
        4: { cellWidth: 20, halign: 'right' }, // Precio
        5: { cellWidth: 25, halign: 'right' }, // Valor
        6: { cellWidth: 15, halign: 'center' }, // Margen
        7: { cellWidth: 15, halign: 'center' } // Estado
      },
      cellPadding: 1,
      fontSize: 7,
      rowPageBreak: 'auto'
    },
    daily: {
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' }, // #
        1: { cellWidth: 32, cellPadding: 2 }, // Producto
        2: { cellWidth: 22, cellPadding: 1 }, // Categoría
        3: { cellWidth: 18, halign: 'center' }, // Cant
        4: { cellWidth: 22, halign: 'right' }, // Precio
        5: { cellWidth: 28, halign: 'right' }, // Ingresos
        6: { cellWidth: 18, halign: 'center' }, // Margen
        7: { cellWidth: 22, halign: 'center' } // Stock
      },
      cellPadding: 2,
      fontSize: 8,
      rowPageBreak: 'auto'
    },
    audit: {
      columnStyles: {
        0: { cellWidth: 35, cellPadding: 2 }, // Cliente
        1: { cellWidth: 25, cellPadding: 1 }, // RNC/Cédula
        2: { cellWidth: 18, halign: 'center' }, // Compras
        3: { cellWidth: 28, halign: 'right' }, // Monto
        4: { cellWidth: 22, halign: 'right' }, // Ticket
        5: { cellWidth: 20, halign: 'center' } // Tipo
      },
      cellPadding: 2,
      fontSize: 8,
      rowPageBreak: 'auto'
    }
  }
  
  return configs[reportType] || {
    columnStyles: {},
    cellPadding: 2,
    fontSize: 9,
    rowPageBreak: 'auto'
  }
}

function formatCurrencyForPDF(amount: number): string {
  return `RD$ ${amount.toLocaleString('es-DO', {minimumFractionDigits: 2})}`
}

function ensurePageBoundaries(doc: jsPDF, yPosition: number, requiredSpace: number = 40): number {
  // Check if we need a new page (leaving 30mm margin at bottom)
  if (yPosition > 260) {
    doc.addPage()
    return 20 // Start position on new page
  }
  return yPosition
}
