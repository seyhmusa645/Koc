import PyPDF2
import json
import re

# PDF dosyasını oku
with open('Sonuclar-Ortaokul-Rapor.pdf', 'rb') as file:
    pdf_reader = PyPDF2.PdfReader(file)
    
    all_students = []
    
    for page_num, page in enumerate(pdf_reader.pages):
        text = page.extract_text()
        
        # Daha spesifik pattern - öğrenci no ile başlayan
        student_pattern = r'Öğrenci No:\s*(\d+).*?Adı Soyadı:\s*([^Cinsiyeti]+)Cinsiyeti:\s*([^Sınıfı]+)Sınıfı:\s*([^\n]+).*?Öğrencinin Öğrenme Stili:\s*([^\n]+)'
        
        matches = re.findall(student_pattern, text, re.DOTALL)
        
        for match in matches:
            student_no = match[0].strip()
            name = match[1].strip()
            gender = match[2].strip()
            grade_class = match[3].strip()
            learning_style = match[4].strip()
            
            # Sınıf bilgisini ayır
            if '/' in grade_class:
                grade, class_name = grade_class.split('/', 1)
                grade = grade.strip()
                class_name = class_name.strip()
            else:
                grade = grade_class.strip()
                class_name = None
            
            # Sadece geçerli isimleri al
            if len(name) > 3 and not name.startswith('Cinsiyeti'):
                all_students.append({
                    'student_no': student_no,
                    'name': name,
                    'gender': gender,
                    'grade': grade,
                    'class': class_name,
                    'learning_style': learning_style
                })
    
    print(f'Toplam geçerli öğrenci: {len(all_students)}')
    
    # İlk 10 öğrenciyi göster
    print('\n=== İLK 10 ÖĞRENCİ ===')
    for i, student in enumerate(all_students[:10]):
        print(f'{i+1}. {student["name"]} - {student["grade"]} - {student["learning_style"]}')
    
    # Öğrenme stilleri analizi
    learning_styles = {}
    for student in all_students:
        style = student['learning_style']
        learning_styles[style] = learning_styles.get(style, 0) + 1
    
    print('\n=== ÖĞRENME STİLLERİ DAĞILIMI ===')
    for style, count in sorted(learning_styles.items(), key=lambda x: x[1], reverse=True):
        print(f'{style}: {count} öğrenci')
    
    # Veriyi kaydet
    with open('final_pdf_students.json', 'w', encoding='utf-8') as f:
        json.dump(all_students, f, ensure_ascii=False, indent=2)
    
    print(f'\nVeriler final_pdf_students.json dosyasına kaydedildi')
