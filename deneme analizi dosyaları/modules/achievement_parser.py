#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kazanım (Achievement) Parse Modülü
PDF'deki kazanım detaylarını çıkarır - Yeni Versiyon

İki format desteklenir:
1. full_text: BenimHocam/Debi Atom - Tam metin + S/D/Y/B%
2. codes: HIZ - Kazanım kodları + durum işareti
"""

import re
import os
import json
from typing import List, Dict, Tuple, Optional


def load_kazanimlar_database() -> Dict:
    """Kazanımlar.json veritabanını yükler - AppData'dan"""
    # Önce AppData'daki güncel dosyayı dene
    appdata_path = os.path.expanduser("~\\AppData\\Roaming\\kapsul-kocluk-programi\\shared\\Kazanımlar.json")
    
    if os.path.exists(appdata_path):
        try:
            with open(appdata_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"[OK] Kazanımlar AppData'dan yüklendi: {len(data)} ders")
                return data
        except Exception as e:
            print(f"[UYARI] AppData Kazanımlar.json yüklenemedi: {e}")
    
    # Fallback: workspace'deki eski dosya
    kazanimlar_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'Kazanımlar.json')
    
    if not os.path.exists(kazanimlar_path):
        # Alternatif yol
        kazanimlar_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'Kazanımlar.json')
    
    if os.path.exists(kazanimlar_path):
        try:
            with open(kazanimlar_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"[OK] Kazanımlar workspace'den yüklendi (fallback): {len(data)} ders")
                return data
        except Exception as e:
            print(f"[HATA] Kazanımlar.json yüklenemedi: {e}")
            return {}
    
    print("[HATA] Kazanımlar.json hiçbir konumda bulunamadı!")
    return {}


def is_number(token: str) -> bool:
    """String'in sayı olup olmadığını kontrol et"""
    return bool(re.fullmatch(r'-?\d+(?:[.,]\d+)?', token))


def parse_full_text_achievements(text: str, template: Dict) -> Dict[str, List[str]]:
    """
    DERSLERE GÖRE ANALİZ bölümünden tam metin kazanımları parse et
    
    Args:
        text: PDF sayfa metni
        template: YAML template (achievements bölümü)
        
    Returns:
        {'TUR': ['Kazanım metni 1', 'Kazanım metni 2'], 'MAT': [...], ...}
    """
    achievements_config = template.get('achievements', {})
    section_patterns = achievements_config.get('section_patterns', ['DERSLERE GÖRE ANALİZ'])
    subject_headers = achievements_config.get('subject_headers', [])
    incorrect_threshold = achievements_config.get('incorrect_threshold', 75)
    
    # Kazanım bölümünü bul
    analysis_start = -1
    for pattern in section_patterns:
        analysis_start = text.find(pattern)
        if analysis_start != -1:
            break
    
    if analysis_start == -1:
        return {}
    
    analysis_text = text[analysis_start:]
    
    # Subject headers ile bölümleri bul - TÜM header'ları bir kez bul
    achievements_by_subject = {}
    
    # Önce tüm ders başlıklarını bul ve sırala
    all_headers = []
    for header_pattern in subject_headers:
        for match in re.finditer(header_pattern, analysis_text, re.IGNORECASE | re.DOTALL):
            subject_match = re.search(r'\(([A-ZÇĞİÖŞÜ]+)\)', match.group(0))
            if subject_match:
                subject_code = subject_match.group(1)
                all_headers.append({
                    'code': subject_code,
                    'start': match.end(),
                    'match_text': match.group(0)
                })
    
    # Pozisyona göre sırala
    all_headers.sort(key=lambda x: x['start'])
    
    # Her ders bloğunu işle
    for idx, header_info in enumerate(all_headers):
        subject_code = header_info['code']
        start = header_info['start']
        
        # Sonraki header'a kadar veya metnin sonuna kadar
        if idx + 1 < len(all_headers):
            end = all_headers[idx + 1]['start'] - len(all_headers[idx + 1]['match_text'])
        else:
            end = len(analysis_text)
        
        block = analysis_text[start:end]
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        
        # S, D, Y, B% başlıklarını atla
        filtered_lines = []
        for line in lines:
            if line.upper() not in ('S', 'D', 'Y', 'B%'):
                filtered_lines.append(line)
        
        # Kazanımları parse et
        subject_achievements = []
        i = 0
        
        while i < len(filtered_lines):
            # Kazanım açıklamasını topla (sayı olmayanlar)
            desc_parts = []
            while i < len(filtered_lines) and not is_number(filtered_lines[i]):
                desc_parts.append(filtered_lines[i])
                i += 1
            
            desc = ' '.join(desc_parts).strip()
            
            if not desc:
                continue
            
            # "KAZANIM BELİRLENEMEDİ" veya benzer ifadeleri atla
            if 'KAZANIM' in desc.upper() and ('BEL' in desc.upper() or 'YOK' in desc.upper()):
                # Ardındaki 4 sayıyı atla
                skipped = 0
                while i < len(filtered_lines) and is_number(filtered_lines[i]) and skipped < 4:
                    i += 1
                    skipped += 1
                continue
            
            # S, D, Y, B% değerlerini topla
            numbers = []
            while i < len(filtered_lines) and is_number(filtered_lines[i]) and len(numbers) < 4:
                numbers.append(filtered_lines[i])
                i += 1
            
            # Eğer 4 sayı varsa (S, D, Y, B%)
            if len(numbers) == 4:
                basari_value = numbers[3].replace(',', '.')
                
                try:
                    basari_pct = float(basari_value)
                    # B% < incorrect_threshold olanları al (varsayılan: 75)
                    if basari_pct < incorrect_threshold:
                        # Kazanım metnini ekle (maksimum 250 karakter)
                        desc_short = desc[:250].strip()
                        subject_achievements.append(desc_short)
                except ValueError:
                    pass
        
        if subject_achievements:
            achievements_by_subject[subject_code] = subject_achievements
    
    return achievements_by_subject


