import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync } from 'fs'
import { join } from 'path'

interface PixelConfig {
  pixelId: string
  enabled: boolean
  lastUpdated: string
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

    // Public klasörüne pixel.json dosyasını yaz
    const publicPath = join(process.cwd(), 'public', 'pixel.json')
    const configData = JSON.stringify(pixelConfig, null, 2)
    
    writeFileSync(publicPath, configData, 'utf-8')

    return NextResponse.json({ 
      success: true, 
      message: 'Pixel konfigürasyonu güncellendi' 
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