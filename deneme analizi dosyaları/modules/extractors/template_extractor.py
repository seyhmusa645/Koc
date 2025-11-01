#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Şablon Bazlı Çıkarıcı - YAML şablonlarına göre veri çıkarır
"""

import re
from typing import Dict, Tuple, Optional, Any
from .base import BaseExtractor
from ..normalizers import normalize_number, normalize_student_name, normalize_class_format


class TemplateExtractor(BaseExtractor):
    """YAML şablonlarına göre PDF'den veri çıkarır"""
    
    def __init__(self):
        super().__init__(name="TemplateExtractor")
    
    def extract(self, page_text: str, template: Optional[Dict] = None,
                page_obj: Any = None) -> Tuple[Dict, float]:
        """
        Şablona göre sayfadan veri çıkarır
        
        Args:
            page_text: Sayfa metni
            template: YAML şablon
            page_obj: PyMuPDF page objesi (kullanılmıyor şimdilik)
            
        Returns:
            (data, confidence)
        """
        if not template:
            return {}, 0.0
        
        if not page_text or not page_text.strip():
            return {}, 0.0
        
        data = {}
        
        try:
            # Öğrenci bilgileri
            student_info = self._extract_student_info(page_text, template)
            data.update(student_info)
            
            if not data.get('ad_soyad'):
                # Öğrenci bilgisi bulunamadı
                return data, 0.0
            
            # LGS bilgileri
            lgs_info = self._extract_lgs_info(page_text, template)
            data.update(lgs_info)
            
            # Katılım
            participation = self._extract_participation(page_text, template)
            if participation:
                data['katilimlar'] = participation
            
            # Ders bilgileri
            sinif_num = self._get_grade_number(data.get('sinif', ''))
            subjects_data = self._extract_subjects(page_text, template, sinif_num)
            data.update(subjects_data)
            
            # Toplam
            total_data = self._extract_total(page_text, template)
            data.update(total_data)
            
            # Kazanımlar (opsiyonel)
            if template.get('achievements', {}).get('enabled', False):
                achievements = self._extract_achievements(page_text, template)
                data['kazanimlar_ozet'] = achievements
            
            # Güven skoru hesapla
            confidence = self.calculate_confidence(data)
            
            return data, confidence
            
        except Exception as e:
            print(f"⚠ Template extraction hatası: {e}")
            return data, 0.0
    
    def _extract_student_info(self, text: str, template: Dict) -> Dict:
        """Öğrenci bilgilerini çıkar (ad, numara, sınıf)"""
        data = {}
        student_block = template.get('student_block', {})
        
        # 1) STANDART FORMAT (eski kod - önce bunu dene): Tek satırda
        # "Öğrenci  Numara  Sınıf  ALMİRA ÖZKAN  35  5-A"
        standard_pattern = student_block.get('standard_pattern')
        if standard_pattern:
            match = re.search(standard_pattern, text)
            if match:
                data['ad_soyad'] = normalize_student_name(match.group(1))
                data['numara'] = match.group(2).strip()
                data['sinif'] = normalize_class_format(match.group(3))
                return data
        
        # 2) DEBİ FORMAT: Başlıklar satır satır, değerler satır satır
        debi_pattern = student_block.get('debi_pattern')
        if debi_pattern:
            match = re.search(debi_pattern, text)
            if match:
                data['ad_soyad'] = normalize_student_name(match.group(1))
                data['numara'] = match.group(2).strip()
                data['sinif'] = normalize_class_format(match.group(3))
                return data
        
        # Alternatif format: İsim ve sınıf ayrı satırlarda (HIZ gibi)
        # Kombine pattern: isim ve sınıf/numara birlikte
        combined_pattern = student_block.get('combined_pattern')
        if combined_pattern:
            match = re.search(combined_pattern, text, re.MULTILINE | re.DOTALL)
            if match:
                groups = match.groups()
                data['ad_soyad'] = normalize_student_name(match.group(1))
                
                # Format 1: İsim, Numara, Sınıf (3 grup) - Debi Atom gibi
                if len(groups) == 3:
                    data['numara'] = match.group(2).strip()
                    data['sinif'] = normalize_class_format(match.group(3))
                # Format 2: İsim, Sınıf_Num, Şube, Numara (4 grup) - HIZ gibi
                elif len(groups) == 4:
                    sinif_num = match.group(2)
                    sube = match.group(3)
                    data['numara'] = match.group(4)
                    data['sinif'] = f"{sinif_num}-{sube}"
                
                return data
        
        # Eski yöntem (fallback)
        name_line_pattern = student_block.get('name_line_pattern')
        class_pattern = student_block.get('class_pattern')
        
        if name_line_pattern and class_pattern:
            # İsim satırını bul
            name_match = re.search(name_line_pattern, text, re.MULTILINE)
            if name_match:
                ad_soyad = normalize_student_name(name_match.group(1))
                
                # Sınıf/numara satırını bul
                class_match = re.search(class_pattern, text)
                if class_match:
                    sinif_num = class_match.group(1)
                    sube = class_match.group(2)
                    numara = class_match.group(3)
                    
                    data['ad_soyad'] = ad_soyad
                    data['numara'] = numara
                    data['sinif'] = f"{sinif_num}-{sube}"
        
        return data
    
    def _extract_lgs_info(self, text: str, template: Dict) -> Dict:
        """LGS puan ve derece bilgilerini çıkar"""
        data = {}
        lgs_block = template.get('lgs_block', {})
        pattern = lgs_block.get('pattern')
        
        if not pattern:
            return data
        
        match = re.search(pattern, text)
        if match:
            data['lgs_puan'] = normalize_number(match.group(1))
            data['lgs_ortalama'] = normalize_number(match.group(2))
            data['sinif_derecesi'] = match.group(3)
            data['kurum_derecesi'] = match.group(4)
            data['ilce_derecesi'] = match.group(5)
            data['il_derecesi'] = match.group(6)
            data['genel_derece'] = match.group(7)
        
        return data
    
    def _extract_participation(self, text: str, template: Dict) -> Optional[str]:
        """Katılım bilgisini çıkar"""
        participation = template.get('participation', {})
        pattern = participation.get('pattern')
        
        if not pattern:
            return None
        
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
        
        return None
    
    def _extract_subjects(self, text: str, template: Dict, grade: int) -> Dict:
        """Ders bilgilerini çıkar"""
        data = {}
        subjects = template.get('subjects', [])
        
        for subject in subjects:
            subject_name = subject.get('name', '')
            pattern = subject.get('pattern')
            
            if not pattern:
                continue
            
            # Sınıfa özel kontrol
            if subject.get('grade_specific') and grade not in subject.get('grade_specific', []):
                continue
            
            # 8. sınıf için özel pattern
            if grade >= 8 and subject.get('grade_8_pattern'):
                pattern = subject.get('grade_8_pattern')
            
            # Alternatif pattern dene (HIZ formatı gibi)
            patterns = [pattern]
            if subject.get('alt_pattern'):
                patterns.append(subject.get('alt_pattern'))
            
            for pat in patterns:
                match = re.search(pat, text, re.IGNORECASE)
                if match:
                    # Prefix belirle (türk, mat, fen, vb.)
                    prefix = self._get_subject_prefix(subject_name, grade)
                    
                    # Grupları çıkar (soru_sayisi, dogru, yanlis, net, basari? şeklinde olabilir)
                    groups = match.groups()
                    
                    if len(groups) >= 4:
                        # HIZ format: soru, doğru, yanlış, boş, net, başarı (6 grup)
                        if len(groups) == 6:
                            data[f'{prefix}_dogru'] = groups[1]
                            data[f'{prefix}_yanlis'] = groups[2]
                            # groups[3] = boş sayısı (kullanmıyoruz)
                            data[f'{prefix}_net'] = normalize_number(groups[4])
                            data[f'{prefix}_basari'] = groups[5]
                        # Standart format: soru, doğru, yanlış, net, başarı (5 grup)
                        elif len(groups) == 5:
                            data[f'{prefix}_dogru'] = groups[1]
                            data[f'{prefix}_yanlis'] = groups[2]
                            data[f'{prefix}_net'] = normalize_number(groups[3])
                            data[f'{prefix}_basari'] = groups[4]
                        # Kısa format: doğru, yanlış, net, başarı (4 grup)
                        elif len(groups) == 4:
                            data[f'{prefix}_dogru'] = groups[0]
                            data[f'{prefix}_yanlis'] = groups[1]
                            data[f'{prefix}_net'] = normalize_number(groups[2])
                            data[f'{prefix}_basari'] = groups[3]
                    
                    break  # İlk eşleşmeyi al
        
        return data
    
    def _extract_total(self, text: str, template: Dict) -> Dict:
        """Toplam satırını çıkar"""
        data = {}
        total = template.get('total', {})
        pattern = total.get('pattern')
        
        if not pattern:
            return data
        
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            groups = match.groups()
            
            if len(groups) >= 4:
                # HIZ format: soru, dogru, yanlis, bos, net (5 grup)
                # Veya standart: soru, dogru, yanlis, net, basari (5 grup)
                data['toplam_dogru'] = groups[1] if len(groups) > 1 else groups[0]
                data['toplam_yanlis'] = groups[2] if len(groups) > 2 else groups[1]
                net_index = 4 if len(groups) >= 5 else 3 if len(groups) >= 4 else 2
                data['toplam_net'] = normalize_number(groups[net_index]) if net_index < len(groups) else groups[-1]
                if len(groups) > net_index + 1:
                    data['toplam_basari'] = groups[net_index + 1]
        
        return data
    
    def _extract_achievements(self, text: str, template: Dict) -> str:
        """Kazanım bilgilerini özetler"""
        achievements = template.get('achievements', {})
        section_pattern = achievements.get('section_pattern')
        
        if not section_pattern:
            return 'Yok'
        
        # Basitleştirilmiş kazanım çıkarımı
        # Detaylı implementasyon gerekirse eklenebilir
        matches = re.findall(section_pattern, text)
        if matches:
            return f"{len(matches)} bölüm bulundu"
        
        return 'Yok'
    
    def _get_subject_prefix(self, subject_name: str, grade: int) -> str:
        """Ders adından prefix döndür (turk, mat, fen, vb.)"""
        subject_name_upper = subject_name.upper()
        
        if 'TÜRK' in subject_name_upper:
            return 'turk'
        elif 'SOSYAL' in subject_name_upper:
            return 'sosyal'
        elif 'İNKILAP' in subject_name_upper or 'INKIL' in subject_name_upper:
            return 'sosyal'  # İnkılap da sosyal prefix'i kullanır
        elif 'DİN' in subject_name_upper or 'DIN' in subject_name_upper:
            return 'din'
        elif 'İNG' in subject_name_upper or 'ING' in subject_name_upper:
            return 'ing'
        elif 'MAT' in subject_name_upper:
            return 'mat'
        elif 'FEN' in subject_name_upper:
            return 'fen'
        else:
            # Varsayılan
            return subject_name.lower().replace(' ', '_')[:6]
    
    def _get_grade_number(self, sinif: str) -> int:
        """Sınıf string'inden sınıf numarasını çıkar"""
        if not sinif:
            return 0
        
        match = re.search(r'(\d+)', sinif)
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                pass
        
        return 0
    
    def supports_template(self, template: Optional[Dict]) -> bool:
        """Bu çıkarıcı her şablonu destekler"""
        return template is not None

