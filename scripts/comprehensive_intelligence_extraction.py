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

def extract_all_students_intelligence():
    """Tüm öğrenciler için zeka türlerini çıkar"""
    students = []
    current_student = None
    
    print("=== TÜM ÖĞRENCİLER İÇİN ZEKA TÜRLERİ ÇIKARILIYOR ===")
    
    for table_idx, table in enumerate(doc.tables):
        # Öğrenci bilgileri tablosu (3 satır, 2 sütun)
        if len(table.rows) == 3 and len(table.columns) == 2:
            # İlk satırı kontrol et
            first_row_text = ' '.join([cell.text.strip() for cell in table.rows[0].cells])
            if 'Öğrenci No:' in first_row_text:
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
                    print(f"Öğrenci bulundu: {student_info['name']} - {student_info.get('grade', '?')}/{student_info.get('class', '?')}")
        
        # Zeka türleri tablosu (8 satır, 2 sütun)
        elif len(table.rows) == 8 and len(table.columns) == 2:
            if current_student:
                # Zeka türlerini çıkar
                for row_idx, row in enumerate(table.rows):
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
                print(f"✅ {current_student['name']} - Zeka türleri eklendi")
                current_student = None
        
        # Diğer tablo boyutları (6-7 satır, 2-3 sütun)
        elif len(table.rows) >= 6 and len(table.columns) >= 2:
            # Zeka türleri tablosu olabilir
            first_row_text = ' '.join([cell.text.strip() for cell in table.rows[0].cells])
            if 'Güçlü Olduğu Zekâ Alanları' in first_row_text:
                if current_student:
                    # Zeka türlerini çıkar
                    for row_idx, row in enumerate(table.rows[1:], 1):  # İlk satırı atla
                        first_cell = row.cells[0].text.strip()
                        second_cell = row.cells[1].text.strip() if len(row.cells) > 1 else ""
                        
                        # Zeka türü adını bul
                        for int_name, int_key in intelligence_mapping.items():
                            if int_name in first_cell:
                                # Eğer ikinci sütunda açıklama varsa, bu zeka türü güçlü
                                if second_cell and len(second_cell) > 50:
                                    current_student['intelligence_types'][int_key] = 1
                                break
                    
                    # Öğrenciyi listeye ekle
                    students.append(current_student)
                    print(f"✅ {current_student['name']} - Zeka türleri eklendi")
                    current_student = None
        
        # Diğer tablo boyutları (3-5 satır, 2-3 sütun) - 5,6,7. sınıflar için
        elif len(table.rows) >= 3 and len(table.rows) <= 5 and len(table.columns) >= 2:
            # Zeka türleri tablosu olabilir
            first_row_text = ' '.join([cell.text.strip() for cell in table.rows[0].cells])
            if 'Güçlü Olduğu Zekâ Alanları' in first_row_text:
                if current_student:
                    # Zeka türlerini çıkar
                    for row_idx, row in enumerate(table.rows[1:], 1):  # İlk satırı atla
                        first_cell = row.cells[0].text.strip()
                        second_cell = row.cells[1].text.strip() if len(row.cells) > 1 else ""
                        
                        # Zeka türü adını bul
                        for int_name, int_key in intelligence_mapping.items():
                            if int_name in first_cell:
                                # Eğer ikinci sütunda açıklama varsa, bu zeka türü güçlü
                                if second_cell and len(second_cell) > 50:
                                    current_student['intelligence_types'][int_key] = 1
                                break
                    
                    # Öğrenciyi listeye ekle
                    students.append(current_student)
                    print(f"✅ {current_student['name']} - Zeka türleri eklendi")
                    current_student = None
    
    return students

# Zeka türlerini çıkar
all_students_with_intelligence = extract_all_students_intelligence()

print(f'\n✅ Toplam {len(all_students_with_intelligence)} öğrenci için zeka türleri çıkarıldı!')

# Zeka türü dağılımını göster
intelligence_stats = {}
for student in all_students_with_intelligence:
    for int_type, score in student['intelligence_types'].items():
        if score > 0:
            intelligence_stats[int_type] = intelligence_stats.get(int_type, 0) + 1

print('\n=== ZEKA TÜRÜ DAĞILIMI ===')
for int_type, count in sorted(intelligence_stats.items(), key=lambda x: x[1], reverse=True):
    print(f'{int_type}: {count} öğrenci')

# Sınıf dağılımı
grade_stats = {}
for student in all_students_with_intelligence:
    grade = student.get('grade', 'Bilinmeyen')
    grade_stats[grade] = grade_stats.get(grade, 0) + 1

print('\n=== SINIF DAĞILIMI ===')
for grade, count in sorted(grade_stats.items()):
    print(f'{grade}. Sınıf: {count} öğrenci')

# Örnek öğrenci göster
if all_students_with_intelligence:
    print('\n=== ÖRNEK ÖĞRENCİ ===')
    sample_student = all_students_with_intelligence[0]
    print(f'İsim: {sample_student["name"]}')
    print(f'Sınıf: {sample_student.get("grade", "Bilinmeyen")}/{sample_student.get("class", "Bilinmeyen")}')
    print(f'Zeka Türleri: {sample_student["intelligence_types"]}')

# Sonuçları kaydet
with open('complete_intelligence_data.json', 'w', encoding='utf-8') as f:
    json.dump(all_students_with_intelligence, f, ensure_ascii=False, indent=2)

print(f'\n✅ Veriler complete_intelligence_data.json dosyasına kaydedildi!')
