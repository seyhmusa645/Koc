# Karne Excel Düzeltme Planı

## Sorun Analizi
`karne_excel.py` dosyasında 5, 6, 7. sınıflardaki "Sosyal Bilgiler" dersinin ve 8. sınıftaki "İnkılap Tarihi" dersinin doğru bir şekilde parse edilememesi sorunu bulunmaktadır.

### Mevcut Sorunlar:
1. **Satır 116-130:** Sadece "Tarih" ve "Sosyal Bilgiler" aranıyor, "İnkılap" aranmıyor
2. **Satır 220:** Excel başlıkları sadece "Tarih" olarak etiketlenmiş
3. **Değişken adlandırması:** Hem Tarih hem de Sosyal Bilgiler için aynı değişkenler kullanılıyor (`tarih_dogru`, `tarih_yanlis`, vb.)

## Çözüm Stratejisi

### 1. Sınıf Seviyesine Göre Ders Adını Belirleme Fonksiyonu
```python
def get_social_subject_name(sinif):
    """Sınıfa göre sosyal bilimler ders adını döndürür"""
    # Sınıf bilgisinden rakamı çıkar
    sinif_num = 0
    try:
        sinif_num = int(re.search(r'\d+', sinif).group())
    except:
        pass
    
    if sinif_num >= 8:  # 8. sınıf ve üzeri
        return "İnkılap Tarihi"
    else:  # 5, 6, 7. sınıflar
        return "Sosyal Bilgiler"
```

### 2. parse_student_page Fonksiyonunda Güncelleme
```python
# Öğrenci sınıfını al
sinif = student_data.get('sinif', '')
sosyal_ders_adi = get_social_subject_name(sinif)

# Sınıfa göre doğru ders adını ara
if sinif_num >= 8:
    # İnkılap Tarihi ara (8. sınıf)
    inkilap_match = re.search(r'İnkılap Tarihi.*?10\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)', text)
    if inkilap_match:
        student_data['sosyal_dogru'] = inkilap_match.group(1)
        student_data['sosyal_yanlis'] = inkilap_match.group(2)
        student_data['sosyal_net'] = inkilap_match.group(3).replace(',', '.')
        student_data['sosyal_basari'] = inkilap_match.group(4)
else:
    # Sosyal Bilgiler ara (5, 6, 7. sınıf)
    sos_match = re.search(r'(?:Sosyal Bilgiler|SOSYAL BİLGİLER|Tarih)\s+10\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)', text)
    if sos_match:
        student_data['sosyal_dogru'] = sos_match.group(1)
        student_data['sosyal_yanlis'] = sos_match.group(2)
        student_data['sosyal_net'] = sos_match.group(3).replace(',', '.')
        student_data['sosyal_basari'] = sos_match.group(4)
```

### 3. Excel Başlıklarını Güncelleme
```python
# Başlık satırı (satır 215-227)
headers = [
    'Ad Soyad', 'Numara', 'Sınıf', 'Katılımlar',
    'LGS Puanı', 'LGS Ortalama', 'Sınıf Derecesi', 'Kurum Derecesi', 
    'İlçe Derecesi', 'İl Derecesi', 'Genel Derece',
    'Türkçe Doğru', 'Türkçe Yanlış', 'Türkçe Net', 'Türkçe Başarı%',
    'Sosyal Bilgiler Doğru', 'Sosyal Bilgiler Yanlış', 'Sosyal Bilgiler Net', 'Sosyal Bilgiler Başarı%',
    'Din Doğru', 'Din Yanlış', 'Din Net', 'Din Başarı%',
    'İngilizce Doğru', 'İngilizce Yanlış', 'İngilizce Net', 'İngilizce Başarı%',
    'Matematik Doğru', 'Matematik Yanlış', 'Matematik Net', 'Matematik Başarı%',
    'Fen Doğru', 'Fen Yanlış', 'Fen Net', 'Fen Başarı%',
    'Toplam Doğru', 'Toplam Yanlış', 'Toplam Net', 'Toplam Başarı%',
    'Kazanım Detayları'
]
```

