/**
 * @file DGII XML Report Generator
 * @description Generates XML files for DGII 606/607 reports (Purchase and Sales reports)
 * @author POS System
 */

import { XMLBuilder } from 'fast-xml-parser'

// DGII 606 Report Interface (Purchases)
export interface DGII606Record {
  rnc: string
  tipoId: string
  numeroComprobante: string
  fechaComprobante: string
  montoFacturado: number
  itbisFacturado: number
}

// DGII 607 Report Interface (Sales)
export interface DGII607Record {
  rnc: string
  tipoId: string
  numeroComprobante: string
  ncfModificado?: string
  fechaComprobante: string
  montoFacturado: number
  itbisFacturado: number
}

// Company information for DGII reports
export interface CompanyInfo {
  rnc: string
  razonSocial: string
  periodo: string // YYYYMM format
}

/**
 * Generates DGII 606 XML report (Purchases)
 */
export function generateDGII606XML(
  companyInfo: CompanyInfo,
  purchases: DGII606Record[]
): string {
  const xmlData = {
    '?xml': {
      '@_version': '1.0',
      '@_encoding': 'UTF-8'
    },
    'DGII:RC606': {
      '@_xmlns:DGII': 'http://www.dgii.gov.do/rc/schemas/rc606',
      '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      '@_xsi:schemaLocation': 'http://www.dgii.gov.do/rc/schemas/rc606 RC606.xsd',
      'DGII:Encabezado': {
        'DGII:RNCEmisor': companyInfo.rnc,
        'DGII:RazonSocial': companyInfo.razonSocial,
        'DGII:Periodo': companyInfo.periodo,
        'DGII:FechaHoraGeneracion': new Date().toISOString(),
        'DGII:TotalRegistros': purchases.length,
        'DGII:MontoTotalCompras': purchases.reduce((sum, p) => sum + p.montoFacturado, 0).toFixed(2),
        'DGII:MontoTotalITBIS': purchases.reduce((sum, p) => sum + p.itbisFacturado, 0).toFixed(2)
      },
      'DGII:DetalleCompras': {
        'DGII:Compra': purchases.map(purchase => ({
          'DGII:RNCProveedor': purchase.rnc,
          'DGII:TipoIdentificacion': purchase.tipoId,
          'DGII:NumeroComprobanteFiscal': purchase.numeroComprobante,
          'DGII:FechaComprobante': purchase.fechaComprobante,
          'DGII:MontoFacturado': purchase.montoFacturado.toFixed(2),
          'DGII:ITBISFacturado': purchase.itbisFacturado.toFixed(2)
        }))
      }
    }
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    suppressEmptyNode: true
  })

  return builder.build(xmlData)
}

/**
 * Generates DGII 607 XML report (Sales)
 */
export function generateDGII607XML(
  companyInfo: CompanyInfo,
  sales: DGII607Record[]
): string {
  const xmlData = {
    '?xml': {
      '@_version': '1.0',
      '@_encoding': 'UTF-8'
    },
    'DGII:RC607': {
      '@_xmlns:DGII': 'http://www.dgii.gov.do/rc/schemas/rc607',
      '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      '@_xsi:schemaLocation': 'http://www.dgii.gov.do/rc/schemas/rc607 RC607.xsd',
      'DGII:Encabezado': {
        'DGII:RNCEmisor': companyInfo.rnc,
        'DGII:RazonSocial': companyInfo.razonSocial,
        'DGII:Periodo': companyInfo.periodo,
        'DGII:FechaHoraGeneracion': new Date().toISOString(),
        'DGII:TotalRegistros': sales.length,
        'DGII:MontoTotalVentas': sales.reduce((sum, s) => sum + s.montoFacturado, 0).toFixed(2),
        'DGII:MontoTotalITBIS': sales.reduce((sum, s) => sum + s.itbisFacturado, 0).toFixed(2)
      },
      'DGII:DetalleVentas': {
        'DGII:Venta': sales.map(sale => ({
          'DGII:RNCComprador': sale.rnc,
          'DGII:TipoIdentificacion': sale.tipoId,
          'DGII:NumeroComprobanteFiscal': sale.numeroComprobante,
          ...(sale.ncfModificado && { 'DGII:NCFModificado': sale.ncfModificado }),
          'DGII:FechaComprobante': sale.fechaComprobante,
          'DGII:MontoFacturado': sale.montoFacturado.toFixed(2),
          'DGII:ITBISFacturado': sale.itbisFacturado.toFixed(2)
        }))
      }
    }
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    suppressEmptyNode: true
  })

  return builder.build(xmlData)
}

/**
 * Validates RNC format for DGII reports
 */
export function validateRNC(rnc: string): boolean {
  if (!rnc) return false
  
  // Remove any spaces or hyphens
  const cleanRNC = rnc.replace(/[\s-]/g, '')
  
  // Dominican RNC should be 9 or 11 digits
  return /^\d{9}$|^\d{11}$/.test(cleanRNC)
}

/**
 * Formats date for DGII XML (YYYY-MM-DD)
 */
export function formatDGIIDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Gets period string for DGII reports (YYYYMM)
 */
export function getDGIIPeriod(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}${month}`
}

/**
 * Gets tipo identificación for DGII reports
 * 1 = RNC, 2 = Cédula, 3 = Pasaporte
 */
export function getTipoIdentificacion(document: string): string {
  if (!document) return '1' // Default to RNC
  
  const cleanDoc = document.replace(/[\s-]/g, '')
  
  if (/^\d{9}$|^\d{11}$/.test(cleanDoc)) {
    return '1' // RNC
  } else if (/^\d{11}$/.test(cleanDoc)) {
    return '2' // Cédula
  } else {
    return '3' // Pasaporte
  }
}

/**
 * Validates XML against basic DGII requirements
 */
export function validateDGIIXML(xmlContent: string, reportType: '606' | '607'): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Check if XML contains required elements
  const requiredElements = {
    '606': ['RNCEmisor', 'Periodo', 'DetalleCompras'],
    '607': ['RNCEmisor', 'Periodo', 'DetalleVentas']
  }
  
  const required = requiredElements[reportType]
  
  for (const element of required) {
    if (!xmlContent.includes(element)) {
      errors.push(`Missing required element: ${element}`)
    }
  }
  
  // Check RNC format in XML
  const rncPattern = /<DGII:RNCEmisor>(\d{9}|\d{11})<\/DGII:RNCEmisor>/
  const rncMatch = xmlContent.match(rncPattern)
  
  if (!rncMatch) {
    errors.push('Invalid or missing RNC format')
  }
  
  // Check period format (YYYYMM)
  const periodPattern = /<DGII:Periodo>(\d{6})<\/DGII:Periodo>/
  const periodMatch = xmlContent.match(periodPattern)
  
  if (!periodMatch) {
    errors.push('Invalid or missing period format (should be YYYYMM)')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
