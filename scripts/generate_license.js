const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Anahtar dosyalarının yolları
const privateKeyPath = path.join(__dirname, 'private.key');
const publicKeyPath = path.join(__dirname, 'public.key');

// Yardımcı Fonksiyon: Anahtar çifti oluştur
function generateKeys() {
  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
    console.log('Mevcut anahtarlar kullanılacak.');
    return;
  }
  console.log('Yeni anahtar çifti oluşturuluyor...');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1', // ES256 için standart
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);
  console.log(`Anahtarlar "${__dirname}" klasörüne kaydedildi.`);
  console.log('LÜTFEN DİKKAT: public.key dosyasının içeriğini kopyalayıp main.js içine gömmeniz gerekecektir.');
}

// Yardımcı Fonksiyon: Base64Url encode
function base64UrlEncode(data) {
  return Buffer.from(JSON.stringify(data))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Ana Lisans Üretme Fonksiyonu
function generateLicense(options) {
  if (!fs.existsSync(privateKeyPath)) {
    console.error('Hata: private.key dosyası bulunamadı. Önce anahtar oluşturun.');
    process.exit(1);
  }

  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

  const header = { alg: 'ES256', typ: 'LICENSE' };
  const payload = {
    requestCode: options.requestCode,
    schoolName: options.schoolName || 'Bilinmeyen Okul',
    plan: options.plan || 'standard',
    expiresAt: options.expiresAt,
    issuedAt: new Date().toISOString(),
  };

  if (!payload.requestCode || !payload.expiresAt) {
    console.error('Hata: --request ve --expires alanları zorunludur.');
    process.exit(1);
  }

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);
  const dataToSign = `${headerEncoded}.${payloadEncoded}`;

  const signer = crypto.createSign('sha256');
  signer.update(dataToSign);
  const signature = signer.sign(privateKey, 'base64url');

  const licenseKey = `${dataToSign}.${signature}`;
  console.log('\n--- LİSANS ANAHTARI ---\n');
  console.log(licenseKey);
  console.log('\n-----------------------\n');
}

// Komut Satırı Argümanlarını İşleme
function main() {
  const args = process.argv.slice(2);

  if (args[0] === 'generate-keys') {
    generateKeys();
    return;
  }

  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    if (key && value) {
        if (key === 'request') options.requestCode = value;
        if (key === 'school') options.schoolName = value;
        if (key === 'plan') options.plan = value;
        if (key === 'expires') options.expiresAt = value;
    }
  }

  generateLicense(options);
}

main();