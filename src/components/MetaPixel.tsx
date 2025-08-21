"use client"
import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface PixelConfig {
  pixelId: string
  enabled: boolean
  lastUpdated: string
}

function MetaPixelContent() {
  const [pixelConfig, setPixelConfig] = useState<PixelConfig | null>(null)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Pixel config'i API'den al
    const fetchPixelConfig = async () => {
      try {
        const response = await fetch('/api/update-pixel', {
          method: 'GET',
          cache: 'no-store'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setPixelConfig(data.data)
            console.log('Pixel config yüklendi:', data.data.pixelId)
            return
          }
        }
      } catch (error) {
        console.error('Pixel config error:', error)
      }
      
      // Fallback
      setPixelConfig({
        pixelId: '1146867957299098',
        enabled: true,
        lastUpdated: new Date().toISOString()
      })
    }

    fetchPixelConfig()
  }, [])

  // Pixel tracking function (image pixel method)
  const trackEvent = (event: string, parameters?: any) => {
    if (!pixelConfig?.enabled || !pixelConfig.pixelId) return

    // Base Facebook Pixel URL
    const pixelUrl = new URL('https://www.facebook.com/tr')
    pixelUrl.searchParams.append('id', pixelConfig.pixelId)
    pixelUrl.searchParams.append('ev', event)
    pixelUrl.searchParams.append('noscript', '1')
    
    // Add custom parameters if provided
    if (parameters) {
      pixelUrl.searchParams.append('cd', JSON.stringify(parameters))
    }

    // Create and append image
    const img = new Image(1, 1)
    img.style.display = 'none'
    img.src = pixelUrl.toString()
    document.body.appendChild(img)
    
    // Remove after load
    img.onload = () => {
      setTimeout(() => {
        document.body.removeChild(img)
      }, 100)
    }

    console.log(`📊 Pixel Event: ${event}`, parameters || '')
  }

  // Track PageView on route change
  useEffect(() => {
    if (pixelConfig?.enabled && pixelConfig.pixelId) {
      trackEvent('PageView', {
        page_path: pathname,
        page_location: window.location.href
      })
    }
  }, [pathname, searchParams, pixelConfig])

  // Global tracking functions
  useEffect(() => {
    if (pixelConfig?.enabled && pixelConfig.pixelId) {
      // Simple fbq implementation for compatibility
      window.fbq = (action: string, event: string, params?: any) => {
        if (action === 'track') {
          trackEvent(event, params)
        }
      }
      
      // Mark as loaded
      window.fbq.loaded = true
      console.log('✅ Pixel tracking ready (image method)')
    }
  }, [pixelConfig])

  if (!pixelConfig?.enabled || !pixelConfig.pixelId) {
    return null
  }

  // Base noscript pixel
  return (
    <noscript>
      <img 
        height="1" 
        width="1" 
        style={{display: 'none'}}
        src={`https://www.facebook.com/tr?id=${pixelConfig.pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  )
}

// Main component with Suspense wrapper
export default function MetaPixel() {
  return (
    <Suspense fallback={null}>
      <MetaPixelContent />
    </Suspense>
  )
}