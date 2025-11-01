#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.path.insert(0, 'deneme analizi dosyaları')

import re
import yaml

# Template yükle
with open('deneme analizi dosyaları/templates/tonguc.yaml', 'r', encoding='utf-8') as f:
    template = yaml.safe_load(f)

# Sayfa metnini yükle
with open('temp_page12.txt', encoding='utf-8') as f:
    text = f.read()

achievements_config = template.get('achievements', {})
section_patterns = achievements_config.get('section_patterns', [])
subject_mapping = achievements_config.get('subject_mapping', {})
incorrect_threshold = achievements_config.get('incorrect_threshold', 75)

print("=" * 80)
print("QUICK TEST - TG Parse")
print("=" * 80)

# Sadece Türkçe'yi test et
turkce_pattern = section_patterns[0]
print(f"\nPattern: {turkce_pattern[:50]}...")

match = re.search(turkce_pattern, text, re.IGNORECASE | re.MULTILINE)
if not match:
    print("HATA: Pattern match yok!")
    sys.exit(1)

print(f"✓ Pattern bulundu at {match.start()}")

# Subject name çıkar
subject_name_match = re.match(r'^([A-ZÇĞİÖŞÜ][^\n\\]+)', turkce_pattern)
if subject_name_match:
    subject_name_raw = subject_name_match.group(1)
    subject_name = re.sub(r'\\[a-z]\*?', '', subject_name_raw)
    subject_name = subject_name.replace('\\.', '.')
    subject_name = subject_name.strip()
    
    print(f"Subject name: '{subject_name}'")
    
    subject_code = subject_mapping.get(subject_name)
    print(f"Subject code: '{subject_code}'")
    
    if not subject_code:
        print("HATA: Subject code bulunamadı!")
        sys.exit(1)
else:
    print("HATA: Subject name extraction failed!")
    sys.exit(1)

# Bölüm metnini al
section_start = match.end()
section_text = text[section_start:section_start+600]  # İlk 600 karakter

print(f"\nSection text (first 200 chars):")
print(section_text[:200])
print("...")

# Satırlara böl
lines = [line.strip() for line in section_text.split('\n') if line.strip()]
print(f"\nToplam satır: {len(lines)}")
print(f"İlk 10 satır: {lines[:10]}")

# Basit parse - ilk kazanımı bul
def is_number(token: str) -> bool:
    return bool(re.fullmatch(r'-?\d+(?:[.,]\d+)?', token))

i = 0
found_count = 0

while i < len(lines) and found_count < 3:
    # Kazanım metni
    desc_parts = []
    while i < len(lines) and not is_number(lines[i]):
        if 'KAZANIM' in lines[i].upper() and 'BELİRTİLMEMİŞ' in lines[i].upper():
            break
        desc_parts.append(lines[i])
        i += 1
    
    desc = ' '.join(desc_parts).strip()
    
    if not desc or 'KAZANIM' in desc.upper():
        skipped = 0
        while i < len(lines) and is_number(lines[i]) and skipped < 4:
            i += 1
            skipped += 1
        continue
    
    # S D Y B% değerleri
    numbers = []
    while i < len(lines) and is_number(lines[i]) and len(numbers) < 4:
        numbers.append(lines[i])
        i += 1
    
    if len(numbers) == 4:
        basari_value = numbers[3].replace(',', '.')
        try:
            basari_pct = float(basari_value)
            found_count += 1
            status = "❌ YANLIŞ" if basari_pct < incorrect_threshold else "✓ DOĞRU"
            print(f"\n{found_count}. Kazanım: B%={basari_pct} {status}")
            print(f"   {desc[:80]}...")
        except ValueError:
            pass

print("\n" + "=" * 80)

