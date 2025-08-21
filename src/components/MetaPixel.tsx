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
    // Pixel config'i fetch et (API'den al)
    const fetchPixelConfig = async () => {
      try {
        // Önce API'den dene
        const apiResponse = await fetch('/api/update-pixel', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json()
          if (apiData.success) {
            setPixelConfig(apiData.data)
            return
          }
        }

        // API başarısız ise pixel.json'dan dene (fallback)
        const jsonResponse = await fetch('/pixel.json?' + Date.now(), {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        const config: PixelConfig = await jsonResponse.json()
        setPixelConfig(config)
      } catch (error) {
        console.error('Pixel config fetch error:', error)
        // Son çare olarak default değer
        setPixelConfig({
          pixelId: '1146867957299098',
          enabled: true,
          lastUpdated: new Date().toISOString()
        })
      }
    }

    fetchPixelConfig()
  }, [])

  // Pixel yüklendikten sonra init et
  const handlePixelLoad = () => {
    if (pixelConfig?.enabled && pixelConfig.pixelId) {
      window.fbq('init', pixelConfig.pixelId)
      window.fbq('track', 'PageView')
    }
  }

  if (!pixelConfig?.enabled || !pixelConfig.pixelId) {
    return null
  }

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onLoad={handlePixelLoad}
      >
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
        `}
      </Script>
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{display: 'none'}}
          src={`https://www.facebook.com/tr?id=${pixelConfig.pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  )
}