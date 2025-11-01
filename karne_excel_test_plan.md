# Karne Excel Test Planı

## Test Amacı
`karne_excel.py` dosyasının 5, 6, 7. sınıflardaki "Sosyal Bilgiler" dersini ve 8. sınıftaki "İnkılap Tarihi" dersini doğru bir şekilde parse edip Excel'e aktardığını doğrulamak.

## Test Senaryoları

### Test 1: 5. Sınıf Öğrencisi (Sosyal Bilgiler)
**Beklenen Davranış:**
- "Sosyal Bilgiler" ders verileri doğru parse edilmeli
- Excel'de "Sosyal Bilgiler" sütunları altında veriler görülmeli

**Test Adımları:**
1. 5. sınıf öğrencisi içeren bir karne PDF'i hazırla
2. `python karne_excel.py test_5sinif.pdf` komutunu çalıştır
3. Oluşturulan Excel dosyasını aç
4. "Sosyal Bilgiler" sütunlarındaki verileri kontrol et

**Beklenen Sonuç:**
```
Sosyal Bilgiler Doğru: [değer]
Sosyal Bilgiler Yanlış: [değer]
Sosyal Bilgiler Net: [değer]
Sosyal Bilgiler Başarı%: [değer]
```

### Test 2: 8. Sınıf Öğrencisi (İnkılap Tarihi)
**Beklenen Davranış:**
- "İnkılap Tarihi" ders verileri doğru parse edilmeli
- Excel'de "Sosyal Bilgiler" sütunları altında veriler görülmeli (başlık aynı kalacak)

**Test Adımları:**
1. 8. sınıf öğrencisi içeren bir karne PDF'i hazırla
2. `python karne_excel.py test_8sinif.pdf` komutunu çalıştır
3. Oluşturulan Excel dosyasını aç
4. "Sosyal Bilgiler" sütunlarındaki verileri kontrol et

**Beklenen Sonuç:**
```
Sosyal Bilgiler Doğru: [değer]
Sosyal Bilgiler Yanlış: [değer]
Sosyal Bilgiler Net: [değer]
Sosyal Bilgiler Başarı%: [değer]
```

### Test 3: Geçersiz Sınıf Bilgisi
**Beklenen Davranış:**
- Sınıf bilgisi geçersiz olduğunda varsayılan olarak "Sosyal Bilgiler" aranmalı
- Hata vermeden çalışmalı

**Test Adımları:**
1. Sınıf bilgisi belirsiz bir karne PDF'i hazırla
2. `python karne_excel.py test_invalid.pdf` komutunu çalıştır
3. Hata mesajı olmadığını kontrol et

## Başarısızlık Senaryoları

### Senaryo 1: 8. Sınıfta "İnkılap Tarihi" Bulunamadığında
**Beklenen Davranış:**
- "İnkılap Tarihi" bulunamazsa "Sosyal Bilgiler" aranmalı
- Kod hata vermeden devam etmeli

### Senaryo 2: Regex Pattern'in Uymadığı Durum
**Beklenen Davranış:**
- PDF formatı beklenenden farklı olduğunda kod hata vermeden çalışmalı
- İlgili ders verileri boş kalmalı

## Doğrulama Kontrol Listesi

- [ ] 5. sınıf öğrencisi için "Sosyal Bilgiler" verileri doğru parse ediliyor
- [ ] 8. sınıf öğrencisi için "İnkılap Tarihi" verileri doğru parse ediliyor
- [ ] Excel'de "Sosyal Bilgiler" başlıkları her iki durumda da görünüyor
- [ ] Geçersiz sınıf bilgisi olduğunda hata verilmiyor
- [ ] Kazanımlar her iki ders türü için de doğru parse ediliyor
- [ ] Excel dosyası sorunsuz oluşturuluyor

## Test Sonuçları

| Test Senaryosu | Sonuç | Notlar |
|----------------|--------|--------|
| 5. Sınıf (Sosyal Bilgiler) | | |
| 8. Sınıf (İnkılap Tarihi) | | |
| Geçersiz Sınıf | | |

## Öneriler

1. Test sırasında konsol çıktısını gözlemle - hangi dersin tespit edildiği hakkında bilgi verir
2. Oluşturulan Excel dosyasını kontrol et - verilerin doğru sütunlara yazıldığını doğrula
3. Farklı formatlardaki karne dosyaları ile test et - gerçek dünya senaryolarını kapsar