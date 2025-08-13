import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for conflicting classes
 * 
 * @param inputs - Class values to merge
 * @returns Merged class string
 * 
 * @example
 * ```tsx
 * cn('px-4 py-2', isActive && 'bg-blue-500', 'px-6') // Result: 'py-2 bg-blue-500 px-6'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in Dominican Pesos (DOP)
 * 
 * @param amount - Amount to format
 * @returns Formatted currency string
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
 * Format date in Dominican format (DD/MM/YYYY)
 * 
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/**
 * Format time in 24-hour format
 * 
 * @param date - Date to format
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

/**
 * Validate Dominican RNC (Registro Nacional de Contribuyentes)
 * 
 * @param rnc - RNC to validate
 * @returns Boolean indicating if RNC is valid
 */
export function validateRNC(rnc: string): boolean {
  // Remove any non-digit characters
  const cleanRNC = rnc.replace(/\D/g, '')
  
  // RNC must be 9 or 11 digits
  return cleanRNC.length === 9 || cleanRNC.length === 11
}

/**
 * Format RNC with proper spacing
 * 
 * @param rnc - RNC to format
 * @returns Formatted RNC string
 */
export function formatRNC(rnc: string): string {
  const cleanRNC = rnc.replace(/\D/g, '')
  
  if (cleanRNC.length === 9) {
    // Format: XXX-XXXXX-X
    return cleanRNC.replace(/(\d{3})(\d{5})(\d{1})/, '$1-$2-$3')
  } else if (cleanRNC.length === 11) {
    // Format: XXX-XXXXXXX-X
    return cleanRNC.replace(/(\d{3})(\d{7})(\d{1})/, '$1-$2-$3')
  }
  
  return rnc
}

/**
 * Format NCF (Número de Comprobante Fiscal)
 * 
 * @param prefix - NCF prefix (B01, B02, etc.)
 * @param number - NCF number
 * @returns Formatted NCF string
 */
export function formatNCF(prefix: string, number: number): string {
  return `${prefix}${number.toString().padStart(8, '0')}`
}

/**
 * Calculate ITBIS tax (18% in Dominican Republic)
 * 
 * @param amount - Base amount
 * @param taxRate - Tax rate (default 0.18)
 * @returns Tax amount
 */
export function calculateITBIS(amount: number, taxRate: number = 0.18): number {
  return Number((amount * taxRate).toFixed(2))
}

/**
 * Calculate total with tax
 * 
 * @param subtotal - Subtotal amount
 * @param taxRate - Tax rate (default 0.18)
 * @returns Total amount including tax
 */
export function calculateTotal(subtotal: number, taxRate: number = 0.18): number {
  return Number((subtotal + calculateITBIS(subtotal, taxRate)).toFixed(2))
}

/**
 * Generate a unique ID
 * 
 * @returns Unique ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}
