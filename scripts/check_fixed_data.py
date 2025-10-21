import json

# fixed_intelligence_data.json dosyasını kontrol et
with open('fixed_intelligence_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f'Toplam öğrenci: {len(data)}')
print('\nİlk 3 öğrenci:')
for i, student in enumerate(data[:3]):
    print(f'{i+1}. {student["name"]}: {student["intelligence_types"]}')

# Zeka türü dağılımını kontrol et
intelligence_stats = {}
for student in data:
    intelligence_types = student.get('intelligence_types', {})
    for int_type, value in intelligence_types.items():
        if value > 0:
            intelligence_stats[int_type] = intelligence_stats.get(int_type, 0) + 1

print('\n=== ZEKA TÜRÜ DAĞILIMI ===')
for int_type, count in sorted(intelligence_stats.items(), key=lambda x: x[1], reverse=True):
    print(f'{int_type}: {count} öğrenci')

if not intelligence_stats:
    print('⚠️  Hiçbir öğrencide zeka türü atanmamış!')
else:
    print(f'\n✅ {sum(intelligence_stats.values())} öğrencide zeka türü var!')
