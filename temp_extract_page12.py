import fitz
doc = fitz.open('deneme analizi dosyaları/Denemeler/TEKPDF-20251015232441820.pdf')
text = doc[11].get_text()
with open('temp_page12.txt', 'w', encoding='utf-8') as f:
    f.write(text)
print(f'[OK] Sayfa 12 kaydedildi: {len(text)} karakter')

