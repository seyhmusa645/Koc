import os
import fitz  # PyMuPDF
import sys

# Unicode karakterlerin düzgün yazdırılabilmesi için stdout kodlamasını ayarlayın
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def is_close(rect1, rect2, margin=50):
    """İki dikdörtgenin birbirine yakın olup olmadığını kontrol eder (genişletilmiş bir kesişim kontrolü)."""
    # İkinci dikdörtgeni her yönde 'margin' kadar genişlet
    inflated_rect2 = fitz.Rect(rect2.x0 - margin, rect2.y0 - margin, rect2.x1 + margin, rect2.y1 + margin)
    return rect1.intersects(inflated_rect2)

def extract_text_from_pdfs(directory):
    """Belirtilen dizindeki PDF'lerden görsellerden arındırılmış metinleri çıkarır."""
    print(f"'{directory}' dizinindeki PDF'ler işleniyor...")
    
    for filename in os.listdir(directory):
        if filename.lower().endswith(".pdf"):
            pdf_path = os.path.join(directory, filename)
            txt_path = os.path.splitext(pdf_path)[0] + ".txt"
            
            print(f"  -> İşleniyor: {filename}")
            
            try:
                doc = fitz.open(pdf_path)
                full_text = []
                
                for page_num, page in enumerate(doc):
                    # Sayfadaki tüm görsellerin sınırlayıcı kutularını (bounding box) al
                    image_bboxes = [fitz.Rect(img[0:4]) for img in page.get_images(full=True)]
                    
                    # Sayfadaki metin bloklarını al
                    text_blocks = page.get_text("blocks")
                    
                    for block in text_blocks:
                        block_rect = fitz.Rect(block[:4])
                        is_near_image = False
                        
                        # Metin bloğunun herhangi bir görsele yakın olup olmadığını kontrol et
                        for img_bbox in image_bboxes:
                            if is_close(block_rect, img_bbox):
                                is_near_image = True
                                break
                        
                        # Eğer metin bir görsele yakın değilse, listeye ekle
                        if not is_near_image:
                            # Bloktaki metin (block[4]) satır sonu karakterleri içerebilir
                            full_text.append(block[4].strip())
                
                # Tüm temiz metni birleştir ve dosyaya yaz
                with open(txt_path, "w", encoding="utf-8") as txt_file:
                    txt_file.write("\n".join(full_text))
                
                print(f"     + Oluşturuldu: {os.path.basename(txt_path)}")
                
            except Exception as e:
                print(f"     ! Hata oluştu: {filename} işlenirken bir sorun oluştu: {e}")

    print("\nİşlem tamamlandı.")

if __name__ == "__main__":
    # Betiğin çalıştığı dizine göre hedef klasörün yolunu belirle
    # Bu betik 'scripts' klasöründe olduğu için, bir üst dizine çıkıp hedef klasöre yöneliyoruz.
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_directory = os.path.join(base_dir, "sosyal bilgiler 7 karışık")
    
    if not os.path.isdir(target_directory):
        print(f"Hata: Hedef dizin bulunamadı: {target_directory}")
        print("Lütfen betiğin doğru konumda olduğundan ve 'sosyal bilgiler 7 karışık' klasörünün var olduğundan emin olun.")
    else:
        extract_text_from_pdfs(target_directory)