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

def clean_kazanim(kazanim):
    """
    Kazanım metnini temizler
    """
    # Temizleme işlemleri
    clean = kazanim.strip()
    
    # Kodları kaldır (SB.5.1.1., İTA.8.1.1. vb.)
    clean = re.sub(r'^[A-Z]{2,3}\.\d+\.\d+\.\d+\.?\s*', '', clean)
    
    # > işaretini kaldır
    clean = clean.replace('>', '').strip()
    
    # * işaretli özel günleri kaldır
    if clean.startswith('*'):
        return None
    
    # Çok kısa veya anlamsız metinleri kaldır
    if len(clean) < 15:
        return None
    
    # Çok uzun kazanımları kısalt
    if len(clean) > 80:
        sentences = clean.split('.')
        if len(sentences) > 1:
            clean = sentences[0] + '.'
        else:
            clean = clean[:80] + "..."
    
    return clean

def main():
    # Dosya yapılandırması
    files_config = [
        # Matematik
        {'file': 'Kazanımlar/5-sinif-matematik-maarif-m-yillik-plan-ogretmenevrak-1758128045.docx', 'grade': '5', 'subject': 'matematik'},
        {'file': 'Kazanımlar/6-sinif-matematik-maarif-m-yillik-plan-ogretmenevrak-1758122706.docx', 'grade': '6', 'subject': 'matematik'},
        {'file': 'Kazanımlar/7-sinif-matematik-kaan-ozdogan-yillik-plan-ogretmenevrak-1758011476.docx', 'grade': '7', 'subject': 'matematik'},
        {'file': 'Kazanımlar/8-sinif-matematik-sahire-sumer-yillik-plan-ogretmenevrak-1758124689.docx', 'grade': '8', 'subject': 'matematik'},
        
        # Fen Bilimleri
        {'file': 'Kazanımlar/5-sinif-fen-bilimleri-maarif-m-yillik-plan-ogretmenevrak-1758170344.docx', 'grade': '5', 'subject': 'fen'},
        {'file': 'Kazanımlar/6-sinif-fen-bilimleri-maarif-m-yillik-plan-ogretmenevrak-1758170416.docx', 'grade': '6', 'subject': 'fen'},
        {'file': 'Kazanımlar/7-sinif-fen-bilimleri-lutfiye-ozoguz-yillik-plan-ogretmenevrak-1758170654.docx', 'grade': '7', 'subject': 'fen'},
        {'file': 'Kazanımlar/8-sinif-fen-bilimleri-lutfiye-ozoguz-yillik-plan-ogretmenevrak-1758170716.docx', 'grade': '8', 'subject': 'fen'},
        
        # Sosyal Bilgiler
        {'file': 'Kazanımlar/Sosyal 5. Sınıf Yıllık Plan.docx', 'grade': '5', 'subject': 'inkilap'},
        {'file': 'Kazanımlar/Sosyal 6. Sınıf Plan.docx', 'grade': '6', 'subject': 'inkilap'},
        {'file': 'Kazanımlar/7. Sınıf Yıllık Plan.docx', 'grade': '7', 'subject': 'inkilap'},
        {'file': 'Kazanımlar/8. Sınıf Yıllık Plan.docx', 'grade': '8', 'subject': 'inkilap'},
        
        # İngilizce
        {'file': 'Kazanımlar/5-sinif-ingilizce-maarif-m-yillik-plan-ogretmenevrak-1758109121.docx', 'grade': '5', 'subject': 'ingilizce'},
        {'file': 'Kazanımlar/6-sinif-ingilizce-yillik-plan-ogretmenevrak-1758302468.docx', 'grade': '6', 'subject': 'ingilizce'},
        {'file': 'Kazanımlar/7-sinif-ingilizce-yillik-plan-ogretmenevrak-1758288422.docx', 'grade': '7', 'subject': 'ingilizce'},
        {'file': 'Kazanımlar/8-sinif-ingilizce-yillik-plan-ogretmenevrak-1758290526.docx', 'grade': '8', 'subject': 'ingilizce'},
        
        # Din Kültürü
        {'file': 'Kazanımlar/5-sinif-din-kult-ve-ahlak-bil-maarif-m-yillik-plan-ogretmenevrak-1758046960 (1).docx', 'grade': '5', 'subject': 'din'},
        {'file': 'Kazanımlar/6-sinif-din-kult-ve-ahlak-bil-maarif-m-yillik-plan-ogretmenevrak-1758048091 (1).docx', 'grade': '6', 'subject': 'din'},
        {'file': 'Kazanımlar/7-sinif-din-kulturu-ve-ahlak-bilgisi-busra-nur-sungur-yillik-plan-ogretmenevrak-1758048190.docx', 'grade': '7', 'subject': 'din'},
        {'file': 'Kazanımlar/8-sinif-din-kulturu-ve-ahlak-bilgisi-busra-nur-sungur-yillik-plan-ogretmenevrak-1758050539.docx', 'grade': '8', 'subject': 'din'},
        
        # Türkçe (sadece 6. sınıf)
        {'file': 'Kazanımlar/GÜNCELLENEN 6. SINIF MEB YAYINLARI TÜRKÇE YILLIK PLANI (yeniii).DOCX', 'grade': '6', 'subject': 'turkce'},
    ]
    
    # Haftalık plan ve kazanımlar için veri yapıları
    haftalik_plan = {}
    all_kazanims = {
        'turkce': set(),
        'matematik': set(),
        'fen': set(),
        'inkilap': set(),
        'ingilizce': set(),
        'din': set()
    }
    
    print("🚀 TÜM DERSLERİN WORD DOSYALARI İŞLENİYOR...")
    print("=" * 60)
    
    # Her dosyayı işle
    for file_info in files_config:
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
                
                # Kazanımları topla
                for week, kazanims in weekly_data.items():
                    for kazanim in kazanims:
                        clean = clean_kazanim(kazanim)
                        if clean:
                            all_kazanims[file_info['subject']].add(clean)
            else:
                print(f"❌ {file_info['file']} dosyasından veri çıkarılamadı")
        else:
            print(f"❌ {file_info['file']} dosyası bulunamadı")
    
    # Kazanımları listeye çevir
    for subject in all_kazanims:
        all_kazanims[subject] = sorted(list(all_kazanims[subject]))
    
    # haftalikPlan.json dosyasını kaydet
    with open('haftalikPlan.json', 'w', encoding='utf-8') as f:
        json.dump(haftalik_plan, f, ensure_ascii=False, indent=2)
    
    # Kazanımlar.json dosyasını kaydet
    with open('Kazanımlar.json', 'w', encoding='utf-8') as f:
        json.dump(all_kazanims, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 60)
    print("🎉 İŞLEM TAMAMLANDI!")
    print("=" * 60)
    
    # Sonuçları göster
    print("\n📋 HAFTALIK PLAN ÖZETİ:")
    for grade, subjects in haftalik_plan.items():
        print(f"\n{grade}. Sınıf:")
        for subject, weeks in subjects.items():
            print(f"  {subject}: {len(weeks)} hafta")
    
    print("\n📚 KAZANIM ÖZETİ:")
    for subject, kazanims in all_kazanims.items():
        print(f"  {subject}: {len(kazanims)} kazanım")
    
    print(f"\n✅ haftalikPlan.json güncellendi!")
    print(f"✅ Kazanımlar.json güncellendi!")

if __name__ == "__main__":
    main()
