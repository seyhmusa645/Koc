import json
import os
from datetime import datetime

# Mevcut profiles.json dosyasını oku
profiles_path = os.path.expanduser("~\\AppData\\Roaming\\kapsul-kocluk-programi\\profiles.json")

print("🔄 Profil sistemini students.json'a dönüştürüyoruz...")

try:
    with open(profiles_path, 'r', encoding='utf-8') as f:
        profiles = json.load(f)
    
    print(f"📋 {len(profiles)} profil bulundu:")
    for profile in profiles:
        print(f"  - {profile['name']} ({profile['grade']}. sınıf)")
    
    # Yeni students.json yapısı
    students_data = {
        "version": "2.0",
        "lastUpdated": datetime.now().isoformat(),
        "students": []
    }
    
    # Her profili yeni yapıya dönüştür
    for i, profile in enumerate(profiles):
        student = {
            "id": f"student_{i+1:03d}",
            "name": profile["name"],
            "grade": profile["grade"],
            "class": None,  # Sonradan eşleştirilecek
            "learningStyle": None,  # Sonradan eşleştirilecek
            "personalizedSettings": {
                "studyDuration": 30,  # Varsayılan 30 dakika
                "breakInterval": 5,
                "preferredActivities": [],
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
                "style": None,
                "confidence": 0,
                "characteristics": [],
                "recommendedTechniques": []
            },
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
        students_data["students"].append(student)
    
    # students.json dosyasını kaydet
    students_path = "students.json"
    with open(students_path, 'w', encoding='utf-8') as f:
        json.dump(students_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ students.json oluşturuldu: {len(students_data['students'])} öğrenci")
    print(f"📁 Konum: {os.path.abspath(students_path)}")
    
    # Yeni yapıyı göster
    print("\n📊 Yeni veri yapısı örneği:")
    print(json.dumps(students_data["students"][0], ensure_ascii=False, indent=2))
    
except Exception as e:
    print(f"❌ Hata: {e}")
