/**
 * Network utility functions for IPv4/IPv6 detection and configuration
 */

export function getNetworkUrls(port: number = 3000) {
  const urls = {
    ipv4: {
      localhost: `http://localhost:${port}`,
      loopback: `http://127.0.0.1:${port}`,
      network: `http://0.0.0.0:${port}`,
    },
    ipv6: {
      localhost: `http://[::1]:${port}`,
      loopback: `http://[::1]:${port}`,
      network: `http://[::]:${port}`,
    }
  }
  
  return urls
}

export function isIPv6Address(address: string): boolean {
  // Simple IPv6 detection - contains colons and brackets
  return address.includes(':') && (address.includes('[') || address.split(':').length > 2)
}

export function isIPv4Address(address: string): boolean {
  // Simple IPv4 detection - four numbers separated by dots
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  return ipv4Regex.test(address)
}

export function formatUrlForDisplay(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    
    if (isIPv6Address(hostname)) {
      return `${urlObj.protocol}//[${hostname}]:${urlObj.port || '80'}`
    }
    
    return url
  } catch {
    return url
  }
}

/**
 * Get appropriate NEXTAUTH_URL based on environment
 */
export function getAuthUrl(): string {
  if (typeof window !== 'undefined') {
    // Client side - use current location
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    const port = window.location.port
    
    if (isIPv6Address(hostname)) {
      return `${protocol}//[${hostname}]${port ? `:${port}` : ''}`
    }
    
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`
  }
  
  // Server side - use environment variables
  return process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL_IPV6 || 'http://localhost:3000'
}
