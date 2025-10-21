import json
import os
from docx import Document
import re

def process_word_plan(file_path, grade, subject_key):
    """
    Word dosyasından haftalık plan verilerini çıkarır
    """
    print(f"📖 {file_path} dosyası işleniyor...")
    
    try:
        doc = Document(file_path)
        
        # Tüm paragrafları al
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        
        # Tabloları da kontrol et
        tables_data = []
        for table in doc.tables:
            for row in table.rows:
                row_data = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_data:
                    tables_data.append(row_data)
        
        print(f"📊 {len(paragraphs)} paragraf, {len(tables_data)} tablo satırı bulundu")
        
        # Hafta ve kazanım verilerini çıkar
        weekly_plan = {}
        
        # Paragraflardan hafta bilgisi ara
        for para in paragraphs:
            # Hafta numarası ara (1. Hafta, 2. Hafta, vb.)
            week_match = re.search(r'(\d+)\.?\s*Hafta', para, re.IGNORECASE)
            if week_match:
                week_num = week_match.group(1)
                # Bu haftanın kazanımlarını bul
                kazanims = extract_kazanims_from_paragraph(para)
                if kazanims:
                    weekly_plan[week_num] = kazanims
        
        # Tablolardan da veri çıkar
        for row in tables_data:
            week_num = None
            kazanims = []
            
            for cell in row:
                # Hafta numarası ara
                week_match = re.search(r'(\d+)\.?\s*Hafta', cell, re.IGNORECASE)
                if week_match:
                    week_num = week_match.group(1)
                
                # Kazanım ara (genellikle uzun metinler)
                if len(cell) > 20 and not re.match(r'^\d+\.?\s*Hafta', cell):
                    kazanims.append(cell)
            
            if week_num and kazanims:
                if week_num not in weekly_plan:
                    weekly_plan[week_num] = []
                weekly_plan[week_num].extend(kazanims)
        
        print(f"✅ {len(weekly_plan)} hafta verisi çıkarıldı")
        return weekly_plan
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        return {}

def extract_kazanims_from_paragraph(para):
    """
    Paragraftan kazanım metinlerini çıkarır
    """
    kazanims = []
    
    # Nokta ile ayrılmış cümleleri al
    sentences = para.split('.')
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) > 15 and not re.match(r'^\d+\.?\s*Hafta', sentence):
            # Çok uzun kazanımları kısalt
            if len(sentence) > 100:
                sentence = sentence[:100] + "..."
            kazanims.append(sentence)
    
    return kazanims

def main():
    # Mevcut haftalikPlan.json'u yükle
    output_file = 'haftalikPlan.json'
    
    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as f:
            haftalik_plan = json.load(f)
    else:
        haftalik_plan = {}
    
    # Tüm sınıf sosyal bilgiler dosyalarını işle
    word_files = [
        {
            'file': 'Sosyal 5. Sınıf Yıllık Plan.docx',
            'grade': '5',
            'subject': 'inkilap'
        },
        {
            'file': 'Sosyal 6. Sınıf Plan.docx',
            'grade': '6',
            'subject': 'inkilap'
        },
        {
            'file': '7. Sınıf Yıllık Plan.docx',
            'grade': '7',
            'subject': 'inkilap'
        },
        {
            'file': '8. Sınıf Yıllık Plan.docx',
            'grade': '8',
            'subject': 'inkilap'
        }
    ]
    
    for file_info in word_files:
        if os.path.exists(file_info['file']):
            weekly_data = process_word_plan(
                file_info['file'], 
                file_info['grade'], 
                file_info['subject']
            )
            
            if weekly_data:
                # Grade ve subject yapısını oluştur
                if file_info['grade'] not in haftalik_plan:
                    haftalik_plan[file_info['grade']] = {}
                if file_info['subject'] not in haftalik_plan[file_info['grade']]:
                    haftalik_plan[file_info['grade']][file_info['subject']] = {}
                
                # Veriyi ekle
                haftalik_plan[file_info['grade']][file_info['subject']] = weekly_data
                print(f"✅ {file_info['grade']}. sınıf {file_info['subject']} verisi eklendi")
            else:
                print(f"❌ {file_info['file']} dosyasından veri çıkarılamadı")
        else:
            print(f"❌ {file_info['file']} dosyası bulunamadı")
    
    # JSON dosyasını kaydet
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(haftalik_plan, f, ensure_ascii=False, indent=2)
    
    print(f"🎉 {output_file} güncellendi!")
    
    # Sonucu göster
    print("\n📋 ÇIKARILAN VERİLER:")
    for grade, subjects in haftalik_plan.items():
        print(f"\n{grade}. Sınıf:")
        for subject, weeks in subjects.items():
            print(f"  {subject}: {len(weeks)} hafta")
            for week, kazanims in list(weeks.items())[:3]:  # İlk 3 haftayı göster
                print(f"    Hafta {week}: {len(kazanims)} kazanım")
                for kazanim in kazanims[:2]:  # İlk 2 kazanımı göster
                    print(f"      - {kazanim[:50]}...")

if __name__ == "__main__":
    main()
