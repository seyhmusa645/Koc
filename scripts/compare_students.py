import json

# Mevcut students.json'u oku
with open('students.json', 'r', encoding='utf-8') as f:
    current_students = json.load(f)

print(f'Mevcut students.json\'da {len(current_students["students"])} öğrenci var')
print(f'PDF\'den {261} öğrenci çıkarıldı')

# PDF'den çıkarılan veriyi oku
with open('all_pdf_students.json', 'r', encoding='utf-8') as f:
    pdf_students = json.load(f)

print(f'PDF\'den çıkarılan toplam veri: {len(pdf_students)}')

# İlk 5 öğrenciyi göster
print('\n=== MEVCUT ÖĞRENCİLER (İLK 5) ===')
for i, student in enumerate(current_students['students'][:5]):
    print(f'{i+1}. {student["name"]} - {student.get("learningStyle", "Belirsiz")}')

print('\n=== PDF ÖĞRENCİLER (İLK 5) ===')
for i, student in enumerate(pdf_students[:5]):
    if len(student) >= 2:
        print(f'{i+1}. {student[1] if len(student) > 1 else "Bilinmeyen"}')

# PDF'den düzgün öğrenci bilgilerini çıkar
clean_pdf_students = []
for student in pdf_students:
    if len(student) >= 5 and student[1] and len(student[1]) > 3:  # En az 3 karakter isim
        clean_pdf_students.append({
            'name': student[1].strip(),
            'gender': student[2].strip() if len(student) > 2 else 'Belirsiz',
            'grade': student[3].strip() if len(student) > 3 else '8',
            'class': student[3].split('/')[1].strip() if len(student) > 3 and '/' in student[3] else None,
            'learning_style': student[4].strip() if len(student) > 4 else 'Belirsiz'
        })

print(f'\nTemizlenmiş PDF öğrenci sayısı: {len(clean_pdf_students)}')

# İlk 10 temiz öğrenciyi göster
print('\n=== TEMİZLENMİŞ PDF ÖĞRENCİLER (İLK 10) ===')
for i, student in enumerate(clean_pdf_students[:10]):
    print(f'{i+1}. {student["name"]} - {student["grade"]} - {student["learning_style"]}')

# Temizlenmiş veriyi kaydet
with open('clean_pdf_students.json', 'w', encoding='utf-8') as f:
    json.dump(clean_pdf_students, f, ensure_ascii=False, indent=2)

print(f'\nTemizlenmiş veriler clean_pdf_students.json dosyasına kaydedildi')
