/**
 * Date helper utilities for handling Date objects and strings
 * Ensures compatibility between server and client date handling
 */

/**
 * Safely convert a date value to ISO string
 * Handles both Date objects and date strings
 */
export function toISOString(date: Date | string | undefined | null): string {
  if (!date) return new Date().toISOString()
  
  if (typeof date === 'string') {
    return date.includes('T') ? date : new Date(date).toISOString()
  }
  
  if (date instanceof Date) {
    return date.toISOString()
  }
  
  return new Date().toISOString()
}

/**
 * Safely create a Date object from various date inputs
 */
export function toDate(date: Date | string | undefined | null): Date {
  if (!date) return new Date()
  
  if (typeof date === 'string') {
    return new Date(date)
  }
  
  if (date instanceof Date) {
    return date
  }
  
  return new Date()
}

/**
 * Format date for Dominican Republic locale
 */
export function formatDominicanDate(date: Date | string | undefined | null): string {
  const dateObj = toDate(date)
  return dateObj.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Format time for Dominican Republic locale
 */
export function formatDominicanTime(date: Date | string | undefined | null): string {
  const dateObj = toDate(date)
  return dateObj.toLocaleTimeString('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

/**
 * Format complete date and time for Dominican Republic locale
 */
export function formatDominicanDateTime(date: Date | string | undefined | null): string {
  const dateObj = toDate(date)
  return dateObj.toLocaleString('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

/**
 * Check if a date string or Date object is valid
 */
export function isValidDate(date: Date | string | undefined | null): boolean {
  if (!date) return false
  
  const dateObj = new Date(date)
  return !isNaN(dateObj.getTime())
}

/**
 * Get relative time (e.g., "hace 2 horas", "ayer")
 */
export function getRelativeTime(date: Date | string | undefined | null): string {
  const dateObj = toDate(date)
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return 'Ahora mismo'
  } else if (diffMinutes < 60) {
    return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`
  } else if (diffHours < 24) {
    return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
  } else if (diffDays === 1) {
    return 'Ayer'
  } else if (diffDays < 7) {
    return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
  } else {
    return formatDominicanDate(dateObj)
  }
}
