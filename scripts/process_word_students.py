import json
from datetime import datetime

# Word'den çıkarılan veriyi oku
with open('complete_students_data.json', 'r', encoding='utf-8') as f:
    word_students = json.load(f)

print(f'Word\'den toplam öğrenci: {len(word_students)}')

# 8. sınıfları hariç tut, diğerlerini sınıf atlat
processed_students = []

for student in word_students:
    grade = student.get('grade', '')
    
    # 8. sınıfları atla
    if grade == '8':
        print(f'⏭️  Atlandı: {student.get("name", "Bilinmeyen")} - 8. sınıf (mezun)')
        continue
    
    # Sınıf atlatma
    if grade == '5':
        new_grade = '6'
    elif grade == '6':
        new_grade = '7'
    elif grade == '7':
        new_grade = '8'
    else:
        new_grade = grade  # Değişiklik yok
    
    # Yeni öğrenci verisi oluştur
    new_student = {
        "id": f"student_{len(processed_students) + 1:03d}",
        "name": student.get('name', 'Bilinmeyen'),
        "grade": new_grade,
        "class": student.get('class'),
        "learningStyle": student.get('learning_style', 'Belirlenmemiş'),
        "personalizedSettings": {
            "studyDuration": 30,
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
            "style": student.get('learning_style', 'Belirlenmemiş'),
            "confidence": 0.9,  # Word'den geldiği için yüksek güven
            "characteristics": [],
            "recommendedTechniques": []
        },
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }
    
    processed_students.append(new_student)
    print(f'✅ Eklendi: {student.get("name", "Bilinmeyen")} - {grade} → {new_grade}')

print(f'\n📊 İşlenen öğrenci sayısı: {len(processed_students)}')

# Sınıf dağılımı
grade_distribution = {}
for student in processed_students:
    grade = student['grade']
    grade_distribution[grade] = grade_distribution.get(grade, 0) + 1

print('\n=== YENİ SINIF DAĞILIMI ===')
for grade, count in sorted(grade_distribution.items()):
    print(f'{grade}. Sınıf: {count} öğrenci')

# Öğrenme stilleri dağılımı
learning_styles = {}
for student in processed_students:
    style = student['learningStyle']
    learning_styles[style] = learning_styles.get(style, 0) + 1

print('\n=== ÖĞRENME STİLLERİ DAĞILIMI ===')
for style, count in sorted(learning_styles.items(), key=lambda x: x[1], reverse=True):
    print(f'{style}: {count} öğrenci')

# Yeni students.json oluştur
new_students_data = {
    "version": "2.0",
    "lastUpdated": datetime.now().isoformat(),
    "students": processed_students
}

# Kaydet
with open('students.json', 'w', encoding='utf-8') as f:
    json.dump(new_students_data, f, ensure_ascii=False, indent=2)

print(f'\n✅ students.json güncellendi!')
print(f'📁 Toplam öğrenci: {len(processed_students)}')
