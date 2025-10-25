#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Format Test Utility
Bir PDF'nin karne parser'ları ile uyumlu olup olmadığını test eder
"""

import sys
import os

def test_pdf_format(pdf_path):
    """PDF formatını test et ve sonuçları göster"""
    try:
        import fitz
    except ImportError:
        print("❌ HATA: PyMuPDF (fitz) yüklü değil!")
        print("Yüklemek için: pip install PyMuPDF")
        return

    if not os.path.exists(pdf_path):
        print(f"❌ HATA: {pdf_path} dosyası bulunamadı!")
        return

    print("=" * 80)
    print("📄 PDF FORMAT ANALİZ ARACI")
    print("=" * 80)
    print(f"\nDosya: {pdf_path}\n")

    # PDF'i aç
    doc = fitz.open(pdf_path)
    print(f"📊 Toplam Sayfa: {len(doc)}\n")

    # İlk birkaç sayfayı analiz et
    max_pages = min(3, len(doc))

    for page_num in range(max_pages):
        print(f"\n{'='*80}")
        print(f"📖 SAYFA {page_num + 1} ANALİZİ")
        print(f"{'='*80}\n")

        page = doc[page_num]
        text = page.get_text()

        # Temel bilgiler
        print(f"📏 Metin uzunluğu: {len(text)} karakter")
        print(f"📝 Satır sayısı: {len(text.splitlines())}\n")

        # İlk 500 karakteri göster
        print("📝 İLK 500 KARAKTER:")
        print("-" * 80)
        print(text[:500])
        print("-" * 80)
        print()

        # Format analizi
        print("🔍 FORMAT ANALİZİ:")
        print("-" * 80)

        # Sayfa ayırıcıları kontrol et
        boundary_keywords = [
            'SONUÇ BELGESİ',
            'KARNE',
            'ÖĞRENCİ RAPORU',
            'SINAV SONUCU',
        ]
        print("\n1️⃣ Sayfa Ayırıcıları:")
        found_boundary = False
        for keyword in boundary_keywords:
            if keyword in text:
                print(f"   ✅ Bulundu: '{keyword}'")
                found_boundary = True
        if not found_boundary:
            print(f"   ⚠️  Standart sayfa ayırıcı bulunamadı")

        # Öğrenci bilgileri
        import re
        print("\n2️⃣ Öğrenci Bilgileri:")
        name_patterns = [
            (r'Öğrenci.*?Numara.*?Sınıf', 'Öğrenci/Numara/Sınıf formatı'),
            (r'Ad[ıi]\s+Soyad[ıi][:：]?', 'Adı Soyadı label'),
            (r'Öğrenci\s+Ad[ıi][:：]?', 'Öğrenci Adı label'),
        ]
        for pattern, desc in name_patterns:
            if re.search(pattern, text):
                print(f"   ✅ {desc}")
            else:
                print(f"   ❌ {desc}")

        # LGS bilgileri
        print("\n3️⃣ LGS Bilgileri:")
        if re.search(r'LGS', text):
            print(f"   ✅ 'LGS' etiketi bulundu")
            if re.search(r'LGS\s+[\d,]+', text):
                print(f"   ✅ LGS puanı formatı tespit edildi")
        else:
            print(f"   ⚠️  LGS bilgisi bulunamadı")

        # Ders skorları
        print("\n4️⃣ Ders Skorları:")
        subjects = ['Türkçe', 'Matematik', 'Fen', 'İngilizce', 'Tarih', 'Sosyal']
        found_subjects = []
        for subject in subjects:
            if subject in text:
                found_subjects.append(subject)
                print(f"   ✅ {subject}")
        if not found_subjects:
            print(f"   ⚠️  Standart ders adları bulunamadı")

        # Kazanım bölümü
        print("\n5️⃣ Kazanım Bölümü:")
        kazanim_headers = [
            'DERSLERE GÖRE ANALİZ',
            'KAZANIM ANALİZİ',
            'KAZANIMLAR',
            'KAZANIM DETAYLARI',
        ]
        found_kazanim = False
        for header in kazanim_headers:
            if header in text:
                print(f"   ✅ Bulundu: '{header}'")
                found_kazanim = True
        if not found_kazanim:
            print(f"   ⚠️  Kazanım başlığı bulunamadı")

        # Sayısal veri kontrolü
        print("\n6️⃣ Sayısal Veriler:")
        numbers = re.findall(r'\d+[,.]?\d*', text)
        print(f"   ℹ️  {len(numbers)} adet sayı tespit edildi")
        if len(numbers) > 20:
            print(f"   ✅ Yeterli sayısal veri var")
        else:
            print(f"   ⚠️  Az sayısal veri (skor verileri eksik olabilir)")

    doc.close()

    # Genel değerlendirme
    print(f"\n\n{'='*80}")
    print("🎯 GENEL DEĞERLENDİRME")
    print("=" * 80)
    print()

    # İlk sayfayı yeniden analiz et
    doc = fitz.open(pdf_path)
    text = doc[0].get_text()

    score = 0
    max_score = 6

    if any(kw in text for kw in boundary_keywords):
        score += 1
        print("✅ Sayfa ayırıcı formatı: UYUMLU")
    else:
        print("⚠️  Sayfa ayırıcı formatı: STANDART DEĞİL (esnek parser gerekebilir)")

    if re.search(r'Öğrenci.*?Numara|Ad[ıi]\s+Soyad', text):
        score += 1
        print("✅ Öğrenci bilgi formatı: UYUMLU")
    else:
        print("❌ Öğrenci bilgi formatı: UYUMSUZ")

    if 'LGS' in text:
        score += 1
        print("✅ LGS bilgileri: MEVCUT")
    else:
        print("⚠️  LGS bilgileri: YOK (bazı formatlar için normal)")

    subjects_found = sum(1 for subj in subjects if subj in text)
    if subjects_found >= 3:
        score += 1
        print(f"✅ Ders skorları: MEVCUT ({subjects_found} ders)")
    else:
        print(f"❌ Ders skorları: YETERSİZ ({subjects_found} ders)")

    if any(kw in text for kw in kazanim_headers):
        score += 1
        print("✅ Kazanım bölümü: MEVCUT")
    else:
        print("⚠️  Kazanım bölümü: YOK")

    if len(re.findall(r'\d+', text)) > 20:
        score += 1
        print("✅ Sayısal veri: YETERLİ")
    else:
        print("⚠️  Sayısal veri: YETERSIZ")

    doc.close()

    print()
    print("=" * 80)
    print(f"📊 UYUMLULUK SKORU: {score}/{max_score}")
    print("=" * 80)
    print()

    if score >= 5:
        print("✅ SONUÇ: Bu PDF muhtemelen HER İKİ PARSER ile de çalışır")
        print("   Öneri: karne_excel.py kullanın (daha hızlı)")
    elif score >= 3:
        print("⚠️  SONUÇ: Bu PDF ESNEK PARSER ile çalışabilir")
        print("   Öneri: karne_excel_flexible.py kullanın")
    else:
        print("❌ SONUÇ: Bu PDF standart format değil")
        print("   Öneri: PDF'den örnek sayfa gönderin, özel parser gerekebilir")

    print()
    print("🔧 ÖNERİLEN KOMUTLAR:")
    print("-" * 80)
    if score >= 3:
        print(f"python karne_excel_flexible.py \"{pdf_path}\" sonuc.xlsx")
        if score >= 5:
            print(f"python karne_excel.py \"{pdf_path}\" sonuc.xlsx")
    else:
        print("# Önce manuel inceleme yapın:")
        print(f"python -c \"import fitz; doc=fitz.open('{pdf_path}'); print(doc[0].get_text())\" | head -100")

    print()


def main():
    if len(sys.argv) < 2:
        print("PDF Format Test Utility")
        print("=" * 80)
        print()
        print("Kullanım: python test_pdf_format.py <pdf_dosyasi>")
        print()
        print("Örnek:")
        print("  python test_pdf_format.py karne.pdf")
        print()
        print("Bu araç PDF'nizin karne parser'ları ile uyumlu olup olmadığını")
        print("test eder ve hangi parser'ı kullanmanız gerektiğini önerir.")
        return

    pdf_path = sys.argv[1]
    test_pdf_format(pdf_path)


if __name__ == "__main__":
    main()
