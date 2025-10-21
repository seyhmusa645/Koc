#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kazanımlar.json dosyasını analiz ederek eksik 6. sınıf kazanımlarını tespit eder
"""

import json
from pathlib import Path

def analyze_kazanims():
    """Kazanımlar.json dosyasını analiz eder"""
    json_file = Path("data/Kazanımlar.json")
    
    if not json_file.exists():
        print("Kazanımlar.json dosyası bulunamadı!")
        return
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("Kazanımlar.json Analizi")
    print("=" * 50)
    
    # Her ders için mevcut sınıf seviyelerini kontrol et
    for subject, grades in data.items():
        print(f"\n{subject}:")
        available_grades = list(grades.keys())
        print(f"  Mevcut sınıflar: {sorted(available_grades)}")
        
        # 6. sınıf var mı kontrol et
        if "6" in grades:
            kazanim_count = len(grades["6"])
            print(f"  6. sınıf: {kazanim_count} kazanım mevcut")
        else:
            print(f"  6. sınıf: EKSİK!")
    
    # Eksik 6. sınıf kazanımları için örnek veriler oluştur
    print("\n" + "=" * 50)
    print("Eksik 6. sınıf kazanımları için örnek veriler:")
    
    missing_subjects = []
    for subject, grades in data.items():
        if "6" not in grades:
            missing_subjects.append(subject)
    
    if missing_subjects:
        print(f"Eksik dersler: {missing_subjects}")
        
        # Sosyal Bilgiler için örnek 6. sınıf kazanımları
        if "Sosyal Bilgiler" in missing_subjects:
            print("\nSosyal Bilgiler 6. sınıf için örnek kazanımlar:")
            sample_social_6 = [
                {
                    "hafta": "CSV Import",
                    "kazanim": "Türklerin Anadolu'ya gelişi ile birlikte Anadolu'da kurulan ilk Türk devletlerini tanır."
                },
                {
                    "hafta": "CSV Import", 
                    "kazanim": "Türkiye Selçuklu Devleti'nin kuruluşu, gelişimi ve yıkılışını açıklar."
                },
                {
                    "hafta": "CSV Import",
                    "kazanim": "Anadolu'da kurulan beyliklerin Türk tarihindeki önemini kavrar."
                },
                {
                    "hafta": "CSV Import",
                    "kazanim": "Osmanlı Devleti'nin kuruluşu ve gelişimini açıklar."
                },
                {
                    "hafta": "CSV Import",
                    "kazanim": "Osmanlı Devleti'nin yükselme dönemindeki önemli olayları değerlendirir."
                },
                {
                    "hafta": "CSV Import",
                    "kazanim": "Osmanlı Devleti'nin duraklama ve gerileme dönemlerini analiz eder."
                },
                {
                    "hafta": "CSV Import",
                    "kazanim": "Osmanlı Devleti'nin dağılma sürecini ve nedenlerini açıklar."
                },
                {
                    "hafta": "CSV Import",
                    "kazanim": "Milli Mücadele'nin başlangıcını ve önemini kavrar."
                },
                {
                    "hafta": "CSV Import",
                    "kazanim": "Türkiye Cumhuriyeti'nin kuruluşu ve gelişimini değerlendirir."
                },
                {
                    "hafta": "CSV Import",
                    "kazanim": "Atatürk'ün hayatı ve kişilik özelliklerini analiz eder."
                }
            ]
            
            for i, kazanim in enumerate(sample_social_6, 1):
                print(f"  {i}. {kazanim['kazanim']}")
    else:
        print("Tüm derslerde 6. sınıf kazanımları mevcut!")

def create_missing_grade6_data():
    """Eksik 6. sınıf kazanımları için veri oluşturur"""
    
    # Sosyal Bilgiler 6. sınıf kazanımları
    social_6_kazanims = [
        {
            "hafta": "CSV Import",
            "kazanim": "Türklerin Anadolu'ya gelişi ile birlikte Anadolu'da kurulan ilk Türk devletlerini tanır."
        },
        {
            "hafta": "CSV Import", 
            "kazanim": "Türkiye Selçuklu Devleti'nin kuruluşu, gelişimi ve yıkılışını açıklar."
        },
        {
            "hafta": "CSV Import",
            "kazanim": "Anadolu'da kurulan beyliklerin Türk tarihindeki önemini kavrar."
        },
        {
            "hafta": "CSV Import",
            "kazanim": "Osmanlı Devleti'nin kuruluşu ve gelişimini açıklar."
        },
        {
            "hafta": "CSV Import",
            "kazanim": "Osmanlı Devleti'nin yükselme dönemindeki önemli olayları değerlendirir."
        },
        {
            "hafta": "CSV Import",
            "kazanim": "Osmanlı Devleti'nin duraklama ve gerileme dönemlerini analiz eder."
        },
        {
            "hafta": "CSV Import",
            "kazanim": "Osmanlı Devleti'nin dağılma sürecini ve nedenlerini açıklar."
        },
        {
            "hafta": "CSV Import",
            "kazanim": "Milli Mücadele'nin başlangıcını ve önemini kavrar."
        },
        {
            "hafta": "CSV Import",
            "kazanim": "Türkiye Cumhuriyeti'nin kuruluşu ve gelişimini değerlendirir."
        },
        {
            "hafta": "CSV Import",
            "kazanim": "Atatürk'ün hayatı ve kişilik özelliklerini analiz eder."
        },
        {
            "hafta": "CSV Import",
            "kazanim": "Türk kültürünün önemli unsurlarını tanır ve değerlendirir."
        },
        {
            "hafta": "CSV Import",
            "kazanim": "Türk tarihindeki önemli şahsiyetleri tanır ve değerlendirir."
        }
    ]
    
    return {
        "Sosyal Bilgiler": {
            "6": social_6_kazanims
        }
    }

def update_kazanims_with_missing_data():
    """Eksik 6. sınıf kazanımlarını Kazanımlar.json dosyasına ekler"""
    json_file = Path("data/Kazanımlar.json")
    
    if not json_file.exists():
        print("Kazanımlar.json dosyası bulunamadı!")
        return False
    
    # Mevcut veriyi oku
    with open(json_file, 'r', encoding='utf-8') as f:
        existing_data = json.load(f)
    
    # Eksik verileri oluştur
    missing_data = create_missing_grade6_data()
    
    # Yeni veriyi ekle
    for subject, grades in missing_data.items():
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
    print("6. Sınıf Kazanımları Analiz ve Ekleme Scripti")
    print("=" * 60)
    
    # Mevcut durumu analiz et
    analyze_kazanims()
    
    # Eksik verileri ekle
    print("\n" + "=" * 60)
    print("Eksik 6. sınıf kazanımları ekleniyor...")
    
    if update_kazanims_with_missing_data():
        print("Güncelleme başarılı!")
        
        # Güncellenmiş durumu kontrol et
        print("\n" + "=" * 60)
        print("Güncellenmiş durum:")
        analyze_kazanims()
    else:
        print("Güncelleme başarısız!")

if __name__ == "__main__":
    main()
