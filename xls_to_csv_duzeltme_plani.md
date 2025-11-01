# XLS to CSV Converter Düzeltme Planı

## Sorun Analizi

`xls_to_csv_converter.py` dosyasında Sosyal Bilgiler/İnkılap Tarihi ayrımı konusunda şu sorunlar bulunmaktadır:

### Mevcut Sorunlar

1. **Eksik Subject Mapping (Satır 38-46):**
   - "Tarih" → "sosyal" olarak eşleştirilmiş
   - "Sosyal Bilgiler" için ayrı bir mapping yok
   - "İnkılap Tarihi" için hiç mapping yok

2. **CSV Başlığı Sorunu (Satır 252):**
   - Sadece "Sosyal_Doğru" olarak tek başlık kullanılıyor
   - 8. sınıftaki "İnkılap Tarihi" için bu başlık uygun olmayabilir

3. **Sınıf Seviyesi Kontrolü Yok:**
   - Kod, sınıf seviyesine göre farklı ders adlarını desteklemiyor
   - 5-6-7. sınıflar için "Sosyal Bilgiler"
   - 8. sınıf için "İnkılap Tarihi" ayrımı yapılmamıyor

## Çözüm Stratejisi

### 1. Subject Mapping'i Genişletme

```python
# Mevcut mapping (satır 38-46)
self.subject_mapping = {
    'Türkçe': 'turkce',
    'Tarih': 'sosyal',  # Tarih → Sosyal
    'Sosyal Bilgiler': 'sosyal',  # YENİ: Doğrudan eşleştirme
    'Matematik': 'matematik',
    'Fen': 'fen',
    'İngilizce': 'ingilizce',
    'Din': 'din'
    # YENİ: İnkılap Tarihi desteği
    'İnkılap Tarihi': 'sosyal',  # İnkılap → sosyal olarak işle
}
```

### 2. Sınıf Seviyesine Göre Dinamik Mapping

```python
def get_social_subject_mapping(sinif_str):
    """Sınıfa göre sosyal bilimler ders adını döndürür"""
    sinif_num = 0
    try:
        sinif_num = int(re.search(r'\d+', sinif_str).group())
    except:
        pass
    
    if sinif_num >= 8:  # 8. sınıf ve üzeri
        return {
            'İnkılap Tarihi': 'sosyal'  # İnkılap → sosyal olarak işle
        }
    else:  # 5, 6, 7. sınıflar
        return {
            'Sosyal Bilgiler': 'sosyal',
            'Tarih': 'sosyal'  # Tarih → sosyal olarak işle
        }
```

### 3. Dinamik CSV Başlığı Oluşturma

```python
def get_social_csv_headers(sinif_str):
    """Sınıfa göre CSV başlıkları döndürür"""
    sinif_num = 0
    try:
        sinif_num = int(re.search(r'\d+', sinif_str).group())
    except:
        pass
    
    if sinif_num >= 8:  # 8. sınıf ve üzeri
        return 'İnkılap Tarihi'  # İnkılap Tarihi olarak göster
    else:  # 5, 6, 7. sınıflar
        return 'Sosyal Bilgiler'  # Sosyal Bilgiler olarak göster
```

## Tam Çözüm Kodu

### 1. Sınıf Seviyesine Göre Mapping Fonksiyonu (satır 57'dan sonra ekle)

```python
def get_social_subject_mapping(sinif_str):
    """Sınıfa göre sosyal bilimler ders adını döndürür"""
    sinif_num = 0
    try:
        sinif_num = int(re.search(r'\d+', sinif_str).group())
    except:
        pass
    
    if sinif_num >= 8:  # 8. sınıf ve üzeri
        return {
            'İnkılap Tarihi': 'sosyal'  # İnkılap → sosyal olarak işle
        }
    else:  # 5, 6, 7. sınıflar
        return {
            'Sosyal Bilgiler': 'sosyal',
            'Tarih': 'sosyal'  # Tarih → sosyal olarak işle
        }
```

### 2. Dinamik CSV Başlığı Fonksiyonu (satır 57'dan sonra ekle)

```python
def get_social_csv_headers(sinif_str):
    """Sınıfa göre CSV başlıkları döndürür"""
    sinif_num = 0
    try:
        sinif_num = int(re.search(r'\d+', sinif_str).group())
    except:
        pass
    
    if sinif_num >= 8:  # 8. sınıf ve üzeri
        return 'İnkılap Tarihi'  # İnkılap Tarihi olarak göster
    else:  # 5, 6, 7. sınıflar
        return 'Sosyal Bilgiler'  # Sosyal Bilgiler olarak göster
```

### 3. convert_row Fonksiyonunda Güncelleme (satır 166-234 arası)

