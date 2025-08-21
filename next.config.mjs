// @ts-check
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Build ID dosyasının yolu
const buildIdFile = path.join(process.cwd(), '.next-build-id.txt');

// Build ID'yi al veya oluştur
function getBuildId() {
  // Eğer build ID dosyası varsa, onu oku
  if (fs.existsSync(buildIdFile)) {
    return fs.readFileSync(buildIdFile, 'utf8').trim();
  }
  
  // Yoksa yeni bir ID oluştur ve kaydet
  const newBuildId = `mardin-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  
  // .next klasörünü oluştur (eğer yoksa)
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    fs.mkdirSync(nextDir, { recursive: true });
  }
  
  // Build ID'yi dosyaya kaydet
  fs.writeFileSync(buildIdFile, newBuildId);
  
  console.log('Build ID oluşturuldu:', newBuildId);
  return newBuildId;
}

// Tek bir build ID al
const buildId = getBuildId();

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  env: {
    DEPLOY_DB_NAME: buildId,
  },
  generateBuildId: async () => {
    // Next.js'in kendi build ID'si için aynı değeri kullan
    return buildId;
  },
  async headers() {
    return [
      {
        // Tüm domainler için CORS headers
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer-when-downgrade'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin'
          }
        ]
      },
      {
        // API routes için özel CORS
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma'
          }
        ]
      }
    ];
  },
}

export default nextConfig;