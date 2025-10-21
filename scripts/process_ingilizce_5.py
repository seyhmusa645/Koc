import json
import os
from docx import Document
import re

def process_ingilizce_5_word_plan(file_path, grade, subject_key):
    """
    5. sınıf İngilizce Word dosyasından haftalık plan verilerini çıkarır
    """
    print(f"📖 {file_path} dosyası işleniyor...")
    
    try:
        doc = Document(file_path)
        
        # Tablolardan veri çıkar
        weekly_plan = {}
        
        for table in doc.tables:
            for row in table.rows:
                row_data = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                
                if len(row_data) >= 3:  # En az 3 sütun olmalı
                    # İlk sütun: WEEK
                    week_cell = row_data[0]
                    
                    # Hafta numarası ara - "Week 3" formatı
                    week_match = re.search(r'Week\s*(\d+)', week_cell, re.IGNORECASE)
                    if week_match:
                        week_num = week_match.group(1)
                        
                        # 3. ve 4. sütunlar: LEARNING OUTCOMES (kazanımlar)
                        kazanims = []
                        
                        # 3. sütun
                        if len(row_data) > 2 and row_data[2]:
                            kazanims.extend(extract_ingilizce_kazanims(row_data[2]))
                        
                        # 4. sütun
                        if len(row_data) > 3 and row_data[3]:
                            kazanims.extend(extract_ingilizce_kazanims(row_data[3]))
                        
                        if kazanims:
                            if week_num not in weekly_plan:
                                weekly_plan[week_num] = []
                            weekly_plan[week_num].extend(kazanims)
        
        print(f"✅ {len(weekly_plan)} hafta verisi çıkarıldı")
        return weekly_plan
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        return {}

def extract_ingilizce_kazanims(kazanims_text):
    """
    İngilizce kazanım metninden kazanımları çıkarır
    """
    kazanims = []
    
    # Satır sonlarını temizle
    clean_text = kazanims_text.replace('\n', ' ').replace('\r', ' ')
    
    # ENG.5.1.L1. gibi kodları kaldır
    clean_text = re.sub(r'ENG\.\d+\.\d+\.\w+\.\d+\.?\s*', '', clean_text)
    
    # Nokta ile ayrılmış cümleleri al
    sentences = clean_text.split('.')
    
    for sentence in sentences:
        sentence = sentence.strip()
        
        # Çok kısa veya anlamsız metinleri atla
        if len(sentence) < 10:
            continue
            
        # Başlık satırlarını atla
        if any(keyword in sentence.upper() for keyword in ['LEARNING OUTCOMES', 'THEME', 'WEEK', 'HOURS']):
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
    
    # 5. sınıf İngilizce dosyasını işle
    ingilizce_file = 'Kazanımlar/5-sinif-ingilizce-maarif-m-yillik-plan-ogretmenevrak-1758109121.docx'
    
    if os.path.exists(ingilizce_file):
        weekly_data = process_ingilizce_5_word_plan(ingilizce_file, '5', 'ingilizce')
        
        if weekly_data:
            # Grade ve subject yapısını oluştur
            if '5' not in haftalik_plan:
                haftalik_plan['5'] = {}
            if 'ingilizce' not in haftalik_plan['5']:
                haftalik_plan['5']['ingilizce'] = {}
            
            # Veriyi ekle
            haftalik_plan['5']['ingilizce'] = weekly_data
            print(f"✅ 5. sınıf İngilizce verisi eklendi")
            
            # Kazanımları topla
            ingilizce_kazanims = set()
            for week, week_kazanims in weekly_data.items():
                for kazanim in week_kazanims:
                    if len(kazanim) > 10:
                        ingilizce_kazanims.add(kazanim)
            
            # Kazanımlar.json'u güncelle
            kazanims['ingilizce'] = sorted(list(ingilizce_kazanims))
            print(f"✅ {len(ingilizce_kazanims)} İngilizce kazanımı eklendi")
        else:
            print(f"❌ {ingilizce_file} dosyasından veri çıkarılamadı")
    else:
        print(f"❌ {ingilizce_file} dosyası bulunamadı")
    
    # Dosyaları kaydet
    with open('haftalikPlan.json', 'w', encoding='utf-8') as f:
        json.dump(haftalik_plan, f, ensure_ascii=False, indent=2)
    
    with open('Kazanımlar.json', 'w', encoding='utf-8') as f:
        json.dump(kazanims, f, ensure_ascii=False, indent=2)
    
    print("\n🎉 5. sınıf İngilizce entegrasyonu tamamlandı!")
    
    # Sonuçları göster
    if '5' in haftalik_plan and 'ingilizce' in haftalik_plan['5']:
        print(f"📚 5. Sınıf İngilizce: {len(haftalik_plan['5']['ingilizce'])} hafta")
        print(f"📝 İngilizce kazanımları: {len(kazanims['ingilizce'])} adet")
        
        # İlk 5 kazanımı göster
        print("\n📋 İLK 5 KAZANIM:")
        for i, kazanim in enumerate(kazanims['ingilizce'][:5], 1):
            print(f"{i}. {kazanim}")

if __name__ == "__main__":
    main()
