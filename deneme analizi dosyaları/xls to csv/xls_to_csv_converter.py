#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
XLS to CSV Converter - Karne verilerini sistem CSV formatına dönüştürür
"""

import openpyxl
import csv
import re
import sys
import os
from datetime import datetime
from typing import Dict, List, Tuple, Optional

class XLSToCSVConverter:
    def __init__(self):
        # Sınıf seviyesine göre soru sayıları
        self.question_counts = {
            5: {
                'turkce': 15, 'matematik': 15, 'fen': 15,
                'sosyal': 10, 'ingilizce': 10, 'din': 10
            },
            6: {
                'turkce': 15, 'matematik': 15, 'fen': 15,
                'sosyal': 10, 'ingilizce': 10, 'din': 10
            },
            7: {
                'turkce': 15, 'matematik': 15, 'fen': 15,
                'sosyal': 10, 'ingilizce': 10, 'din': 10
            },
            8: {
                'turkce': 20, 'matematik': 20, 'fen': 20,
                'sosyal': 10, 'ingilizce': 10, 'din': 10
            }
        }
        
        # Ders eşleştirmeleri (XLS sütun adı → sistem adı)
        self.subject_mapping = {
            'Türkçe': 'turkce',
            'Tarih': 'sosyal',  # Tarih → Sosyal
            'Sosyal Bilgiler': 'sosyal',
            'Matematik': 'matematik',
            'Fen': 'fen',
            'İngilizce': 'ingilizce',
            'Din': 'din'
        }
        
        # Kazanım prefix eşleştirmeleri
        self.kazanim_prefix_mapping = {
            'TÜR': 'turkce',
            'MAT': 'matematik',
            'FEN': 'fen',
            'TAR': 'sosyal',
            'İNG': 'ingilizce',
            'DİN': 'din'
        }

    def get_social_subject_mapping(self, sinif_str):
        """Sınıfa göre sosyal bilimler ders adını döndürür"""
        sinif_num = 0
        try:
            sinif_num = int(re.search(r'\d+', sinif_str).group())
        except:
            pass
        
        if sinif_num >= 8:  # 8. sınıf ve üzeri
            return {
                'İnkılap Tarihi': 'sosyal'  # İnkılap → sosyal olarak işle
            }
        else:  # 5, 6, 7. sınıflar
            return {
                'Sosyal Bilgiler': 'sosyal',
                'Tarih': 'sosyal'  # Tarih → sosyal olarak işle
            }

    def get_social_csv_headers(self, sinif_str):
        """Sınıfa göre CSV başlıkları döndürür"""
        sinif_num = 0
        try:
            sinif_num = int(re.search(r'\d+', sinif_str).group())
        except:
            pass
        
        if sinif_num >= 8:  # 8. sınıf ve üzeri
            return 'İnkılap Tarihi'  # İnkılap Tarihi olarak göster
        else:  # 5, 6, 7. sınıflar
            return 'Sosyal Bilgiler'  # Sosyal Bilgiler olarak göster

    def read_xls(self, file_path: str) -> List[Dict]:
        """XLS dosyasını oku ve veri listesi döndür"""
        try:
            workbook = openpyxl.load_workbook(file_path)
            worksheet = workbook.active
            
            # Başlık satırını oku
            headers = []
            for cell in worksheet[1]:
                headers.append(cell.value)
            
            print(f"📊 XLS başlıkları: {headers}")
            
            # Veri satırlarını oku (3. satırdan başla - ilk satır başlık, ikinci satır garip)
            data = []
            for row in worksheet.iter_rows(min_row=3, values_only=True):
                row_dict = {}
                for i, value in enumerate(row):
                    if i < len(headers):
                        row_dict[headers[i]] = value
                data.append(row_dict)
            
            workbook.close()
            print(f"✅ {len(data)} satır veri okundu")
            return data
            
        except Exception as e:
            print(f"❌ XLS okuma hatası: {e}")
            return []

    def extract_class_level(self, class_str: str) -> int:
        """Sınıf string'inden sınıf seviyesini çıkar"""
        if not class_str:
            return 8  # Varsayılan
        
        # Sayısal değeri bul
        match = re.search(r'(\d+)', str(class_str))
        if match:
            level = int(match.group(1))
            if 5 <= level <= 8:
                return level
        
        return 8  # Varsayılan

    def calculate_bos(self, class_level: int, subject: str, dogru: int, yanlis: int) -> int:
        """Boş soru sayısını hesapla"""
        try:
            dogru = int(dogru) if dogru else 0
            yanlis = int(yanlis) if yanlis else 0
            
            total_questions = self.question_counts[class_level][subject]
            bos = total_questions - dogru - yanlis
            return max(0, bos)  # Negatif olamaz
            
        except Exception:
            return 0

    def parse_kazanimlar(self, kazanim_str: str) -> Dict[str, List[str]]:
        """Kazanım string'ini parse et ve %70 altındakileri filtrele"""
        if not kazanim_str:
            return {subject: [] for subject in self.kazanim_prefix_mapping.values()}
        
        result = {subject: [] for subject in self.kazanim_prefix_mapping.values()}
        
        try:
            # Pipe ile ayrılmış kazanımları böl
            kazanimlar = kazanim_str.split('|')
            
            for kazanim in kazanimlar:
                kazanim = kazanim.strip()
                if not kazanim:
                    continue
                
                # Format: "PREFIX: Açıklama (XX.X%)"
                # Prefix'i bul
                prefix_match = re.match(r'^([A-ZÇĞİÖŞÜ]+):', kazanim)
                if not prefix_match:
                    continue
                
                prefix = prefix_match.group(1).strip().upper()
                
                # Başarı yüzdesini bul
                percentage_match = re.search(r'\(([\d,]+)%\)', kazanim)
                if not percentage_match:
                    continue
                
                try:
                    percentage = float(percentage_match.group(1).replace(',', '.'))
                except ValueError:
                    continue
                
                # %70 altındaki kazanımları al
                if percentage < 70:
                    # Kazanım açıklamasını çıkar
                    desc_match = re.search(r':\s*(.+?)\s*\(', kazanim)
                    if desc_match:
                        description = desc_match.group(1).strip()
                        
                        # Prefix'i ders adına çevir
                        if prefix in self.kazanim_prefix_mapping:
                            subject = self.kazanim_prefix_mapping[prefix]
                            result[subject].append(description)
                
        except Exception as e:
            print(f"⚠️ Kazanım parse hatası: {e}")
        
        return result

    def convert_row(self, xls_row: Dict, sosyal_header: str) -> Optional[Dict]:
        """Tek XLS satırını CSV formatına dönüştür"""
        try:
            # Temel bilgiler
            ogrenci_adi = xls_row.get('Ad Soyad', '').strip()
            if not ogrenci_adi:
                return None
            
            sinif_str = xls_row.get('Sınıf', '')
            sinif_level = self.extract_class_level(sinif_str)
            sosyal_mapping = self.get_social_subject_mapping(sinif_str)
            
            # Bugünün tarihi
            sinav_tarihi = datetime.now().strftime('%Y-%m-%d')
            
            # LGS Puanını al
            lgs_puani = xls_row.get('LGS Puanı', 0)
            try:
                lgs_puani = float(lgs_puani) if lgs_puani else 0
            except (ValueError, TypeError):
                lgs_puani = 0
            
            # CSV satırı başlat
            csv_row = {
                'Öğrenci Adı': ogrenci_adi,
                'Sınav Adı': 'Karne Sınavı',
                'Sınav Tarihi': sinav_tarihi,
                'LGS_Puanı': lgs_puani
            }
            
            # Kazanımları parse et
            kazanim_str = xls_row.get('Kazanım Detayları', '')
            kazanimlar = self.parse_kazanimlar(kazanim_str)
            
            # Her ders için veri işle
            subjects = ['turkce', 'matematik', 'fen', 'sosyal', 'ingilizce', 'din']
            
            for subject in subjects:
                # XLS'teki sütun adlarını bul (dinamik mapping ile)
                xls_subject_name = None
                for xls_name, sys_name in self.subject_mapping.items():
                    if sys_name == subject:
                        xls_subject_name = xls_name
                        break
                
                # Sosyal dersler için özel mapping kullan
                if subject == 'sosyal':
                    for xls_name, sys_name in sosyal_mapping.items():
                        if xls_name in xls_row:
                            xls_subject_name = xls_name
                            break
                
                if not xls_subject_name:
                    continue
                
                # Doğru ve yanlış sayılarını al
                dogru_key = f'{xls_subject_name} Doğru'
                yanlis_key = f'{xls_subject_name} Yanlış'
                
                dogru = xls_row.get(dogru_key, 0)
                yanlis = xls_row.get(yanlis_key, 0)
                
                # Boş sayısını hesapla
                bos = self.calculate_bos(sinif_level, subject, dogru, yanlis)
                
                # Yanlış kazanımları al
                yanlis_kazanimlar = kazanimlar.get(subject, [])
                yanlis_kazanim_str = ' | '.join(yanlis_kazanimlar) if yanlis_kazanimlar else ''
                
                # CSV sütunlarını doldur (sosyal için dinamik başlık)
                if subject == 'sosyal':
                    csv_row[f'{sosyal_header}_Doğru'] = dogru
                    csv_row[f'{sosyal_header}_Yanlış'] = yanlis
                    csv_row[f'{sosyal_header}_Boş'] = bos
                    csv_row[f'{sosyal_header}_Yanlış_Kazanımlar'] = yanlis_kazanim_str
                else:
                    # Türkçe karakterleri düzelt
                    if subject == 'turkce':
                        subject_name = 'Türkçe'
                    elif subject == 'matematik':
                        subject_name = 'Matematik'
                    elif subject == 'fen':
                        subject_name = 'Fen'
                    elif subject == 'ingilizce':
                        subject_name = 'İngilizce'
                    elif subject == 'din':
                        subject_name = 'Din'
                    else:
                        subject_name = subject.capitalize()
                    
                    csv_row[f'{subject_name}_Doğru'] = dogru
                    csv_row[f'{subject_name}_Yanlış'] = yanlis
                    csv_row[f'{subject_name}_Boş'] = bos
                    csv_row[f'{subject_name}_Yanlış_Kazanımlar'] = yanlis_kazanim_str
            
            return csv_row
            
        except Exception as e:
            print(f"❌ Satır dönüştürme hatası: {e}")
            return None

    def write_csv(self, data: List[Dict], output_path: str):
        """CSV dosyasını yaz"""
        if not data:
            print("❌ Yazılacak veri yok")
            return
        
        # İlk satırdan sınıf bilgisini al
        sinif_str = data[0].get('Sınıf', '') if data else ''
        sosyal_header = self.get_social_csv_headers(sinif_str)
        
        # CSV başlıkları
        headers = [
            'Öğrenci Adı', 'Sınav Adı', 'Sınav Tarihi', 'LGS_Puanı',
            'Türkçe_Doğru', 'Türkçe_Yanlış', 'Türkçe_Boş', 'Türkçe_Yanlış_Kazanımlar',
            'Matematik_Doğru', 'Matematik_Yanlış', 'Matematik_Boş', 'Matematik_Yanlış_Kazanımlar',
            'Fen_Doğru', 'Fen_Yanlış', 'Fen_Boş', 'Fen_Yanlış_Kazanımlar',
            f'{sosyal_header}_Doğru', f'{sosyal_header}_Yanlış', f'{sosyal_header}_Boş', f'{sosyal_header}_Yanlış_Kazanımlar',
            'İngilizce_Doğru', 'İngilizce_Yanlış', 'İngilizce_Boş', 'İngilizce_Yanlış_Kazanımlar',
            'Din_Doğru', 'Din_Yanlış', 'Din_Boş', 'Din_Yanlış_Kazanımlar'
        ]
        
        try:
            with open(output_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=headers)
                writer.writeheader()
                
                for row in data:
                    writer.writerow(row)
            
            print(f"✅ CSV dosyası oluşturuldu: {output_path}")
            print(f"📊 {len(data)} satır yazıldı")
            
        except Exception as e:
            print(f"❌ CSV yazma hatası: {e}")

    def convert(self, input_path: str, output_path: str):
        """Ana dönüştürme fonksiyonu"""
        print("=" * 80)
        print("XLS TO CSV CONVERTER")
        print("=" * 80)
        
        # XLS dosyasını oku
        xls_data = self.read_xls(input_path)
        if not xls_data:
            print("❌ XLS dosyası okunamadı")
            return
        
        # Dönüştür
        csv_data = []
        errors = 0
        
        # İlk satırdan sınıf bilgisini al ve sosyal başlığı belirle
        sinif_str = xls_data[0].get('Sınıf', '') if xls_data else ''
        sosyal_header = self.get_social_csv_headers(sinif_str)
        
        for i, xls_row in enumerate(xls_data):
            csv_row = self.convert_row(xls_row, sosyal_header)
            if csv_row:
                csv_data.append(csv_row)
            else:
                errors += 1
                print(f"⚠️ Satır {i+2} atlandı")
        
        # CSV yaz
        self.write_csv(csv_data, output_path)
        
        # İstatistikler
        print("\n" + "=" * 80)
        print("DÖNÜŞTÜRME TAMAMLANDI")
        print("=" * 80)
        print(f"✅ Başarıyla dönüştürülen: {len(csv_data)} satır")
        print(f"❌ Hatalı satır: {errors}")
        print(f"📁 Çıktı dosyası: {output_path}")

