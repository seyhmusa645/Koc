import json
import os

def quick_clear_all_exams():
    """Tüm sınavları hızla sil - yedek almadan"""
    
    data_path = r"C:\Users\Program Geliştirme\AppData\Roaming\kapsul-kocluk-programi\data.json"
    
    print("🧹 Tüm sınavlar siliniyor...")
    
    try:
        # Mevcut sınav sayısını göster
        if os.path.exists(data_path):
            with open(data_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if isinstance(data, dict) and 'value' in data:
                exam_count = len(data['value'])
            elif isinstance(data, list):
                exam_count = len(data)
            else:
                exam_count = 0
            
            print(f"📊 Silinen sınav sayısı: {exam_count}")
        else:
            print("📊 data.json dosyası bulunamadı")
            exam_count = 0
        
        # Boş veri yapısı oluştur
        clean_data = {
            "value": [],
            "Count": 0
        }
        
        # Temiz veriyi kaydet
        with open(data_path, 'w', encoding='utf-8') as f:
            json.dump(clean_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Başarılı! {exam_count} sınav silindi")
        print("📋 data.json temizlendi")
        print("🎯 CSV dosyalarını artık temiz ortamda test edebilirsiniz!")
        
        return True
        
    except Exception as e:
        print(f"❌ Hata oluştu: {e}")
        return False

if __name__ == "__main__":
    print("🚨 HIZLI SİLME İŞLEMİ")
    print("=" * 30)
    
    success = quick_clear_all_exams()
    
    if success:
        print("\n🎉 Tamamlandı!")
        print("🔄 Programı yeniden başlatabilirsiniz")
    else:
        print("\n❌ Hata oluştu!")