def match_kazanim_code(code: str, grade: int) -> Optional[str]:
    """
    Kazanımlar.json'dan kodu eşleştir veya tam metni döndür
    
    Args:
        code: Kazanım kodu veya metin (örn: "İTA.8.1.4", "T.8.3.20.3" veya tam kazanım metni)
        grade: Sınıf seviyesi
        
    Returns:
        Kazanım tam metni (eşleşirse) veya orijinal kod/metin
    """
    # Kodu normalize et (büyük harf, boşlukları temizle)
    code_normalized = code.upper().strip()
    
    # Database'i yükle
    kazanimlar_db = load_kazanimlar_database()
    
    if not kazanimlar_db:
        return code  # Database yüklenemezse kodu döndür
    
    grade_str = str(grade)
    
    # Kod prefix'ini çıkar
    prefix_match = re.match(r'^([A-ZÇĞİÖŞÜ]+)', code_normalized)
    if not prefix_match:
        return code  # Parse edilemezse kodu döndür
    
    prefix = prefix_match.group(1)
    
    # Ders mapping (kod prefix -> ders adı)
    subject_prefix_map = {
        'T': 'Türkçe',
        'TUR': 'Türkçe',
        'TÜR': 'Türkçe',
        'İNG': 'İngilizce',
        'ING': 'İngilizce',
        'ENG': 'İngilizce',
        'İTA': 'Sosyal Bilgiler',  # İnkılap Tarihi (8. sınıf)
        'TAR': 'Sosyal Bilgiler',
        'M': 'Matematik',
        'MAT': 'Matematik',
        'F': 'Fen Bilimleri',
        'FB': 'Fen Bilimleri',
        'FEN': 'Fen Bilimleri',
        'SB': 'Sosyal Bilgiler',
        'DK': 'Din Kültürü ve Ahlak Bilgisi',
        'DİN': 'Din Kültürü ve Ahlak Bilgisi'
    }
    
    subject_name = subject_prefix_map.get(prefix)
    
    if not subject_name or subject_name not in kazanimlar_db:
        return code  # Ders bulunamazsa kodu döndür
    
    # İlgili sınıf seviyesindeki kazanımları ara
    if grade_str not in kazanimlar_db[subject_name]:
        return code  # Sınıf bulunamazsa kodu döndür
    
    kazanimlar = kazanimlar_db[subject_name][grade_str]
    
    # Türkçe ve İngilizce için özel işlem (kod içermiyorlar, fuzzy match)
    if subject_name in ['Türkçe', 'İngilizce']:
        # Eğer code tam bir kazanım metni ise, database'de ara
        # Önce tam eşleşme dene
        for item in kazanimlar:
            kazanim_text = item.get('kazanim', '')
            if kazanim_text.upper().strip() == code_normalized:
                return kazanim_text  # Tam eşleşme bulundu
        
        # Tam eşleşme yoksa, kısmi eşleşme dene (ilk 30 karakter)
        code_start = code_normalized[:30]
        for item in kazanimlar:
            kazanim_text = item.get('kazanim', '')
            if kazanim_text.upper().strip().startswith(code_start):
                return kazanim_text  # Kısmi eşleşme bulundu
        
        # Hiç eşleşme bulunamazsa orijinal metni döndür
        return code
    
    # Diğer dersler için kod bazlı eşleşme
    # Kazanım listesinde kodu ara
    for item in kazanimlar:
        kazanim_text = item.get('kazanim', '') or item.get('ogrenme_cikti', '')
        
        # Kazanım metninde kod geçiyor mu kontrol et
        if code_normalized in kazanim_text.upper():
            return kazanim_text
    
    # Bulunamazsa kodu döndür
    return code