```python
def convert_row(self, xls_row: Dict) -> Optional[Dict]:
    """Tek XLS satırını CSV formatına dönüştür"""
    try:
        # Temel bilgiler
        ogrenci_adi = xls_row.get('Ad Soyad', '').strip()
        if not ogrenci_adi:
            return None
        
        sinif_str = xls_row.get('Sınıf', '')
        sinif_level = self.extract_class_level(sinif_str)
        sosyal_header = get_social_csv_headers(sinif_str)
        sosyal_mapping = get_social_subject_mapping(sinif_str)
        
        # Bugünün tarihi
        sinav_tarihi = datetime.now().strftime('%Y-%m-%d')
        
        # LGS Puanını al
        lgs_puani = xls_row.get('LGS Puanı', 0)
        try:
            lgs_puani = float(lgs_puani) if lgs_puani else 0
        except (ValueError, TypeError):
            lgs_puani = 0
        
        # CSV satırı başlat
        csv_row = {
            'Öğrenci Adı': ogrenci_adi,
            'Sınav Adı': 'Karne Sınavı',
            'Sınav Tarihi': sinav_tarihi,
            'LGS_Puanı': lgs_puani
        }
        
        # Kazanımları parse et
        kazanim_str = xls_row.get('Kazanım Detayları', '')
        kazanimlar = self.parse_kazanimlar(kazanim_str)
        
        # Her ders için veri işle
        subjects = ['turkce', 'matematik', 'fen', 'sosyal', 'ingilizce', 'din']
        
        for subject in subjects:
            # XLS'teki sütun adlarını bul (dinamik mapping ile)
            xls_subject_name = None
            for xls_name, sys_name in self.subject_mapping.items():
                if sys_name == subject:
                    xls_subject_name = xls_name
                    break
            
            # Sosyal dersler için özel mapping kullan
            if subject == 'sosyal':
                for xls_name, sys_name in sosyal_mapping.items():
                    if xls_name in xls_row:
                        xls_subject_name = xls_name
                        break
            
            if not xls_subject_name:
                continue
            
            # Doğru ve yanlış sayılarını al
            dogru_key = f'{xls_subject_name} Doğru'
            yanlis_key = f'{xls_subject_name} Yanlış'
            
            dogru = xls_row.get(dogru_key, 0)
            yanlis = xls_row.get(yanlis_key, 0)
            
            # Boş sayısını hesapla
            bos = self.calculate_bos(sinif_level, subject, dogru, yanlis)
            
            # Yanlış kazanımları al
            yanlis_kazanimlar = kazanimlar.get(subject, [])
            yanlis_kazanim_str = ' | '.join(yanlis_kazanimlar) if yanlis_kazanimlar else ''
            
            # CSV sütunlarını doldur (sosyal için dinamik başlık)
            if subject == 'sosyal':
                csv_row[f'{sosyal_header}_Doğru'] = dogru
                csv_row[f'{sosyal_header}_Yanlış'] = yanlis
                csv_row[f'{sosyal_header}_Boş'] = bos
                csv_row[f'{sosyal_header}_Yanlış_Kazanımlar'] = yanlis_kazanim_str
            else:
                subject_name = subject.capitalize()
                csv_row[f'{subject_name}_Doğru'] = dogru
                csv_row[f'{subject_name}_Yanlış'] = yanlis
                csv_row[f'{subject_name}_Boş'] = bos
                csv_row[f'{subject_name}_Yanlış_Kazanımlar'] = yanlis_kazanim_str
        
        return csv_row
        
    except Exception as e:
        print(f"❌ Satır dönüştürme hatası: {e}")
        return None
```

### 4. CSV Başlıklarını Dinamik Oluşturma (satır 247-255 arası)

```python
def write_csv(self, data: List[Dict], output_path: str):
    """CSV dosyasını yaz"""
    if not data:
        print("❌ Yazılacak veri yok")
        return
    
    # İlk satırdan sınıf bilgisini al
    sinif_str = data[0].get('Sınıf', '') if data else ''
    sosyal_header = get_social_csv_headers(sinif_str)
    
    # CSV başlıkları
    headers = [
        'Öğrenci Adı', 'Sınav Adı', 'Sınav Tarihi', 'LGS_Puanı',
        'Türkçe_Doğru', 'Türkçe_Yanlış', 'Türkçe_Boş', 'Türkçe_Yanlış_Kazanımlar',
        'Matematik_Doğru', 'Matematik_Yanlış', 'Matematik_Boş', 'Matematik_Yanlış_Kazanımlar',
        'Fen_Doğru', 'Fen_Yanlış', 'Fen_Boş', 'Fen_Yanlış_Kazanımlar',
        f'{sosyal_header}_Doğru', f'{sosyal_header}_Yanlış', f'{sosyal_header}_Boş', f'{sosyal_header}_Yanlış_Kazanımlar',
        'İngilizce_Doğru', 'İngilizce_Yanlış', 'İngilizce_Boş', 'İngilizce_Yanlış_Kazanımlar',
        'Din_Doğru', 'Din_Yanlış', 'Din_Boş', 'Din_Yanlış_Kazanımlar'
    ]
```

## Test Senaryoları

### Test 1: 5. Sınıf Öğrencisi (Sosyal Bilgiler)
**Beklenen Davranış:**
- "Sosyal Bilgiler" olarak CSV başlıkları oluşturulmalı
- Veriler doğru sütunlara yazılmalı

### Test 2: 8. Sınıf Öğrencisi (İnkılap Tarihi)
**Beklenen Davranış:**
- "İnkılap Tarihi" olarak CSV başlıkları oluşturulmalı
- Veriler doğru sütunlara yazılmalı

## Uygulama Adımları

1. `xls_to_csv_converter.py` dosyasını aç
2. Yukarıdaki kod değişikliklerini uygula
3. Farklı sınıflardan örnek XLS dosyaları ile test et
4. CSV çıktısını kontrol et

Bu çözüm, hem 5-6-7. sınıfların "Sosyal Bilgiler" dersini hem de 8. sınıfın "İnkılap Tarihi" dersini doğru bir şekilde CSV formatına aktaracaktır.