# Karne PDF Parser Karşılaştırması
# Report Card PDF Parser Comparison

## 📋 İki Versiyon

### 1. `karne_excel.py` - Orijinal Parser (Sabit Format)
**Ne zaman kullanılır:**
- PDF formatı değişmez ve her zaman aynıdır
- "SONUÇ BELGESİ" başlığı her sayfada vardır
- Kazanım bilgileri "DERSLERE GÖRE ANALİZ" başlığı altındadır
- Sütunlar her zaman aynı sıradadır: Ders | Soru | D | Y | Net | Başarı%

**장점:**
- Hızlı çalışır
- Bilinen format için optimize edilmiş
- Daha az hata payı

### 2. `karne_excel_flexible.py` - Esnek Parser (Çoklu Format) ⭐ YENİ
**Ne zaman kullanılır:**
- PDF düzeni değişkendir
- Farklı yayınlardan/kaynaklardan gelen karneler
- Kazanım bilgileri farklı yerlerde olabilir
- Skorlar farklı formatlarda olabilir (üstte/solda/sağda)

**Özellikler:**
✅ Birden fazla pattern dener (ilk eşleşeni kullanır)
✅ Farklı başlık formatlarını tanır
✅ Sütun sırası değişse bile çalışır
✅ Otomatik format algılama
✅ Eksik alanları atlar (hata vermez)

---

## 🔧 Kullanım

### Basit Kullanım (Her İki Parser İçin)
```bash
# Orijinal parser (sabit format)
python karne_excel.py girdi.pdf

# Esnek parser (farklı formatlar)
python karne_excel_flexible.py girdi.pdf
```

### Çıktı Dosyası Belirleme
```bash
# Orijinal
python karne_excel.py girdi.pdf cikti.xlsx

# Esnek
python karne_excel_flexible.py girdi.pdf cikti_flexible.xlsx
```

---

## 📊 Format Farklılıkları Desteği

### Esnek Parser'ın Desteklediği Format Varyasyonları:

#### 1. **Öğrenci Bilgileri**
```
Format 1: Öğrenci Numara Sınıf [AD SOYAD] [123] [8-A]
Format 2: Adı Soyadı: [AD SOYAD]
Format 3: Öğrenci Adı: [AD SOYAD]
Format 4: İsim: [AD SOYAD]
```

#### 2. **LGS Skorları**
```
Format 1: LGS 450,25 420,50 1 2 3 4 5  (tek satırda)
Format 2: LGS Puanı: 450,25
Format 3: Puan: 450,25
         Ortalama: 420,50
```

#### 3. **Ders Skorları**
```
Format 1: Türkçe 20 15 3 13,5 75  (klasik tablo)
Format 2: Türkçe
         D: 15
         Y: 3
         Net: 13,5
         Başarı: 75
```

#### 4. **Sayfa Sınırları**
```
Algılanan Başlıklar:
- SONUÇ BELGESİ
- KARNE
- ÖĞRENCİ RAPORU
- SINAV SONUCU
- Öğrenci No:
```

#### 5. **Kazanım Bölümleri**
```
Algılanan Başlıklar:
- DERSLERE GÖRE ANALİZ
- KAZANIM ANALİZİ
- KAZANIMLAR
- KAZANIM DETAYLARI
- ANALİZ
- DERS ANALİZİ
```

---

## 🎯 Hangi Parser'ı Seçmeliyim?

### `karne_excel.py` Kullan Eğer:
- ✅ Her zaman aynı PDF formatını kullanıyorsanız
- ✅ Hızlı işlem istiyorsanız
- ✅ Format değişmeyecekse

### `karne_excel_flexible.py` Kullan Eğer:
- ✅ Farklı kaynaklardan PDF'ler geliyorsa
- ✅ PDF formatı değişebiliyorsa
- ✅ Kazanım/skor konumları farklıysa
- ✅ Yeni bir PDF formatıyla karşılaştıysanız

---

## 🔍 Teknik Detaylar

### Esnek Parser'ın Çalışma Prensibi

