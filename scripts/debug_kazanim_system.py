#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kazanım eşleştirme sisteminin nasıl çalıştığını debug eder
"""

import json
from pathlib import Path

def normalize_kazanim_text(text):
    """Kazanım metnini normalize eder"""
    if not text:
        return ''
    
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

def debug_kazanim_system():
    """Kazanım sistemini debug eder"""
    print("Kazanım Eşleştirme Sistemi Debug")
    print("=" * 50)
    
    # Kazanımlar.json dosyasını yükle
    json_file = Path("data/Kazanımlar.json")
    with open(json_file, 'r', encoding='utf-8') as f:
        kazanimlar_database = json.load(f)
    
    # İndeks oluştur
    kazanimlar_index = {}
    total_kazanimlar = 0
    
    for subject, grades in kazanimlar_database.items():
        for grade, kazanim_list in grades.items():
            if isinstance(kazanim_list, list):
                for item in kazanim_list:
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
    print(f"İndeks boyutu: {len(kazanimlar_index)}")
    
    # 6. sınıf Sosyal Bilgiler kazanımlarını listele
    print("\n6. Sınıf Sosyal Bilgiler Kazanımları:")
    print("-" * 50)
    if 'Sosyal Bilgiler' in kazanimlar_database and '6' in kazanimlar_database['Sosyal Bilgiler']:
        for i, kazanim in enumerate(kazanimlar_database['Sosyal Bilgiler']['6'], 1):
            print(f"{i}. {kazanim['kazanim']}")
            print(f"   Normalize: {normalize_kazanim_text(kazanim['kazanim'])}")
    else:
        print("6. sınıf Sosyal Bilgiler kazanımları bulunamadı!")
    
    # Test: SB.6.1.1 kodunu eşleştirmeye çalış
    print("\n" + "=" * 50)
    print("Test: SB.6.1.1 kodunu eşleştirme")
    print("-" * 50)
    
    test_code = "SB.6.1.1"
    normalized_code = normalize_kazanim_text(test_code)
    print(f"Test kodu: {test_code}")
    print(f"Normalize edilmiş: {normalized_code}")
    
    # İndekste ara
    if normalized_code in kazanimlar_index:
        matches = kazanimlar_index[normalized_code]
        print(f"İndekste bulundu: {len(matches)} eşleşme")
        for match in matches:
            print(f"  - {match['subject']} {match['grade']}: {match['fullText']}")
    else:
        print("İndekste bulunamadı!")
        
        # Benzer aramalar yap
        print("\nBenzer aramalar:")
        for key in kazanimlar_index.keys():
            if 'sb' in key or '6' in key or '1' in key:
                print(f"  - {key}")
    
    # CSV'den gelen gerçek kazanım kodlarını test et
    print("\n" + "=" * 50)
    print("CSV'den gelen kazanım kodları testi")
    print("-" * 50)
    
    csv_codes = ["SB.6.1.1", "SB.6.1.2", "SB.6.2.1", "SB.6.1.3", "SB.6.2.2", "SB.6.3.1"]
    
    for code in csv_codes:
        normalized = normalize_kazanim_text(code)
        print(f"\nKod: {code}")
        print(f"Normalize: {normalized}")
        
        if normalized in kazanimlar_index:
            matches = kazanimlar_index[normalized]
            print(f"  ✅ Eşleşme bulundu: {len(matches)} adet")
            for match in matches:
                print(f"    - {match['subject']} {match['grade']}: {match['fullText']}")
        else:
            print(f"  ❌ Eşleşme bulunamadı")
            
            # Kısmi eşleşme ara
            partial_matches = []
            for key in kazanimlar_index.keys():
                if key.startswith(normalized) or normalized.startswith(key):
                    partial_matches.append(key)
            
            if partial_matches:
                print(f"  🔍 Kısmi eşleşmeler: {partial_matches}")
            else:
                print(f"  🔍 Kısmi eşleşme yok")

def main():
    debug_kazanim_system()

if __name__ == "__main__":
    main()
