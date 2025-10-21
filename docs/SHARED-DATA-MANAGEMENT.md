# Shared Data Yönetimi

## Veri Konumu
Tüm paylaşımlı veriler şu konumda saklanır:
`C:\Users\[Kullanıcı]\AppData\Roaming\kapsul-kocluk-program\shared\`

## Klasör Yapısı
```
shared/
├── Kazanımlar.json          (Ana kazanım veritabanı - TÜM dersler)
├── students.json             (Ortak öğrenci listesi)
├── data.json                 (Sınav sonuçları)
├── haftalikPlan.json         (Haftalık planlar)
├── evaluations/              (AI değerlendirmeleri)
└── logs/
    └── kazanim-operations.log (İşlem logları)
```

## Yedekleme
- Her kayıt işleminde otomatik `.bak` dosyası oluşturulur
- Kazanım işlemleri `shared/logs/kazanim-operations.log` dosyasına kaydedilir
- Yedek dosyalar: `dosyaadi.json.bak` formatında

## Manuel Müdahale
Shared klasöründeki dosyaları manuel düzenlerseniz:
1. Uygulamayı kapatın
2. Dosyayı düzenleyin
3. Uygulamayı açın - değişiklikler otomatik algılanır

## Veri Geri Yükleme
Hata durumunda `.bak` dosyalarından geri yükleme:
1. Shared klasörünü açın
2. `.bak` uzantılı yedek dosyayı bulun
3. `.bak` uzantısını kaldırın
4. Uygulamayı yeniden başlatın

## Kazanım Veritabanı Koruma
- CSV import sırasında duplikasyon kontrolü yapılır
- Kazanım sayısı azalması durumunda uyarı verilir
- Her değişiklik loglanır
- Otomatik yedekleme ile veri kaybı önlenir

## Log Dosyası
`shared/logs/kazanim-operations.log` dosyasında şu işlemler kaydedilir:
- Kazanım yükleme/kaydetme
- CSV import işlemleri
- Validasyon hataları
- Migrasyon işlemleri

## Sorun Giderme
1. **Kazanım kaybı uyarısı alıyorsanız:**
   - Log dosyasını kontrol edin
   - `.bak` dosyasından geri yükleyin
   - Destek ekibiyle iletişime geçin

2. **Dosya izleme çalışmıyorsa:**
   - Uygulamayı yeniden başlatın
   - Shared klasörü izinlerini kontrol edin

3. **Migrasyon sorunları:**
   - Eski veri dosyalarının varlığını kontrol edin
   - Log dosyasından hata detaylarını inceleyin
