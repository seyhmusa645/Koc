# 🤖 Gemini API Kurulum Rehberi

## 📋 Adım Adım Kurulum

### 1️⃣ Google AI Studio'ya Git
- [Google AI Studio](https://aistudio.google.com/) adresine git
- Google hesabınla giriş yap

### 2️⃣ API Key Oluştur
- "Get API Key" butonuna tıkla
- "Create API Key" seçeneğini seç
- Yeni proje oluştur veya mevcut projeyi seç
- API key'ini kopyala

### 3️⃣ API Key'i Programa Ekle
`renderer.js` dosyasında 2651. satırda:
```javascript
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; // Buraya API key'inizi girin
```

**YOUR_GEMINI_API_KEY_HERE** yerine kendi API key'inizi yapıştır.

### 4️⃣ Test Et
- Programı başlat: `npm start`
- "Öğrenci Değerlendir" bölümüne git
- Bir öğrenci seç
- "🤖 Gemini AI Analizi" kartında AI analizini gör

## ⚠️ Önemli Notlar

- **Güvenlik**: API key'inizi kimseyle paylaşmayın
- **Limit**: Günlük ücretsiz limit: 15 istek/dakika
- **Maliyet**: Limit aşılırsa ücretli plan gerekebilir

## 🔧 Sorun Giderme

### API Key Bulunamadı Hatası
- API key'in doğru kopyalandığından emin ol
- Tırnak işaretlerini kontrol et
- Dosyayı kaydet ve programı yeniden başlat

### API Hatası
- İnternet bağlantını kontrol et
- API key'in aktif olduğundan emin ol
- Google AI Studio'da limit kontrolü yap

## 🚀 Özellikler

✅ **Gerçek AI Analizi**: Gemini AI ile kişiselleştirilmiş değerlendirme
✅ **Türkçe Destek**: Tam Türkçe analiz ve tavsiyeler
✅ **Hata Yönetimi**: API çalışmazsa analitik analiz devreye girer
✅ **Güvenli**: API key sadece sizin bilgisayarınızda saklanır

## 📞 Destek

Sorun yaşarsan:
1. Console'da hata mesajlarını kontrol et
2. API key'in doğru olduğundan emin ol
3. İnternet bağlantını test et
