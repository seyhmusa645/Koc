import json

with open('students.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("İlk 5 öğrenci:")
for i, student in enumerate(data['students'][:5]):
    print(f"{i+1}. {student['name']}")

print(f"\nToplam öğrenci: {len(data['students'])}")
