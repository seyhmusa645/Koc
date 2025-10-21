import PyPDF2
import json
import re

# PDF dosyasını oku
with open('Sonuclar-Ortaokul-Rapor.pdf', 'rb') as file:
    pdf_reader = PyPDF2.PdfReader(file)
    
    print(f'PDF toplam sayfa sayısı: {len(pdf_reader.pages)}')
    
    all_students = []
    page_student_counts = []
    
    for page_num, page in enumerate(pdf_reader.pages):
        text = page.extract_text()
        
        # Farklı pattern'ler deneyelim
        patterns = [
            # Pattern 1: Öğrenci No ile başlayan
            r'Öğrenci No:\s*(\d+).*?Adı Soyadı:\s*([^Cinsiyeti]+)Cinsiyeti:\s*([^Sınıfı]+)Sınıfı:\s*([^\n]+).*?Öğrencinin Öğrenme Stili:\s*([^\n]+)',
            # Pattern 2: Sadece isim ile başlayan
            r'Adı Soyadı:\s*([^Cinsiyeti]+)Cinsiyeti:\s*([^Sınıfı]+)Sınıfı:\s*([^\n]+).*?Öğrencinin Öğrenme Stili:\s*([^\n]+)',
            # Pattern 3: Daha esnek pattern
            r'Adı Soyadı:\s*([^Cinsiyeti]+)Cinsiyeti:\s*([^Sınıfı]+)Sınıfı:\s*([^\n]+)',
            # Pattern 4: Öğrenme stili ile arama
            r'Öğrencinin Öğrenme Stili:\s*([^\n]+)',
        ]
        
        page_students = []
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.DOTALL)
            if matches:
                print(f'Sayfa {page_num + 1}: {len(matches)} öğrenci bulundu (Pattern: {patterns.index(pattern) + 1})')
                page_students.extend(matches)
                break
        
        # Eğer hiç pattern çalışmazsa, sayfada "Adı Soyadı" geçen yerleri bul
        if not page_students:
            name_matches = re.findall(r'Adı Soyadı:\s*([^\n]+)', text)
            if name_matches:
                print(f'Sayfa {page_num + 1}: {len(name_matches)} isim bulundu (sadece isimler)')
                for name in name_matches:
                    page_students.append(('', name.strip(), '', '', ''))
        
        page_student_counts.append(len(page_students))
        all_students.extend(page_students)
    
    print(f'\n=== SAYFA BAZINDA ÖĞRENCİ SAYILARI ===')
    for i, count in enumerate(page_student_counts):
        if count > 0:
            print(f'Sayfa {i + 1}: {count} öğrenci')
    
    print(f'\nToplam bulunan öğrenci: {len(all_students)}')
    
    # İlk 10 öğrenciyi göster
    print(f'\n=== İLK 10 ÖĞRENCİ ===')
    for i, student in enumerate(all_students[:10]):
        if len(student) >= 2:
            print(f'{i+1}. {student[1] if len(student) > 1 else "Bilinmeyen"}')
    
    # Öğrenme stilleri analizi
    learning_styles = {}
    for student in all_students:
        if len(student) >= 5:
            style = student[4].strip()
            if style:
                learning_styles[style] = learning_styles.get(style, 0) + 1
    
    print(f'\n=== ÖĞRENME STİLLERİ DAĞILIMI ===')
    for style, count in sorted(learning_styles.items(), key=lambda x: x[1], reverse=True):
        print(f'{style}: {count} öğrenci')
    
    # Veriyi kaydet
    with open('all_pdf_students.json', 'w', encoding='utf-8') as f:
        json.dump(all_students, f, ensure_ascii=False, indent=2)
    
    print(f'\nTüm veriler all_pdf_students.json dosyasına kaydedildi')
