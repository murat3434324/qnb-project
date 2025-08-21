"use client"
import { useState, useEffect } from 'react'

interface PixelConfig {
  pixelId: string
  enabled: boolean
  lastUpdated: string
}

const PixelManager = () => {
  const [pixelConfig, setPixelConfig] = useState<PixelConfig>({
    pixelId: '',
    enabled: true,
    lastUpdated: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Mevcut pixel config'i yükle
    fetchPixelConfig()
  }, [])

  const fetchPixelConfig = async () => {
    try {
      // Önce pixel.json'ı dene
      const jsonResponse = await fetch('/pixel.json?' + Date.now(), {
        cache: 'no-store'
      })
      
      if (jsonResponse.ok) {
        const config = await jsonResponse.json()
        setPixelConfig(config)
        console.log('PixelManager: pixel.json\'dan yüklendi:', config)
        return
      }
    } catch (error) {
      console.error('pixel.json error:', error)
    }

    // API'den dene
    try {
      const response = await fetch('/api/update-pixel?' + Date.now(), {
        method: 'GET',
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setPixelConfig(data.data)
          console.log('PixelManager: API\'den yüklendi:', data.data)
          return
        }
      }
    } catch (error) {
      console.error('API error:', error)
    }
    
    // Fallback
    setPixelConfig({
      pixelId: '1146867957299098',
      enabled: true,
      lastUpdated: new Date().toISOString()
    })
    setMessage('⚠️ Varsayılan pixel config kullanılıyor')
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      const updatedConfig = {
        ...pixelConfig,
        lastUpdated: new Date().toISOString()
      }

      const response = await fetch('/api/update-pixel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedConfig)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessage('✅ Pixel config güncellendi! (Local/Memory)')
          setPixelConfig(data.data || updatedConfig)
          
          // Production uyarısı
          if (window.location.hostname !== 'localhost') {
            setTimeout(() => {
              setMessage('⚠️ Production\'da kalıcı değişiklik için pixel.json\'ı Vercel Dashboard\'dan güncelleyin!')
            }, 2000)
          }
          
          // Sayfayı yenile (pixel'i yeniden yüklemek için)
          setTimeout(() => {
            window.location.reload()
          }, 4000)
        } else {
          setMessage(`❌ Güncelleme başarısız: ${data.error || 'Bilinmeyen hata'}`)
        }
      } else {
        const errorData = await response.json()
        setMessage(`❌ Güncelleme başarısız: ${errorData.error || 'Sunucu hatası'}`)
      }
    } catch (error) {
      console.error('Update error:', error)
      setMessage('❌ Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-auto bg-white flex flex-col items-center justify-center p-4 mt-4">
      <div className="w-full max-w-[400px] bg-white rounded-[20px] border border-gray-200 p-8 shadow-sm">
        
        <h1 className="text-[#333] text-2xl font-semibold mb-6 text-center">
          Meta Pixel Yönetimi
        </h1>

        {/* Pixel ID */}
        <div className="mb-6">
          <h2 className="text-[#333] text-lg font-semibold mb-4">
            Pixel ID
          </h2>
          <input
            type="text"
            placeholder="1146867957299098"
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#800D51] text-base text-gray-700"
            value={pixelConfig.pixelId}
            onChange={(e) => setPixelConfig(prev => ({ ...prev, pixelId: e.target.value }))}
            disabled={isLoading}
          />
          <p className="text-gray-500 text-sm mt-2">
            Meta Pixel ID'nizi buraya girin
          </p>
        </div>

     

        {/* Son Güncelleme */}
        {pixelConfig.lastUpdated && (
          <div className="mb-6">
            <h2 className="text-[#333] text-lg font-semibold mb-2">
              Son Güncelleme
            </h2>
            <p className="text-gray-600 text-sm">
              {new Date(pixelConfig.lastUpdated).toLocaleString('tr-TR')}
            </p>
          </div>
        )}

        {/* Mesaj */}
        {message && (
          <div className="mb-6">
            <p className={`text-sm p-3 rounded-md ${
              message.includes('✅') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </p>
          </div>
        )}

        {/* Kaydet Butonu */}
        <button
          onClick={handleSave}
          className="w-full bg-[#800D51] text-white rounded-md py-4 hover:bg-[#800D51]/90 transition font-semibold text-lg disabled:opacity-50"
          disabled={isLoading || !pixelConfig.pixelId}
        >
          {isLoading ? 'Kaydediliyor...' : 'Pixel Konfigürasyonunu Kaydet'}
        </button>
        
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

export default PixelManager