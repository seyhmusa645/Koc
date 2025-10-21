import json
import re
from difflib import SequenceMatcher

def similarity(a, b):
    """İki string arasındaki benzerlik oranını hesapla"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def normalize_name(name):
    """İsmi normalize et (büyük harf, boşluk temizleme)"""
    return re.sub(r'\s+', ' ', name.upper().strip())

def find_class_from_grade(grade):
    """Sınıf seviyesinden muhtemel sınıfları bul"""
    grade_num = grade.replace('.', '').strip()
    return [f"{grade_num}A", f"{grade_num}B"]

def match_students_with_learning_styles():
    print("🔍 Öğrenci-Öğrenme Stili Eşleştirme Başlıyor...")
    
    # students.json'ı yükle
    with open('students.json', 'r', encoding='utf-8') as f:
        students_data = json.load(f)
    
    # ogrenme_stilleri_data.json'ı yükle
    with open('ogrenme_stilleri_data.json', 'r', encoding='utf-8') as f:
        learning_data = json.load(f)
    
    matches = []
    unmatched_students = []
    
    print(f"👥 {len(students_data['students'])} öğrenci işleniyor...")
    
    for student in students_data['students']:
        student_name = normalize_name(student['name'])
        student_grade = student['grade']
        best_match = None
        best_score = 0
        
        print(f"\n🔍 Aranan: {student['name']} ({student_grade}. sınıf)")
        
        # Muhtemel sınıfları bul
        possible_classes = find_class_from_grade(student_grade)
        print(f"📚 Muhtemel sınıflar: {possible_classes}")
        
        # Her sınıfta ara
        for class_name in possible_classes:
            if class_name in learning_data:
                class_data = learning_data[class_name]
                
                for entry in class_data:
                    if entry.get('Unnamed: 2') and entry.get('Unnamed: 3'):
                        entry_name = normalize_name(str(entry['Unnamed: 2']))
                        learning_style = entry['Unnamed: 3']
                        
                        # İsim başlığı veya boş değerleri atla
                        if 'İSİM LİSTESİ' in entry_name or not learning_style or learning_style == 'ÖĞRENME STİLİ':
                            continue
                        
                        # Benzerlik hesapla
                        score = similarity(student_name, entry_name)
                        
                        if score > best_score and score > 0.6:  # En az %60 benzerlik
                            best_match = {
                                'class': class_name,
                                'name': entry_name,
                                'style': learning_style,
                                'score': score,
                                'original_entry': entry
                            }
                            best_score = score
                            
                        if score > 0.5:  # %50+ benzerlikleri göster
                            print(f"  🔗 {score:.2%} benzerlik: {entry_name} -> {learning_style}")
        
        if best_match:
            matches.append({
                'student': student,
                'match': best_match
            })
            print(f"  ✅ En iyi eşleşme: {best_match['name']} ({best_match['score']:.2%}) -> {best_match['style']}")
        else:
            unmatched_students.append(student)
            print(f"  ❌ Eşleşme bulunamadı")
    
    print(f"\n📊 SONUÇLAR:")
    print(f"✅ Eşleşen: {len(matches)} öğrenci")
    print(f"❌ Eşleşmeyen: {len(unmatched_students)} öğrenci")
    
    # Eşleşmeleri uygula
    if matches:
        print(f"\n🔄 Öğrenme stillerini students.json'a kaydediyor...")
        
        for match in matches:
            student = match['student']
            learning_match = match['match']
            
            # Öğrenci bilgilerini güncelle
            student['class'] = learning_match['class']
            student['learningStyle'] = learning_match['style']
            student['learningStyleData'] = {
                'style': learning_match['style'],
                'confidence': learning_match['score'],
                'characteristics': get_style_characteristics(learning_match['style']),
                'recommendedTechniques': get_style_techniques(learning_match['style'])
            }
            
            print(f"  📝 {student['name']}: {learning_match['style']} ({learning_match['score']:.2%})")
        
        # Güncellenmiş students.json'ı kaydet
        with open('students.json', 'w', encoding='utf-8') as f:
            json.dump(students_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ students.json güncellendi!")
    
    # Eşleşmeyen öğrenciler için önerilər
    if unmatched_students:
        print(f"\n⚠️  Eşleşmeyen öğrenciler:")
        for student in unmatched_students:
            print(f"  - {student['name']} ({student['grade']}. sınıf)")
        print("💡 Bu öğrenciler için manuel eşleştirme gerekebilir.")
    
    return matches, unmatched_students

def get_style_characteristics(style):
    """Öğrenme stiline göre karakteristikler"""
    characteristics = {
        'AYRIŞTIRAN': ['Analitik düşünür', 'Detay odaklı', 'Mantıklı yaklaşım', 'Teorik bilgi sever'],
        'ÖZÜMSEYEN': ['Gözlemci', 'Dinleyici', 'Sakin', 'Düşünerek öğrenir'],
        'YERLEŞTİREN': ['Sosyal', 'Deneyimleyerek öğrenir', 'Esnek', 'Sezgisel'],
        'DEĞİŞTİREN': ['Pratik', 'Problem çözücü', 'Aktif', 'Sonuç odaklı']
    }
    return characteristics.get(style, [])

def get_style_techniques(style):
    """Öğrenme stiline göre teknikler"""
    techniques = {
        'AYRIŞTIRAN': ['Detaylı not alma', 'Karşılaştırma tabloları', 'Analiz yapma', 'Teorik okuma'],
        'ÖZÜMSEYEN': ['Gözlem yapma', 'Dinleme', 'Düşünme zamanı', 'Yavaş öğrenme'],
        'YERLEŞTİREN': ['Grup çalışması', 'Deneyim paylaşımı', 'Sosyal öğrenme', 'Esnek program'],
        'DEĞİŞTİREN': ['Soru çözme', 'Pratik uygulamalar', 'Hızlı feedback', 'Problem çözme']
    }
    return techniques.get(style, [])

if __name__ == "__main__":
    matches, unmatched = match_students_with_learning_styles()
