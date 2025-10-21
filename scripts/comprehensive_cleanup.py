import json
import re

# Kazanımlar.json dosyasını yükle
with open('Kazanımlar.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Temizlenmesi gereken anahtar kelimeler ve desenler
cleanup_patterns = [
    # Değerler eğitimi
    r'^D\d+\.',  # D3. Çalışkanlık gibi
    r'Çalışkanlık|Sorumluluk|Tasarruf|Dostluk|Duyarlılık|Estetik|Merhamet|Mütevazılık|Saygı|Yardımseverlik',
    
    # Sosyal etkinlikler
    r'Gaziler Günü|İlköğretim Haftası|Ahilik|Kültür Haftası',
    
    # Değerlendirme yöntemleri
    r'Açık uçlu|kısa cevaplı|izleme testi|çalışma kâğıdı|performans görevi|akran değerlendirme',
    r'Anlatım|Gurup|Gösterim|Beyin Fırtınası|Gösterip|Yaptırma',
    r'diyagramı|analitik|dereceli|puanlama|anahtarı',
    
    # Teknik detaylar
    r'\(5 Saat\)|\(4 Saat\)|\(3 Saat\)|\(2 Saat\)|\(1 Saat\)',
    r'MAT\.|FEN\.|TÜRKÇE\.|İNKILAP\.|DİN\.|İNGİLİZCE\.',
    r'\\n|\\r',
    
    # Çok kısa veya anlamsız
    r'^D\d+$',  # Sadece D3, D4 gibi
    r'^[A-Z]\.$',  # Sadece A., B. gibi
    r'^.{1,3}$',  # 3 karakterden kısa
]

print("=== KAPSAMLI KAZANIM TEMİZLEME ===")
total_removed = 0

for subject in data.keys():
    original_count = len(data[subject])
    to_remove = []
    
    for kazanim in data[subject]:
        # Herhangi bir temizleme deseniyle eşleşen kazanımları bul
        should_remove = False
        for pattern in cleanup_patterns:
            if re.search(pattern, kazanim, re.IGNORECASE):
                should_remove = True
                break
        
        if should_remove:
            to_remove.append(kazanim)
    
    # Temizlenmesi gereken kazanımları kaldır
    for kazanim in to_remove:
        data[subject].remove(kazanim)
    
    removed_count = len(to_remove)
    total_removed += removed_count
    
    print(f"{subject}: {removed_count} adet yanlış kazanım kaldırıldı")
    if removed_count > 0:
        print(f"  Örnekler: {to_remove[:3]}...")  # İlk 3'ünü göster

print(f"\nToplam {total_removed} adet yanlış kazanım kaldırıldı")

# Temizlenmiş dosyayı kaydet
with open('Kazanımlar.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Kazanımlar.json dosyası kapsamlı olarak temizlendi ve kaydedildi")

# Temizleme sonrası durumu göster
print("\n=== TEMİZLEME SONRASI DURUM ===")
for subject in data.keys():
    print(f"{subject}: {len(data[subject])} kazanım")