def parse_code_achievements(text: str, template: Dict, grade: int) -> Dict[str, List[str]]:
    """
    KAZANIMLAR bölümünden kod bazlı kazanımları parse et (HIZ format)
    
    Args:
        text: PDF sayfa metni
        template: YAML template (achievements bölümü)
        grade: Sınıf seviyesi
        
    Returns:
        {'TUR': ['Kazanım metni 1', ...], 'ITA': [...], ...}
    """
    achievements_config = template.get('achievements', {})
    section_patterns = achievements_config.get('section_patterns', ['KAZANIMLAR'])
    code_pattern = achievements_config.get('code_pattern', r'([A-ZÇĞİÖŞÜ]{1,4}\.\d+\.\d+\.\d+)')
    incorrect_marker = achievements_config.get('incorrect_marker', '-')
    deduplicate = achievements_config.get('deduplicate', True)
    
    # Kazanım bölümünü bul
    analysis_start = -1
    for pattern in section_patterns:
        analysis_start = text.find(pattern)
        if analysis_start != -1:
            break
    
    if analysis_start == -1:
        return {}
    
    analysis_text = text[analysis_start:]
    
    # Ders başlıklarını bul (TÜRKÇE(B), İNKILAP TARİHİ(B) vb.)
    subject_header_pattern = r'(TÜRKÇE|İNKILAP TARİHİ|DİN KÜLTÜRÜ|İNGİLİZCE|MATEMATİK|FEN BİLİMLERİ)\s*\([A-Z]\)'
    subject_matches = list(re.finditer(subject_header_pattern, analysis_text))
    
    achievements_by_subject = {}
    
    for idx, subject_match in enumerate(subject_matches):
        subject_name = subject_match.group(1)
        
        # Ders kodu mapping
        subject_code_map = {
            'TÜRKÇE': 'TUR',
            'İNKILAP TARİHİ': 'ITA',
            'DİN KÜLTÜRÜ': 'DIN',
            'İNGİLİZCE': 'ING',
            'MATEMATİK': 'MAT',
            'FEN BİLİMLERİ': 'FEN'
        }
        
        subject_code = subject_code_map.get(subject_name, subject_name[:3])
        
        # Bu dersin bloğunu al
        start = subject_match.end()
        end = subject_matches[idx + 1].start() if idx + 1 < len(subject_matches) else len(analysis_text)
        block = analysis_text[start:end]
        
        # Kazanım kodlarını ve durumlarını bul
        # HIZ format: Kod bir satırda, DC/ÖC/+- sonraki satırlarda
        # Örnek:
        #   T.8.3.20.3. Okuduğu metinleri
        #   A
        #   b
        #   -
        lines = block.split('\n')
        
        incorrect_codes = set() if deduplicate else []
        
        for i, line in enumerate(lines):
            # Kazanım kodu ara
            code_matches = list(re.finditer(code_pattern, line))
            
            for code_match in code_matches:
                code = code_match.group(1)
                
                # Kod satırından sonraki 1-4 satırda "-" var mı kontrol et
                # (DC, ÖC, +- sırasıyla gelebilir)
                found_incorrect = False
                for j in range(i, min(i + 5, len(lines))):
                    next_line = lines[j].strip()
                    if next_line == incorrect_marker:
                        found_incorrect = True
                        break
                
                if found_incorrect:
                    if deduplicate:
                        incorrect_codes.add(code)
                    else:
                        incorrect_codes.append(code)
        
        # Kodları tam metinlere çevir (Türkçe/İngilizce sadece kod döner)
        subject_achievements = []
        codes_to_process = list(incorrect_codes) if deduplicate else incorrect_codes
        
        for code in codes_to_process:
            result = match_kazanim_code(code, grade)
            # match_kazanim_code artık her zaman bir değer döndürür (kod veya tam metin)
            subject_achievements.append(result[:250].strip())
        
        if subject_achievements:
            achievements_by_subject[subject_code] = subject_achievements
    
    return achievements_by_subject


