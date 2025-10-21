import json
import re
from difflib import SequenceMatcher

def similarity(a, b):
    """İki string arasındaki benzerlik oranını hesapla"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def normalize_name(name):
    """İsmi normalize et"""
    if not name or str(name).strip() == '':
        return ''
    return re.sub(r'\s+', ' ', str(name).upper().strip())

def extract_learning_styles():
    """Öğrenme stilleri verisini düzgün şekilde çıkar"""
    print("🔍 Öğrenme stilleri verisi çıkarılıyor...")
    
    with open('ogrenme_stilleri_data.json', 'r', encoding='utf-8') as f:
        learning_data = json.load(f)
    
    clean_data = {}
    
    for class_name, class_data in learning_data.items():
        print(f"\n📚 {class_name} sınıfı işleniyor...")
        clean_data[class_name] = []
        
        for entry in class_data:
            name = normalize_name(entry.get('Unnamed: 2', ''))
            style = entry.get('Unnamed: 3', '')
            
            # Geçersiz girişleri atla
            if (not name or not style or 
                'İSİM LİSTESİ' in name or 
                'SIRA NO' in str(entry.get('Unnamed: 0', '')) or
                style in ['ÖĞRENME STİLİ', 'ÖĞRENME STİLLERİ'] or
                name in ['SONUÇLAR', 'Sonuçlar']):
                continue
            
            # Geçerli öğrenme stilleri kontrolü
            valid_styles = ['AYRIŞTIRAN', 'ÖZÜMSEYEN', 'YERLEŞTİREN', 'DEĞİŞTİREN', 
                          'AYRIŞTIRAN/ÖZÜMSEYEN', 'YERLEŞTİREN/AYRIŞTIRAN', 
                          'YERLEŞTİREN/DEĞİŞTİREN', 'DEĞİŞTİREN/ÖZÜMSEYEN']
            
            if any(valid_style in style for valid_style in valid_styles):
                clean_entry = {
                    'name': name,
                    'style': style,
                    'primary_style': style.split('/')[0] if '/' in style else style
                }
                clean_data[class_name].append(clean_entry)
                print(f"  ✅ {name} -> {style}")
    
    return clean_data

def match_students_improved():
    """Geliştirilmiş öğrenci eşleştirme"""
    print("🚀 Geliştirilmiş eşleştirme başlıyor...")
    
    # Temiz veriyi çıkar
    clean_learning_data = extract_learning_styles()
    
    # students.json'ı yükle
    with open('students.json', 'r', encoding='utf-8') as f:
        students_data = json.load(f)
    
    matches = []
    unmatched = []
    
    for student in students_data['students']:
        student_name = normalize_name(student['name'])
        grade = student['grade']
        
        print(f"\n🔍 Eşleştiriliyor: {student['name']} ({grade}. sınıf)")
        
        best_match = None
        best_score = 0
        
        # Her sınıfta ara
        for class_name in [f"{grade}A", f"{grade}B"]:
            if class_name in clean_learning_data:
                for entry in clean_learning_data[class_name]:
                    score = similarity(student_name, entry['name'])
                    
                    print(f"  📊 {score:.2%} - {entry['name']} ({entry['style']})")
                    
                    if score > best_score and score > 0.7:  # %70 benzerlik şartı
                        best_match = {
                            'class': class_name,
                            'name': entry['name'],
                            'style': entry['primary_style'],
                            'full_style': entry['style'],
                            'score': score
                        }
                        best_score = score
        
        if best_match:
            matches.append({
                'student': student,
                'match': best_match
            })
            print(f"  ✅ Eşleşti: {best_match['name']} ({best_match['score']:.2%}) -> {best_match['style']}")
        else:
            unmatched.append(student)
            print(f"  ❌ Eşleşme bulunamadı (en yüksek benzerlik: {best_score:.2%})")
    
    # Eşleştirmeleri uygula
    update_students_with_matches(students_data, matches)
    
    return matches, unmatched

def get_style_info(style):
    """Öğrenme stili bilgilerini getir"""
    style_info = {
        'AYRIŞTIRAN': {
            'characteristics': ['Analitik düşünür', 'Detay odaklı', 'Mantıklı yaklaşım', 'Teorik bilgi sever'],
            'techniques': ['Detaylı not alma', 'Karşılaştırma tabloları', 'Analiz yapma', 'Teorik okuma'],
            'study_duration': 45,
            'preferred_activities': ['analiz', 'teorik_okuma', 'detayli_notlar']
        },
        'ÖZÜMSEYEN': {
            'characteristics': ['Gözlemci', 'Dinleyici', 'Sakin', 'Düşünerek öğrenir'],
            'techniques': ['Gözlem yapma', 'Dinleme', 'Düşünme zamanı', 'Yavaş öğrenme'],
            'study_duration': 40,
            'preferred_activities': ['gozlem', 'dinleme', 'dusunme']
        },
        'YERLEŞTİREN': {
            'characteristics': ['Sosyal', 'Deneyimleyerek öğrenir', 'Esnek', 'Sezgisel'],
            'techniques': ['Grup çalışması', 'Deneyim paylaşımı', 'Sosyal öğrenme', 'Esnek program'],
            'study_duration': 30,
            'preferred_activities': ['grup_calismasi', 'deneyim', 'sosyal_ogrenme']
        },
        'DEĞİŞTİREN': {
            'characteristics': ['Pratik', 'Problem çözücü', 'Aktif', 'Sonuç odaklı'],
            'techniques': ['Soru çözme', 'Pratik uygulamalar', 'Hızlı feedback', 'Problem çözme'],
            'study_duration': 25,
            'preferred_activities': ['soru_cozme', 'pratik_uygulama', 'hizli_feedback']
        }
    }
    return style_info.get(style, style_info['DEĞİŞTİREN'])

def update_students_with_matches(students_data, matches):
    """Eşleştirmeleri students.json'a kaydet"""
    print(f"\n💾 {len(matches)} eşleştirme kaydediliyor...")
    
    for match in matches:
        student = match['student']
        learning_match = match['match']
        style_info = get_style_info(learning_match['style'])
        
        # Öğrenci bilgilerini güncelle
        student['class'] = learning_match['class']
        student['learningStyle'] = learning_match['style']
        student['personalizedSettings']['studyDuration'] = style_info['study_duration']
        student['personalizedSettings']['preferredActivities'] = style_info['preferred_activities']
        
        student['learningStyleData'] = {
            'style': learning_match['style'],
            'full_style': learning_match['full_style'],
            'confidence': learning_match['score'],
            'characteristics': style_info['characteristics'],
            'recommendedTechniques': style_info['techniques']
        }
        
        print(f"  📝 {student['name']}: {learning_match['style']} (%{learning_match['score']*100:.1f})")
    
    # Kaydet
    with open('students.json', 'w', encoding='utf-8') as f:
        json.dump(students_data, f, ensure_ascii=False, indent=2)
    
    print("✅ students.json güncellendi!")

if __name__ == "__main__":
    matches, unmatched = match_students_improved()
    
    print(f"\n📊 FINAL SONUÇLAR:")
    print(f"✅ Başarılı eşleştirme: {len(matches)}")
    print(f"❌ Eşleştirilemedi: {len(unmatched)}")
    
    if unmatched:
        print("\n⚠️ Manuel eşleştirme gerekebilir:")
        for student in unmatched:
            print(f"  - {student['name']} ({student['grade']}. sınıf)")
