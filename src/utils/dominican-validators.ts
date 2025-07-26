/**
 * Dominican Republic specific utility functions for POS system
 */

/**
 * Validates RNC (Registro Nacional del Contribuyente) format
 * RNC can be 9 or 11 digits
 */
export function validateRNC(rnc: string): boolean {
  if (!rnc) return false
  
  // Remove any non-digit characters
  const cleanRnc = rnc.replace(/\D/g, '')
  
  // Must be exactly 9 or 11 digits
  if (cleanRnc.length !== 9 && cleanRnc.length !== 11) {
    return false
  }
  
  // Basic format validation (you can enhance with checksum validation)
  return /^\d{9}$|^\d{11}$/.test(cleanRnc)
}

/**
 * Formats RNC for display
 */
export function formatRNC(rnc: string): string {
  const cleanRnc = rnc.replace(/\D/g, '')
  
  if (cleanRnc.length === 9) {
    return `${cleanRnc.slice(0, 1)}-${cleanRnc.slice(1, 3)}-${cleanRnc.slice(3, 8)}-${cleanRnc.slice(8)}`
  } else if (cleanRnc.length === 11) {
    return `${cleanRnc.slice(0, 3)}-${cleanRnc.slice(3, 10)}-${cleanRnc.slice(10)}`
  }
  
  return rnc
}

/**
 * Validates Cedula format (Dominican ID)
 * Format: XXX-XXXXXXX-X (11 digits total)
 */
export function validateCedula(cedula: string): boolean {
  if (!cedula) return false
  
  const cleanCedula = cedula.replace(/\D/g, '')
  
  // Must be exactly 11 digits
  if (cleanCedula.length !== 11) {
    return false
  }
  
  // Basic format validation
  return /^\d{11}$/.test(cleanCedula)
}

/**
 * Formats Cedula for display
 */
export function formatCedula(cedula: string): string {
  const cleanCedula = cedula.replace(/\D/g, '')
  
  if (cleanCedula.length === 11) {
    return `${cleanCedula.slice(0, 3)}-${cleanCedula.slice(3, 10)}-${cleanCedula.slice(10)}`
  }
  
  return cedula
}

/**
 * Validates NCF (Número de Comprobante Fiscal) format
 * Format: 3 letters + 8 digits (e.g., B01########)
 */
export function validateNCF(ncf: string): boolean {
  if (!ncf) return false
  
  // NCF format: 3 letters followed by 8 digits
  const ncfPattern = /^[A-Z]{3}\d{8}$/
  return ncfPattern.test(ncf.toUpperCase())
}

/**
 * Generates next NCF in sequence
 */
export function generateNCF(type: string, sequenceNumber: number): string {
  // Ensure sequence number is padded to 8 digits
  const paddedNumber = sequenceNumber.toString().padStart(8, '0')
  return `${type}${paddedNumber}`
}

/**
 * Calculates ITBIS (Dominican tax) - 18%
 */
export function calculateITBIS(subtotal: number, rate: number = 0.18): number {
  return Math.round(subtotal * rate * 100) / 100
}

/**
 * Formats currency for Dominican Pesos (DOP)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formats date for Dominican Republic (DD/MM/YYYY)
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/**
 * Formats date and time for Dominican Republic
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

/**
 * Validates if a number is a valid monetary amount (2 decimal places max)
 */
export function validateMonetaryAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount >= 0 && Number((amount * 100).toFixed(0)) / 100 === amount
}

/**
 * Rounds monetary amount to 2 decimal places
 */
export function roundToTwoDecimals(amount: number): number {
  return Math.round(amount * 100) / 100
}
