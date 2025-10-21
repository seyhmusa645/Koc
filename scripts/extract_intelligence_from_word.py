import json
from docx import Document
import re

# Word dosyasını oku
doc = Document('Sonuclar-Ortaokul-Rapor.docx')

# Zeka türü eşleştirme sözlüğü
intelligence_mapping = {
    'Sözel / Dilsel Zekâ': 'verbal',
    'Matematiksel\n/ Mantıksal Zekâ': 'logical',
    'Görsel / Uzamsal Zekâ': 'visual',
    'Müziksel / Ritmik Zekâ': 'musical',
    'Doğa Zekâsı': 'naturalist',
    'Kişiler Arası Zekâ': 'interpersonal',
    'Bedensel /\nKinestetik Zekâ': 'kinesthetic',
    'İçsel / Öze Dönük Zekâ': 'intrapersonal'
}

def extract_student_intelligence():
    """Her öğrenci için zeka türlerini çıkar"""
    students = []
    current_student = None
    
    for table_idx, table in enumerate(doc.tables):
        # Öğrenci bilgileri tablosu (3 satır, 2 sütun)
        if len(table.rows) == 3 and len(table.columns) == 2:
            # Öğrenci bilgilerini çıkar
            student_info = {}
            for row in table.rows:
                for cell in row.cells:
                    text = cell.text.strip()
                    if 'Öğrenci No:' in text:
                        student_info['student_no'] = text.split(':')[1].strip()
                    elif 'Adı Soyadı:' in text:
                        student_info['name'] = text.split(':')[1].strip()
                    elif 'Sınıfı:' in text:
                        grade_class = text.split(':')[1].strip()
                        if '/' in grade_class:
                            grade, class_name = grade_class.split('/')
                            student_info['grade'] = grade.strip()
                            student_info['class'] = class_name.strip()
            
            if student_info.get('name'):
                current_student = student_info
                current_student['intelligence_types'] = {
                    'verbal': 0,
                    'logical': 0,
                    'visual': 0,
                    'musical': 0,
                    'kinesthetic': 0,
                    'interpersonal': 0,
                    'intrapersonal': 0,
                    'naturalist': 0
                }
        
        # Zeka türleri tablosu (8 satır, 2 sütun)
        elif len(table.rows) == 8 and len(table.columns) == 2:
            if current_student:
                # Zeka türlerini çıkar
                for row in table.rows:
                    first_cell = row.cells[0].text.strip()
                    second_cell = row.cells[1].text.strip()
                    
                    # Zeka türü adını bul
                    for int_name, int_key in intelligence_mapping.items():
                        if int_name in first_cell:
                            # Eğer ikinci sütunda açıklama varsa, bu zeka türü güçlü
                            if second_cell and len(second_cell) > 50:
                                current_student['intelligence_types'][int_key] = 1
                            break
                
                # Öğrenciyi listeye ekle
                students.append(current_student)
                current_student = None
    
    return students

# Zeka türlerini çıkar
students_with_intelligence = extract_student_intelligence()

print(f'✅ {len(students_with_intelligence)} öğrenci için zeka türleri çıkarıldı!')

# Zeka türü dağılımını göster
intelligence_stats = {}
for student in students_with_intelligence:
    for int_type, score in student['intelligence_types'].items():
        if score > 0:
            intelligence_stats[int_type] = intelligence_stats.get(int_type, 0) + 1

print('\n=== ZEKA TÜRÜ DAĞILIMI ===')
for int_type, count in sorted(intelligence_stats.items(), key=lambda x: x[1], reverse=True):
    print(f'{int_type}: {count} öğrenci')

# Örnek öğrenci göster
if students_with_intelligence:
    print('\n=== ÖRNEK ÖĞRENCİ ===')
    sample_student = students_with_intelligence[0]
    print(f'İsim: {sample_student["name"]}')
    print(f'Sınıf: {sample_student.get("grade", "Bilinmeyen")}/{sample_student.get("class", "Bilinmeyen")}')
    print(f'Zeka Türleri: {sample_student["intelligence_types"]}')

# Sonuçları kaydet
with open('students_with_intelligence.json', 'w', encoding='utf-8') as f:
    json.dump(students_with_intelligence, f, ensure_ascii=False, indent=2)

print(f'\n✅ Veriler students_with_intelligence.json dosyasına kaydedildi!')
