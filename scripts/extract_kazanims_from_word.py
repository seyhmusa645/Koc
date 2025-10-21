#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Word dosyalarından kazanımları çıkarıp Kazanımlar.json formatına dönüştüren script
"""

import os
import json
import re
from pathlib import Path
from docx import Document
import sys

def extract_kazanims_from_docx(file_path):
    """Word dosyasından kazanımları çıkarır"""
    try:
        doc = Document(file_path)
        kazanims = []
        
        for paragraph in doc.paragraphs:
            text = paragraph.text.strip()
            if not text:
                continue
                
            # Kazanım kodlarını ara (örn: SB.6.1.1, M.6.1.2, vb.)
            kazanim_pattern = r'([A-Z]+\.6\.\d+\.\d+)'
            matches = re.findall(kazanim_pattern, text)
            
            if matches:
                # Kazanım kodundan sonraki metni al
                for match in matches:
                    # Kazanım kodundan sonraki kısmı bul
                    start_idx = text.find(match)
                    if start_idx != -1:
                        # Kazanım kodundan sonraki metni al
                        after_code = text[start_idx + len(match):].strip()
                        # Nokta ile başlıyorsa kaldır
                        if after_code.startswith('.'):
                            after_code = after_code[1:].strip()
                        
                        if after_code and len(after_code) > 10:  # En az 10 karakter olsun
                            kazanims.append({
                                "hafta": "CSV Import",
                                "kazanim": after_code
                            })
        
        return kazanims
    except Exception as e:
        print(f"Hata: {file_path} dosyası okunamadı: {e}")
        return []

def get_subject_from_filename(filename):
    """Dosya adından ders adını çıkarır"""
    filename_lower = filename.lower()
    
    if 'sosyal' in filename_lower:
        return 'Sosyal Bilgiler'
    elif 'turkce' in filename_lower or 'türkçe' in filename_lower:
        return 'Türkçe'
    elif 'matematik' in filename_lower:
        return 'Matematik'
    elif 'fen' in filename_lower:
        return 'Fen Bilimleri'
    elif 'ingilizce' in filename_lower:
        return 'İngilizce'
    elif 'din' in filename_lower:
        return 'Din Kültürü ve Ahlak Bilgisi'
    else:
        return None

def process_word_files():
    """Word dosyalarını işler ve kazanımları çıkarır"""
    kazanims_data = {}
    
    # Kazanımlar klasöründeki 6. sınıf dosyalarını işle
    kazanims_dir = Path("Kazanımlar")
    if not kazanims_dir.exists():
        kazanims_dir = Path("assets/Kazanımlar")
    
    if not kazanims_dir.exists():
        print("Kazanımlar klasörü bulunamadı!")
        return {}
    
    # 6. sınıf dosyalarını bul
    grade6_files = []
    for file_path in kazanims_dir.glob("*.docx"):
        if '6' in file_path.name.lower():
            grade6_files.append(file_path)
    
    for file_path in kazanims_dir.glob("*.doc"):
        if '6' in file_path.name.lower():
            grade6_files.append(file_path)
    
    print(f"Bulunan 6. sınıf dosyaları: {len(grade6_files)}")
    
    for file_path in grade6_files:
        print(f"İşleniyor: {file_path.name}")
        subject = get_subject_from_filename(file_path.name)
        
        if subject:
            kazanims = extract_kazanims_from_docx(file_path)
            if kazanims:
                if subject not in kazanims_data:
                    kazanims_data[subject] = {}
                kazanims_data[subject]["6"] = kazanims
                print(f"  {subject}: {len(kazanims)} kazanım bulundu")
            else:
                print(f"  {subject}: Kazanım bulunamadı")
        else:
            print(f"  Ders adı belirlenemedi: {file_path.name}")
    
    return kazanims_data

def update_kazanims_json(new_data):
    """Mevcut Kazanımlar.json dosyasını günceller"""
    json_file = Path("data/Kazanımlar.json")
    
    if not json_file.exists():
        print("Kazanımlar.json dosyası bulunamadı!")
        return False
    
    # Mevcut veriyi oku
    with open(json_file, 'r', encoding='utf-8') as f:
        existing_data = json.load(f)
    
    # Yeni veriyi ekle
    for subject, grades in new_data.items():
        if subject not in existing_data:
            existing_data[subject] = {}
        
        for grade, kazanims in grades.items():
            existing_data[subject][grade] = kazanims
            print(f"Eklenen: {subject} - {grade}. sınıf: {len(kazanims)} kazanım")
    
    # Güncellenmiş veriyi kaydet
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)
    
    print(f"Kazanımlar.json dosyası güncellendi!")
    return True

def main():
    print("6. Sınıf Kazanımları Çıkarma Scripti")
    print("=" * 50)
    
    # Word dosyalarından kazanımları çıkar
    new_kazanims = process_word_files()
    
    if not new_kazanims:
        print("Hiç kazanım bulunamadı!")
        return
    
    print("\nBulunan kazanımlar:")
    for subject, grades in new_kazanims.items():
        for grade, kazanims in grades.items():
            print(f"  {subject} - {grade}. sınıf: {len(kazanims)} kazanım")
    
    # Kazanımlar.json dosyasını güncelle
    print("\nKazanımlar.json dosyası güncelleniyor...")
    if update_kazanims_json(new_kazanims):
        print("Güncelleme başarılı!")
    else:
        print("Güncelleme başarısız!")

if __name__ == "__main__":
    main()
