import json
from docx import Document
import os
import re

def extract_kazanims_from_word(file_path):
    """Word dosyasından kazanımları çıkar"""
    try:
        doc = Document(file_path)
        kazanims = []
        
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text = cell.text.strip()
                    # Kazanım olabilecek metinleri filtrele
                    if (len(text) > 20 and 
                        not any(x in text for x in ['(5 Saat)', '(4 Saat)', '(3 Saat)', '(2 Saat)', '(1 Saat)']) and
                        not text.startswith('D') and
                        not any(x in text for x in ['Gaziler Günü', 'İlköğretim Haftası', 'Ahilik']) and
                        not re.match(r'^[A-Z]\.$', text) and
                        not re.match(r'^\d+\.$', text)):
                        kazanims.append(text)
        
        return kazanims
    except Exception as e:
        print(f"Hata: {file_path} - {e}")
        return []

def analyze_subject_kazanims(subject_name, word_files, current_kazanims):
    """Bir dersin kazanımlarını analiz et"""
    print(f"\n=== {subject_name.upper()} KAZANIMLARI ANALİZİ ===")
    
    # Word dosyalarından kazanımları çıkar
    word_kazanims = []
    for file_path in word_files:
        if os.path.exists(file_path):
            kazanims = extract_kazanims_from_word(file_path)
            word_kazanims.extend(kazanims)
    
    print(f"Word dosyalarından çıkarılan kazanım sayısı: {len(word_kazanims)}")
    print(f"Mevcut JSON'daki kazanım sayısı: {len(current_kazanims)}")
    
    # Mevcut kazanımları analiz et
    print(f"\nMevcut kazanımların ilk 10'u:")
    for i, kazanim in enumerate(current_kazanims[:10]):
        print(f"  {i+1}. {kazanim}")
    
    # Şüpheli kazanımları tespit et
    suspicious = []
    for kazanim in current_kazanims:
        if (len(kazanim) < 10 or 
            any(x in kazanim for x in ['D3.', 'D4.', 'D5.', 'D6.', 'D7.', 'D8.', 'D9.', 'D10.']) or
            any(x in kazanim for x in ['Gaziler', 'İlköğretim', 'Ahilik']) or
            any(x in kazanim for x in ['Açık uçlu', 'kısa cevaplı', 'izleme testi']) or
            re.match(r'^[A-Z]\.$', kazanim) or
            re.match(r'^\d+\.$', kazanim)):
            suspicious.append(kazanim)
    
    print(f"\nŞüpheli kazanım sayısı: {len(suspicious)}")
    if suspicious:
        print("Şüpheli kazanımlar:")
        for kazanim in suspicious[:5]:  # İlk 5'ini göster
            print(f"  - {kazanim}")
    
    return len(suspicious)

# Mevcut kazanımları yükle
with open('Kazanımlar.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Ders dosyalarını tanımla
subject_files = {
    'matematik': [
        'Kazanımlar/5-sinif-matematik-maarif-m-yillik-plan-ogretmenevrak-1758128045.docx',
        'Kazanımlar/6-sinif-matematik-maarif-m-yillik-plan-ogretmenevrak-1758122706.docx',
        'Kazanımlar/7-sinif-matematik-kaan-ozdogan-yillik-plan-ogretmenevrak-1758011476.docx',
        'Kazanımlar/8-sinif-matematik-sahire-sumer-yillik-plan-ogretmenevrak-1758124689.docx'
    ],
    'fen': [
        'Kazanımlar/5-sinif-fen-bilimleri-maarif-m-yillik-plan-ogretmenevrak-1758170344.docx',
        'Kazanımlar/6-sinif-fen-bilimleri-maarif-m-yillik-plan-ogretmenevrak-1758170416.docx',
        'Kazanımlar/7-sinif-fen-bilimleri-lutfiye-ozoguz-yillik-plan-ogretmenevrak-1758170654.docx',
        'Kazanımlar/8-sinif-fen-bilimleri-lutfiye-ozoguz-yillik-plan-ogretmenevrak-1758170716.docx'
    ],
    'inkilap': [
        'Kazanımlar/Sosyal 5. Sınıf Yıllık Plan.docx',
        'Kazanımlar/Sosyal 6. Sınıf Plan.docx',
        'Kazanımlar/7. SINIF YILLIK PLAN 2025-2026.DOCX',
        'Kazanımlar/8. Sınıf Yıllık Plan.docx'
    ],
    'din': [
        'Kazanımlar/5-sinif-din-kult-ve-ahlak-bil-maarif-m-yillik-plan-ogretmenevrak-1758046960 (1).docx',
        'Kazanımlar/6-sinif-din-kult-ve-ahlak-bil-maarif-m-yillik-plan-ogretmenevrak-1758048091 (1).docx',
        'Kazanımlar/7-sinif-din-kulturu-ve-ahlak-bilgisi-busra-nur-sungur-yillik-plan-ogretmenevrak-1758048190.docx',
        'Kazanımlar/8-sinif-din-kulturu-ve-ahlak-bilgisi-busra-nur-sungur-yillik-plan-ogretmenevrak-1758050539.docx'
    ],
    'ingilizce': [
        'Kazanımlar/5-sinif-ingilizce-maarif-m-yillik-plan-ogretmenevrak-1758109121.docx',
        'Kazanımlar/6-sinif-ingilizce-yillik-plan-ogretmenevrak-1758302468.docx',
        'Kazanımlar/7-sinif-ingilizce-yillik-plan-ogretmenevrak-1758288422.docx',
        'Kazanımlar/8-sinif-ingilizce-yillik-plan-ogretmenevrak-1758290526.docx'
    ],
    'turkce': [
        'Kazanımlar/GÜNCELLENEN 6. SINIF MEB YAYINLARI TÜRKÇE YILLIK PLANI (yeniii).DOCX'
    ]
}

print("=== KAZANIMLAR DOĞRULAMA RAPORU ===")
total_suspicious = 0

for subject, files in subject_files.items():
    if subject in data:
        suspicious_count = analyze_subject_kazanims(subject, files, data[subject])
        total_suspicious += suspicious_count

print(f"\n=== ÖZET ===")
print(f"Toplam şüpheli kazanım sayısı: {total_suspicious}")
print(f"Temizlenmesi gereken kazanım sayısı: {total_suspicious}")
