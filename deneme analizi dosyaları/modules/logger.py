#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Detaylı Loglama Modülü - Log Rotasyon Desteği ile
"""

import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime


class KarneLogger:
    """Karne işleme sürecini detaylı loglayan sınıf"""
    
    def __init__(self, log_file='karne_islem.log', log_level=logging.INFO, 
                 max_bytes=10*1024*1024, backup_count=5):
        """
        Logger'ı başlat
        
        Args:
            log_file: Log dosya yolu
            log_level: Log seviyesi
            max_bytes: Maksimum log dosya boyutu (varsayılan: 10MB)
            backup_count: Saklanacak eski log sayısı (varsayılan: 5)
        """
        self.log_file = log_file
        self.logger = logging.getLogger('KarneLogger')
        self.logger.setLevel(log_level)
        
        # Mevcut handler'ları temizle
        self.logger.handlers.clear()
        
        # Rotating file handler (log rotasyonu)
        fh = RotatingFileHandler(
            log_file, 
            encoding='utf-8',
            maxBytes=max_bytes,      # 10MB
            backupCount=backup_count  # Son 5 log dosyası
        )
        fh.setLevel(log_level)
        
        # Console handler
        ch = logging.StreamHandler()
        ch.setLevel(logging.WARNING)
        
        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        fh.setFormatter(formatter)
        ch.setFormatter(formatter)
        
        self.logger.addHandler(fh)
        self.logger.addHandler(ch)
        
        # İşlem başlangıcını logla
        self.logger.info("=" * 80)
        self.logger.info("Yeni işlem başlatıldı")
        self.logger.info("=" * 80)
    
    def log_pdf_info(self, pdf_path, page_count):
        """PDF dosya bilgilerini logla"""
        self.logger.info(f"PDF Dosyası: {pdf_path}")
        self.logger.info(f"Toplam Sayfa: {page_count}")
    
    def log_format_detection(self, detected_format, confidence, all_scores):
        """Format tespit sonucunu logla"""
        self.logger.info(f"Format Tespit: {detected_format or 'BİLİNMEYEN'}")
        self.logger.info(f"Güven Skoru: {confidence:.2%}")
        if all_scores:
            self.logger.debug(f"Tüm Format Skorları: {all_scores}")
    
    def log_page_processing(self, page_num, total_pages):
        """Sayfa işleme başlangıcını logla"""
        self.logger.debug(f"Sayfa {page_num}/{total_pages} işleniyor...")
    
    def log_extractor_attempt(self, extractor_name, page_num):
        """Çıkarıcı denemesini logla"""
        self.logger.debug(f"  [{page_num}] {extractor_name} deneniyor...")
    
    def log_extractor_result(self, extractor_name, page_num, success, confidence, data_summary=None):
        """Çıkarıcı sonucunu logla"""
        if success:
            self.logger.info(f"  [{page_num}] ✓ {extractor_name} - Güven: {confidence:.2%}")
            if data_summary:
                self.logger.debug(f"      Veri: {data_summary}")
        else:
            self.logger.debug(f"  [{page_num}] ✗ {extractor_name} başarısız")
    
    def log_validation_result(self, page_num, student_name, is_valid, confidence, issues):
        """Doğrulama sonucunu logla"""
        if is_valid:
            self.logger.info(f"  [{page_num}] ✓ Doğrulama: {student_name} - Güven: {confidence:.2%}")
        else:
            self.logger.warning(f"  [{page_num}] ⚠ Şüpheli: {student_name} - Güven: {confidence:.2%}")
            if issues:
                for issue in issues:
                    self.logger.warning(f"      - {issue}")
    
    def log_student_skipped(self, page_num, reason):
        """Atlanan öğrenciyi logla"""
        self.logger.warning(f"  [{page_num}] ⊗ Atlandı: {reason}")
    
    def log_summary(self, total_pages, valid_count, suspicious_count, skipped_count):
        """İşlem özetini logla"""
        self.logger.info("=" * 80)
        self.logger.info("İŞLEM ÖZETİ")
        self.logger.info("-" * 80)
        self.logger.info(f"Toplam Sayfa İşlendi: {total_pages}")
        self.logger.info(f"Geçerli Kayıt: {valid_count}")
        self.logger.info(f"Şüpheli Kayıt: {suspicious_count}")
        self.logger.info(f"Atlanan Kayıt: {skipped_count}")
        self.logger.info("=" * 80)
    
    def log_error(self, error_msg, exception=None):
        """Hata mesajını logla"""
        self.logger.error(f"HATA: {error_msg}")
        if exception:
            self.logger.error(f"Detay: {str(exception)}", exc_info=True)
    
    def log_warning(self, warning_msg):
        """Uyarı mesajını logla"""
        self.logger.warning(f"UYARI: {warning_msg}")
    
    def log_debug(self, debug_msg):
        """Debug mesajını logla"""
        self.logger.debug(debug_msg)


# Singleton instance
_logger_instance = None


def get_logger(log_file='karne_islem.log', log_level=logging.INFO):
    """Global logger instance'ını döndür"""
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = KarneLogger(log_file, log_level)
    return _logger_instance

