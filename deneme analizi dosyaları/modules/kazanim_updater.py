#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kazanım Güncelleme Modülü
PDF/CSV import sırasında bulunamayan kazanımları Kazanımlar.json'a ekler
"""

import os
import json
from typing import List, Dict, Optional


def get_appdata_kazanimlar_path() -> str:
    """AppData kazanımlar.json yolunu döndür"""
    return os.path.expanduser("~\\AppData\\Roaming\\kapsul-kocluk-programi\\shared\\Kazanımlar.json")


def load_kazanimlar() -> Dict:
    """Kazanımlar.json'u yükle"""
    kazanim_path = get_appdata_kazanimlar_path()
    
    if not os.path.exists(kazanim_path):
        print(f"[UYARI] Kazanımlar.json bulunamadı: {kazanim_path}")
        return {}
    
    try:
        with open(kazanim_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        print(f"[HATA] Kazanımlar.json okunamadı: {e}")
        return {}


def save_kazanimlar(data: Dict) -> bool:
    """Kazanımlar.json'u kaydet (yedek ile)"""
    kazanim_path = get_appdata_kazanimlar_path()
    
    try:
        # Yedek oluştur
        if os.path.exists(kazanim_path):
            import shutil
            from datetime import datetime
            backup_path = kazanim_path + f'.backup-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
            shutil.copy2(kazanim_path, backup_path)
            print(f"[OK] Yedek oluşturuldu: {os.path.basename(backup_path)}")
        
        # Yeni veriyi kaydet
        with open(kazanim_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"[OK] Kazanımlar.json güncellendi: {kazanim_path}")
        return True
    except Exception as e:
        print(f"[HATA] Kazanımlar.json kaydedilemedi: {e}")
        return False


def add_kazanim_to_database(subject: str, grade: int, kazanim_text: str) -> bool:
    """
    Kazanımlar.json'a yeni kazanım ekle (Türkçe ve İngilizce için)
    
    Args:
        subject: Ders adı ('Türkçe' veya 'İngilizce')
        grade: Sınıf seviyesi (5-8)
        kazanim_text: Kazanım metni
        
    Returns:
        True = eklendi, False = zaten var veya hata
    """
    # Sadece Türkçe ve İngilizce için
    if subject not in ['Türkçe', 'İngilizce']:
        print(f"[UYARI] {subject} için kazanım ekleme desteklenmiyor (sadece Türkçe/İngilizce)")
        return False
    
    # Kazanımları yükle
    kazanimlar = load_kazanimlar()
    
    if not kazanimlar:
        print("[HATA] Kazanımlar yüklenemedi")
        return False
    
    # Ders kontrolü
    if subject not in kazanimlar:
        kazanimlar[subject] = {}
    
    grade_str = str(grade)
    
    # Sınıf kontrolü
    if grade_str not in kazanimlar[subject]:
        kazanimlar[subject][grade_str] = []
    
    # Kazanım zaten var mı kontrol et
    existing_kazanimlar = kazanimlar[subject][grade_str]
    
    for item in existing_kazanimlar:
        existing_text = item.get('kazanim', '')
        if existing_text.strip().lower() == kazanim_text.strip().lower():
            print(f"[BİLGİ] Kazanım zaten mevcut: {kazanim_text[:50]}...")
            return False  # Zaten var
    
    # Yeni kazanım ekle
    new_kazanim = {
        'kazanim': kazanim_text.strip()
    }
    
    kazanimlar[subject][grade_str].append(new_kazanim)
    
    # Kaydet
    if save_kazanimlar(kazanimlar):
        print(f"[OK] Yeni kazanım eklendi: {subject} {grade}. sınıf - {kazanim_text[:50]}...")
        return True
    
    return False


def add_multiple_kazanimlar(kazanim_list: List[Dict]) -> Dict[str, int]:
    """
    Birden fazla kazanım ekle (toplu ekleme)
    
    Args:
        kazanim_list: [
            {'subject': 'Türkçe', 'grade': 5, 'kazanim': '...'},
            {'subject': 'İngilizce', 'grade': 7, 'kazanim': '...'},
            ...
        ]
        
    Returns:
        {'added': 5, 'skipped': 2, 'errors': 0}
    """
    stats = {'added': 0, 'skipped': 0, 'errors': 0}
    
    # Kazanımları yükle (bir kez)
    kazanimlar = load_kazanimlar()
    
    if not kazanimlar:
        print("[HATA] Kazanımlar yüklenemedi")
        return {'added': 0, 'skipped': 0, 'errors': len(kazanim_list)}
    
    modified = False
    
    for item in kazanim_list:
        subject = item.get('subject')
        grade = item.get('grade')
        kazanim_text = item.get('kazanim')
        
        if not subject or not grade or not kazanim_text:
            stats['errors'] += 1
            continue
        
        # Sadece Türkçe ve İngilizce
        if subject not in ['Türkçe', 'İngilizce']:
            stats['skipped'] += 1
            continue
        
        # Ders/sınıf yapısını kontrol et
        if subject not in kazanimlar:
            kazanimlar[subject] = {}
        
        grade_str = str(grade)
        
        if grade_str not in kazanimlar[subject]:
            kazanimlar[subject][grade_str] = []
        
        # Zaten var mı kontrol et
        existing_kazanimlar = kazanimlar[subject][grade_str]
        already_exists = False
        
        for existing_item in existing_kazanimlar:
            existing_text = existing_item.get('kazanim', '')
            if existing_text.strip().lower() == kazanim_text.strip().lower():
                already_exists = True
                break
        
        if already_exists:
            stats['skipped'] += 1
            continue
        
        # Yeni kazanım ekle
        new_kazanim = {'kazanim': kazanim_text.strip()}
        kazanimlar[subject][grade_str].append(new_kazanim)
        stats['added'] += 1
        modified = True
    
    # Eğer değişiklik varsa kaydet
    if modified:
        if save_kazanimlar(kazanimlar):
            print(f"[OK] Toplu ekleme tamamlandı: {stats['added']} eklendi, {stats['skipped']} atlandı")
        else:
            stats['errors'] += stats['added']
            stats['added'] = 0
    
    return stats


def ensure_kazanim_in_database(subject: str, grade: int, kazanim_text: str) -> str:
    """
    Kazanım database'de var mı kontrol et, yoksa ekle
    
    Args:
        subject: Ders adı
        grade: Sınıf seviyesi
        kazanim_text: Kazanım metni/kodu
        
    Returns:
        Kazanım metni (eklendiyse veya zaten varsa)
    """
    # Türkçe ve İngilizce için
    if subject in ['Türkçe', 'İngilizce']:
        # Kazanımları kontrol et
        kazanimlar = load_kazanimlar()
        
        if not kazanimlar or subject not in kazanimlar:
            # Ekle
            add_kazanim_to_database(subject, grade, kazanim_text)
            return kazanim_text
        
        grade_str = str(grade)
        
        if grade_str not in kazanimlar[subject]:
            # Ekle
            add_kazanim_to_database(subject, grade, kazanim_text)
            return kazanim_text
        
        # Zaten var mı kontrol et
        existing_kazanimlar = kazanimlar[subject][grade_str]
        
        for item in existing_kazanimlar:
            existing_text = item.get('kazanim', '')
            # Tam eşleşme veya kısmi eşleşme
            if (existing_text.strip().lower() == kazanim_text.strip().lower() or
                existing_text.strip().lower().startswith(kazanim_text.strip().lower()[:30])):
                return existing_text  # Mevcut olanı döndür
        
        # Bulunamadı, ekle
        add_kazanim_to_database(subject, grade, kazanim_text)
    
    return kazanim_text

