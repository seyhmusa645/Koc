import json
import re
from datetime import datetime

def normalize_name(name):
    """İsmi normalize et"""
    if not name or str(name).strip() == '':
        return ''
    return re.sub(r'\s+', ' ', str(name).upper().strip())

def generate_student_id(name, class_name):
    """Öğrenci ID'si oluştur"""
    # İsimden ilk harfleri al
    name_parts = name.split()
    initials = ''.join([part[0] for part in name_parts if part])
    
    # Zaman damgası ekle
    timestamp = str(int(datetime.now().timestamp()))[-6:]
    
    return f"{class_name.lower()}_{initials.lower()}_{timestamp}"

def get_style_settings(learning_style):
    """Öğrenme stiline göre ayarları getir"""
    primary_style = learning_style.split('/')[0] if '/' in learning_style else learning_style
    
    style_settings = {
        'AYRIŞTIRAN': {
            'studyDuration': 45,
            'preferredActivities': ['analiz', 'teorik_okuma', 'detayli_notlar'],
            'characteristics': ['Analitik düşünür', 'Detay odaklı', 'Mantıklı yaklaşım', 'Teorik bilgi sever'],
            'techniques': ['Detaylı not alma', 'Karşılaştırma tabloları', 'Analiz yapma', 'Teorik okuma']
        },
        'ÖZÜMSEYEN': {
            'studyDuration': 40,
            'preferredActivities': ['gozlem', 'dinleme', 'dusunme'],
            'characteristics': ['Gözlemci', 'Dinleyici', 'Sakin', 'Düşünerek öğrenir'],
            'techniques': ['Gözlem yapma', 'Dinleme', 'Düşünme zamanı', 'Yavaş öğrenme']
        },
        'YERLEŞTİREN': {
            'studyDuration': 30,
            'preferredActivities': ['grup_calismasi', 'deneyim', 'sosyal_ogrenme'],
            'characteristics': ['Sosyal', 'Deneyimleyerek öğrenir', 'Esnek', 'Sezgisel'],
            'techniques': ['Grup çalışması', 'Deneyim paylaşımı', 'Sosyal öğrenme', 'Esnek program']
        },
        'DEĞİŞTİREN': {
            'studyDuration': 25,
            'preferredActivities': ['soru_cozme', 'pratik_uygulama', 'hizli_feedback'],
            'characteristics': ['Pratik', 'Problem çözücü', 'Aktif', 'Sonuç odaklı'],
            'techniques': ['Soru çözme', 'Pratik uygulamalar', 'Hızlı feedback', 'Problem çözme']
        }
    }
    
    return style_settings.get(primary_style, style_settings['DEĞİŞTİREN'])

def create_student_profiles():
    """Excel dosyasından öğrenci profillerini otomatik oluştur"""
    print("🚀 Otomatik öğrenci profili oluşturma başlıyor...")
    
    # Öğrenme stilleri verisini yükle
    with open('ogrenme_stilleri_data.json', 'r', encoding='utf-8') as f:
        learning_data = json.load(f)
    
    # Mevcut students.json'ı yükle (varsa)
    try:
        with open('students.json', 'r', encoding='utf-8') as f:
            students_data = json.load(f)
    except:
        students_data = {
            "version": "2.0",
            "lastUpdated": datetime.now().isoformat(),
            "students": []
        }
    
    created_students = []
    
    # 5, 6, 7. sınıfları işle (8. sınıf hariç)
    target_classes = ['5A', '5B', '6A', '6B', '7A', '7B']
    
    for class_name in target_classes:
        if class_name not in learning_data:
            print(f"⚠️  {class_name} sınıfı verisi bulunamadı, atlanıyor...")
            continue
            
        print(f"\n📚 {class_name} sınıfı işleniyor...")
        class_students = 0
        
        for entry in learning_data[class_name]:
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
            
            if not any(valid_style in style for valid_style in valid_styles):
                continue
            
            # Aynı öğrenci zaten var mı kontrol et
            existing_student = next((s for s in students_data['students'] 
                                   if s['name'] == name and s['class'] == class_name), None)
            
            if existing_student:
                print(f"  ⏭️  {name} zaten mevcut, atlanıyor...")
                continue
            
            # Öğrenme stili ayarlarını al
            style_settings = get_style_settings(style)
            
            # Yeni öğrenci profili oluştur
            new_student = {
                "id": generate_student_id(name, class_name),
                "name": name,
                "grade": class_name[0],  # 5, 6, 7
                "class": class_name,
                "learningStyle": style.split('/')[0] if '/' in style else style,  # Ana stil
                "personalizedSettings": {
                    "studyDuration": style_settings['studyDuration'],
                    "breakInterval": 5,
                    "preferredActivities": style_settings['preferredActivities'],
                    "motivationLevel": "medium"
                },
                "academicData": {
                    "weaknesses": [],
                    "strengths": [],
                    "lastExamDate": None,
                    "averageScore": None,
                    "examHistory": []
                },
                "learningStyleData": {
                    "style": style.split('/')[0] if '/' in style else style,
                    "full_style": style,  # Tam stil (örn: AYRIŞTIRAN/ÖZÜMSEYEN)
                    "confidence": 1.0,  # Excel'den geldiği için %100 güvenilir
                    "characteristics": style_settings['characteristics'],
                    "recommendedTechniques": style_settings['techniques']
                },
                "createdAt": datetime.now().isoformat(),
                "updatedAt": datetime.now().isoformat()
            }
            
            students_data['students'].append(new_student)
            created_students.append(new_student)
            class_students += 1
            
            print(f"  ✅ {name} -> {style} (ID: {new_student['id']})")
        
        print(f"📊 {class_name}: {class_students} öğrenci eklendi")
    
    # students.json'ı güncelle
    students_data['lastUpdated'] = datetime.now().isoformat()
    
    with open('students.json', 'w', encoding='utf-8') as f:
        json.dump(students_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n🎉 TAMAMLANDI!")
    print(f"✅ Toplam {len(created_students)} yeni öğrenci profili oluşturuldu")
    print(f"📊 Toplam öğrenci sayısı: {len(students_data['students'])}")
    
    # Sınıf bazında özet
    class_summary = {}
    for student in students_data['students']:
        class_name = student.get('class', 'Belirsiz')
        if class_name not in class_summary:
            class_summary[class_name] = 0
        class_summary[class_name] += 1
    
    print(f"\n📋 Sınıf Dağılımı:")
    for class_name, count in sorted(class_summary.items(), key=lambda x: x[0] or ''):
        if class_name and class_name != 'Belirsiz':
            print(f"  {class_name}: {count} öğrenci")
    
    # Öğrenme stili dağılımı
    style_summary = {}
    for student in created_students:
        style = student.get('learningStyle', 'Belirsiz')
        if style not in style_summary:
            style_summary[style] = 0
        style_summary[style] += 1
    
    if style_summary:
        print(f"\n🧠 Yeni Eklenen Öğrencilerin Öğrenme Stili Dağılımı:")
        for style, count in sorted(style_summary.items()):
            print(f"  {style}: {count} öğrenci")
    
    return created_students

if __name__ == "__main__":
    created_students = create_student_profiles()
    
    print(f"\n💡 İpucu: Programı başlattığınızda bu öğrenciler otomatik olarak görünecek!")
    print(f"📝 8. sınıf öğrencileri dahil edilmedi (istek üzerine)")
