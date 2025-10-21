#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

def merge_din_outcomes():
    """Tüm Din Kültürü kazanımlarını ana Kazanımlar.json dosyasına birleştirir"""
    
    # Mevcut Kazanımlar.json dosyasını oku
    try:
        with open('Kazanımlar.json', 'r', encoding='utf-8') as f:
            main_data = json.load(f)
    except FileNotFoundError:
        main_data = {}
    
    # Din Kültürü kazanımlarını yükle
    din_outcomes = {}
    
    # 5. sınıf
    try:
        with open('din_5_kazanımlar.json', 'r', encoding='utf-8') as f:
            din_5 = json.load(f)
            din_outcomes['5'] = din_5
            print(f"5. sınıf Din Kültürü: {len(din_5)} kazanım")
    except FileNotFoundError:
        print("5. sınıf Din Kültürü dosyası bulunamadı")
    
    # 6. sınıf
    try:
        with open('din_6_kazanımlar.json', 'r', encoding='utf-8') as f:
            din_6 = json.load(f)
            din_outcomes['6'] = din_6
            print(f"6. sınıf Din Kültürü: {len(din_6)} kazanım")
    except FileNotFoundError:
        print("6. sınıf Din Kültürü dosyası bulunamadı")
    
    # 7. sınıf
    try:
        with open('din_7_kazanımlar.json', 'r', encoding='utf-8') as f:
            din_7 = json.load(f)
            din_outcomes['7'] = din_7
            print(f"7. sınıf Din Kültürü: {len(din_7)} kazanım")
    except FileNotFoundError:
        print("7. sınıf Din Kültürü dosyası bulunamadı")
    
    # 8. sınıf
    try:
        with open('din_8_kazanımlar.json', 'r', encoding='utf-8') as f:
            din_8 = json.load(f)
            din_outcomes['8'] = din_8
            print(f"8. sınıf Din Kültürü: {len(din_8)} kazanım")
    except FileNotFoundError:
        print("8. sınıf Din Kültürü dosyası bulunamadı")
    
    # Ana veriye Din Kültürü bölümünü ekle
    main_data['Din Kültürü ve Ahlak Bilgisi'] = din_outcomes
    
    # Güncellenmiş dosyayı kaydet
    with open('Kazanımlar.json', 'w', encoding='utf-8') as f:
        json.dump(main_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nDin Kültürü kazanımları başarıyla birleştirildi!")
    print(f"Toplam sınıf: {len(din_outcomes)}")
    
    # İstatistikler
    total_outcomes = sum(len(outcomes) for outcomes in din_outcomes.values())
    print(f"Toplam kazanım: {total_outcomes}")
    
    for grade, outcomes in din_outcomes.items():
        print(f"  {grade}. sınıf: {len(outcomes)} kazanım")

if __name__ == "__main__":
    print("Din Kültürü kazanımları birleştiriliyor...")
    print("=" * 50)
    merge_din_outcomes()
