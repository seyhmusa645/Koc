# Kabiliyet Verisi Entegrasyonu - Test Senaryoları

Bu doküman, yeni kabiliyet verisi entegrasyonunun test edilmesi için gerekli senaryoları içerir.

## Test Senaryoları

### Senaryo A: Müdür Hesabı ile CSV Import
**Amaç:** Müdür hesabıyla yeni CSV formatını import etme ve kabiliyet verilerinin doğru şekilde işlenmesi

**Adımlar:**
1. Müdür hesabıyla giriş yap
2. `data/example_students_summary.csv` dosyasını import et
3. Öğrenci listesinde kabiliyet verilerinin görüntülendiğini kontrol et
4. Bir öğrenciyi seç ve detay panelinde kabiliyet rozetlerinin görüntülendiğini kontrol et
5. `data/students.json` dosyasında kabiliyet verilerinin kaydedildiğini kontrol et

**Beklenen Sonuç:**
- CSV başarıyla import edilir
- Öğrenci detay panelinde 8 kabiliyet rozeti görüntülenir
- Rozetlerde seviye ve puan bilgileri doğru şekilde gösterilir
- En güçlü ve zayıf kabiliyetler doğru şekilde analiz edilir
- Öğrenme stili bilgisi görüntülenir

### Senaryo B: Öğretmen Hesabı ile Veri Görüntüleme
**Amaç:** Öğretmen hesabıyla kabiliyet verilerini görüntüleme (sadece okuma)

**Adımlar:**
1. Öğretmen hesabıyla giriş yap
2. Öğrenci listesini görüntüle
3. Bir öğrenciyi seç ve detay panelinde kabiliyet verilerinin görüntülendiğini kontrol et
4. CSV import butonunun devre dışı olduğunu kontrol et
5. Öğrenci ekleme butonunun devre dışı olduğunu kontrol et

**Beklenen Sonuç:**
- Kabiliyet verileri görüntülenir
- Düzenleme butonları devre dışıdır
- Sadece okuma erişimi vardır

### Senaryo C: Eski CSV Formatı ile Import
**Amaç:** Eski formatlı CSV dosyası ile import denemesi ve hata mesajının gösterilmesi

**Adımlar:**
1. Müdür hesabıyla giriş yap
2. Eski formatlı CSV dosyası (kabiliyet kolonları olmayan) import etmeye çalış
3. Hata mesajının gösterildiğini kontrol et

**Beklenen Sonuç:**
- "CSV'de eksik kolonlar" hatası gösterilir
- Import işlemi başarısız olur
- Kullanıcıya anlamlı hata mesajı verilir

### Senaryo D: Veri Migrasyonu
**Amaç:** Mevcut öğrenci verilerinin yeni şemaya migrate edilmesi

**Adımlar:**
1. Mevcut `students.json` dosyasını backup al
2. `scripts/migrate_students_data.js` scriptini çalıştır
3. Migrasyon sonrası öğrenci verilerini kontrol et
4. UI'da kabiliyet verilerinin görüntülendiğini kontrol et

**Beklenen Sonuç:**
- Eski veriler yeni şemaya migrate edilir
- Backup dosyası oluşturulur
- UI'da kabiliyet verileri görüntülenir

### Senaryo E: Öğrenci Güncelleme
**Amaç:** Mevcut öğrencinin kabiliyet verilerinin güncellenmesi

**Adımlar:**
1. Müdür hesabıyla giriş yap
2. Mevcut bir öğrenciyi seç
3. Yeni kabiliyet verileri ile CSV import et
4. Öğrencinin güncellendiğini kontrol et

**Beklenen Sonuç:**
- Öğrenci verileri güncellenir
- Yeni kabiliyet verileri kaydedilir
- UI'da güncellenmiş veriler görüntülenir

## Test Verileri

### Örnek CSV Dosyası
`data/example_students_summary.csv` dosyası test için hazırlanmıştır ve şu özellikleri içerir:
- 25 öğrenci verisi
- Tüm zorunlu kolonlar
- Tüm kabiliyet kolonları
- Çeşitli öğrenme stilleri
- Farklı kabiliyet seviyeleri

### Test Komutları

```bash
# Migrasyon scriptini çalıştır
node scripts/migrate_students_data.js

# Uygulamayı başlat
npm start
```

## Hata Durumları

### Yaygın Hatalar ve Çözümleri

1. **"CSV'de eksik kolonlar" hatası**
   - Çözüm: CSV dosyasının yeni şemaya uygun olduğundan emin ol

2. **"Geçersiz öğrenci verisi" hatası**
   - Çözüm: CSV dosyasının doğru formatda olduğundan emin ol

3. **Kabiliyet rozetleri görüntülenmiyor**
   - Çözüm: Öğrenci verilerinin migrate edildiğinden emin ol

4. **Öğrenme stili görüntülenmiyor**
   - Çözüm: CSV'de "Öğrenme Stili" kolonunun olduğundan emin ol

## Başarı Kriterleri

- ✅ CSV import başarılı
- ✅ Kabiliyet rozetleri görüntüleniyor
- ✅ Öğrenme stili bilgisi görüntüleniyor
- ✅ En güçlü/zayıf kabiliyetler doğru analiz ediliyor
- ✅ Öğretmen rolünde düzenleme butonları devre dışı
- ✅ Veri migrasyonu başarılı
- ✅ Hata mesajları anlamlı
- ✅ UI responsive ve kullanıcı dostu