def map_subject_codes_to_csv_format(achievements_dict: Dict[str, List[str]], grade: int = 5) -> Dict[str, List[str]]:
    """
    PDF'deki ders kodlarını CSV formatına çevir
    
    Args:
        achievements_dict: {'TUR': [...], 'MAT': [...], ...}
        grade: Sınıf seviyesi (8. sınıf için Sosyal -> İnkılap Tarihi)
        
    Returns:
        {'turkce': [...], 'matematik': [...], ...}
    """
    # 8. sınıf için Sosyal Bilgiler -> İnkılap Tarihi
    mapping = {
        'TÜR': 'turkce',
        'TUR': 'turkce',
        'TAR': 'inkilap' if grade == 8 else 'sosyal',
        'ITA': 'inkilap',
        'SOS': 'sosyal',
        'DİN': 'din',
        'İNG': 'ingilizce',
        'ING': 'ingilizce',
        'MAT': 'matematik',
        'FEN': 'fen'
    }
    
    result = {}
    for pdf_code, csv_key in mapping.items():
        if pdf_code in achievements_dict:
            result[csv_key] = achievements_dict[pdf_code]
    
    return result


def extract_achievements_from_page(page, template: Dict, grade: int) -> Dict[str, List[str]]:
    """
    PyMuPDF page objesinden kazanımları çıkar
    
    Args:
        page: PyMuPDF page objesi (fitz.Page)
        template: YAML template dictionary
        grade: Sınıf seviyesi
        
    Returns:
        {'turkce': ['Kazanım 1', 'Kazanım 2'], 'matematik': [...], ...}
        CSV formatında ders isimleri ile
    """
    achievements_config = template.get('achievements', {})
    
    if not achievements_config.get('enabled', False):
        return {}
    
    # Sayfa metnini al
    text = page.get_text()
    
    # Format'a göre parse et
    format_type = achievements_config.get('format', 'full_text')
    
    if format_type == 'full_text':
        # BenimHocam / Debi Atom formatı
        achievements_dict = parse_full_text_achievements(text, template)
    elif format_type == 'full_text_vertical':
        # Tonguç (TG) formatı - vertical layout
        achievements_dict = parse_tonguc_vertical_achievements(text, template)
    elif format_type == 'codes':
        # HIZ formatı
        achievements_dict = parse_code_achievements(text, template, grade)
    else:
        return {}
    
    # PDF kodlarını CSV formatına çevir
    csv_format = map_subject_codes_to_csv_format(achievements_dict, grade)
    
    return csv_format


# Geriye dönük uyumluluk için eski fonksiyonları bırak
def parse_achievements_from_text(text: str) -> Dict[str, List[str]]:
    """
    Eski API - Geriye dönük uyumluluk için
    
    Args:
        text: PDF sayfa metni
        
    Returns:
        {'TUR': ['Kazanım 1 (50%)', ...], ...}
    """
    # Basit template oluştur
    simple_template = {
        'achievements': {
            'enabled': True,
            'format': 'full_text',
            'section_patterns': ['DERSLERE GÖRE ANALİZ'],
            'subject_headers': [
                "Sözel \\(TÜR\\).*?Türkçe",
                "Sözel \\(TAR\\).*?Tarih",
                "Sözel \\(SOS\\).*?SOSYAL BİLGİLER",
                "Sözel \\(DİN\\).*?Din",
                "Sözel \\(İNG\\).*?İngilizce",
                "Sayısal \\(MAT\\).*?Matematik",
                "Sayısal \\(FEN\\).*?Fen"
            ],
            'parse_method': 'sdyb',
            'incorrect_threshold': 100  # Eski davranış: < 100
        }
    }
    
    return parse_full_text_achievements(text, simple_template)


