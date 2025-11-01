import re
import yaml

with open('deneme analizi dosyaları/templates/tonguc.yaml', 'r', encoding='utf-8') as f:
    template = yaml.safe_load(f)

with open('temp_page12.txt', encoding='utf-8') as f:
    text = f.read()

achievements_config = template.get('achievements', {})
section_patterns = achievements_config.get('section_patterns', [])
subject_mapping = achievements_config.get('subject_mapping', {})

print("=" * 80)
print("DEBUG: parse_tonguc_vertical_achievements")
print("=" * 80)
print(f"\nToplam section_patterns: {len(section_patterns)}")
print(f"Subject mapping: {subject_mapping}")
print()

for i, section_pattern in enumerate(section_patterns, 1):
    print(f"\n[{i}] Pattern: {section_pattern[:60]}...")
    
    match = re.search(section_pattern, text, re.IGNORECASE | re.MULTILINE)
    if not match:
        print("  → MATCH YOK!")
        continue
    
    print(f"  → MATCH BULUNDU at position {match.start()}")
    
    # Ders adını çıkar
    try:
        subject_name_match = re.match(r'^([A-ZÇĞİÖŞÜ][^\n]*?)\s*\\n', section_pattern)
        if subject_name_match:
            subject_name_raw = subject_name_match.group(1)
            subject_name = subject_name_raw.replace('\\\.', '.')
            print(f"  → Subject name (raw): {repr(subject_name_raw)}")
            print(f"  → Subject name (clean): {repr(subject_name)}")
            
            # Mapping kontrolü
            subject_code = subject_mapping.get(subject_name)
            print(f"  → Subject code: {repr(subject_code)}")
        else:
            print("  → Subject name extraction FAILED!")
    except Exception as e:
        print(f"  → ERROR: {e}")

print()
print("=" * 80)

