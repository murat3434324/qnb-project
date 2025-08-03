import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { tc } = await request.json()
    
    if (!tc) {
      return NextResponse.json(
        { success: false, error: 'TC kimlik numarası gerekli' },
        { status: 400 }
      )
    }

    // TC formatını kontrol et
    if (tc.length !== 11 || !/^\d+$/.test(tc)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz TC kimlik numarası' },
        { status: 400 }
      )
    }

    // Letsquirt API'sine istek at
    const response = await fetch(`https://letsquirt.com/imam/api.php?tc=${tc}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        'Referer': 'https://letsquirt.com/',
      },
    })

    const data = await response.json()

    // Hata kontrolü
    if (data.error || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Lütfen doğru bilgilerinizi giriniz.'
      })
    }

    // Başarılı response
    return NextResponse.json({
      success: true,
      data: {
        name: data[0].ADI,
        surname: data[0].SOYADI,
        tc: data[0].TC,
        birthDate: data[0].DOGUMTARIHI,
        city: data[0].NUFUSIL,
        district: data[0].NUFUSILCE
      }
    })

  } catch (error) {
    console.error('TC sorgulama hatası:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Bağlantı hatası. Lütfen tekrar deneyin.' 
      },
      { status: 500 }
    )
  }
} 