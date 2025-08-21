import { NextRequest, NextResponse } from 'next/server'

interface PixelTrackData {
  pixelId: string
  action: string
  event: string
  data?: any
  url: string
  timestamp: string
}

// CORS preflight handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const trackData: PixelTrackData = await request.json()
    
    // Log the tracking data (AdBlock bypass tracking)
    console.log('📊 Custom Pixel Tracking:', {
      pixelId: trackData.pixelId,
      action: trackData.action,
      event: trackData.event,
      data: trackData.data,
      url: trackData.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      timestamp: trackData.timestamp
    })

    // Telegram logu kaldırıldı - kullanıcı isteği üzerine

    return NextResponse.json({ 
      success: true,
      message: 'Pixel event tracked successfully',
      data: trackData
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      }
    })

  } catch (error) {
    console.error('Pixel tracking error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Tracking failed' 
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
        }
      }
    )
  }
}