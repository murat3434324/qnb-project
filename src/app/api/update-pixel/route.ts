import { NextRequest, NextResponse } from 'next/server'

interface PixelConfig {
  pixelId: string
  enabled: boolean
  lastUpdated: string
}

// CORS preflight handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    },
  })
}

// pixel.json'ı oku
async function readPixelConfig(): Promise<PixelConfig> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'production' 
      ? 'https://qnbfinans-basvuru.vercel.app' 
      : 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/pixel.json`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
    
    if (response.ok) {
      const config = await response.json()
      console.log('📖 Pixel config from pixel.json:', config)
      return config
    }
  } catch (error) {
    console.error('pixel.json read error:', error)
  }
  
  // Fallback
  return {
    pixelId: process.env.DEFAULT_PIXEL_ID || '1146867957299098',
    enabled: true,
    lastUpdated: new Date().toISOString()
  }
}

export async function POST(request: NextRequest) {
  try {
    const pixelConfig: PixelConfig = await request.json()
    
    // Validasyon
    if (!pixelConfig.pixelId) {
      return NextResponse.json(
        { success: false, error: 'Pixel ID gerekli' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
          }
        }
      )
    }

    // Pixel ID formatını kontrol et (sadece sayılar)
    if (!/^\d+$/.test(pixelConfig.pixelId)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz Pixel ID formatı' },
        { status: 400 }
      )
    }

    // Yeni config
    const updatedConfig = {
      ...pixelConfig,
      lastUpdated: new Date().toISOString()
    }

    console.log('✅ Pixel config güncellendi:', updatedConfig)
    console.log('📝 Not: pixel.json dosyası production\'da otomatik güncellenmez.')
    console.log('📌 Production\'da güncelleme için Vercel Dashboard > Files > pixel.json')

    return NextResponse.json({ 
      success: true, 
      message: 'Pixel konfigürasyonu güncellendi (memory only)',
      data: updatedConfig,
      note: 'Production\'da kalıcı değişiklik için pixel.json manuel güncellenmeli'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      }
    })

  } catch (error) {
    console.error('Pixel update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sunucu hatası' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint - pixel config'i almak için
export async function GET() {
  try {
    // pixel.json'dan oku
    const pixelConfig = await readPixelConfig()
    
    console.log('📊 Pixel config GET request:', pixelConfig)
    
    return NextResponse.json({
      success: true,
      data: pixelConfig,
      timestamp: new Date().toISOString(),
      source: 'pixel.json'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      }
    })
  } catch (error) {
    console.error('Pixel get error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sunucu hatası',
        fallback: {
          pixelId: '1146867957299098',
          enabled: true,
          lastUpdated: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}