def map_achievements_to_csv_format(achievements_dict: Dict[str, List[str]]) -> Dict[str, List[str]]:
    """
    Eski API - Geriye dönük uyumluluk için
    
    Args:
        achievements_dict: {'TUR': [...], 'MAT': [...], ...}
        
    Returns:
        {'turkce': [...], 'matematik': [...], ...}
    """
    return map_subject_codes_to_csv_format(achievements_dict, grade=5)


def parse_tonguc_vertical_achievements(text: str, template: Dict) -> Dict[str, List[str]]:
    """
    Tonguç (TG) vertical formatındaki kazanımları parse et
    
    TG Format:
    ```
    Türkçe
    S
    D
    Y
    B%
    [Kazanım metni]
    3
    3
    0
    100
    [Diğer kazanım]
    3
    1
    2
    33
    ```
    
    Args:
        text: PDF sayfa metni
        template: YAML template (tonguc.yaml)
        
    Returns:
        {'TUR': ['kazanım1', ...], 'MAT': [...], ...}
    """
    achievements_config = template.get('achievements', {})
    section_patterns = achievements_config.get('section_patterns', [])
    subject_mapping = achievements_config.get('subject_mapping', {})
    incorrect_threshold = achievements_config.get('incorrect_threshold', 75)
    
    achievements_by_subject = {}
    
    # Her ders bölümünü bul ve parse et
    for section_pattern in section_patterns:
        match = re.search(section_pattern, text, re.IGNORECASE | re.MULTILINE)
        if not match:
            continue
        
        # Ders adını çıkar (örn: "Türkçe", "Matematik")
        # section_pattern regex'inden isim çıkart
        subject_name_match = re.match(r'^([A-ZÇĞİÖŞÜ][^\n\\]+)', section_pattern)
        if not subject_name_match:
            continue
        
        subject_name_raw = subject_name_match.group(1)
        # Regex escape'lerini temizle (\\s* -> '', \\. -> .)
        subject_name = re.sub(r'\\[a-z]\*?', '', subject_name_raw)  # \s*, \n* vb. temizle
        subject_name = subject_name.replace('\\.', '.')  # \. -> .
        subject_name = subject_name.strip()
        
        # Subject code'a map et
        subject_code = subject_mapping.get(subject_name)
        if not subject_code:
            continue
        
        # Bölüm başlangıcı
        section_start = match.end()
        
        # Sonraki ders bölümünü bul (bitiş noktası)
        next_section = None
        for other_pattern in section_patterns:
            if other_pattern == section_pattern:
                continue
            other_match = re.search(other_pattern, text[section_start:], re.IGNORECASE | re.MULTILINE)
            if other_match:
                if next_section is None or other_match.start() < next_section:
                    next_section = other_match.start()
        
        if next_section:
            section_text = text[section_start:section_start + next_section]
        else:
            section_text = text[section_start:]
        
        # Satır satır parse et
        lines = [line.strip() for line in section_text.split('\n') if line.strip()]
        
        subject_achievements = []
        i = 0
        
        while i < len(lines):
            # Kazanım metni topla (sayı olmayanları)
            desc_parts = []
            while i < len(lines) and not is_number(lines[i]):
                # "KAZANIM BELİRTİLMEMİŞ" veya boş satır skip
                if 'KAZANIM' in lines[i].upper() and 'BELİRTİLMEMİŞ' in lines[i].upper():
                    break
                desc_parts.append(lines[i])
                i += 1
            
            desc = ' '.join(desc_parts).strip()
            
            if not desc or 'KAZANIM' in desc.upper():
                # S D Y B% değerlerini skip et (4 sayı)
                skipped = 0
                while i < len(lines) and is_number(lines[i]) and skipped < 4:
                    i += 1
                    skipped += 1
                continue
            
            # S D Y B% değerlerini topla (4 sayı)
            numbers = []
            while i < len(lines) and is_number(lines[i]) and len(numbers) < 4:
                numbers.append(lines[i])
                i += 1
            
            if len(numbers) == 4:
                basari_value = numbers[3].replace(',', '.')
                
                try:
                    basari_pct = float(basari_value)
                    if basari_pct < incorrect_threshold:
                        # Kazanım metnini kısalt (max 250 karakter)
                        desc_short = desc[:250].strip()
                        subject_achievements.append(desc_short)
                except ValueError:
                    pass
        
        if subject_achievements:
            achievements_by_subject[subject_code] = subject_achievements
    
    return achievements_by_subject
