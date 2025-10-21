#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kazanım eşleştirme sistemini test eder
"""

import json
from pathlib import Path

def normalize_kazanim_text(text):
    """Kazanım metnini normalize eder (renderer.js'deki fonksiyonun Python versiyonu)"""
    if not text:
        return ''
    
    # Metni normalize et (küçük harf, noktalama işaretleri kaldır, fazla boşlukları temizle)
    return text.lower().replace('.', '').replace(',', '').replace(';', '').replace(':', '').replace('!', '').replace('?', '').replace('(', '').replace(')', '').replace('  ', ' ').strip()

def get_kazanimlar_subject_name(csv_subject_key):
    """CSV ders anahtarını JSON ders adına çevirir"""
    mapping = {
        'turkce': 'Türkçe',
        'matematik': 'Matematik',
        'fen': 'Fen Bilimleri',
        'inkilap': 'Sosyal Bilgiler',
        'din': 'Din Kültürü ve Ahlak Bilgisi',
        'ingilizce': 'İngilizce'
    }
    return mapping.get(csv_subject_key, csv_subject_key)

def load_kazanimlar_database():
    """Kazanımlar veritabanını yükler ve indeks oluşturur"""
    json_file = Path("data/Kazanımlar.json")
    
    if not json_file.exists():
        print("Kazanımlar.json dosyası bulunamadı!")
        return {}, {}
    
    with open(json_file, 'r', encoding='utf-8') as f:
        kazanimlar_database = json.load(f)
    
    # İndeks oluştur (hızlı arama için)
    kazanimlar_index = {}
    total_kazanimlar = 0
    
    for subject, grades in kazanimlar_database.items():
        for grade, kazanim_list in grades.items():
            if isinstance(kazanim_list, list):
                for item in kazanim_list:
                    # Güvenli kazanım metni çıkarma
                    kazanim_text = ''
                    if isinstance(item, str):
                        kazanim_text = item
                    elif isinstance(item, dict) and 'kazanim' in item:
                        kazanim_text = item['kazanim']
                    
                    if kazanim_text:
                        normalized = normalize_kazanim_text(kazanim_text)
                        if normalized not in kazanimlar_index:
                            kazanimlar_index[normalized] = []
                        
                        kazanimlar_index[normalized].append({
                            'subject': subject,
                            'grade': grade,
                            'fullText': kazanim_text
                        })
                        total_kazanimlar += 1
    
    print(f"Toplam {total_kazanimlar} kazanım yüklendi")
    return kazanimlar_database, kazanimlar_index

def match_kazanim(csv_kazanim_text, csv_subject_key, student_grade, kazanimlar_index):
    """Kazanım eşleştirme fonksiyonu (renderer.js'deki fonksiyonun Python versiyonu)"""
    if not csv_kazanim_text or not csv_kazanim_text.strip():
        return {
            'matched': False,
            'fullText': '',
            'confidence': 0,
            'method': 'Boş Kazanım'
        }
    
    normalized = normalize_kazanim_text(csv_kazanim_text)
    json_subject_name = get_kazanimlar_subject_name(csv_subject_key)
    grade_str = str(student_grade)
    
    # 1. Tam eşleşme
    if normalized in kazanimlar_index:
        matches = [k for k in kazanimlar_index[normalized] 
                  if k['subject'] == json_subject_name and k['grade'] == grade_str]
        if matches:
            return {
                'matched': True,
                'fullText': matches[0]['fullText'],
                'confidence': 1.0,
                'method': 'Tam Eşleşme'
            }
    
    # 2. Kısmi eşleşme
    for key, items in kazanimlar_index.items():
        if key.startswith(normalized) or normalized.startswith(key):
            matches = [k for k in items 
                      if k['subject'] == json_subject_name and k['grade'] == grade_str]
            if matches:
                return {
                    'matched': True,
                    'fullText': matches[0]['fullText'],
                    'confidence': 0.85,
                    'method': 'Kısmi Eşleşme (Kesilmiş Metin)'
                }
    
    # 3. Benzerlik eşleşmesi (basit kelime benzerliği)
    best_match = None
    best_confidence = 0
    
    for key, items in kazanimlar_index.items():
        matches = [k for k in items 
                  if k['subject'] == json_subject_name and k['grade'] == grade_str]
        
        if matches:
            # Basit kelime benzerliği hesapla
            normalized_words = set(normalized.split())
            key_words = set(key.split())
            
            if normalized_words and key_words:
                intersection = normalized_words.intersection(key_words)
                union = normalized_words.union(key_words)
                similarity = len(intersection) / len(union) if union else 0
                
                if similarity > best_confidence and similarity > 0.3:  # %30'dan fazla benzerlik
                    best_confidence = similarity
                    best_match = matches[0]
    
    if best_match:
        return {
            'matched': True,
            'fullText': best_match['fullText'],
            'confidence': best_confidence,
            'method': f'Benzerlik Eşleşmesi ({best_confidence:.2f})'
        }
    
    # Eşleşme bulunamadı
    return {
        'matched': False,
        'fullText': csv_kazanim_text,
        'confidence': 0,
        'method': 'Eşleşme Bulunamadı'
    }

def test_kazanim_matching():
    """Kazanım eşleştirme sistemini test eder"""
    print("Kazanım Eşleştirme Sistemi Testi")
    print("=" * 50)
    
    # Veritabanını yükle
    kazanimlar_database, kazanimlar_index = load_kazanimlar_database()
    
    if not kazanimlar_database:
        print("Veritabanı yüklenemedi!")
        return
    
    # Test verileri (6. sınıf Sosyal Bilgiler kazanımları)
    test_cases = [
        {
            'csv_text': 'Türklerin Anadolu\'ya gelişi',
            'subject': 'inkilap',
            'grade': 6,
            'expected_match': True
        },
        {
            'csv_text': 'Osmanlı Devleti\'nin kuruluşu',
            'subject': 'inkilap', 
            'grade': 6,
            'expected_match': True
        },
        {
            'csv_text': 'Atatürk\'ün hayatı',
            'subject': 'inkilap',
            'grade': 6,
            'expected_match': True
        },
        {
            'csv_text': 'SB.6.1.1',  # Kod formatı
            'subject': 'inkilap',
            'grade': 6,
            'expected_match': False  # Kod formatı eşleşmez
        },
        {
            'csv_text': 'Matematik kazanımı',  # Yanlış ders
            'subject': 'matematik',
            'grade': 6,
            'expected_match': False
        }
    ]
    
    print("\nTest Sonuçları:")
    print("-" * 50)
    
    success_count = 0
    total_tests = len(test_cases)
    
    for i, test_case in enumerate(test_cases, 1):
        result = match_kazanim(
            test_case['csv_text'],
            test_case['subject'],
            test_case['grade'],
            kazanimlar_index
        )
        
        expected = test_case['expected_match']
        actual = result['matched']
        
        status = "✓" if expected == actual else "✗"
        if expected == actual:
            success_count += 1
        
        print(f"Test {i}: {status}")
        print(f"  Giriş: '{test_case['csv_text']}'")
        print(f"  Ders: {test_case['subject']}, Sınıf: {test_case['grade']}")
        print(f"  Sonuç: {result['method']}")
        print(f"  Eşleşme: {result['matched']} (Beklenen: {expected})")
        if result['matched']:
            print(f"  Tam Metin: {result['fullText'][:100]}...")
        print()
    
    print(f"Test Sonucu: {success_count}/{total_tests} başarılı")
    
    # 6. sınıf Sosyal Bilgiler kazanımlarını listele
    print("\n6. Sınıf Sosyal Bilgiler Kazanımları:")
    print("-" * 50)
    if 'Sosyal Bilgiler' in kazanimlar_database and '6' in kazanimlar_database['Sosyal Bilgiler']:
        for i, kazanim in enumerate(kazanimlar_database['Sosyal Bilgiler']['6'], 1):
            print(f"{i}. {kazanim['kazanim']}")
    else:
        print("6. sınıf Sosyal Bilgiler kazanımları bulunamadı!")

def main():
    test_kazanim_matching()

if __name__ == "__main__":
    main()
