#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OCR Bazlı Çıkarıcı - Tesseract OCR ile metin çıkarır (son çare)
"""

from typing import Dict, Tuple, Optional, Any
from .base import BaseExtractor


class OCRExtractor(BaseExtractor):
    """Tesseract OCR ile veri çıkarır (en son çare)"""
    
    def __init__(self):
        super().__init__(name="OCRExtractor")
        self.tesseract_available = False
        
        try:
            import pytesseract
            self.tesseract_available = True
        except ImportError:
            pass
    
    def extract(self, page_text: str, template: Optional[Dict] = None,
                page_obj: Any = None) -> Tuple[Dict, float]:
        """
        OCR ile metin çıkarır
        
        Args:
            page_text: Mevcut sayfa metni (kullanılmıyor)
            template: Şablon (kullanılmıyor)
            page_obj: PyMuPDF page objesi
            
        Returns:
            (data, confidence)
        """
        if not self.tesseract_available:
            return {}, 0.0
        
        # OCR çok yavaş ve hata eğilimli
        # Sadece diğer yöntemler başarısız olursa kullanılmalı
        # Şimdilik placeholder
        
        # TODO: OCR implementasyonu
        # 1. PyMuPDF ile sayfayı görüntüye çevir
        # 2. Tesseract ile OCR yap
        # 3. TextExtractor ile çıkarım yap
        
        return {}, 0.0
    
    def supports_template(self, template: Optional[Dict]) -> bool:
        """OCR her durumda çalışmaya çalışır ama en son seçenek"""
        return self.tesseract_available


# Not: OCR çok yavaş ve karmaşık
# Şu an için placeholder, gerekirse implement edilir
# Normal PDF'lerde metin zaten var, OCR'a gerek yok

