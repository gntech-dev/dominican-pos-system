'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

interface LogoSectionProps {
  businessLogo?: string
  className?: string
  fallbackText?: string
  size?: 'small' | 'medium' | 'large'
  showFallback?: boolean
}

/**
 * Logo Section Component - Automatically detects and displays business logo
 * Falls back to generated logos or text when no custom logo is uploaded
 */
export default function LogoSection({ 
  businessLogo, 
  className = "h-16 mb-4", 
  fallbackText,
  size = 'medium',
  showFallback = true 
}: LogoSectionProps) {
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [debugStatus, setDebugStatus] = useState<string>('Initializing...')

  const sizeClasses = {
    small: 'h-12',
    medium: 'h-16', 
    large: 'h-20'
  }

  // Auto-detect uploaded logo
  useEffect(() => {
    const detectLogo = async () => {
      setDebugStatus('Starting logo detection...')
      
      // Priority 1: Use provided business logo
      if (businessLogo) {
        setDebugStatus(`Using provided business logo: ${businessLogo}`)
        setLogoSrc(businessLogo)
        return
      }

      // Priority 2: Check for uploaded custom logo (various formats)
      // Check both with and without extension to be thorough
      const logoFormats = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif']
      
      for (const format of logoFormats) {
        try {
          setDebugStatus(`Checking for /logo.${format}`)
          // Try both with cache-busting and without
          const urls = [`/logo.${format}?t=${Date.now()}`, `/logo.${format}`]
          
          for (const url of urls) {
            try {
              const response = await fetch(url, { 
                method: 'GET',
                cache: 'no-cache'
              })
              if (response.ok && response.status === 200) {
                setDebugStatus(`Found logo at ${url}`)
                setLogoSrc(`/logo.${format}`)
                return
              }
            } catch (innerError) {
              continue
            }
          }
        } catch (error) {
          setDebugStatus(`Error checking /logo.${format}: ${error}`)
          continue
        }
      }

      // Priority 3: Use generated SVG logos  
      const generatedLogos = ['logo.svg', 'logo-modern.svg', 'logo-clean.svg']
      for (const logo of generatedLogos) {
        try {
          setDebugStatus(`Checking for generated logo /${logo}`)
          const response = await fetch(`/${logo}?t=${Date.now()}`, { 
            method: 'GET',
            cache: 'no-cache'
          })
          if (response.ok && response.status === 200) {
            setDebugStatus(`Found generated logo at /${logo}`)
            setLogoSrc(`/${logo}`)
            return
          }
        } catch (error) {
          setDebugStatus(`Error checking /${logo}: ${error}`)
          continue
        }
      }

      // No logo found
      setDebugStatus('No logo found, using fallback')
      setLogoSrc(null)
    }

    detectLogo()
  }, [businessLogo])

  const handleImageError = () => {
    setDebugStatus(`Image failed to load: ${logoSrc} - Using fallback`)
    setLogoError(true)
  }

  // If we have a logo and no error, display it
  if (logoSrc && !logoError) {
    const isVector = logoSrc.endsWith('.svg')
    const isPng = logoSrc.endsWith('.png')
    const isJpg = logoSrc.endsWith('.jpg') || logoSrc.endsWith('.jpeg')
    
    return (
      <div className={`${className} flex items-center`}>
        {isVector ? (
          // For SVG files, use img tag instead of Next.js Image
          <img
            src={logoSrc}
            alt="Business Logo"
            className={`${sizeClasses[size]} w-auto object-contain`}
            onError={handleImageError}
          />
        ) : (
          // For other image formats, use Next.js Image
          <Image
            src={logoSrc}
            alt="Business Logo"
            width={200}
            height={80}
            className={`${sizeClasses[size]} w-auto object-contain`}
            onError={handleImageError}
            priority={true}
            quality={isPng ? 100 : 90} // Higher quality for PNG logos
          />
        )}
      </div>
    )
  }

  // Show fallback if enabled
  if (showFallback) {
    return (
      <div className={`${className} flex items-center`}>
        <div className={`${sizeClasses[size]} flex items-center justify-center bg-blue-100 border-2 border-blue-300 rounded-lg px-4`}>
          <span className="text-blue-800 font-bold text-lg">
            {fallbackText || 'LOGO'}
          </span>
        </div>
      </div>
    )
  }

  return null
}

/**
 * Hook to detect if business logo exists
 */
export function useBusinessLogo(): { logoExists: boolean; logoSrc: string | null } {
  const [logoExists, setLogoExists] = useState(false)
  const [logoSrc, setLogoSrc] = useState<string | null>(null)

  useEffect(() => {
    const checkLogo = async () => {
      const logoFormats = ['png', 'jpg', 'jpeg', 'svg']
      for (const format of logoFormats) {
        try {
          const response = await fetch(`/logo.${format}`, { method: 'HEAD' })
          if (response.ok) {
            setLogoExists(true)
            setLogoSrc(`/logo.${format}`)
            return
          }
        } catch (error) {
          // Continue checking
        }
      }
      
      setLogoExists(false)
      setLogoSrc(null)
    }

    checkLogo()
  }, [])

  return { logoExists, logoSrc }
}
