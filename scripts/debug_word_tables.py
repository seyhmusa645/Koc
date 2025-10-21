import docx
import re

def debug_word_tables(docx_path='Sonuclar-Ortaokul-Rapor.docx'):
    doc = docx.Document(docx_path)
    
    print("=== WORD DOSYASINDAKİ TABLOLARI İNCELE ===")
    
    for table_idx, table in enumerate(doc.tables):
        print(f"\n--- TABLO {table_idx+1} ---")
        print(f"Satır sayısı: {len(table.rows)}")
        print(f"Sütun sayısı: {len(table.columns)}")
        
        # İlk 3 satırı göster
        for row_idx in range(min(3, len(table.rows))):
            row_text = []
            for cell in table.rows[row_idx].cells:
                row_text.append(cell.text.strip())
            print(f"Satır {row_idx+1}: {row_text}")
        
        # Zeka türü tablosu olabilir mi kontrol et
        if len(table.rows) >= 3 and len(table.columns) >= 2:
            first_row_text = ' '.join([cell.text.strip() for cell in table.rows[0].cells])
            if 'Zekâ' in first_row_text or 'Güçlü' in first_row_text:
                print(f"  -> Bu zeka türleri tablosu olabilir!")
                
                # Tüm satırları göster
                for row_idx, row in enumerate(table.rows):
                    row_text = []
                    for cell in row.cells:
                        row_text.append(cell.text.strip())
                    print(f"    Satır {row_idx+1}: {row_text}")

if __name__ == "__main__":
    debug_word_tables()
