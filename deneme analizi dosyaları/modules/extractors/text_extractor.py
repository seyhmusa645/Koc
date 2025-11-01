#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Metin Bazlı Çıkarıcı - Genel regex pattern'leri ile fallback çıkarım
"""

import re
from typing import Dict, Tuple, Optional, Any
from .base import BaseExtractor
from ..normalizers import normalize_number, normalize_student_name, normalize_class_format


class TextExtractor(BaseExtractor):
    """Genel regex pattern'leri ile metin çıkarır (fallback)"""
    
    def __init__(self):
        super().__init__(name="TextExtractor")
    
    def extract(self, page_text: str, template: Optional[Dict] = None,
                page_obj: Any = None) -> Tuple[Dict, float]:
        """
        Genel pattern'lerle veri çıkarır
        
        Args:
            page_text: Sayfa metni
            template: Şablon (referans için, zorunlu değil)
            page_obj: PyMuPDF page objesi (kullanılmıyor)
            
        Returns:
            (data, confidence)
        """
        if not page_text or not page_text.strip():
            return {}, 0.0
        
        data = {}
        
        try:
            # Öğrenci adı - çeşitli formatlar
            name_patterns = [
                r'Öğrenci[:\s]+([A-ZÇĞİÖŞÜ\s]+)\s+(\d+)\s+([5-8][-/][A-Z])',
                r'ADI SOYADI[:\s]+([A-ZÇĞİÖŞÜ\s]+)',
                r'Ad Soyad[:\s]+([A-ZÇĞİÖŞÜ\s]+)',
            ]
            
            for pattern in name_patterns:
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    data['ad_soyad'] = normalize_student_name(match.group(1))
                    if len(match.groups()) >= 3:
                        data['numara'] = match.group(2).strip()
                        data['sinif'] = normalize_class_format(match.group(3))
                    break
            
            if not data.get('ad_soyad'):
                # Başarısız
                return data, 0.0
            
            # Net değerleri - genel pattern
            net_pattern = r'(\d+)\s+(\d+)\s+([\\d,]+)'
            
            # Türkçe
            turk_match = re.search(r'Türkçe.*?' + net_pattern, page_text, re.IGNORECASE)
            if turk_match:
                data['turk_dogru'] = turk_match.group(1)
                data['turk_yanlis'] = turk_match.group(2)
                data['turk_net'] = normalize_number(turk_match.group(3))
            
            # Matematik
            mat_match = re.search(r'Matematik.*?' + net_pattern, page_text, re.IGNORECASE)
            if mat_match:
                data['mat_dogru'] = mat_match.group(1)
                data['mat_yanlis'] = mat_match.group(2)
                data['mat_net'] = normalize_number(mat_match.group(3))
            
            # Fen
            fen_match = re.search(r'Fen.*?' + net_pattern, page_text, re.IGNORECASE)
            if fen_match:
                data['fen_dogru'] = fen_match.group(1)
                data['fen_yanlis'] = fen_match.group(2)
                data['fen_net'] = normalize_number(fen_match.group(3))
            
            # Toplam
            toplam_match = re.search(r'Toplam.*?' + net_pattern, page_text, re.IGNORECASE)
            if toplam_match:
                data['toplam_dogru'] = toplam_match.group(1)
                data['toplam_yanlis'] = toplam_match.group(2)
                data['toplam_net'] = normalize_number(toplam_match.group(3))
            
            # Güven skoru hesapla
            confidence = self.calculate_confidence(data)
            
            # Fallback olarak düşük güven
            confidence = confidence * 0.7  # Fallback cezası
            
            return data, confidence
            
        except Exception as e:
            print(f"⚠ Text extraction hatası: {e}")
            return data, 0.0
    
    def supports_template(self, template: Optional[Dict]) -> bool:
        """Text extractor her durumda çalışır"""
        return True

