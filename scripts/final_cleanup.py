import json
import re

# Kazanımlar.json dosyasını yükle
with open('Kazanımlar.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Son temizleme desenleri
final_cleanup_patterns = [
    r'^[A-Z]{2,4}\.$',  # OB1., SDB1., DKAB. gibi
    r'^[a-z]\)\s',  # a) Hz. gibi
    r'^[IVX]+-[IVX]+\.$',  # VII-XIII., XI-XIII. gibi
    r'^[A-Z]\.$',  # Tek harf + nokta
    r'^\d+\.$',  # Sadece sayı + nokta
    r'^[A-Z]{1,3}\d*\.$',  # OB1, SDB2 gibi
]

print("=== SON TEMİZLEME ===")
total_removed = 0

for subject in data.keys():
    original_count = len(data[subject])
    to_remove = []
    
    for kazanim in data[subject]:
        # Son temizleme desenleriyle eşleşen kazanımları bul
        should_remove = False
        for pattern in final_cleanup_patterns:
            if re.match(pattern, kazanim.strip()):
                should_remove = True
                break
        
        if should_remove:
            to_remove.append(kazanim)
    
    # Temizlenmesi gereken kazanımları kaldır
    for kazanim in to_remove:
        data[subject].remove(kazanim)
    
    removed_count = len(to_remove)
    total_removed += removed_count
    
    print(f"{subject}: {removed_count} adet şüpheli kazanım kaldırıldı")
    if removed_count > 0:
        print(f"  Kaldırılanlar: {to_remove}")

print(f"\nToplam {total_removed} adet şüpheli kazanım kaldırıldı")

# Temizlenmiş dosyayı kaydet
with open('Kazanımlar.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Kazanımlar.json dosyası son kez temizlendi ve kaydedildi")

# Final durumu göster
print("\n=== FİNAL DURUM ===")
for subject in data.keys():
    print(f"{subject}: {len(data[subject])} kazanım")

# Örnek kazanımları göster
print("\n=== ÖRNEK KAZANIMLAR ===")
for subject in data.keys():
    print(f"\n{subject.upper()}:")
    for i, kazanim in enumerate(data[subject][:3]):  # İlk 3'ünü göster
        print(f"  {i+1}. {kazanim[:80]}...")
