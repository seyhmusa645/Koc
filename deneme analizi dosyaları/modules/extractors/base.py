#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Temel Çıkarıcı Sınıfı - Tüm çıkarıcılar bu sınıftan türeyecek
"""

from abc import ABC, abstractmethod
from typing import Dict, Tuple, Optional, Any


class BaseExtractor(ABC):
    """Tüm PDF çıkarıcılarının temel sınıfı"""
    
    def __init__(self, name: str = "BaseExtractor"):
        """
        Args:
            name: Çıkarıcının adı (loglama için)
        """
        self.name = name
        self.min_confidence = 0.5  # Minimum güven skoru
    
    @abstractmethod
    def extract(self, page_text: str, template: Optional[Dict] = None, 
                page_obj: Any = None) -> Tuple[Dict, float]:
        """
        PDF sayfasından öğrenci bilgilerini çıkarır
        
        Args:
            page_text: Sayfa metni (string)
            template: YAML şablon bilgileri (dict) - opsiyonel
            page_obj: PyMuPDF page objesi - koordinat bilgisi için
            
        Returns:
            (data_dict, confidence_score)
            - data_dict: Çıkarılan veriler
            - confidence_score: 0.0-1.0 arası güven skoru
        """
        pass
    
    def validate_output(self, data: Dict) -> bool:
        """
        Çıkarılan verinin temel geçerliliğini kontrol eder
        
        Args:
            data: Çıkarılan veri dictionary
            
        Returns:
            bool: Veri geçerli mi?
        """
        # Minimum gereksinimler
        required_fields = ['ad_soyad']
        
        for field in required_fields:
            if field not in data or not data[field]:
                return False
        
        return True
    
    def calculate_confidence(self, data: Dict, expected_fields: list = None) -> float:
        """
        Çıkarılan verinin güven skorunu hesaplar
        
        Args:
            data: Çıkarılan veri
            expected_fields: Beklenen alanların listesi
            
        Returns:
            float: 0.0-1.0 arası güven skoru
        """
        if not data:
            return 0.0
        
        if expected_fields is None:
            expected_fields = [
                'ad_soyad', 'numara', 'sinif',
                'turk_dogru', 'turk_yanlis', 'turk_net',
                'mat_dogru', 'mat_yanlis', 'mat_net',
                'fen_dogru', 'fen_yanlis', 'fen_net',
                'toplam_dogru', 'toplam_yanlis', 'toplam_net'
            ]
        
        # Dolu alan sayısı
        filled_count = sum(1 for field in expected_fields if data.get(field))
        
        # Güven skoru = dolu alan oranı
        confidence = filled_count / len(expected_fields)
        
        return confidence
    
    def merge_data(self, existing: Dict, new_data: Dict, confidence: float) -> Dict:
        """
        Mevcut veri ile yeni veriyi birleştirir (yüksek güvenli alanlar kazanır)
        
        Args:
            existing: Mevcut veri
            new_data: Yeni çıkarılan veri
            confidence: Yeni verinin güven skoru
            
        Returns:
            dict: Birleştirilmiş veri
        """
        merged = existing.copy()
        
        # Yüksek güvenliyse yeni veriyi tercih et
        if confidence >= 0.7:
            merged.update(new_data)
        else:
            # Sadece boş alanları doldur
            for key, value in new_data.items():
                if key not in merged or not merged[key]:
                    merged[key] = value
        
        return merged
    
    def get_name(self) -> str:
        """Çıkarıcının adını döndür"""
        return self.name
    
    def supports_template(self, template: Optional[Dict]) -> bool:
        """
        Bu çıkarıcının verilen şablonu destekleyip desteklemediğini kontrol eder
        
        Args:
            template: YAML şablon
            
        Returns:
            bool: Destekleniyor mu?
        """
        # Varsayılan: Her şablonu destekler
        return True


class ExtractionResult:
    """Çıkarım sonucu wrapper sınıfı"""
    
    def __init__(self, data: Dict, confidence: float, extractor_name: str,
                 success: bool = True, error: Optional[str] = None):
        """
        Args:
            data: Çıkarılan veri
            confidence: Güven skoru (0.0-1.0)
            extractor_name: Çıkarıcının adı
            success: Başarılı mı?
            error: Hata mesajı (varsa)
        """
        self.data = data
        self.confidence = confidence
        self.extractor_name = extractor_name
        self.success = success
        self.error = error
    
    def is_valid(self, min_confidence: float = 0.5) -> bool:
        """Sonuç geçerli mi?"""
        return self.success and self.confidence >= min_confidence and bool(self.data)
    
    def __repr__(self) -> str:
        return (f"ExtractionResult(extractor={self.extractor_name}, "
                f"confidence={self.confidence:.2f}, success={self.success})")

