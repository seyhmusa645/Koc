import json

# Öğrenci verilerini kontrol et
with open('students.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Toplam öğrenci: {len(data['students'])}")
print("\nİlk 3 öğrenci:")
for i, student in enumerate(data['students'][:3]):
    print(f"{i+1}. {student['name']} ({student['grade']}/{student['class']})")
    print(f"   Öğrenme Stili: {student.get('learningStyle', 'Belirlenmemiş')}")
    print(f"   Zeka Türleri: {student.get('intelligenceTypes', {})}")
    print()

# Zeka türü dağılımını kontrol et
intelligence_stats = {}
for student in data['students']:
    intelligence_types = student.get('intelligenceTypes', {})
    for int_type, value in intelligence_types.items():
        if value > 0:
            intelligence_stats[int_type] = intelligence_stats.get(int_type, 0) + 1

print("=== ZEKA TÜRÜ DAĞILIMI ===")
for int_type, count in sorted(intelligence_stats.items(), key=lambda x: x[1], reverse=True):
    print(f"{int_type}: {count} öğrenci")

print(f"\n✅ Sistem hazır! AI analizi artık zeka türlerini değerlendirecek.")
