import json
import re

def extract_clean_kazanims(haftalik_plan):
    """
    Haftalık plandan temiz kazanım metinlerini çıkarır
    """
    all_kazanims = set()
    
    for grade, subjects in haftalik_plan.items():
        if 'inkilap' in subjects:
            for week, kazanims in subjects['inkilap'].items():
                for kazanim in kazanims:
                    # Temizleme işlemleri
                    clean_kazanim = kazanim.strip()
                    
                    # SB.5.1.1. gibi kodları kaldır
                    clean_kazanim = re.sub(r'^SB\.\d+\.\d+\.\d+\.?\s*', '', clean_kazanim)
                    clean_kazanim = re.sub(r'^İTA\.\d+\.\d+\.\d+\.?\s*', '', clean_kazanim)
                    
                    # > işaretini kaldır
                    clean_kazanim = clean_kazanim.replace('>', '').strip()
                    
                    # Çok uzun kazanımları kısalt
                    if len(clean_kazanim) > 100:
                        # İlk cümleyi al
                        first_sentence = clean_kazanim.split('.')[0]
                        if len(first_sentence) > 80:
                            clean_kazanim = first_sentence[:80] + "..."
                        else:
                            clean_kazanim = first_sentence + "."
                    
                    # Boş olmayan ve anlamlı kazanımları ekle
                    if len(clean_kazanim) > 10 and not clean_kazanim.startswith('•'):
                        all_kazanims.add(clean_kazanim)
    
    return sorted(list(all_kazanims))

def main():
    # Haftalık planı yükle
    with open('haftalikPlan.json', 'r', encoding='utf-8') as f:
        haftalik_plan = json.load(f)
    
    # Kazanımlar.json'u yükle
    with open('Kazanımlar.json', 'r', encoding='utf-8') as f:
        kazanims = json.load(f)
    
    # Sosyal bilgiler kazanımlarını çıkar
    print("📚 Sosyal bilgiler kazanımları çıkarılıyor...")
    inkilap_kazanims = extract_clean_kazanims(haftalik_plan)
    
    print(f"✅ {len(inkilap_kazanims)} kazanım çıkarıldı")
    
    # Kazanımlar.json'u güncelle
    kazanims['inkilap'] = inkilap_kazanims
    
    # Dosyayı kaydet
    with open('Kazanımlar.json', 'w', encoding='utf-8') as f:
        json.dump(kazanims, f, ensure_ascii=False, indent=2)
    
    print("🎉 Kazanımlar.json güncellendi!")
    
    # İlk 10 kazanımı göster
    print("\n📋 İLK 10 KAZANIM:")
    for i, kazanim in enumerate(inkilap_kazanims[:10], 1):
        print(f"{i:2d}. {kazanim}")
    
    print(f"\n📊 TOPLAM: {len(inkilap_kazanims)} sosyal bilgiler kazanımı")

if __name__ == "__main__":
    main()
