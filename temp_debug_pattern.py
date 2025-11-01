import re

with open('temp_page12.txt', encoding='utf-8') as f:
    text = f.read()

patterns = [
    ('Türkçe basic', r'Türkçe'),
    ('Türkçe with S', r'Türkçe\s*\n\s*S'),
    ('Türkçe full', r'Türkçe\s*\n\s*S\s*\n\s*D\s*\n\s*Y\s*\n\s*B%'),
    ('Tarih full', r'Tarih\s*\n\s*S\s*\n\s*D\s*\n\s*Y\s*\n\s*B%'),
    ('Din full', r'Din K\.ve A\.B\.\s*\n\s*S\s*\n\s*D\s*\n\s*Y\s*\n\s*B%'),
]

print("=" * 60)
for name, pattern in patterns:
    match = re.search(pattern, text, re.MULTILINE)
    print(f"{name:20} → {'✓ BULUNDU' if match else '✗ BULUNAMADI'}")
    if match:
        print(f"  Position: {match.start()}")
        print(f"  Context: {repr(text[match.start():match.start()+60])}")
print("=" * 60)

