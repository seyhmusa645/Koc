import json
from datetime import datetime

# Mevcut öğrencileri oku
with open('students.json', 'r', encoding='utf-8') as f:
    current_students = json.load(f)

# Zeka türleri verilerini oku
with open('all_students_with_intelligence.json', 'r', encoding='utf-8') as f:
    intelligence_data = json.load(f)

print(f'Mevcut öğrenci sayısı: {len(current_students["students"])}')
print(f'Zeka türü verisi olan öğrenci sayısı: {len(intelligence_data)}')

# Zeka türlerini mevcut öğrencilerle eşleştir
updated_students = []

for student in current_students["students"]:
    student_name = student["name"]
    
    # Zeka türü verisinde bu öğrenciyi ara
    intelligence_match = None
    for int_student in intelligence_data:
        if int_student["name"] == student_name:
            intelligence_match = int_student
            break
    
    # Eğer eşleşme bulunduysa zeka türlerini ekle
    if intelligence_match:
        student["intelligenceTypes"] = intelligence_match["intelligence_types"]
        print(f'✅ {student_name} - Zeka türleri eklendi')
    else:
        # Eşleşme bulunamadıysa varsayılan değerler
        student["intelligenceTypes"] = {
            "verbal": 0,
            "logical": 0,
            "visual": 0,
            "musical": 0,
            "kinesthetic": 0,
            "interpersonal": 0,
            "intrapersonal": 0,
            "naturalist": 0
        }
        print(f'⚠️  {student_name} - Zeka türü verisi bulunamadı, varsayılan değerler atandı')
    
    updated_students.append(student)

# Güncellenmiş veriyi kaydet
current_students["students"] = updated_students
current_students["lastUpdated"] = datetime.now().isoformat()

with open('students.json', 'w', encoding='utf-8') as f:
    json.dump(current_students, f, ensure_ascii=False, indent=2)

print(f'\n✅ {len(updated_students)} öğrenci güncellendi!')

# Zeka türü dağılımını göster
intelligence_stats = {}
for student in updated_students:
    for int_type, score in student["intelligenceTypes"].items():
        if score > 0:
            intelligence_stats[int_type] = intelligence_stats.get(int_type, 0) + 1

print('\n=== GÜNCELLENMİŞ ZEKA TÜRÜ DAĞILIMI ===')
for int_type, count in sorted(intelligence_stats.items(), key=lambda x: x[1], reverse=True):
    print(f'{int_type}: {count} öğrenci')

# Örnek öğrenci göster
if updated_students:
    print('\n=== ÖRNEK ÖĞRENCİ ===')
    sample_student = updated_students[0]
    print(f'İsim: {sample_student["name"]}')
    print(f'Sınıf: {sample_student["grade"]}/{sample_student["class"]}')
    print(f'Öğrenme Stili: {sample_student["learningStyle"]}')
    print(f'Zeka Türleri: {sample_student["intelligenceTypes"]}')
