#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.path.insert(0, 'deneme analizi dosyaları')

import yaml
from modules.achievement_parser import parse_tonguc_vertical_achievements, map_subject_codes_to_csv_format

# Template yükle
with open('deneme analizi dosyaları/templates/tonguc.yaml', 'r', encoding='utf-8') as f:
    template = yaml.safe_load(f)

# Sayfa metnini yükle
with open('temp_page12.txt', encoding='utf-8') as f:
    text = f.read()

print("=" * 80)
print("TONGUÇ FORMAT PARSE TEST - FULL")
print("=" * 80)

try:
    # Parse et
    achievements_dict = parse_tonguc_vertical_achievements(text, template)
    print(f"\n✓ Parse tamamlandı")
    print(f"Toplam ders: {len(achievements_dict)}")
    
    for code, outcomes in achievements_dict.items():
        print(f"\n{code}: {len(outcomes)} yanlış kazanım")
        for i, outcome in enumerate(outcomes[:2], 1):  # İlk 2'sini göster
            print(f"  {i}. {outcome[:70]}...")
    
    # CSV formatına çevir
    achievements_csv = map_subject_codes_to_csv_format(achievements_dict, grade=6)
    print(f"\n✓ CSV formatına çevrildi")
    print(f"CSV format keys: {list(achievements_csv.keys())}")
    
except Exception as e:
    print(f"\n❌ HATA: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)

