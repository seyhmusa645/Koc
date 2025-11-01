#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Veri Temizleme ve Normalizasyon Modülü
"""

import re
import unicodedata


def normalize_text(text):
    """Metni normalize eder - Unicode, boşluk, satır sonları"""
    if not text:
        return ""
    
    # Unicode normalizasyonu (NFC)
    text = unicodedata.normalize('NFC', text)
    
    # Fazla boşlukları temizle
    text = re.sub(r'\s+', ' ', text)
    
    # Baş ve son boşlukları kaldır
    text = text.strip()
    
    return text


def normalize_turkish_upper(text):
    """Türkçe karakterleri dikkate alarak büyük harfe çevir"""
    if not text:
        return ""
    
    # Türkçe karakter dönüşümleri
    replacements = {
        'i': 'İ',
        'ı': 'I',
        'ş': 'Ş',
        'ğ': 'Ğ',
        'ü': 'Ü',
        'ö': 'Ö',
        'ç': 'Ç'
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    return text.upper()


def normalize_turkish_lower(text):
    """Türkçe karakterleri dikkate alarak küçük harfe çevir"""
    if not text:
        return ""
    
    # Türkçe karakter dönüşümleri
    replacements = {
        'İ': 'i',
        'I': 'ı',
        'Ş': 'ş',
        'Ğ': 'ğ',
        'Ü': 'ü',
        'Ö': 'ö',
        'Ç': 'ç'
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    return text.lower()


def normalize_number(value):
    """Sayı formatını normalize eder - virgül/nokta dönüşümü"""
    if not value:
        return None
    
    # String'e çevir
    value_str = str(value).strip()
    
    # Virgülü noktaya çevir
    value_str = value_str.replace(',', '.')
    
    # Boşlukları temizle
    value_str = value_str.replace(' ', '')
    
    try:
        # Float'a çevir
        return float(value_str)
    except (ValueError, TypeError):
        return None


def normalize_student_name(name):
    """Öğrenci adını normalize eder"""
    if not name:
        return ""
    
    # Unicode normalize
    name = normalize_text(name)
    
    # Türkçe büyük harfe çevir
    name = normalize_turkish_upper(name)
    
    # Birden fazla boşlukları tek boşluğa indir
    name = re.sub(r'\s+', ' ', name)
    
    # Özel karakterleri temizle (sadece harf, boşluk ve tire)
    name = re.sub(r'[^A-ZÇĞİÖŞÜ\s\-]', '', name)
    
    return name.strip()


def normalize_class_format(sinif):
    """Sınıf formatını normalize eder - X-Y veya X/Y -> X-Y"""
    if not sinif:
        return ""
    
    sinif = str(sinif).strip()
    
    # X/Y formatını X-Y'ye çevir
    sinif = sinif.replace('/', '-')
    
    # Boşlukları temizle
    sinif = sinif.replace(' ', '')
    
    return sinif


def clean_page_text(text):
    """Sayfa metnini temizler ve normalize eder"""
    if not text:
        return ""
    
    # Unicode normalize
    text = unicodedata.normalize('NFC', text)
    
    # Satır sonlarını normalize et
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    return text

