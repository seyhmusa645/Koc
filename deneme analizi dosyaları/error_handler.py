#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Error Handler - Kullanıcı dostu hata yönetimi
"""

import os
import traceback
from typing import Optional, Dict, Any
from enum import Enum


class ErrorType(Enum):
    """Hata tipleri"""
    FILE_NOT_FOUND = "file_not_found"
    FILE_CORRUPTED = "file_corrupted"
    FILE_ENCRYPTED = "file_encrypted"
    PERMISSION_DENIED = "permission_denied"
    FORMAT_UNKNOWN = "format_unknown"
    EXTRACTION_FAILED = "extraction_failed"
    VALIDATION_FAILED = "validation_failed"
    SAVE_FAILED = "save_failed"
    MEMORY_ERROR = "memory_error"
    UNKNOWN = "unknown"


class PDFError(Exception):
    """PDF işleme hatası"""
    def __init__(self, error_type: ErrorType, message: str, details: Optional[str] = None):
        self.error_type = error_type
        self.message = message
        self.details = details
        super().__init__(message)


def get_user_friendly_message(error: Exception) -> Dict[str, Any]:
    """
    Hatayı kullanıcı dostu mesaja çevirir
    
    Returns:
        {
            'title': str,           # Hata başlığı
            'message': str,         # Ana mesaj
            'suggestion': str,      # Kullanıcıya öneri
            'technical': str,       # Teknik detay (opsiyonel)
            'can_retry': bool,      # Tekrar denenebilir mi?
            'show_wizard': bool     # Şablon sihirbazı gösterilsin mi?
        }
    """
    
    # PDFError türü
    if isinstance(error, PDFError):
        return _handle_pdf_error(error)
    
    # Diğer yaygın hatalar
    error_str = str(error).lower()
    
    # Dosya bulunamadı
    if isinstance(error, FileNotFoundError) or 'no such file' in error_str:
        return {
            'title': 'Dosya Bulunamadı',
            'message': 'Seçilen PDF dosyası bulunamadı.',
            'suggestion': 'Lütfen dosyanın yerini kontrol edin ve tekrar deneyin.',
            'technical': str(error),
            'can_retry': True,
            'show_wizard': False
        }
    
    # İzin hatası
    if isinstance(error, PermissionError) or 'permission denied' in error_str:
        return {
            'title': 'Erişim İzni Yok',
            'message': 'Dosyaya erişim izni bulunmuyor.',
            'suggestion': 'Dosyanın açık olmadığından emin olun ve yazma iznini kontrol edin.',
            'technical': str(error),
            'can_retry': True,
            'show_wizard': False
        }
    
    # Bellek hatası
    if isinstance(error, MemoryError) or 'memory' in error_str:
        return {
            'title': 'Bellek Yetersiz',
            'message': 'PDF dosyası çok büyük, bellek yetersiz.',
            'suggestion': 'Lütfen diğer programları kapatıp tekrar deneyin veya daha küçük PDF kullanın.',
            'technical': str(error),
            'can_retry': True,
            'show_wizard': False
        }
    
    # PDF bozuk/şifreli
    if 'password' in error_str or 'encrypted' in error_str:
        return {
            'title': 'Şifreli PDF',
            'message': 'PDF dosyası şifre korumalı.',
            'suggestion': 'Lütfen PDF\'in şifresini kaldırıp tekrar deneyin.',
            'technical': str(error),
            'can_retry': False,
            'show_wizard': False
        }
    
    if 'corrupt' in error_str or 'damaged' in error_str or 'invalid' in error_str:
        return {
            'title': 'Bozuk PDF',
            'message': 'PDF dosyası bozuk veya geçersiz.',
            'suggestion': 'Dosyayı tekrar indirin veya farklı bir PDF deneyin.',
            'technical': str(error),
            'can_retry': False,
            'show_wizard': False
        }
    
    # Genel hata
    return {
        'title': 'Beklenmeyen Hata',
        'message': 'İşlem sırasında bir hata oluştu.',
        'suggestion': 'Lütfen tekrar deneyin. Sorun devam ederse program logunu inceleyin.',
        'technical': str(error),
        'can_retry': True,
        'show_wizard': False
    }


def _handle_pdf_error(error: PDFError) -> Dict[str, Any]:
    """PDFError türünü işle"""
    
    if error.error_type == ErrorType.FILE_NOT_FOUND:
        return {
            'title': 'Dosya Bulunamadı',
            'message': error.message,
            'suggestion': 'Dosya yolunu kontrol edin ve tekrar deneyin.',
            'technical': error.details,
            'can_retry': True,
            'show_wizard': False
        }
    
    elif error.error_type == ErrorType.FILE_CORRUPTED:
        return {
            'title': 'Bozuk PDF',
            'message': error.message,
            'suggestion': 'Dosyayı tekrar indirin veya farklı bir PDF kullanın.',
            'technical': error.details,
            'can_retry': False,
            'show_wizard': False
        }
    
    elif error.error_type == ErrorType.FILE_ENCRYPTED:
        return {
            'title': 'Şifreli PDF',
            'message': error.message,
            'suggestion': 'PDF şifresini kaldırıp tekrar deneyin.',
            'technical': error.details,
            'can_retry': False,
            'show_wizard': False
        }
    
    elif error.error_type == ErrorType.PERMISSION_DENIED:
        return {
            'title': 'Erişim İzni Yok',
            'message': error.message,
            'suggestion': 'Dosyanın açık olmadığından ve yazma izniniz olduğundan emin olun.',
            'technical': error.details,
            'can_retry': True,
            'show_wizard': False
        }
    
    elif error.error_type == ErrorType.FORMAT_UNKNOWN:
        return {
            'title': 'Bilinmeyen Format',
            'message': error.message,
            'suggestion': 'Bu PDF formatı tanınmıyor. Şablon Sihirbazı ile yeni format ekleyebilirsiniz.',
            'technical': error.details,
            'can_retry': False,
            'show_wizard': True  # Sihirbaz öner
        }
    
    elif error.error_type == ErrorType.EXTRACTION_FAILED:
        return {
            'title': 'Çıkarım Başarısız',
            'message': error.message,
            'suggestion': 'Veriler çıkarılamadı. PDF formatını kontrol edin veya Şablon Sihirbazı kullanın.',
            'technical': error.details,
            'can_retry': True,
            'show_wizard': True
        }
    
    elif error.error_type == ErrorType.VALIDATION_FAILED:
        return {
            'title': 'Doğrulama Hatası',
            'message': error.message,
            'suggestion': 'Çıkarılan veriler doğrulama kurallarına uymadı. Şüpheli kayıtları inceleyin.',
            'technical': error.details,
            'can_retry': False,
            'show_wizard': False
        }
    
    elif error.error_type == ErrorType.SAVE_FAILED:
        return {
            'title': 'Kaydetme Hatası',
            'message': error.message,
            'suggestion': 'Dosya kaydedilemedi. Hedef klasörü ve izinleri kontrol edin.',
            'technical': error.details,
            'can_retry': True,
            'show_wizard': False
        }
    
    elif error.error_type == ErrorType.MEMORY_ERROR:
        return {
            'title': 'Bellek Yetersiz',
            'message': error.message,
            'suggestion': 'PDF çok büyük. Diğer programları kapatıp tekrar deneyin.',
            'technical': error.details,
            'can_retry': True,
            'show_wizard': False
        }
    
    else:  # UNKNOWN
        return {
            'title': 'Bilinmeyen Hata',
            'message': error.message,
            'suggestion': 'Lütfen tekrar deneyin. Sorun devam ederse destek alın.',
            'technical': error.details,
            'can_retry': True,
            'show_wizard': False
        }


def safe_execute(func, *args, **kwargs) -> tuple:
    """
    Fonksiyonu güvenli çalıştırır ve hataları yakalar
    
    Returns:
        (success: bool, result_or_error: Any)
    """
    try:
        result = func(*args, **kwargs)
        return (True, result)
    except Exception as e:
        error_info = get_user_friendly_message(e)
        return (False, error_info)


def log_error_details(error: Exception, log_file: str = "error.log"):
    """Hata detaylarını log dosyasına yaz"""
    try:
        with open(log_file, 'a', encoding='utf-8') as f:
            import datetime
            timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            f.write(f"\n{'='*80}\n")
            f.write(f"[{timestamp}] HATA\n")
            f.write(f"Tip: {type(error).__name__}\n")
            f.write(f"Mesaj: {str(error)}\n")
            f.write(f"\nStack Trace:\n")
            f.write(traceback.format_exc())
            f.write(f"\n{'='*80}\n")
    except:
        pass  # Log yazma hatası bile olsa devam et


# Örnek kullanım:
"""
try:
    result = api.extract_records(pdf_path)
except Exception as e:
    error_info = get_user_friendly_message(e)
    log_error_details(e)
    
    messagebox.showerror(
        error_info['title'],
        f"{error_info['message']}\n\n{error_info['suggestion']}"
    )
    
    if error_info['show_wizard']:
        # Sihirbazı aç
        open_template_wizard(pdf_path)
"""