def get_file_path(prompt: str) -> str:
    """Kullanıcıdan dosya yolu al"""
    while True:
        file_path = input(prompt).strip()
        if not file_path:
            print("❌ Dosya yolu boş olamaz!")
            continue
        
        # Tırnak işaretlerini kaldır
        file_path = file_path.strip('"\'')
        
        if os.path.exists(file_path):
            return file_path
        else:
            print(f"❌ Dosya bulunamadı: {file_path}")
            print("💡 Tam dosya yolunu girin (örnek: C:\\Users\\Desktop\\dosya.xlsx)")
            continue

def main():
    """Ana fonksiyon"""
    print("=" * 80)
    print("XLS TO CSV CONVERTER - KARNE VERİLERİNİ SİSTEM FORMATINA DÖNÜŞTÜRÜCÜ")
    print("=" * 80)
    print()
    
    # Komut satırı parametreleri kontrol et
    if len(sys.argv) >= 3:
        input_file = sys.argv[1]
        output_file = sys.argv[2]
        
        if not os.path.exists(input_file):
            print(f"❌ Dosya bulunamadı: {input_file}")
            return
    else:
        # Etkileşimli mod
        print("📁 XLS dosyasının tam yolunu girin:")
        print("   Örnek: C:\\Users\\Desktop\\ogrenci_karneleri.xlsx")
        print("   Örnek: ..\\claude deneme analizi\\ogrenci_karneleri.xlsx")
        print()
        
        input_file = get_file_path("XLS dosyası: ")
        
        print()
        print("📁 CSV çıktı dosyasının adını girin:")
        print("   Örnek: sinav_sonuclari.csv")
        print("   Örnek: C:\\Users\\Desktop\\cikti.csv")
        print("   (Boş bırakırsanız: ..\\Csv çıktı dosyaları\\sinav_sonuclari.csv)")
        print()
        
        output_file = input("CSV dosyası: ").strip()
        if not output_file:
            # Varsayılan klasör yapısı
            default_dir = "..\\Csv çıktı dosyaları"
            if not os.path.exists(default_dir):
                os.makedirs(default_dir)
            output_file = os.path.join(default_dir, "sinav_sonuclari.csv")
        else:
            # Tırnak işaretlerini kaldır
            output_file = output_file.strip('"\'')
            
            # Eğer sadece dosya adı verilmişse varsayılan klasöre koy
            if not os.path.dirname(output_file) and not output_file.startswith('C:'):
                default_dir = "..\\Csv çıktı dosyaları"
                if not os.path.exists(default_dir):
                    os.makedirs(default_dir)
                output_file = os.path.join(default_dir, output_file)
            
            # Eğer uzantı yoksa .csv ekle
            if not output_file.lower().endswith('.csv'):
                output_file += '.csv'
    
    print()
    print(f"🔄 Dönüştürme başlatılıyor...")
    print(f"   Giriş: {input_file}")
    print(f"   Çıkış: {output_file}")
    print()
    
    converter = XLSToCSVConverter()
    converter.convert(input_file, output_file)
    
    print()
    print("✅ İşlem tamamlandı!")
    print("📁 Çıktı dosyası:", output_file)
    
    # Dosyayı açmak isteyip istemediğini sor
    try:
        open_file = input("\nDosyayı açmak istiyor musunuz? (E/H): ").strip().upper()
        if open_file == 'E':
            os.startfile(output_file)
    except:
        pass

if __name__ == "__main__":
    main()