```python
# Birden fazla pattern dener
def try_patterns(self, field_name, patterns):
    """Birden fazla pattern dene, ilk eşleşeni döndür"""
    for pattern in patterns:
        match = re.search(pattern, self.text)
        if match:
            return match  # İlk eşleşeni kullan
    return None  # Hiçbiri eşleşmezse None
```

### Pattern Öncelik Sırası
1. **En spesifik pattern** önce denenir
2. Eşleşmezse **daha genel pattern**
3. Hala eşleşmezse **fallback pattern**
4. Son olarak **en basit pattern**

### Örnek: Ad Soyad Çıkarma
```python
name_patterns = [
    # 1. En spesifik - tam format
    r'Öğrenci.*?Numara.*?Sınıf\s+([\w\s]+?)\s+(\d+)\s+([\d\-A-Z]+)',

    # 2. Label ile
    r'Ad[ıi]\s+Soyad[ıi][:：]?\s*([\w\s]+)',

    # 3. Daha genel
    r'Öğrenci\s+Ad[ıi][:：]?\s*([\w\s]+)',

    # 4. En basit
    r'(?:İsim|Ad|Name)[:：]?\s*([\w\s]{3,50}?)',
]
```

---

## 📝 Örnek Kullanım Senaryoları

### Senaryo 1: Tek Format PDF'ler
```bash
# 50 öğrenci, hepsi aynı format
python karne_excel.py tum_ogrenciler.pdf sonuc.xlsx
```
**Sonuç:** ✅ Hızlı ve doğru

---

### Senaryo 2: Karışık Format PDF'ler
```bash
# Bazı sayfalar farklı düzende
python karne_excel_flexible.py karisik_formatlar.pdf sonuc.xlsx
```
**Sonuç:** ✅ Tüm formatları algılar

---

### Senaryo 3: Yeni Format Deneme
```bash
# Önce esnek parser'ı dene
python karne_excel_flexible.py yeni_format.pdf test.xlsx

# Çalışırsa, hızlı versiyon için pattern ekle
# Çalışmazsa, daha fazla pattern ekle
```

---

## 🛠️ Gereksinimler

Her iki parser için aynı:
```bash
pip install PyMuPDF openpyxl
```

---

## 🐛 Sorun Giderme

### Problem: "Hiçbir öğrenci bulunamadı"

**Çözüm 1:** Esnek parser kullan
```bash
python karne_excel_flexible.py dosya.pdf
```

**Çözüm 2:** PDF'den örnek metin çıkar
```bash
python karne_excel_flexible.py dosya.pdf -v  # verbose mode (eklenecek)
```

**Çözüm 3:** Manuel inceleme
```python
import fitz
doc = fitz.open('dosya.pdf')
print(doc[0].get_text())  # İlk sayfayı göster
```

---

### Problem: "Bazı alanlar boş"

**Normal durumlar:**
- ✅ Öğrenci testi çözmemiş (tüm alanlar boş)
- ✅ Öğrenci full yapmış (kazanım eksik yok)
- ✅ O ders yoktu (ders alanları boş)

**Gerçek problem ise:**
- Esnek parser kullanın
- Veya yeni pattern ekleyin

---

## 📈 Performans

| Parser | Hız | Esneklik | Hata Toleransı |
|--------|-----|----------|----------------|
| `karne_excel.py` | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| `karne_excel_flexible.py` | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🔮 Gelecek Özellikler (karne_excel_flexible.py)

Planlanan iyileştirmeler:
- [ ] AI/LLM tabanlı parsing (GPT-4 Vision ile)
- [ ] Otomatik pattern öğrenme
- [ ] OCR desteği (taranmış PDF'ler için)
- [ ] Verbose mode (detaylı log)
- [ ] Format validasyon raporu
- [ ] Batch processing (klasör düzeyinde)

---

## 📞 Destek

Sorun yaşarsanız:
1. Önce `karne_excel_flexible.py` deneyin
2. PDF'den örnek sayfa gönderin
3. Hata mesajını paylaşın

---

## 📄 Lisans

MIT License - Kapsül Koçluk Programı

---

**Güncellenme:** 2025-10-25
**Versiyon:** 1.0 (Flexible Parser)