### 4. Veri Satırını Güncelleme
```python
# Verileri yaz (satır 252-293)
data_row = [
    student_data.get('ad_soyad', ''),
    student_data.get('numara', ''),
    student_data.get('sinif', ''),
    student_data.get('katilimlar', ''),
    student_data.get('lgs_puan', ''),
    student_data.get('lgs_ortalama', ''),
    student_data.get('sinif_derecesi', ''),
    student_data.get('kurum_derecesi', ''),
    student_data.get('ilce_derecesi', ''),
    student_data.get('il_derecesi', ''),
    student_data.get('genel_derece', ''),
    student_data.get('turk_dogru', ''),
    student_data.get('turk_yanlis', ''),
    student_data.get('turk_net', ''),
    student_data.get('turk_basari', ''),
    student_data.get('sosyal_dogru', ''),  # Değiştirildi
    student_data.get('sosyal_yanlis', ''),  # Değiştirildi
    student_data.get('sosyal_net', ''),  # Değiştirildi
    student_data.get('sosyal_basari', ''),  # Değiştirildi
    student_data.get('din_dogru', ''),
    student_data.get('din_yanlis', ''),
    student_data.get('din_net', ''),
    student_data.get('din_basari', ''),
    student_data.get('ing_dogru', ''),
    student_data.get('ing_yanlis', ''),
    student_data.get('ing_net', ''),
    student_data.get('ing_basari', ''),
    student_data.get('mat_dogru', ''),
    student_data.get('mat_yanlis', ''),
    student_data.get('mat_net', ''),
    student_data.get('mat_basari', ''),
    student_data.get('fen_dogru', ''),
    student_data.get('fen_yanlis', ''),
    student_data.get('fen_net', ''),
    student_data.get('fen_basari', ''),
    student_data.get('toplam_dogru', ''),
    student_data.get('toplam_yanlis', ''),
    student_data.get('toplam_net', ''),
    student_data.get('toplam_basari', ''),
    student_data.get('kazanimlar_ozet', 'Yok')
]
```

## Tam Çözüm Kodu

### 1. Yeni Fonksiyon Ekleme (satır 10'dan sonra)
```python
def get_social_subject_name(sinif):
    """Sınıfa göre sosyal bilimler ders adını döndürür"""
    # Sınıf bilgisinden rakamı çıkar
    sinif_num = 0
    try:
        sinif_num = int(re.search(r'\d+', sinif).group())
    except:
        pass
    
    if sinif_num >= 8:  # 8. sınıf ve üzeri
        return "İnkılap Tarihi"
    else:  # 5, 6, 7. sınıflar
        return "Sosyal Bilgiler"
```

### 2. parse_student_page Fonksiyonunda Güncelleme (satır 116-130 arası)
```python
    # Sınıfa göre sosyal bilgiler/inkılap tarihi bilgisi
    sinif = student_data.get('sinif', '')
    sosyal_ders_adi = get_social_subject_name(sinif)
    
    # Sınıf numarasını belirle
    sinif_num = 0
    try:
        sinif_num = int(re.search(r'\d+', sinif).group())
    except:
        pass
    
    if sinif_num >= 8:
        # İnkılap Tarihi ara (8. sınıf)
        inkilap_match = re.search(r'İnkılap Tarihi.*?10\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)', text)
        if inkilap_match:
            student_data['sosyal_dogru'] = inkilap_match.group(1)
            student_data['sosyal_yanlis'] = inkilap_match.group(2)
            student_data['sosyal_net'] = inkilap_match.group(3).replace(',', '.')
            student_data['sosyal_basari'] = inkilap_match.group(4)
    else:
        # Sosyal Bilgiler ara (5, 6, 7. sınıf)
        sos_match = re.search(r'(?:Sosyal Bilgiler|SOSYAL BİLGİLER|Tarih)\s+10\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)', text)
        if sos_match:
            student_data['sosyal_dogru'] = sos_match.group(1)
            student_data['sosyal_yanlis'] = sos_match.group(2)
            student_data['sosyal_net'] = sos_match.group(3).replace(',', '.')
            student_data['sosyal_basari'] = sos_match.group(4)
```

### 3. Excel Başlıklarını Güncelleme (satır 220)
```python
    'Sosyal Bilgiler Doğru', 'Sosyal Bilgiler Yanlış', 'Sosyal Bilgiler Net', 'Sosyal Bilgiler Başarı%',
```

### 4. Veri Satırını Güncelleme (satır 268-271)
```python
    student_data.get('sosyal_dogru', ''),
    student_data.get('sosyal_yanlis', ''),
    student_data.get('sosyal_net', ''),
    student_data.get('sosyal_basari', ''),
```

## Test Senaryoları

### Test 1: 5. Sınıf Öğrencisi
- Beklenen: "Sosyal Bilgiler" ders verileri doğru parse edilmeli
- Kontrol: Excel'de "Sosyal Bilgiler" başlıkları altında veriler görülmeli

### Test 2: 8. Sınıf Öğrencisi
- Beklenen: "İnkılap Tarihi" ders verileri doğru parse edilmeli
- Kontrol: Excel'de "Sosyal Bilgiler" başlıkları altında veriler görülmeli

### Test 3: Geçersiz Sınıf Bilgisi
- Beklenen: Varsayılan olarak "Sosyal Bilgiler" aranmalı
- Kontrol: Hata vermeden çalışmalı

## Uygulama Adımları

1. `karne_excel.py` dosyasını aç
2. Yukarıdaki kod değişikliklerini uygula
3. Farklı sınıflardan örnek karne dosyaları ile test et
4. Excel çıktısını kontrol et

Bu çözüm, hem 5-6-7. sınıfların "Sosyal Bilgiler" dersini hem de 8. sınıfın "İnkılap Tarihi" dersini doğru bir şekilde parse edecek ve Excel'e uygun formatta yazacaktır.