import json
import os

def clean_fake_turkish_outcomes():
    """Mevcut sınavlardaki sahte Türkçe ve İngilizce kazanımlarını temizle"""
    
    data_path = r"C:\Users\Program Geliştirme\AppData\Roaming\kapsul-kocluk-programi\data.json"
    
    print("🧹 Sahte kazanımlar temizleniyor...")
    
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except:
        print("❌ data.json dosyası bulunamadı")
        return
    
    # Data formatını kontrol et
    if isinstance(data, dict) and 'value' in data:
        exams = data['value']
    elif isinstance(data, list):
        exams = data
    else:
        print("❌ Bilinmeyen data formatı")
        return
    
    print(f"📊 {len(exams)} sınav kontrol ediliyor...")
    
    cleaned_count = 0
    
    for exam in exams:
        courses = exam.get('courses', {})
        
        # Türkçe temizliği
        if 'turkce' in courses:
            old_outcomes = courses['turkce'].get('incorrectOutcomes', [])
            if isinstance(old_outcomes, str):
                old_outcomes = old_outcomes.split(' | ') if old_outcomes else []
            
            # T.X.Y.Z formatındaki sahte kodları filtrele
            cleaned_outcomes = [
                outcome for outcome in old_outcomes 
                if not (outcome.startswith('T.') and len(outcome.split('.')) == 4)
            ]
            
            if len(cleaned_outcomes) != len(old_outcomes):
                courses['turkce']['incorrectOutcomes'] = cleaned_outcomes
                cleaned_count += 1
                print(f"  🧹 {exam['profile']}: Türkçe temizlendi ({len(old_outcomes)} → {len(cleaned_outcomes)})")
        
        # İngilizce temizliği  
        if 'ingilizce' in courses:
            old_outcomes = courses['ingilizce'].get('incorrectOutcomes', [])
            if isinstance(old_outcomes, str):
                old_outcomes = old_outcomes.split(' | ') if old_outcomes else []
            
            # İ.X.Y.Z formatındaki sahte kodları filtrele
            cleaned_outcomes = [
                outcome for outcome in old_outcomes 
                if not (outcome.startswith('İ.') and len(outcome.split('.')) == 4)
            ]
            
            if len(cleaned_outcomes) != len(old_outcomes):
                courses['ingilizce']['incorrectOutcomes'] = cleaned_outcomes
                print(f"  🧹 {exam['profile']}: İngilizce temizlendi ({len(old_outcomes)} → {len(cleaned_outcomes)})")
    
    # Güncellenmiş veriyi kaydet
    if isinstance(data, dict) and 'value' in data:
        data['value'] = exams
    else:
        data = {
            "value": exams,
            "Count": len(exams)
        }
    
    with open(data_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Temizlik tamamlandı!")
    print(f"🧹 {cleaned_count} sınavda sahte kazanım temizlendi")
    print(f"💾 data.json güncellendi")

if __name__ == "__main__":
    clean_fake_turkish_outcomes()
