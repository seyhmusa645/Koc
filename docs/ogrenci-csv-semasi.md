# Öğrenci CSV Şeması

Bu doküman, Kapsül Koçluk Programı'na öğrenci verilerini CSV formatında aktarmak için gerekli şemayı açıklar.

## Zorunlu Kolonlar

| Kolon Adı | Açıklama | Örnek |
|------------|----------|-------|
| `Öğrenci No` | Öğrencinin benzersiz numarası | `12345` |
| `Ad Soyad` | Öğrencinin tam adı | `Ahmet Yılmaz` |
| `Sınıf` | Öğrencinin sınıf seviyesi | `8` |
| `Öğrenme Stili` | Öğrencinin öğrenme stili metni | `Ayrıştıran` |

## Kabiliyet Kolonları

Her kabiliyet için iki kolon bulunur: `level` (seviye) ve `score` (puan).

### Görsel-Uzamsal Zeka
- `visual_spatial_level`: Seviye (1-5 arası)
- `visual_spatial_score`: Puan (0-100 arası)

### Sözel-Dilsel Zeka
- `verbal_linguistic_level`: Seviye (1-5 arası)
- `verbal_linguistic_score`: Puan (0-100 arası)

### Mantıksal-Matematiksel Zeka
- `logical_mathematical_level`: Seviye (1-5 arası)
- `logical_mathematical_score`: Puan (0-100 arası)

### Müziksel-Ritmik Zeka
- `musical_rhythmic_level`: Seviye (1-5 arası)
- `musical_rhythmic_score`: Puan (0-100 arası)

### Bedensel-Kinestetik Zeka
- `bodily_kinesthetic_level`: Seviye (1-5 arası)
- `bodily_kinesthetic_score`: Puan (0-100 arası)

### Kişiler Arası Zeka
- `interpersonal_level`: Seviye (1-5 arası)
- `interpersonal_score`: Puan (0-100 arası)

### İçsel-Öze Dönük Zeka
- `intrapersonal_level`: Seviye (1-5 arası)
- `intrapersonal_score`: Puan (0-100 arası)

### Doğa Zekası
- `naturalist_level`: Seviye (1-5 arası)
- `naturalist_score`: Puan (0-100 arası)

## Örnek CSV Satırı

```csv
Öğrenci No,Ad Soyad,Sınıf,Öğrenme Stili,visual_spatial_level,visual_spatial_score,verbal_linguistic_level,verbal_linguistic_score,logical_mathematical_level,logical_mathematical_score,musical_rhythmic_level,musical_rhythmic_score,bodily_kinesthetic_level,bodily_kinesthetic_score,interpersonal_level,interpersonal_score,intrapersonal_level,intrapersonal_score,naturalist_level,naturalist_score
12345,Ahmet Yılmaz,8,Ayrıştıran,4,85,3,65,5,92,2,45,3,70,4,80,3,60,2,40
```

## Geriye Dönük Uyumluluk

- **Eski formatlı CSV'ler** artık desteklenmemektedir
- **Eksik kolonlar** durumunda sistem anlamlı uyarı verecektir
- **Kabiliyet verileri eksik** olan öğrenciler için varsayılan değerler kullanılacaktır

## Notlar

- Seviye değerleri 1-5 arasında olmalıdır
- Puan değerleri 0-100 arasında olmalıdır
- Boş değerler için varsayılan olarak 0 kullanılır
- Öğrenme stili metni tam olarak yazılmalıdır (büyük/küçük harf duyarlı)
