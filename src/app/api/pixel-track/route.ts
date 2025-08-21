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

    // Telegram'a da gönderebiliriz (opsiyonel)
    if (trackData.event === 'PageView' || trackData.event === 'Lead' || trackData.event === 'Purchase') {
      try {
        const token = process.env.TELEGRAM_TOKEN
        const chatId = process.env.TELEGRAM_CHAT
        
        if (token && chatId) {
          const host = request.headers.get('host') || 'unknown-domain'
          const protocol = request.headers.get('x-forwarded-proto') || 'http'
          const fullDomain = `${protocol}://${host}`

          const message = `
🎯 *PIXEL EVENT (AdBlock Bypass)*

🌐 *Domain:* \`${fullDomain}\`
📊 *Pixel ID:* \`${trackData.pixelId}\`
🎬 *Event:* \`${trackData.event}\`
🔄 *Action:* \`${trackData.action}\`
🌍 *URL:* \`${trackData.url}\`
📅 *Time:* \`${trackData.timestamp}\`

🚫 *AdBlock Detected - Custom Tracking Active*

---
          `.trim()

          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: 'Markdown'
            })
          })
        }
      } catch (telegramError) {
        console.error('Telegram notification error:', telegramError)
      }
    }

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