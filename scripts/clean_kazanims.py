import json

# Kazanımlar.json dosyasını yükle
with open('Kazanımlar.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Temizlenmesi gereken anahtar kelimeler
cleanup_keywords = [
    "Ahilik", "Anlatım", "Gurup", "Gösterim", "Beyin", "Gösterip", 
    "Ayarlanabilir", "diyagramı", "analitik", "dereceli", "puanlama", 
    "anahtarı", "Çalışma kâğıdı", "Performans görevi", "Akran değerlendirme"
]

print("=== YANLIŞ KAZANIMLAR TESPİT EDİLİYOR ===")
total_removed = 0

for subject in data.keys():
    original_count = len(data[subject])
    # Temizlenmesi gereken kazanımları bul
    to_remove = []
    for kazanim in data[subject]:
        for keyword in cleanup_keywords:
            if keyword in kazanim:
                to_remove.append(kazanim)
                break
    
    # Temizlenmesi gereken kazanımları kaldır
    for kazanim in to_remove:
        data[subject].remove(kazanim)
    
    removed_count = len(to_remove)
    total_removed += removed_count
    
    print(f"{subject}: {removed_count} adet yanlış kazanım kaldırıldı")
    if removed_count > 0:
        print(f"  Kaldırılanlar: {to_remove[:3]}...")  # İlk 3'ünü göster

print(f"\nToplam {total_removed} adet yanlış kazanım kaldırıldı")

# Temizlenmiş dosyayı kaydet
with open('Kazanımlar.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Kazanımlar.json dosyası temizlendi ve kaydedildi")
