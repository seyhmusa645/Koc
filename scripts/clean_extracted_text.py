import os
import re
import sys

# Unicode karakterlerin düzgün yazdırılabilmesi için stdout kodlamasını ayarlayın
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def clean_text_files(directory, files_to_skip):
    """
    Belirtilen dizindeki .txt dosyalarını temizler.
    - Satır sonu tirelerini kaldırır.
    - İstenmeyen başlıkları siler.
    - Fazla boş satırları düzenler.
    """
    print(f"\'\'{directory}\' dizinindeki .txt dosyaları temizleniyor...")
    
    # Kaldırılacak başlıklar ve desenler
    patterns_to_remove = [
        re.compile(r'^7\. Sınıf\s*$', re.MULTILINE),
        re.compile(r'^Sosyal Bilgiler\s*$', re.MULTILINE),
        re.compile(r'^MEB\s+\u25cf\s+Ölçme, Değerlendirme ve Sınav Hizmetleri Genel Müdürlüğü\s*$', re.MULTILINE),
        # Gelecekte eklenebilecek diğer desenler buraya gelebilir
    ]
    
    # Satır sonu tire deseni
    dehyphenate_pattern = re.compile(r'-\s*\n')
    
    # Çoklu boşluk deseni
    extra_newline_pattern = re.compile(r'\n{3,}')

    for filename in os.listdir(directory):
        if filename.lower().endswith(".txt"):
            if filename in files_to_skip:
                print(f"  - Atlanıyor: {filename} (manuel olarak düzenlendi)")
                continue

            file_path = os.path.join(directory, filename)
            print(f"  -> Temizleniyor: {filename}")
            
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # 1. Adım: Satır sonu tirelerini kaldır
                cleaned_content = dehyphenate_pattern.sub('', content)
                
                # 2. Adım: İstenmeyen başlıkları kaldır
                for pattern in patterns_to_remove:
                    cleaned_content = pattern.sub('', cleaned_content)
                
                # 3. Adım: Baştaki ve sondaki boşlukları ve çoklu boş satırları temizle
                cleaned_content = cleaned_content.strip()
                cleaned_content = extra_newline_pattern.sub('\n\n', cleaned_content)
                
                # 4. Adım: Temizlenmiş içeriği dosyaya geri yaz
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(cleaned_content)
                
            except Exception as e:
                print(f"     ! Hata oluştu: {filename} işlenirken bir sorun oluştu: {e}")

    print("\nTemizleme işlemi tamamlandı.")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_directory = os.path.join(base_dir, "sosyal bilgiler 7 karışık")
    
    # Kullanıcının atlanmasını istediği dosyalar
    skip_files = ['1.txt', '2.txt', '3.txt', '4.txt']
    
    if not os.path.isdir(target_directory):
        print(f"Hata: Hedef dizin bulunamadı: {target_directory}")
    else:
        clean_text_files(target_directory, skip_files)
