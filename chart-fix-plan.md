# 🔧 Grafik Veri Düzeltme Planı

## 🔍 Tespit Edilen Sorunlar

### Problem 1: Net Değerleri Kayıtlı Değil
**Durum:**
- `data.json` dosyasında sadece `correct`, `incorrect`, `blank` var
- `course.net` alanı hiç yazılmamış
- `preparePerformanceComparisonData` fonksiyonu `course.net` değerine güveniyor
- Sonuç: Tüm ortalamalar ve son deneme değerleri **0** çıkıyor

**Etkilenen Dosya:**
- `src/renderer.js` (satır 533-586)
- `C:\Users\Program Geliştirme\AppData\Roaming\kapsul-kocluk-programi\shared\data.json`

### Problem 2: Tarih ve Duplicate Kayıtlar
**Durum:**
- Tüm denemeler aynı tarihe kayıtlı (2025-10-17)
- Aynı sınav için duplicate kayıtlar var (biri gerçek, biri sıfır)
- Trend grafiği anlamlı ilerleme gösteremiyor
- Zaman ekseninde tüm noktalar üst üste

**Etkilenen Dosya:**
- `src/renderer.js` (satır 464-523)

## 💡 Çözüm Stratejisi

### Faz 1: Net Hesaplama Düzeltmesi (ÖNCELİK #1) ⭐

#### 1.1 preparePerformanceComparisonData Fonksiyonu Güncelleme
```javascript
// ÖNCEKİ (Hatalı):
const net = exam.courses[subjectKey].net || 0;

// YENİ (Düzeltilmiş):
const course = exam.courses[subjectKey];
const net = course.net ?? (course.correct - (course.incorrect / 4));
```

**Değiştirilecek Yerler:**
- `src/renderer.js` satır ~551
- Tüm net kullanan fonksiyonlar

#### 1.2 Yeni Sınav Kaydı Oluştururken Net Kaydetme
```javascript
// Sınav ekleme/güncelleme sırasında
examToUpdate.courses[subjectKey] = {
  correct,
  incorrect,
  blank,
  net: correct - (incorrect / 4)  // 🆕 YENİ: Net'i hesapla ve kaydet
};
```

**Değiştirilecek Yerler:**
- `src/renderer.js` satır ~2774-2811 (addExamForm submit)
- `src/renderer.js` satır ~926 (editExamForm submit)

### Faz 2: Mevcut Veri Backfill (ÖNCELİK #2) ⭐

#### 2.1 Backfill Script Oluşturma
```javascript
// scripts/backfill-net-values.js
const fs = require('fs');
const path = require('path');

const dataPath = 'C:\\Users\\Program Geliştirme\\AppData\\Roaming\\kapsul-kocluk-programi\\shared\\data.json';

// Veriyi oku
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

// Her sınav için net hesapla
if (data.value && Array.isArray(data.value)) {
  data.value.forEach(exam => {
    if (exam.courses) {
      Object.keys(exam.courses).forEach(subject => {
        const course = exam.courses[subject];
        // Net yoksa hesapla
        if (course.net === undefined || course.net === null) {
          course.net = course.correct - (course.incorrect / 4);
        }
      });
    }
  });
}

// Yedek oluştur
const backupPath = dataPath + '.backup-' + Date.now();
fs.writeFileSync(backupPath, rawData);

// Güncellenmiş veriyi kaydet
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log(`✅ Backfill tamamlandı. Yedek: ${backupPath}`);
```

### Faz 3: Tarih ve Duplicate Düzeltmeleri (ÖNCELİK #3)

#### 3.1 Sınav Eklerken Tarih Kontrolü
```javascript
// Aynı profil + tarih + sınav adı kontrolü
function checkDuplicateExam(profile, date, examName) {
  const existing = allExams.find(exam => 
    exam.profile === profile && 
    exam.date === date && 
    exam.name === examName
  );
  
  if (existing) {
    // Kullanıcıya sor: Güncelle mi, yeni kayıt mı?
    return confirm('Bu sınav zaten kayıtlı. Güncellemek ister misiniz?');
  }
  return true;
}
```

#### 3.2 Trend Grafiği için Tarih Validation
```javascript
// Trend grafiğinde yinelenen kayıtları filtrele
function filterDuplicateExams(exams) {
  const seen = new Map();
  
  return exams.filter(exam => {
    const key = `${exam.profile}_${exam.date}_${exam.name}`;
    
    // Eğer bu key'i daha önce gördüysek
    if (seen.has(key)) {
      // Boş değerleri atla (sıfırlanmış kayıtlar)
      const totalNet = Object.values(exam.courses || {})
        .reduce((sum, c) => sum + (c.net || 0), 0);
      if (totalNet === 0) return false;
    }
    
    seen.set(key, exam);
    return true;
  });
}
```

