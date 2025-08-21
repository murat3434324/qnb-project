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
          console.log('🔄 Fallback: Manual pixel loading...')
          loadPixelManually()
        }
      }, 2000) // 2 saniye bekle, sonra manual yükle

      return () => clearTimeout(timer)
    }
  }, [pixelConfig])

  // Manual script injection (CORS fallback)
  const loadPixelManually = () => {
    if (typeof window === 'undefined' || !pixelConfig?.enabled || !pixelConfig.pixelId) return

    // Facebook Pixel base code
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

      // Create and append script
      const script = document.createElement('script')
      script.async = true
      script.crossOrigin = 'anonymous'
      script.referrerPolicy = 'strict-origin-when-cross-origin'
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      script.onload = () => {
        console.log('✅ Facebook Pixel script loaded manually')
        if (pixelConfig?.enabled && pixelConfig.pixelId) {
          (window as any).fbq('init', pixelConfig.pixelId)
          ;(window as any).fbq('track', 'PageView')
        }
      }
      script.onerror = () => {
        console.error('❌ Facebook Pixel script failed to load')
      }
      
      const firstScript = document.getElementsByTagName('script')[0]
      firstScript.parentNode?.insertBefore(script, firstScript)
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
        console.log('⚠️ fbq not available, trying manual load...')
        loadPixelManually()
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