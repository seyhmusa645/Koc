#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Veri Doğrulama ve Güven Skoru Modülü
"""

import re
from typing import Dict, Tuple, List, Optional


def validate_student_name(ad_soyad: str) -> Tuple[bool, Optional[str]]:
    """
    Öğrenci adını doğrular
    
    Returns:
        (is_valid, error_message)
    """
    if not ad_soyad:
        return False, "Ad soyad boş"
    
    ad_soyad = str(ad_soyad).strip()
    
    # Minimum uzunluk
    if len(ad_soyad) < 2:
        return False, "Ad soyad çok kısa"
    
    # Sadece rakamlardan oluşmamalı
    if ad_soyad.isdigit():
        return False, "Ad soyad sadece rakamlardan oluşuyor"
    
    # Geçersiz isimler
    invalid_names = ['0', 'yok', 'test', 'null', 'none', 'boş']
    if ad_soyad.lower() in invalid_names:
        return False, f"Geçersiz ad: {ad_soyad}"
    
    return True, None


def validate_class_format(sinif: str) -> Tuple[bool, Optional[str]]:
    """
    Sınıf formatını doğrular (örn: 5-A, 8-B, 5/A -> geçerli)
    
    Returns:
        (is_valid, error_message)
    """
    if not sinif:
        return False, "Sınıf boş"
    
    sinif = str(sinif).strip()
    
    # Desteklenen formatlar: X-Y veya X/Y (X: 5-8, Y: A-Z)
    pattern = r'^[5-8][-/][A-Z]$'
    
    if not re.match(pattern, sinif):
        return False, f"Geçersiz sınıf formatı: {sinif}"
    
    return True, None


def validate_question_count(sinif: str, toplam_soru: int) -> Tuple[bool, Optional[str]]:
    """
    Sınıfa göre toplam soru sayısını doğrular
    
    Returns:
        (is_valid, error_message)
    """
    expected_questions = {
        5: 75,
        6: 75,
        7: 75,
        8: 90
    }
    
    # Sınıf numarasını çıkar
    try:
        grade = int(re.search(r'[5-8]', sinif).group())
    except (AttributeError, ValueError):
        return False, f"Sınıf numarası belirlenemedi: {sinif}"
    
    expected = expected_questions.get(grade)
    if expected is None:
        return False, f"Bilinmeyen sınıf seviyesi: {grade}"
    
    if toplam_soru != expected:
        return False, f"Yanlış soru sayısı: {toplam_soru} (beklenen: {expected})"
    
    return True, None


def validate_percentage(basari: float, field_name: str = "Başarı") -> Tuple[bool, Optional[str]]:
    """
    Yüzde değerini doğrular (0-100 arası olmalı)
    
    Returns:
        (is_valid, error_message)
    """
    if basari is None:
        return False, f"{field_name} değeri yok"
    
    try:
        basari = float(basari)
    except (ValueError, TypeError):
        return False, f"Geçersiz {field_name} değeri: {basari}"
    
    if basari < -10 or basari > 100:  # -10'a kadar tolerans (yanlış fazlaysa negatif olabilir)
        return False, f"{field_name} değeri aralık dışı: {basari}%"
    
    return True, None


def validate_lgs_score(puan: float) -> Tuple[bool, Optional[str]]:
    """
    LGS puanını doğrular (makul aralıkta olmalı)
    
    Returns:
        (is_valid, error_message)
    """
    if puan is None:
        return True, None  # LGS puanı opsiyonel
    
    try:
        puan = float(puan)
    except (ValueError, TypeError):
        return False, f"Geçersiz LGS puanı: {puan}"
    
    # LGS puan aralığı genelde 100-500 arası
    if puan < 50 or puan > 550:
        return False, f"LGS puanı şüpheli: {puan}"
    
    return True, None


def validate_net_consistency(data: Dict, tolerance: float = 2.0) -> Tuple[bool, Optional[str]]:
    """
    Net tutarlılığını kontrol eder (toplam net = ders netleri toplamı)
    
    Returns:
        (is_valid, error_message)
    """
    toplam_net = data.get('toplam_net')
    if not toplam_net:
        return True, None  # Toplam net yoksa kontrol edilemez
    
    try:
        toplam_net = float(str(toplam_net).replace(',', '.'))
    except (ValueError, TypeError):
        return False, "Toplam net geçersiz"
    
    # Ders netlerini topla
    subject_nets = []
    for prefix in ['turk', 'sosyal', 'din', 'ing', 'mat', 'fen']:
        net = data.get(f'{prefix}_net')
        if net:
            try:
                subject_nets.append(float(str(net).replace(',', '.')))
            except (ValueError, TypeError):
                pass
    
    if not subject_nets:
        return True, None  # Ders netleri yoksa kontrol edilemez
    
    calculated_total = sum(subject_nets)
    difference = abs(toplam_net - calculated_total)
    
    if difference > tolerance:
        return False, f"Net tutarsızlığı: toplam={toplam_net:.2f}, hesaplanan={calculated_total:.2f}, fark={difference:.2f}"
    
    return True, None


def validate_answer_counts(dogru: int, yanlis: int, soru_sayisi: int) -> Tuple[bool, Optional[str]]:
    """
    Doğru + yanlış <= soru sayısı kontrolü
    
    Returns:
        (is_valid, error_message)
    """
    if dogru is None or yanlis is None or soru_sayisi is None:
        return True, None
    
    try:
        dogru = int(dogru)
        yanlis = int(yanlis)
        soru_sayisi = int(soru_sayisi)
    except (ValueError, TypeError):
        return False, "Sayı değerleri geçersiz"
    
    if dogru + yanlis > soru_sayisi:
        return False, f"Doğru({dogru}) + Yanlış({yanlis}) > Soru Sayısı({soru_sayisi})"
    
    if dogru < 0 or yanlis < 0:
        return False, f"Negatif değer: D={dogru}, Y={yanlis}"
    
    return True, None


def validate_student_data(data: Dict, template: Optional[Dict] = None) -> Tuple[bool, float, List[str]]:
    """
    Öğrenci verisinin tam doğrulaması
    
    Args:
        data: Öğrenci verisi
        template: Şablon bilgileri (opsiyonel)
        
    Returns:
        (is_valid, confidence_score, issues_list)
        - is_valid: Kritik hatalar yok mu?
        - confidence_score: 0.0-1.0 arası güven skoru
        - issues_list: Bulunan sorunların listesi
    """
    issues = []
    confidence_points = 0
    max_points = 0
    
    # 1. Ad soyad kontrolü (kritik)
    max_points += 10
    is_valid, error = validate_student_name(data.get('ad_soyad'))
    if is_valid:
        confidence_points += 10
    else:
        issues.append(f"❌ {error}")
        return False, 0.0, issues  # Kritik hata
    
    # 2. Sınıf kontrolü (kritik)
    max_points += 10
    is_valid, error = validate_class_format(data.get('sinif', ''))
    if is_valid:
        confidence_points += 10
    else:
        issues.append(f"❌ {error}")
        return False, 0.0, issues  # Kritik hata
    
    # 3. Soru sayısı kontrolü
    max_points += 8
    toplam_soru = data.get('toplam_dogru')
    if toplam_soru:
        try:
            toplam_soru = int(toplam_soru) + int(data.get('toplam_yanlis', 0))
        except (ValueError, TypeError):
            toplam_soru = None
    
    if toplam_soru:
        is_valid, error = validate_question_count(data.get('sinif', ''), toplam_soru)
        if is_valid:
            confidence_points += 8
        else:
            issues.append(f"⚠ {error}")
            confidence_points += 2  # Kısmi puan
    
    # 4. Yüzde değerleri kontrolü
    max_points += 5
    basari = data.get('toplam_basari')
    if basari:
        is_valid, error = validate_percentage(basari, "Toplam başarı")
        if is_valid:
            confidence_points += 5
        else:
            issues.append(f"⚠ {error}")
    
    # 5. LGS puanı kontrolü
    max_points += 5
    lgs_puan = data.get('lgs_puan')
    if lgs_puan:
        is_valid, error = validate_lgs_score(lgs_puan)
        if is_valid:
            confidence_points += 5
        else:
            issues.append(f"⚠ {error}")
    else:
        confidence_points += 2  # LGS yoksa kısmi puan
    
    # 6. Net tutarlılığı
    max_points += 10
    is_valid, error = validate_net_consistency(data)
    if is_valid:
        confidence_points += 10
    else:
        issues.append(f"⚠ {error}")
        confidence_points += 3
    
    # 7. Temel alan doluluk kontrolü
    max_points += 12
    basic_fields = [
        ('turk_dogru', 2), ('turk_yanlis', 2), ('turk_net', 2),
        ('mat_dogru', 2), ('mat_yanlis', 2), ('mat_net', 2)
    ]
    for field, points in basic_fields:
        if data.get(field) is not None:
            confidence_points += points
    
    # Güven skoru hesapla
    confidence = confidence_points / max_points if max_points > 0 else 0.0
    
    # Genel değerlendirme
    is_valid = confidence >= 0.4  # %40'ın üstü geçerli (daha toleranslı)
    
    if not issues:
        issues.append("✓ Tüm kontroller başarılı")
    
    return is_valid, confidence, issues


def get_validation_summary(data: Dict) -> str:
    """
    Veri özeti döndürür (loglama için)
    
    Returns:
        str: Özet string
    """
    name = data.get('ad_soyad', 'Bilinmiyor')
    sinif = data.get('sinif', '?')
    net = data.get('toplam_net', '?')
    
    return f"{name} ({sinif}) - Net: {net}"

