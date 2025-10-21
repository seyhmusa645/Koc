import json
from datetime import datetime

# Mevcut öğrencileri oku
with open('students.json', 'r', encoding='utf-8') as f:
    current_data = json.load(f)

# Doğru zeka türleri verilerini oku
with open('fixed_intelligence_data.json', 'r', encoding='utf-8') as f:
    intelligence_data = json.load(f)

print(f'Mevcut öğrenci sayısı: {len(current_data["students"])}')
print(f'Zeka türü verisi olan öğrenci sayısı: {len(intelligence_data)}')

# Zeka türlerini mevcut öğrencilerle eşleştir
updated_students = []
matched_count = 0

for student in current_data["students"]:
    student_name = student["name"]
    
    # Zeka türü verisinde bu öğrenciyi ara
    intelligence_match = None
    for int_student in intelligence_data:
        if int_student["name"] == student_name:
            intelligence_match = int_student
            break
    
    # Eğer eşleşme bulunduysa zeka türlerini güncelle
    if intelligence_match:
        student["intelligenceTypes"] = intelligence_match["intelligence_types"]
        matched_count += 1
        print(f'✅ {student_name} - Zeka türleri güncellendi: {intelligence_match["intelligence_types"]}')
    else:
        print(f'⚠️  {student_name} - Zeka türü verisi bulunamadı')

# Güncellenmiş veriyi kaydet
current_data["students"] = updated_students
current_data["lastUpdated"] = datetime.now().isoformat()

with open('students.json', 'w', encoding='utf-8') as f:
    json.dump(current_data, f, ensure_ascii=False, indent=2)

print(f'\n✅ {len(updated_students)} öğrenci güncellendi!')
print(f'✅ {matched_count} öğrenci için zeka türleri eşleşti!')
print(f'⚠️  {len(updated_students) - matched_count} öğrenci için zeka türü verisi bulunamadı!')
