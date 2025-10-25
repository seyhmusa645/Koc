#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Esnek Karne PDF Parser - Farklı PDF düzenlerini destekler
Flexible Report Card PDF Parser - Supports different PDF layouts
"""

import re
import sys
import os


class FlexibleKarneParser:
    """PDF formatından bağımsız esnek parser sınıfı"""

    def __init__(self, text):
        self.text = text
        self.data = {}

    def try_patterns(self, field_name, patterns):
        """Birden fazla pattern dene, ilk eşleşeni döndür"""
        for pattern in patterns:
            match = re.search(pattern, self.text, re.DOTALL | re.MULTILINE)
            if match:
                return match
        return None

    def parse_student_info(self):
        """Öğrenci bilgilerini çıkar - çoklu format desteği"""
        # Ad Soyad için farklı formatlar
        name_patterns = [
            # Format 1: Öğrenci Numara Sınıf formatı
            r'Öğrenci.*?Numara.*?Sınıf\s+([\w\s]+?)\s+(\d+)\s+([\d\-A-Z]+)',
            # Format 2: Adı Soyadı formatı
            r'Ad[ıi]\s+Soyad[ıi][:：]?\s*([\w\s]+)',
            # Format 3: Öğrenci Adı formatı
            r'Öğrenci\s+Ad[ıi][:：]?\s*([\w\s]+)',
            # Format 4: İsim label'ı ile
            r'(?:İsim|Ad|Name)[:：]?\s*([\w\s]{3,50}?)(?:\s+\d+|$)',
        ]

        name_match = self.try_patterns('name', name_patterns)
        if name_match:
            if len(name_match.groups()) >= 3:
                self.data['ad_soyad'] = name_match.group(1).strip()
                self.data['numara'] = name_match.group(2).strip()
                self.data['sinif'] = name_match.group(3).strip()
            else:
                self.data['ad_soyad'] = name_match.group(1).strip()

        # Numara için alternatif pattern (ad soyaddan ayrı ise)
        if 'numara' not in self.data:
            num_patterns = [
                r'(?:Numara|No|Öğrenci\s+No)[:：]?\s*(\d+)',
                r'No[:：]\s*(\d+)',
            ]
            num_match = self.try_patterns('numara', num_patterns)
            if num_match:
                self.data['numara'] = num_match.group(1).strip()

        # Sınıf için alternatif pattern
        if 'sinif' not in self.data:
            class_patterns = [
                r'S[ıi]n[ıi]f[:：]?\s*([\d\-A-Z]+)',
                r'Class[:：]?\s*([\d\-A-Z]+)',
            ]
            class_match = self.try_patterns('sinif', class_patterns)
            if class_match:
                self.data['sinif'] = class_match.group(1).strip()

    def parse_lgs_scores(self):
        """LGS puanları ve dereceleri - esnek format"""
        lgs_patterns = [
            # Format 1: Tek satırda tüm bilgiler
            r'LGS\s+([\d,]+)\s+([\d,]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)',
            # Format 2: LGS Puanı label'lı
            r'LGS\s+Puan[ıi]?[:：]?\s*([\d,]+)',
            # Format 3: Puan ve Ortalama ayrı satırlarda
            r'Puan[:：]?\s*([\d,]+).*?Ortalama[:：]?\s*([\d,]+)',
        ]

        lgs_match = self.try_patterns('lgs', lgs_patterns)
        if lgs_match:
            groups = lgs_match.groups()
            if len(groups) >= 7:
                self.data['lgs_puan'] = groups[0].replace(',', '.')
                self.data['lgs_ortalama'] = groups[1].replace(',', '.')
                self.data['sinif_derecesi'] = groups[2]
                self.data['kurum_derecesi'] = groups[3]
                self.data['ilce_derecesi'] = groups[4]
                self.data['il_derecesi'] = groups[5]
                self.data['genel_derece'] = groups[6]
            elif len(groups) >= 2:
                self.data['lgs_puan'] = groups[0].replace(',', '.')
                if len(groups) > 1:
                    self.data['lgs_ortalama'] = groups[1].replace(',', '.')
            elif len(groups) >= 1:
                self.data['lgs_puan'] = groups[0].replace(',', '.')

        # Dereceler için ayrı pattern dene
        if 'sinif_derecesi' not in self.data:
            derece_patterns = [
                r'S[ıi]n[ıi]f\s+Derece(?:si)?[:：]?\s*(\d+)',
                r'Kurum\s+Derece(?:si)?[:：]?\s*(\d+)',
                r'İlçe\s+Derece(?:si)?[:：]?\s*(\d+)',
                r'İl\s+Derece(?:si)?[:：]?\s*(\d+)',
                r'Genel\s+Derece(?:si)?[:：]?\s*(\d+)',
            ]
            for i, pattern in enumerate(derece_patterns):
                match = re.search(pattern, self.text)
                if match:
                    field_names = ['sinif_derecesi', 'kurum_derecesi', 'ilce_derecesi',
                                   'il_derecesi', 'genel_derece']
                    if i < len(field_names):
                        self.data[field_names[i]] = match.group(1)

    def parse_katilim(self):
        """Katılım bilgisi"""
        katilim_patterns = [
            r'Kat[ıi]l[ıi]mlar?[:：]?\s+([\d\s]+)',
            r'Devam[:：]?\s+([\d\s]+)',
            r'Attendance[:：]?\s+([\d\s]+)',
        ]
        katilim_match = self.try_patterns('katilim', katilim_patterns)
        if katilim_match:
            self.data['katilimlar'] = katilim_match.group(1).strip()

    def parse_subject(self, subject_name, patterns, prefix):
        """Ders bilgilerini parse et - esnek sütun sırası"""
        for pattern in patterns:
            match = re.search(pattern, self.text)
            if match:
                groups = match.groups()
                # Soru sayısını atla, doğrudan doğru/yanlış/net/başarı al
                if len(groups) >= 4:
                    self.data[f'{prefix}_dogru'] = groups[1] if len(groups) > 1 else groups[0]
                    self.data[f'{prefix}_yanlis'] = groups[2] if len(groups) > 2 else '0'
                    self.data[f'{prefix}_net'] = groups[3].replace(',', '.') if len(groups) > 3 else '0'
                    if len(groups) > 4:
                        self.data[f'{prefix}_basari'] = groups[4]
                return True
        return False

    def parse_all_subjects(self):
        """Tüm dersleri parse et"""
        subjects = [
            ('Türkçe', [
                r'Türkçe\s+(?:15|20)\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)',
                r'Türkçe.*?D[:：]?\s*(\d+).*?Y[:：]?\s*(\d+).*?Net[:：]?\s*([\d,]+).*?(?:Başar[ıi]|%)[:：]?\s*(\d+)',
            ], 'turk'),

            ('Tarih/Sosyal', [
                r'Tarih\s+10\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)',
                r'(?:Sosyal\s+Bilgiler|SOSYAL\s+BİLGİLER)\s+10\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)',
                r'(?:Tarih|Sosyal).*?D[:：]?\s*(\d+).*?Y[:：]?\s*(\d+).*?Net[:：]?\s*([\d,]+).*?(?:Başar[ıi]|%)[:：]?\s*(\d+)',
            ], 'tarih'),

            ('Din Kültürü', [
                r'Din\s+K\.ve\s+A\.B\.\s+10\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)',
                r'Din.*?10\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)',
                r'Din.*?D[:：]?\s*(\d+).*?Y[:：]?\s*(\d+).*?Net[:：]?\s*([\d,]+).*?(?:Başar[ıi]|%)[:：]?\s*(\d+)',
            ], 'din'),

            ('İngilizce', [
                r'İngilizce\s+10\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)',
                r'(?:İngilizce|English).*?D[:：]?\s*(\d+).*?Y[:：]?\s*(\d+).*?Net[:：]?\s*([\d,]+).*?(?:Başar[ıi]|%)[:：]?\s*(\d+)',
            ], 'ing'),

            ('Matematik', [
                r'Matematik\s+(?:15|20)\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)',
                r'(?:Matematik|Math).*?D[:：]?\s*(\d+).*?Y[:：]?\s*(\d+).*?Net[:：]?\s*([\d,]+).*?(?:Başar[ıi]|%)[:：]?\s*(\d+)',
            ], 'mat'),

            ('Fen', [
                r'Fen\s+(?:15|20)\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)',
                r'(?:Fen|Science).*?D[:：]?\s*(\d+).*?Y[:：]?\s*(\d+).*?Net[:：]?\s*([\d,]+).*?(?:Başar[ıi]|%)[:：]?\s*(\d+)',
            ], 'fen'),

            ('Toplam', [
                r'Toplam[:：]?\s+(?:75|90)\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)',
                r'(?:Toplam|Total).*?D[:：]?\s*(\d+).*?Y[:：]?\s*(\d+).*?Net[:：]?\s*([\d,]+).*?(?:Başar[ıi]|%)[:：]?\s*(\d+)',
            ], 'toplam'),
        ]

        for subject_name, patterns, prefix in subjects:
            self.parse_subject(subject_name, patterns, prefix)

    def parse_kazanimlar(self):
        """Kazanım bilgilerini parse et - esnek başlık araması"""
        # Farklı başlık alternatifleri
        section_headers = [
            'DERSLERE GÖRE ANALİZ',
            'KAZANIM ANALİZİ',
            'KAZANIMLAR',
            'KAZANIM DETAYLARI',
            'ANALİZ',
            'DERS ANALİZİ',
        ]

        analysis_start = -1
        for header in section_headers:
            analysis_start = self.text.find(header)
            if analysis_start != -1:
                break

        if analysis_start == -1:
            self.data['kazanimlar_ozet'] = 'Yok'
            return

        analysis_text = self.text[analysis_start:]
        section_pattern = re.compile(r'(Sözel|Sayısal)\s*\(([A-ZÇĞİÖŞÜ\s]+)\)')
        matches = list(section_pattern.finditer(analysis_text))

        if not matches:
            self.data['kazanimlar_ozet'] = 'Yok'
            return

        def is_number(token: str) -> bool:
            return bool(re.fullmatch(r'-?\d+(?:[.,]\d+)?', token))

        kazanimlar = []
        for idx, match in enumerate(matches):
            start = match.start()
            end = matches[idx + 1].start() if idx + 1 < len(matches) else len(analysis_text)
            block = analysis_text[start:end]

            lines = [line.strip() for line in block.splitlines() if line.strip()]
            if not lines:
                continue

            # Başlık satırlarını atla
            if lines and (lines[0].startswith('Sözel') or lines[0].startswith('Sayısal')):
                lines.pop(0)
            if lines:
                lines.pop(0)  # ders adı
            for label in ('S', 'D', 'Y', 'B%'):
                if lines and lines[0].upper() == label:
                    lines.pop(0)

            i = 0
            while i < len(lines):
                if not lines[i]:
                    i += 1
                    continue

                desc_parts = []
                while i < len(lines) and not is_number(lines[i]):
                    desc_parts.append(lines[i])
                    i += 1
                desc = ' '.join(desc_parts).strip()
                if not desc:
                    continue

                if 'KAZANIM' in desc.upper() and 'BEL' in desc.upper():
                    skipped = 0
                    while i < len(lines) and is_number(lines[i]) and skipped < 4:
                        i += 1
                        skipped += 1
                    continue

                numbers = []
                while i < len(lines) and is_number(lines[i]) and len(numbers) < 4:
                    numbers.append(lines[i])
                    i += 1

                if len(numbers) == 4:
                    basari_value = numbers[3].replace(',', '.')
                    prefix = match.group(2).strip()
                    kazanimlar.append(f"{prefix}: {desc[:200]} ({basari_value}%)")

        self.data['kazanimlar_ozet'] = ' | '.join(kazanimlar) if kazanimlar else 'Yok'

    def parse(self):
        """Tüm verileri parse et"""
        self.parse_student_info()
        self.parse_lgs_scores()
        self.parse_katilim()
        self.parse_all_subjects()
        self.parse_kazanimlar()
        return self.data


def detect_page_boundaries(content):
    """Sayfa sınırlarını tespit et - farklı formatlar için"""
    boundary_patterns = [
        r'(?=SONUÇ BELGESİ)',
        r'(?=KARNE)',
        r'(?=ÖĞRENCİ\s+RAPORU)',
        r'(?=SINAV\s+SONUCU)',
        r'(?=Öğrenci\s+No[:：])',
    ]

    for pattern in boundary_patterns:
        pages = re.split(pattern, content)
        # En az 2 sayfa varsa ve ilk sayfa boş değilse
        if len(pages) >= 2 and len(pages[0].strip()) < 500:
            # İlk sayfa çok kısa, muhtemelen başlık
            if len(pages) > 2:
                return pages[1:]  # İlk boş sayfayı atla
        if len(pages) >= 2:
            return pages

    # Hiçbir pattern eşleşmezse, sabit satır sayısına göre böl (yedek yöntem)
    lines = content.split('\n')
    if len(lines) > 100:
        # Her 100 satırda bir sayfa varsay
        pages = []
        for i in range(0, len(lines), 100):
            pages.append('\n'.join(lines[i:i+100]))
        return pages

    # Son çare: tüm içeriği tek sayfa olarak döndür
    return [content]


def extract_to_excel(input_file, output_file):
    """PDF'den Excel'e çıkarma - Esnek format desteği"""
    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment
    except ImportError:
        print("HATA: openpyxl kütüphanesi yüklü değil!")
        print("Yüklemek için: pip install openpyxl")
        return

    # Dosyayı oku
    if input_file.lower().endswith('.pdf'):
        try:
            import fitz
            doc = fitz.open(input_file)
            all_text = ""
            for page_num in range(len(doc)):
                page = doc[page_num]
                all_text += page.get_text()
            doc.close()
            content = all_text
        except ImportError:
            print("HATA: PyMuPDF (fitz) yüklü değil!")
            print("Yüklemek için: pip install PyMuPDF")
            return
    else:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()

    # Sayfaları esnek şekilde ayır
    pages = detect_page_boundaries(content)
    print(f"Tespit edilen sayfa sayısı: {len(pages)}")

    # Excel workbook oluştur
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Öğrenci Karneleri"

    # Başlık satırı
    headers = [
        'Ad Soyad', 'Numara', 'Sınıf', 'Katılımlar',
        'LGS Puanı', 'LGS Ortalama', 'Sınıf Derecesi', 'Kurum Derecesi',
        'İlçe Derecesi', 'İl Derecesi', 'Genel Derece',
        'Türkçe Doğru', 'Türkçe Yanlış', 'Türkçe Net', 'Türkçe Başarı%',
        'Tarih Doğru', 'Tarih Yanlış', 'Tarih Net', 'Tarih Başarı%',
        'Din Doğru', 'Din Yanlış', 'Din Net', 'Din Başarı%',
        'İngilizce Doğru', 'İngilizce Yanlış', 'İngilizce Net', 'İngilizce Başarı%',
        'Matematik Doğru', 'Matematik Yanlış', 'Matematik Net', 'Matematik Başarı%',
        'Fen Doğru', 'Fen Yanlış', 'Fen Net', 'Fen Başarı%',
        'Toplam Doğru', 'Toplam Yanlış', 'Toplam Net', 'Toplam Başarı%',
        'Kazanım Detayları'
    ]

    # Başlık stilini ayarla
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")

    for col, header in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col)
        cell.value = header
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center', vertical='center')

    # Öğrenci verilerini işle
    row = 2
    skipped = 0
    for page_idx, page in enumerate(pages):
        if not page.strip() or len(page.strip()) < 50:
            skipped += 1
            continue

        # Esnek parser kullan
        parser = FlexibleKarneParser(page)
        student_data = parser.parse()

        if not student_data.get('ad_soyad'):
            skipped += 1
            continue

        # Verileri yaz
        data_row = [
            student_data.get('ad_soyad', ''),
            student_data.get('numara', ''),
            student_data.get('sinif', ''),
            student_data.get('katilimlar', ''),
            student_data.get('lgs_puan', ''),
            student_data.get('lgs_ortalama', ''),
            student_data.get('sinif_derecesi', ''),
            student_data.get('kurum_derecesi', ''),
            student_data.get('ilce_derecesi', ''),
            student_data.get('il_derecesi', ''),
            student_data.get('genel_derece', ''),
            student_data.get('turk_dogru', ''),
            student_data.get('turk_yanlis', ''),
            student_data.get('turk_net', ''),
            student_data.get('turk_basari', ''),
            student_data.get('tarih_dogru', ''),
            student_data.get('tarih_yanlis', ''),
            student_data.get('tarih_net', ''),
            student_data.get('tarih_basari', ''),
            student_data.get('din_dogru', ''),
            student_data.get('din_yanlis', ''),
            student_data.get('din_net', ''),
            student_data.get('din_basari', ''),
            student_data.get('ing_dogru', ''),
            student_data.get('ing_yanlis', ''),
            student_data.get('ing_net', ''),
            student_data.get('ing_basari', ''),
            student_data.get('mat_dogru', ''),
            student_data.get('mat_yanlis', ''),
            student_data.get('mat_net', ''),
            student_data.get('mat_basari', ''),
            student_data.get('fen_dogru', ''),
            student_data.get('fen_yanlis', ''),
            student_data.get('fen_net', ''),
            student_data.get('fen_basari', ''),
            student_data.get('toplam_dogru', ''),
            student_data.get('toplam_yanlis', ''),
            student_data.get('toplam_net', ''),
            student_data.get('toplam_basari', ''),
            student_data.get('kazanimlar_ozet', 'Yok')
        ]

        for col, value in enumerate(data_row, start=1):
            ws.cell(row=row, column=col, value=value)

        print(f"  ✓ Sayfa {page_idx + 1}: {student_data.get('ad_soyad', 'Bilinmeyen')}")
        row += 1

    # Sütun genişliklerini ayarla
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 150)
        ws.column_dimensions[column_letter].width = adjusted_width

    # Dosyayı kaydet
    wb.save(output_file)
    print(f'\n[OK] Excel dosyası oluşturuldu: {output_file}')
    print(f"  Toplam {row-2} öğrenci kaydedildi.")
    print(f"  {skipped} sayfa atlandı (veri yok veya format uyumsuz)")


def main():
    """Ana fonksiyon"""
    print("=" * 80)
    print("ESNEK KARNE PDF'DEN EXCEL'E ÇIKARMA ARACI")
    print("Flexible Report Card PDF to Excel Converter")
    print("=" * 80)
    print()

    if len(sys.argv) < 2:
        print("Kullanım: python karne_excel_flexible.py <pdf_dosyasi> [excel_dosyasi]")
        print()
        print("Örnek:")
        print("  python karne_excel_flexible.py karne.pdf")
        print("  python karne_excel_flexible.py karne.pdf sonuc.xlsx")
        print()
        print("ÖZELLİKLER:")
        print("  - Farklı PDF düzenlerini otomatik algılar")
        print("  - Kazanım bilgileri sol/sağ tarafta olabilir")
        print("  - Skor bilgileri üst/sol tarafta olabilir")
        print("  - Birden fazla sayfa ayırma formatını destekler")
        return

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "ogrenci_karneleri_flexible.xlsx"

    if not output_file.endswith('.xlsx'):
        output_file += '.xlsx'

    if not os.path.exists(input_file):
        print(f"HATA: {input_file} dosyası bulunamadı!")
        return

    extract_to_excel(input_file, output_file)

    print()
    print("=" * 80)
    print("İşlem tamamlandı!")
    print("=" * 80)


if __name__ == "__main__":
    main()
