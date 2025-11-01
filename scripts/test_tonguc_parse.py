#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tonguç formatını test et
"""
import sys
import os

# Path setup
sys.path.insert(0, 'deneme analizi dosyaları')

import fitz
import yaml
from modules.achievement_parser import parse_tonguc_vertical_achievements, map_subject_codes_to_csv_format

# Template yükle
with open('deneme analizi dosyaları/templates/tonguc.yaml', 'r', encoding='utf-8') as f:
    template = yaml.safe_load(f)

# PDF sayfa 12'yi aç
doc = fitz.open('deneme analizi dosyaları/Denemeler/TEKPDF-20251015232441820.pdf')
page = doc[11]  # Sayfa 12 (index 11)

# Parse et
achievements_dict = parse_tonguc_vertical_achievements(page.get_text(), template)

# CSV formatına çevir
achievements_csv = map_subject_codes_to_csv_format(achievements_dict, grade=6)

print("=" * 80)
print("TONGUÇ FORMATININ PARSE EDİLMESİ - SAYFA 12")
print("=" * 80)
print()

print(f"Toplam ders: {len(achievements_csv)}")
print()

for course, outcomes in achievements_csv.items():
    if outcomes:
        print(f"\n{course.upper()}: {len(outcomes)} yanlış kazanım (B% < 75)")
        for i, outcome in enumerate(outcomes, 1):
            print(f"  {i}. {outcome[:80]}...")

print()
print("=" * 80)

