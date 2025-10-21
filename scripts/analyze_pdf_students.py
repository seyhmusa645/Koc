import json

# PDF'den çıkarılan veriyi oku
with open('pdf_students_data.json', 'r', encoding='utf-8') as f:
    pdf_students = json.load(f)

print(f'PDF\'de toplam {len(pdf_students)} öğrenci var')
print(f'Tüm öğrenciler 8. sınıf (mezun)')

# Sınıf dağılımı
classes = {}
for student in pdf_students:
    class_name = student.get('class', 'Belirsiz')
    classes[class_name] = classes.get(class_name, 0) + 1

print('\n=== SINIF DAĞILIMI ===')
for class_name, count in sorted(classes.items()):
    print(f'{class_name} sınıfı: {count} öğrenci')

# Cinsiyet dağılımı
genders = {}
for student in pdf_students:
    gender = student.get('gender', 'Belirsiz')
    genders[gender] = genders.get(gender, 0) + 1

print('\n=== CİNSİYET DAĞILIMI ===')
for gender, count in sorted(genders.items()):
    print(f'{gender}: {count} öğrenci')

print('\n=== İLK 5 ÖĞRENCİ ===')
for i, student in enumerate(pdf_students[:5]):
    print(f'{i+1}. {student["name"]} - {student["class"]} - {student["learning_style"]}')

# Öğrenme stilleri temizleme
print('\n=== ÖĞRENME STİLLERİ (TEMİZLENMİŞ) ===')
learning_styles_clean = {}
for student in pdf_students:
    style = student['learning_style']
    # Boşlukları ve hataları temizle
    style_clean = style.replace(' ', '').replace('AYR', 'AYRIŞTIRAN').replace('ÖZÜM', 'ÖZÜMSEYEN')
    learning_styles_clean[style_clean] = learning_styles_clean.get(style_clean, 0) + 1

for style, count in sorted(learning_styles_clean.items(), key=lambda x: x[1], reverse=True):
    print(f'{style}: {count} öğrenci')
