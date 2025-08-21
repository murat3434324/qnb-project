"use client"
import Script from 'next/script'
import { useEffect, useState } from 'react'

interface PixelConfig {
  pixelId: string
  enabled: boolean
  lastUpdated: string
}

declare global {
  interface Window {
    fbq: any
  }
}

export default function MetaPixel() {
  const [pixelConfig, setPixelConfig] = useState<PixelConfig | null>(null)

  useEffect(() => {
    // Pixel config'i sadece API'den al
    const fetchPixelConfig = async () => {
      try {
        const response = await fetch('/api/update-pixel', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setPixelConfig(data.data)
            console.log('Pixel config API\'den yüklendi:', data.data)
            return
          }
        }

        throw new Error('API response başarısız')
      } catch (error) {
        console.error('Pixel config fetch error:', error)
        // Fallback - default değer
        const fallbackConfig = {
          pixelId: '1146867957299098',
          enabled: true,
          lastUpdated: new Date().toISOString()
        }
        setPixelConfig(fallbackConfig)
        console.log('Fallback pixel config kullanıldı:', fallbackConfig)
      }
    }

    fetchPixelConfig()
  }, [])

  // Component mount olduğunda manual load'u da dene
  useEffect(() => {
    if (pixelConfig?.enabled && pixelConfig.pixelId) {
      const timer = setTimeout(() => {
        if (!window.fbq) {
          console.log('🔄 Fallback: Bypass pixel loading...')
          loadPixelWithBypass()
        }
      }, 2000) // 2 saniye bekle, sonra bypass yükle

      return () => clearTimeout(timer)
    }
  }, [pixelConfig])

  // AdBlock detection ve bypass sistemi
  const isAdBlockActive = async (): Promise<boolean> => {
    try {
      const testUrl = 'https://googleads.g.doubleclick.net/pagead/ads'
      const response = await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' })
      return false // Eğer fetch başarılı ise AdBlock yok
    } catch {
      return true // Fetch başarısız ise AdBlock var
    }
  }

  // Alternative pixel loading (AdBlock bypass)
  const loadPixelWithBypass = async () => {
    if (typeof window === 'undefined' || !pixelConfig?.enabled || !pixelConfig.pixelId) return

    const adBlockDetected = await isAdBlockActive()
    console.log(adBlockDetected ? '🚫 AdBlock detected' : '✅ AdBlock not detected')

    // Facebook Pixel base function
    const fbq = function() {
      (window as any).fbq.callMethod ? 
        (window as any).fbq.callMethod.apply((window as any).fbq, arguments) : 
        (window as any).fbq.queue.push(arguments)
    }
    
    if (!(window as any).fbq) {
      (window as any).fbq = fbq;
      (window as any).fbq.push = fbq;
      (window as any).fbq.loaded = true;
      (window as any).fbq.version = '2.0';
      (window as any).fbq.queue = [];

      if (adBlockDetected) {
        // AdBlock bypass: Custom tracking
        console.log('🔄 Using custom tracking (AdBlock bypass)')
        ;(window as any).fbq = function(action: string, event: string, data?: any) {
          console.log('📊 Custom Pixel Event:', { action, event, data, pixelId: pixelConfig.pixelId })
          
          // Send to our own tracking endpoint
          fetch('/api/pixel-track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pixelId: pixelConfig.pixelId,
              action,
              event,
              data,
              url: window.location.href,
              timestamp: new Date().toISOString()
            })
          }).catch(console.error)
        }
        
        // Initialize and track PageView
        ;(window as any).fbq('init', pixelConfig.pixelId)
        ;(window as any).fbq('track', 'PageView')
      } else {
        // Normal Facebook Pixel loading
        const script = document.createElement('script')
        script.async = true
        script.crossOrigin = 'anonymous'
        script.referrerPolicy = 'strict-origin-when-cross-origin'
        
        // Alternative CDN URLs (eğer ana URL bloklanırsa)
        const pixelUrls = [
          'https://connect.facebook.net/en_US/fbevents.js',
          'https://www.facebook.com/tr/fbevents.js',
          'https://connect.facebook.net/tr_TR/fbevents.js'
        ]
        
        const tryLoadScript = (urlIndex = 0) => {
          if (urlIndex >= pixelUrls.length) {
            console.error('❌ All Facebook Pixel URLs failed')
            return
          }
          
          script.src = pixelUrls[urlIndex]
          script.onload = () => {
            console.log(`✅ Facebook Pixel loaded from: ${pixelUrls[urlIndex]}`)
            ;(window as any).fbq('init', pixelConfig.pixelId)
            ;(window as any).fbq('track', 'PageView')
          }
          script.onerror = () => {
            console.warn(`⚠️ Failed to load from: ${pixelUrls[urlIndex]}`)
            tryLoadScript(urlIndex + 1)
          }
        }
        
        tryLoadScript()
        const firstScript = document.getElementsByTagName('script')[0]
        firstScript.parentNode?.insertBefore(script, firstScript)
      }
    }
  }

  // Pixel yüklendikten sonra init et
  const handlePixelLoad = () => {
    if (pixelConfig?.enabled && pixelConfig.pixelId) {
      if (window.fbq) {
        window.fbq('init', pixelConfig.pixelId)
        window.fbq('track', 'PageView')
        console.log('✅ Facebook Pixel initialized:', pixelConfig.pixelId)
      } else {
        console.log('⚠️ fbq not available, trying bypass load...')
        loadPixelWithBypass()
      }
    }
  }

  if (!pixelConfig?.enabled || !pixelConfig.pixelId) {
    return null
  }

  return (
    <>
      {/* Meta Pixel Base Code */}
      <Script
        id="meta-pixel-base"
        strategy="beforeInteractive"
      >
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];}(window, document,'script');
        `}
      </Script>
      
      {/* Facebook Events Script */}
      <Script
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="afterInteractive"
        onLoad={handlePixelLoad}
        crossOrigin="anonymous"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{display: 'none'}}
          src={`https://www.facebook.com/tr?id=${pixelConfig.pixelId}&ev=PageView&noscript=1`}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </noscript>
    </>
  )
}