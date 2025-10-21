import docx
import re
import json

def extract_intelligence_correctly(docx_path='Sonuclar-Ortaokul-Rapor.docx'):
    doc = docx.Document(docx_path)
    students = []
    current_student = None
    
    print("=== ZEKA TÜRLERİNİ DOĞRU ŞEKİLDE ÇIKARIYOR ===")
    
    for table_idx, table in enumerate(doc.tables):
        # Öğrenci bilgileri tablosu (3 satır, 2 sütun)
        if len(table.rows) == 3 and len(table.columns) == 2:
            try:
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
            except Exception as e:
                print(f"Hata: {e}")
                continue
        
        # Zeka türleri tablosu - TÜM BOYUTLAR
        elif len(table.rows) >= 3 and len(table.columns) >= 2:
            if current_student:
                # Zeka türleri tablosu olabilir
                first_row_text = ' '.join([cell.text.strip() for cell in table.rows[0].cells])
                if 'Güçlü Olduğu Zekâ Alanları' in first_row_text or 'Zekâ Alanları' in first_row_text:
                    print(f"  -> Zeka türleri tablosu bulundu: {len(table.rows)} satır, {len(table.columns)} sütun")
                    
                    # Zeka türlerini çıkar
                    intelligence_found = False
                    for row_idx, row in enumerate(table.rows[1:], 1):  # İlk satırı atla
                        first_cell = row.cells[0].text.strip()
                        second_cell = row.cells[1].text.strip() if len(row.cells) > 1 else ""
                        
                        # Zeka türü adını bul
                        intelligence_keywords = {
                            'Sözel / Dilsel Zekâ': 'verbal',
                            'Matematiksel\n/ Mantıksal Zekâ': 'logical',
                            'Görsel / Uzamsal Zekâ': 'visual',
                            'Müziksel / Ritmik Zekâ': 'musical',
                            'Doğa Zekâsı': 'naturalist',
                            'Kişiler Arası Zekâ': 'interpersonal',
                            'Bedensel /\nKinestetik Zekâ': 'kinesthetic',
                            'İçsel / Öze Dönük Zekâ': 'intrapersonal'
                        }
                        
                        for int_name, int_key in intelligence_keywords.items():
                            if int_name in first_cell:
                                # Eğer ikinci sütunda açıklama varsa, bu zeka türü güçlü
                                if second_cell and len(second_cell) > 50:
                                    current_student['intelligence_types'][int_key] = 1
                                    intelligence_found = True
                                    print(f"    -> {int_key}: 1")
                                break
                    
                    if intelligence_found:
                        students.append(current_student)
                        print(f"✅ {current_student['name']} - Zeka türleri eklendi")
                        current_student = None
                    else:
                        print(f"⚠️  {current_student['name']} - Zeka türleri bulunamadı")
                        current_student = None
    
    return students

# Zeka türlerini çıkar
all_students = extract_intelligence_correctly()

print(f'\n✅ Toplam {len(all_students)} öğrenci için zeka türleri çıkarıldı!')

# Zeka türü dağılımını göster
intelligence_stats = {}
for student in all_students:
    for int_type, score in student['intelligence_types'].items():
        if score > 0:
            intelligence_stats[int_type] = intelligence_stats.get(int_type, 0) + 1

print('\n=== ZEKA TÜRÜ DAĞILIMI ===')
for int_type, count in sorted(intelligence_stats.items(), key=lambda x: x[1], reverse=True):
    print(f'{int_type}: {count} öğrenci')

# Sonuçları kaydet
with open('corrected_intelligence_data.json', 'w', encoding='utf-8') as f:
    json.dump(all_students, f, ensure_ascii=False, indent=2)

print(f'\n✅ Veriler corrected_intelligence_data.json dosyasına kaydedildi!')