### Faz 4: CSV/JSON Import Düzeltmeleri (ÖNCELİK #4)

#### 4.1 Tarih Mapping
```javascript
// Import sırasında tarih sütununu oku
function importExamData(csvData) {
  // Tarih sütunu yoksa kullanıcıdan iste
  const dateColumn = detectDateColumn(csvData) || askUserForDateColumn();
  
  csvData.forEach(row => {
    const examDate = row[dateColumn] || new Date().toISOString().split('T')[0];
    // ...
  });
}
```

## 📊 Uygulama Sırası

### Sprint 1: Net Hesaplama (1-2 saat)
1. ✅ `preparePerformanceComparisonData` fonksiyonunu güncelle
2. ✅ Sınav ekleme formunu güncelle (net kaydetme)
3. ✅ Sınav düzenleme formunu güncelle (net kaydetme)
4. ✅ Test: Yeni sınav ekle, grafiği kontrol et

### Sprint 2: Backfill Script (30 dakika)
5. ✅ `scripts/backfill-net-values.js` oluştur
6. ✅ Yedek al ve scripti çalıştır
7. ✅ Test: Eski kayıtların grafikte görünmesini doğrula

### Sprint 3: Tarih ve Duplicate (1-2 saat)
8. ✅ Duplicate kontrol fonksiyonu ekle
9. ✅ Trend grafiği filtreleme ekle
10. ✅ CSV import tarih mapping ekle
11. ✅ Test: Import ve trend grafiği

### Sprint 4: Son Kontroller (30 dakika)
12. ✅ Rastgele 3-5 öğrenci için tüm grafikleri test et
13. ✅ `comparisonData.overallAverage` ve `lastExam` değerlerini konsola logla
14. ✅ Yeni veri import et ve doğruluğunu kontrol et

## 🎯 Başarı Kriterleri

### Performans Karşılaştırma Grafiği:
- ✅ `overallAverage` değerleri 0'dan farklı
- ✅ `lastExam` değerleri 0'dan farklı
- ✅ Trend okları doğru yönde (⬆️⬇️)
- ✅ Net değerleri mantıklı aralıkta (0-20 arası)

### Ders Bazında Gelişim Trendi:
- ✅ Zaman ekseninde farklı tarihler görünüyor
- ✅ Çizgiler yumuşak (duplicate'ler yok)
- ✅ Aynı sınavın iki versiyonu yok

### Veri Bütünlüğü:
- ✅ `data.json` dosyasında tüm kayıtlarda `net` alanı var
- ✅ Yedek dosyası oluşturulmuş
- ✅ Yeni kayıtlar doğru formatta

## 🔧 Teknik Detaylar

### Net Hesaplama Formülü:
```javascript
net = doğru - (yanlış / 4)
```

### Veri Yapısı (ÖNCEKİ):
```json
{
  "courses": {
    "matematik": {
      "correct": 15,
      "incorrect": 4,
      "blank": 1
      // ❌ net YOK!
    }
  }
}
```

### Veri Yapısı (YENİ):
```json
{
  "courses": {
    "matematik": {
      "correct": 15,
      "incorrect": 4,
      "blank": 1,
      "net": 14.0  // ✅ net EKLENDI!
    }
  }
}
```

## 📝 Commit Stratejisi

### Commit 1: Net Hesaplama
```
feat: Add net calculation to exam forms

- Update preparePerformanceComparisonData to calculate net if missing
- Save net value when creating/editing exams
- Fallback to calculated net for existing data
```

### Commit 2: Backfill Script
```
chore: Add backfill script for net values

- Create backfill-net-values.js script
- Auto-calculate net for existing exams
- Create backup before updating data.json
```

### Commit 3: Duplicate Handling
```
fix: Handle duplicate exams and improve date validation

- Add duplicate exam detection
- Filter zero-value duplicates from trend chart
- Improve date handling in imports
```

## 🚀 Sonuç

Bu plan uygulandığında:
- ✅ **Performans Karşılaştırma Grafiği** çalışacak
- ✅ **Ders Bazında Gelişim Trendi** anlamlı olacak
- ✅ **Eski veriler** düzeltilecek
- ✅ **Yeni veriler** doğru kaydedilecek
- ✅ **Duplicate kayıtlar** önlenecek

**Tahmini Süre:** 3-4 saat
**Risk Seviyesi:** Düşük (yedekleme ile güvenli)
**Öncelik:** Yüksek (grafikler kullanılamaz durumda)

