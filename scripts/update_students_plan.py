import json

# Mevcut students.json'u oku
with open('students.json', 'r', encoding='utf-8') as f:
    current_data = json.load(f)

print(f'Mevcut öğrenci sayısı: {len(current_data["students"])}')

# Yeni boş yapı oluştur
new_students_data = {
    "version": "2.0",
    "lastUpdated": "2025-09-22T23:30:00.000000",
    "students": []
}

# Boş students.json'u kaydet
with open('students.json', 'w', encoding='utf-8') as f:
    json.dump(new_students_data, f, ensure_ascii=False, indent=2)

print('✅ Mevcut tüm öğrenciler silindi!')
print('📝 students.json artık boş')
