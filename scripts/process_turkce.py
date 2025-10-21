import json
import os
from docx import Document
import re

def process_turkce_word_plan(file_path, grade, subject_key):
    """
    Türkçe Word dosyasından haftalık plan verilerini çıkarır
    """
    print(f"📖 {file_path} dosyası işleniyor...")
    
    try:
        doc = Document(file_path)
        
        # Tablolardan veri çıkar
        weekly_plan = {}
        
        for table in doc.tables:
            for row in table.rows:
                row_data = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                
                if len(row_data) >= 4:  # En az 4 sütun olmalı
                    # İlk sütun: AY / HAFTA/SÜRE
                    hafta_cell = row_data[0]
                    
                    # Hafta numarası ara - farklı formatlar
                    week_match = re.search(r'(\d+)\s*HAFTA', hafta_cell, re.IGNORECASE)
                    if not week_match:
                        # "8-16 EYLÜL / 8 DERS SAATİ" formatını dene
                        week_match = re.search(r'(\d+)-(\d+)\s+\w+\s*/\s*(\d+)', hafta_cell)
                        if week_match:
                            week_num = week_match.group(1)  # İlk sayıyı hafta numarası olarak al
                        else:
                            # Sadece sayı ara
                            week_match = re.search(r'(\d+)', hafta_cell)
                            if week_match:
                                week_num = week_match.group(1)
                    
                    if week_match:
                        week_num = week_match.group(1)
                        
                        # 3. sütun: ÖĞRENME ÇIKTILARI (kazanımlar)
                        kazanims_cell = row_data[3] if len(row_data) > 3 else ""
                        
                        if kazanims_cell and len(kazanims_cell) > 20:
                            # Kazanımları temizle ve ayır
                            kazanims = extract_turkce_kazanims(kazanims_cell)
                            
                            if kazanims:
                                if week_num not in weekly_plan:
                                    weekly_plan[week_num] = []
                                weekly_plan[week_num].extend(kazanims)
        
        print(f"✅ {len(weekly_plan)} hafta verisi çıkarıldı")
        return weekly_plan
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        return {}

def extract_turkce_kazanims(kazanims_text):
    """
    Türkçe kazanım metninden kazanımları çıkarır
    """
    kazanims = []
    
    # Satır sonlarını temizle
    clean_text = kazanims_text.replace('\n', ' ').replace('\r', ' ')
    
    # Nokta ile ayrılmış cümleleri al
    sentences = clean_text.split('.')
    
    for sentence in sentences:
        sentence = sentence.strip()
        
        # Çok kısa veya anlamsız metinleri atla
        if len(sentence) < 15:
            continue
            
        # Başlık satırlarını atla
        if any(keyword in sentence.upper() for keyword in ['ÖĞRENME ÇIKTILARI', 'ALAN BECERİLERİ', 'TEMA']):
            continue
            
        # Çok uzun kazanımları kısalt
        if len(sentence) > 100:
            sentence = sentence[:100] + "..."
            
        kazanims.append(sentence)
    
    return kazanims

def main():
    # Mevcut haftalikPlan.json'u yükle
    with open('haftalikPlan.json', 'r', encoding='utf-8') as f:
        haftalik_plan = json.load(f)
    
    # Mevcut Kazanımlar.json'u yükle
    with open('Kazanımlar.json', 'r', encoding='utf-8') as f:
        kazanims = json.load(f)
    
    # Türkçe dosyasını işle
    turkce_file = 'Kazanımlar/GÜNCELLENEN 6. SINIF MEB YAYINLARI TÜRKÇE YILLIK PLANI (yeniii).DOCX'
    
    if os.path.exists(turkce_file):
        weekly_data = process_turkce_word_plan(turkce_file, '6', 'turkce')
        
        if weekly_data:
            # Grade ve subject yapısını oluştur
            if '6' not in haftalik_plan:
                haftalik_plan['6'] = {}
            if 'turkce' not in haftalik_plan['6']:
                haftalik_plan['6']['turkce'] = {}
            
            # Veriyi ekle
            haftalik_plan['6']['turkce'] = weekly_data
            print(f"✅ 6. sınıf Türkçe verisi eklendi")
            
            # Kazanımları topla
            turkce_kazanims = set()
            for week, week_kazanims in weekly_data.items():
                for kazanim in week_kazanims:
                    if len(kazanim) > 15:
                        turkce_kazanims.add(kazanim)
            
            # Kazanımlar.json'u güncelle
            kazanims['turkce'] = sorted(list(turkce_kazanims))
            print(f"✅ {len(turkce_kazanims)} Türkçe kazanımı eklendi")
        else:
            print(f"❌ {turkce_file} dosyasından veri çıkarılamadı")
    else:
        print(f"❌ {turkce_file} dosyası bulunamadı")
    
    # Dosyaları kaydet
    with open('haftalikPlan.json', 'w', encoding='utf-8') as f:
        json.dump(haftalik_plan, f, ensure_ascii=False, indent=2)
    
    with open('Kazanımlar.json', 'w', encoding='utf-8') as f:
        json.dump(kazanims, f, ensure_ascii=False, indent=2)
    
    print("\n🎉 Türkçe entegrasyonu tamamlandı!")
    
    # Sonuçları göster
    if '6' in haftalik_plan and 'turkce' in haftalik_plan['6']:
        print(f"📚 6. Sınıf Türkçe: {len(haftalik_plan['6']['turkce'])} hafta")
        print(f"📝 Türkçe kazanımları: {len(kazanims['turkce'])} adet")
        
        # İlk 5 kazanımı göster
        print("\n📋 İLK 5 KAZANIM:")
        for i, kazanim in enumerate(kazanims['turkce'][:5], 1):
            print(f"{i}. {kazanim}")

if __name__ == "__main__":
    main()
