import { NextRequest, NextResponse } from 'next/server'

interface PixelConfig {
  pixelId: string
  enabled: boolean
  lastUpdated: string
}

// Memory store for pixel config (serverless ortam için)
let pixelStore: PixelConfig = {
  pixelId: process.env.DEFAULT_PIXEL_ID || '1146867957299098',
  enabled: true,
  lastUpdated: new Date().toISOString()
}

// İlk yüklemede environment'dan kontrol et
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Production pixel store başlatıldı:', pixelStore)
}

export async function POST(request: NextRequest) {
  try {
    const pixelConfig: PixelConfig = await request.json()
    
    // Validasyon
    if (!pixelConfig.pixelId) {
      return NextResponse.json(
        { success: false, error: 'Pixel ID gerekli' },
        { status: 400 }
      )
    }

    // Pixel ID formatını kontrol et (sadece sayılar)
    if (!/^\d+$/.test(pixelConfig.pixelId)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz Pixel ID formatı' },
        { status: 400 }
      )
    }

    // Memory store'a kaydet (serverless ortam için)
    pixelStore = {
      ...pixelConfig,
      lastUpdated: new Date().toISOString()
    }

    console.log('Pixel güncellendi:', pixelStore)

    return NextResponse.json({ 
      success: true, 
      message: 'Pixel konfigürasyonu güncellendi',
      data: pixelStore
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
    // Memory store'un güncel olduğundan emin ol
    if (!pixelStore.pixelId) {
      pixelStore.pixelId = process.env.DEFAULT_PIXEL_ID || '1146867957299098'
    }

    console.log('📊 Pixel config GET request:', pixelStore)
    
    return NextResponse.json({
      success: true,
      data: pixelStore,
      timestamp: new Date().toISOString()
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