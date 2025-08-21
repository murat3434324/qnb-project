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
    // Pixel config'i pixel.json'dan al
    const fetchPixelConfig = async () => {
      try {
        // Önce pixel.json'ı dene
        const response = await fetch('/pixel.json?' + Date.now(), {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        
        if (response.ok) {
          const config = await response.json()
          setPixelConfig(config)
          console.log('✅ Pixel config loaded from pixel.json:', config.pixelId)
          return
        }
      } catch (error) {
        console.error('pixel.json error, trying API:', error)
        
        // pixel.json başarısız ise API'den dene
        try {
          const apiResponse = await fetch('/api/update-pixel', {
            method: 'GET',
            cache: 'no-store'
          })
          
          if (apiResponse.ok) {
            const data = await apiResponse.json()
            if (data.success && data.data) {
              setPixelConfig(data.data)
              console.log('✅ Pixel config loaded from API:', data.data.pixelId)
              return
            }
          }
        } catch (apiError) {
          console.error('API error:', apiError)
        }
      }
      
      // Fallback
      const fallbackConfig = {
        pixelId: '1146867957299098',
        enabled: true,
        lastUpdated: new Date().toISOString()
      }
      setPixelConfig(fallbackConfig)
      console.log('⚠️ Using fallback pixel config:', fallbackConfig.pixelId)
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

      // Özel sayfa event'leri
      if (pathname === '/sepete-eklendi') {
        trackEvent('AddToCart', {
          content_name: 'Page Based AddToCart',
          page_path: pathname
        })
        console.log('📊 Pixel Event: AddToCart (Page Based)')
      }
      
      // Phone sayfasında AddToCart
      if (pathname === '/phone') {
        trackEvent('AddToCart', {
          content_name: 'Phone Page AddToCart',
          content_type: 'phone_verification',
          page_path: pathname
        })
        console.log('📊 Pixel Event: AddToCart (Phone Page)')
      }
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