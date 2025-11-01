#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Format Tespit Modülü
Farklı yayınevi formatlarını otomatik tanır
"""

import os
import yaml
import fitz  # PyMuPDF
from typing import Optional, Dict, List, Tuple
try:
    from Levenshtein import ratio as levenshtein_ratio
except ImportError:
    # Fallback basit benzerlik fonksiyonu
    def levenshtein_ratio(s1, s2):
        """Basit benzerlik oranı hesapla"""
        s1, s2 = s1.lower(), s2.lower()
        if s1 == s2:
            return 1.0
        # Substring kontrolü
        if s1 in s2 or s2 in s1:
            return 0.8
        # Kelime eşleşme oranı
        words1 = set(s1.split())
        words2 = set(s2.split())
        if not words1 or not words2:
            return 0.0
        intersection = words1 & words2
        union = words1 | words2
        return len(intersection) / len(union)

from .normalizers import normalize_text, normalize_turkish_upper


class FormatDetector:
    """PDF formatını tespit eden sınıf"""
    
    def __init__(self, templates_dir: str = "templates"):
        """
        Args:
            templates_dir: Şablon dosyalarının bulunduğu dizin
        """
        self.templates_dir = templates_dir
        self.templates = {}
        self.load_templates()
    
    def load_templates(self):
        """YAML şablon dosyalarını yükle"""
        if not os.path.exists(self.templates_dir):
            print(f"UYARI: Şablon dizini bulunamadı: {self.templates_dir}")
            return
        
        for filename in os.listdir(self.templates_dir):
            if filename.endswith('.yaml') and filename != 'template_schema.yaml':
                filepath = os.path.join(self.templates_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        template = yaml.safe_load(f)
                        if template and 'name' in template:
                            self.templates[template['name']] = template
                            print(f"[OK] Sablon yuklendi: {template['name']}")
                except Exception as e:
                    print(f"[UYARI] Sablon yuklene(medi ({filename}): {e}")
        
        print(f"Toplam {len(self.templates)} şablon yüklendi")
    
    def detect_format(self, pdf_path: str, sample_pages: int = 2) -> Tuple[Optional[Dict], float, Dict]:
        """
        PDF'in formatını tespit eder
        
        Args:
            pdf_path: PDF dosya yolu
            sample_pages: İncelenecek sayfa sayısı
            
        Returns:
            (template, confidence, all_scores)
            - template: En uygun şablon (dict) veya None
            - confidence: Güven skoru (0.0-1.0)
            - all_scores: Tüm şablonların skorları
        """
        if not os.path.exists(pdf_path):
            print(f"HATA: PDF dosyası bulunamadı: {pdf_path}")
            return None, 0.0, {}
        
        # PDF'den örnek metin al + yapısal analiz
        try:
            doc = fitz.open(pdf_path)
            sample_text = ""
            page_texts = []
            for page_num in range(min(sample_pages, len(doc))):
                page_text = doc[page_num].get_text()
                sample_text += page_text
                page_texts.append(page_text)
            
            total_pages = len(doc)
            doc.close()
        except Exception as e:
            print(f"HATA: PDF okunamadı: {e}")
            return None, 0.0, {}
        
        if not sample_text:
            print("HATA: PDF'den metin çıkarılamadı")
            return None, 0.0, {}
        
        # Metni normalize et
        sample_text = normalize_text(sample_text)
        sample_text_upper = normalize_turkish_upper(sample_text)
        
        # Yapısal analiz (sayfa düzeni) bonusu
        structure_bonus = self._analyze_structure(page_texts, total_pages)
        
        # Her şablonu puanla
        scores = {}
        for template_name, template in self.templates.items():
            score = self._score_template(sample_text, sample_text_upper, template)
            # Yapısal bonus ekle
            if template_name in structure_bonus:
                score = min(1.0, score + structure_bonus[template_name])
            scores[template_name] = score
        
        if not scores:
            return None, 0.0, {}
        
        # En yüksek skoru bul - priority ile ağırlıklandırılmış
        # Skorlar yakınsa (fark %10'dan az), yüksek priority'li şablonu seç
        best_template_name = None
        best_score = 0.0
        
        # Skorları priority ile ağırlıklandır
        weighted_scores = {}
        for name, score in scores.items():
            priority = self.templates[name].get('priority', 0)
            # Yüksek priority bonus - %15'e kadar (daha güçlü)
            priority_bonus = min(priority / 100.0, 0.15)
            weighted_scores[name] = score + priority_bonus
        
        # En yüksek ağırlıklı skoru seç
        best_template_name = max(weighted_scores, key=weighted_scores.get)
        best_score = scores[best_template_name]  # Orijinal skor
        best_template = self.templates[best_template_name]
        
        # Minimum eşik kontrolü
        min_threshold = 0.4
        if best_score < min_threshold:
            print(f"UYARI: En iyi skor ({best_score:.2%}) eşiğin altında ({min_threshold:.2%})")
            return None, best_score, scores
        
        return best_template, best_score, scores
    
    def _score_template(self, text: str, text_upper: str, template: Dict) -> float:
        """
        Bir şablonun metinle eşleşme skorunu hesaplar
        
        Args:
            text: Normalize edilmiş metin
            text_upper: Büyük harfe çevrilmiş metin
            template: Şablon dict
            
        Returns:
            float: 0.0-1.0 arası skor
        """
        signatures = template.get('signatures', [])
        if not signatures:
            return 0.0
        
        total_score = 0.0
        max_score = 0.0
        exact_match_count = 0
        
        # Unique/benzersiz signature'lar daha değerli
        unique_signatures = ['ATOM LGS', 'DEBİ AKADEMİ', 'BH -', 'SINIF - SDS', 'TG GELİŞİM']
        
        for signature in signatures:
            # Benzersiz signature'lara 1.5x ağırlık
            weight = 1.5 if signature in unique_signatures else 1.0
            max_score += weight
            
            signature_norm = normalize_text(signature)
            signature_upper = normalize_turkish_upper(signature_norm)
            
            # Tam eşleşme kontrolü (en yüksek puan)
            if signature_upper in text_upper:
                total_score += weight
                exact_match_count += 1
                continue
            
            # Fuzzy matching (kısmi puan) - daha sıkı eşik
            best_match = 0.0
            words = text_upper.split()
            
            # Kelime kelime karşılaştır
            for i in range(len(words)):
                # 1-3 kelimelik pencerelerle karşılaştır
                for window_size in range(1, min(4, len(words) - i + 1)):
                    window = ' '.join(words[i:i+window_size])
                    similarity = levenshtein_ratio(signature_upper, window)
                    best_match = max(best_match, similarity)
            
            # Benzerlik skorunu ekle - daha sıkı eşikler
            if best_match >= 0.85:  # %85 ve üzeri -> tam puan
                total_score += weight * best_match
            elif best_match >= 0.7:  # %70-85 arası -> yarım puan
                total_score += weight * best_match * 0.5
            # %70'in altı hiç puan almaz
        
        # Normalize et
        final_score = total_score / max_score if max_score > 0 else 0.0
        
        # Tam eşleşme bonusu - 2 veya daha fazla tam eşleşme varsa +%10 bonus
        if exact_match_count >= 2:
            final_score = min(1.0, final_score + 0.10)
        
        return final_score
    
    def get_template_by_name(self, name: str) -> Optional[Dict]:
        """İsimle şablon getir"""
        return self.templates.get(name)
    
    def _analyze_structure(self, page_texts: List[str], total_pages: int) -> Dict[str, float]:
        """
        PDF sayfa yapısını analiz et ve format bonusları ver
        
        BenimHocam: İlk 1-2 sayfa liste, sonraki sayfalar "SONUÇ BELGESİ"
        HIZ: Çift sayfa yapısı, tek sayfalar öğrenci, çift sayfalar "KAZANIMLAR"
        """
        bonus = {}
        
        if total_pages < 3:
            return bonus
        
        # İlk 2 sayfa "SONUÇ BELGESİ" içermiyorsa ama 3+ sayfalarda varsa → BenimHocam
        first_two_has_sonuc = any('SONUÇ BELGESİ' in page_texts[i] for i in range(min(2, len(page_texts))))
        later_has_sonuc = any('SONUÇ BELGESİ' in page_texts[i] for i in range(2, min(5, len(page_texts))))
        
        if not first_two_has_sonuc and later_has_sonuc:
            bonus['BenimHocam'] = 0.10  # %10 bonus
        
        # Çift sayfalarda "KAZANIMLAR" varsa → HIZ
        # Örnek: sayfa 2,4,6... kazanım sayfası
        kazanim_count_even = 0
        kazanim_count_odd = 0
        for i in range(min(6, len(page_texts))):
            if 'KAZANIMLAR' in page_texts[i]:
                if i % 2 == 1:  # Çift sayfa (index 1,3,5... = sayfa 2,4,6...)
                    kazanim_count_even += 1
                else:
                    kazanim_count_odd += 1
        
        if kazanim_count_even >= 2 and kazanim_count_even > kazanim_count_odd:
            bonus['HIZ'] = 0.15  # %15 bonus - güçlü işaret
        
        # İlk sayfada liste göstergesi (birden fazla öğrenci)
        # BenimHocam listelerde "Sıra" sütunu olur
        if len(page_texts) > 0 and 'Sıra' in page_texts[0] and 'Ö.No' in page_texts[0]:
            bonus['BenimHocam'] = bonus.get('BenimHocam', 0) + 0.05
        
        return bonus
    
    def list_templates(self) -> List[str]:
        """Yüklü şablon isimlerini listele"""
        return list(self.templates.keys())


def detect_pdf_format(pdf_path: str, templates_dir: str = "templates") -> Tuple[Optional[Dict], float]:
    """
    Yardımcı fonksiyon: PDF formatını tespit et
    
    Args:
        pdf_path: PDF dosya yolu
        templates_dir: Şablon dizini
        
    Returns:
        (template, confidence)
    """
    detector = FormatDetector(templates_dir)
    template, confidence, _ = detector.detect_format(pdf_path)
    return template, confidence

