#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Exam Importer - PDF'den sınav verilerini çıkarıp içe aktar
"""

import sys
import os
import json
from datetime import datetime

# Core modüllerin yolunu ekle
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'deneme analizi dosyaları'))

from core_api import PDFExtractionAPI
from error_handler import get_user_friendly_message, log_error_details
from modules.achievement_parser import parse_achievements_from_text, map_achievements_to_csv_format
from modules.kazanim_updater import add_multiple_kazanimlar


def get_app_data_path():
    """AppData yolunu dinamik olarak belirle"""
    return os.path.expanduser("~\\AppData\\Roaming\\kapsul-kocluk-programi")


def load_students():
    """Öğrenci listesini yükle - Shared klasöründen"""
    appdata_path = get_app_data_path()
    students_path = os.path.join(appdata_path, "shared", "students.json")
    
    try:
        with open(students_path, 'r', encoding='utf-8') as f:
            students_data = json.load(f)
        print(f"[OK] Öğrenci verisi yüklendi: {students_path}")
        return students_data['students']
    except FileNotFoundError:
        print(f"[HATA] Öğrenci dosyası bulunamadı: {students_path}")
        return []
    except Exception as e:
        print(f"[HATA] Öğrenci dosyası okunamadı: {e}")
        return []


def load_existing_exams():
    """Mevcut sınavları yükle - Shared klasöründen"""
    appdata_path = get_app_data_path()
    data_path = os.path.join(appdata_path, "shared", "data.json")
    
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if isinstance(data, dict) and 'value' in data:
            return data['value']
        elif isinstance(data, list):
            return data
        else:
            return []
    except FileNotFoundError:
        print(f"[HATA] Sınav dosyası bulunamadı: {data_path}")
        return []
    except Exception as e:
        print(f"[HATA] Sınav dosyası okunamadı: {e}")
        return []


def save_exams(exams):
    """Sınavları kaydet - Shared klasörüne"""
    appdata_path = get_app_data_path()
    data_path = os.path.join(appdata_path, "shared", "data.json")
    
    # Yedek oluştur
    backup_path = data_path + ".bak"
    if os.path.exists(data_path):
        try:
            with open(data_path, 'r', encoding='utf-8') as src:
                with open(backup_path, 'w', encoding='utf-8') as dst:
                    dst.write(src.read())
            print(f"[OK] Yedek oluşturuldu: {backup_path}")
        except Exception as e:
            print(f"[UYARI] Yedek oluşturulamadı: {e}")
    
    data_to_save = {
        "value": exams,
        "Count": len(exams),
        "lastUpdated": datetime.now().isoformat()
    }
    
    try:
        with open(data_path, 'w', encoding='utf-8') as f:
            json.dump(data_to_save, f, ensure_ascii=False, indent=2)
        print(f"[OK] Sınav verisi kaydedildi: {data_path}")
    except Exception as e:
        print(f"[HATA] Sınav verisi kaydedilemedi: {e}")
        raise


def levenshtein_distance(str1, str2):
    """Levenshtein Distance algoritması"""
    matrix = [[0] * (len(str2) + 1) for _ in range(len(str1) + 1)]
    
    for i in range(len(str1) + 1):
        matrix[i][0] = i
    for j in range(len(str2) + 1):
        matrix[0][j] = j
    
    for i in range(1, len(str1) + 1):
        for j in range(1, len(str2) + 1):
            if str1[i-1] == str2[j-1]:
                matrix[i][j] = matrix[i-1][j-1]
            else:
                matrix[i][j] = min(
                    matrix[i-1][j] + 1,
                    matrix[i][j-1] + 1,
                    matrix[i-1][j-1] + 1
                )
    
    return matrix[len(str1)][len(str2)]


def find_student_by_name(student_name, students):
    """
    İsme göre öğrenci bul - Fuzzy matching ile
    
    Returns:
        (student_obj, confidence_score)
    """
    if not student_name or not students:
        return None, 0.0
    
    # İsmi normalize et
    search_name = student_name.upper().strip()
    
    best_match = None
    best_score = 0.0
    
    for student in students:
        # İsim alanlarını dene: önce 'name', yoksa 'firstName + lastName'
        student_full_name = student.get('name', '')
        if not student_full_name:
            student_full_name = f"{student.get('firstName', '')} {student.get('lastName', '')}".strip()
        
        student_full_name = student_full_name.upper().strip()
        
        if not student_full_name:
            continue
        
        # Tam eşleşme
        if search_name == student_full_name:
            return student, 1.0
        
        # Fuzzy matching
        distance = levenshtein_distance(search_name, student_full_name)
        max_len = max(len(search_name), len(student_full_name))
        
        if max_len == 0:
            continue
        
        similarity = 1.0 - (distance / max_len)
        
        if similarity > best_score:
            best_score = similarity
            best_match = student
    
    # En az %70 benzerlik iste
    if best_score >= 0.7:
        return best_match, best_score
    
    return None, 0.0


def convert_pdf_record_to_exam_format(pdf_record, student, exam_name, exam_date, page_text=''):
    """PDF kaydını CSV ile uyumlu sınav formatına dönüştür"""
    from datetime import datetime
    
    # Unique ID oluştur
    exam_id = int(datetime.now().timestamp() * 1000) + hash(student['name'] + exam_name) % 1000
    
    # CSV formatına uyumlu yapı
    exam_entry = {
        "id": exam_id,
        "profile": student['name'],  # Öğrenci profil adı
        "name": exam_name,
        "date": exam_date,
        "courses": {}
    }
    
    # Kazanımları al (önce _achievements, yoksa _page_text'ten parse et - fallback)
    achievements = pdf_record.get('_achievements', {})
    
    # Fallback: eski yöntem (eğer _achievements yoksa)
    if not achievements and page_text:
        achievements_dict = parse_achievements_from_text(page_text)
        achievements = map_achievements_to_csv_format(achievements_dict)
    
    # Ders mapping (PDF key -> CSV key)
    subject_mapping = {
        'turk': 'turkce',
        'mat': 'matematik', 
        'fen': 'fen',
        'sosyal': 'inkilap' if pdf_record.get('sinif', '').startswith('8') else 'sosyal',
        'din': 'din',
        'ing': 'ingilizce'
    }
    
    # Her ders için veri ekle
    for pdf_key, csv_key in subject_mapping.items():
        dogru = pdf_record.get(f'{pdf_key}_dogru')
        yanlis = pdf_record.get(f'{pdf_key}_yanlis')
        
        if dogru is not None:  # Ders varsa
            # Boş hesapla (Net formülünden: Net = Doğru - (Yanlış/4))
            # Toplam soru = Doğru + Yanlış + Boş
            # Net verisi varsa boşu hesaplayabiliriz
            net = float(pdf_record.get(f'{pdf_key}_net', 0) or 0)
            dogru_int = int(dogru) if dogru else 0
            yanlis_int = int(yanlis) if yanlis else 0
            
            # Boş tahmini (tam kesin değil ama makul)
            # Türkçe/Mat/Fen = 20 soru, diğerleri = 10 soru
            total_questions = 20 if csv_key in ['turkce', 'matematik', 'fen'] else 10
            bos = total_questions - dogru_int - yanlis_int
            if bos < 0:
                bos = 0
            
            # Kazanımları ekle (yalnızca yanlış yapılanlar)
            incorrect_outcomes = achievements.get(csv_key, [])
            
            exam_entry["courses"][csv_key] = {
                "correct": dogru_int,
                "incorrect": yanlis_int,
                "blank": bos,
                "net": net,
                "incorrectOutcomes": incorrect_outcomes
            }
    
    # Metadata (opsiyonel - CSV'de yok ama yararlı)
    exam_entry["_pdfMetadata"] = {
        "lgs_puan": pdf_record.get('lgs_puan', ''),
        "sinif_derece": pdf_record.get('sinif_derecesi', ''),
        "kurum_derece": pdf_record.get('kurum_derecesi', ''),
        "confidence": pdf_record.get('_confidence', 0),
        "extractor": pdf_record.get('_extractor', 'unknown')
    }
    
    return exam_entry


def import_pdf_exams(pdf_path, exam_name=None, exam_date=None, options=None):
    """
    PDF'den sınavları içe aktar
    
    Args:
        pdf_path: PDF dosya yolu
        exam_name: Sınav adı (None ise PDF formatından çıkarılır)
        exam_date: Sınav tarihi (None ise bugün)
        options: Ek seçenekler
        
    Returns:
        {
            'success': bool,
            'imported_count': int,
            'unmatched_count': int,
            'suspicious_count': int,
            'error': str (if failed)
        }
    """
    print(f"[OK] PDF dosyasi ice aktariliyor: {pdf_path}")
    print(f"[OK] Baslangic zamani: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if not os.path.exists(pdf_path):
        return {'success': False, 'error': f"PDF dosyasi bulunamadi: {pdf_path}"}
    
    options = options or {}
    manual_mappings = options.get('manual_mappings', {})
    
    # Varsayılan değerler
    if not exam_date:
        exam_date = datetime.now().strftime('%Y-%m-%d')
    
    if not exam_name:
        # PDF adından sınav adı türet
        exam_name = os.path.splitext(os.path.basename(pdf_path))[0]
    
    try:
        # 1. Öğrencileri yükle
        students = load_students()
        print(f"[OK] {len(students)} ogrenci yuklendi")
        
        if len(students) == 0:
            return {'success': False, 'error': 'Ogrenci verisi bulunamadi!'}
        
        # 2. PDF'i çıkart
        api = PDFExtractionAPI()
        
        print(f"[OK] PDF format tespiti yapiliyor...")
        format_result = api.detect_format(pdf_path)
        
        format_detected = format_result['success']
        if format_detected:
            print(f"[OK] Format: {format_result['name']} (Guven: {format_result['confidence']:.0%})")
        else:
            print(f"[UYARI] Format taninamadi, varsayilan cikarim deneniyor...")
        
        print(f"[OK] Kayitlar cikarti iliyor...")
        extraction_result = api.extract_records(pdf_path, options)
        
        if not extraction_result['success']:
            return {
                'success': False, 
                'error': extraction_result.get('error', 'Bilinmeyen hata'),
                'show_wizard': not format_detected  # Format tanınmadıysa sihirbaz öner
            }
        
        valid_records = extraction_result['valid_records']
        suspicious_records = extraction_result['suspicious_records']
        
        print(f"[OK] {len(valid_records)} gecerli kayit cikarildi")
        print(f"[UYARI] {len(suspicious_records)} supheli kayit")
        
        # Eğer hiç geçerli kayıt yoksa ve format güven düşükse sihirbaz öner
        if len(valid_records) == 0 and format_result.get('confidence', 0) < 0.6:
            print(f"[UYARI] Gecerli kayit yok ve format guveni dusuk. Sablon sihi rbazi onerilir.")
            return {
                'success': False,
                'error': 'Gecerli kayit cikarilmadi. PDF formati taninamadi veya uygun degil.',
                'show_wizard': True,
                'suspicious_count': len(suspicious_records)
            }
        
        # 3. Öğrenci eşleştirme
        matched_records = []
        unmatched_records = []
        
        for record in valid_records:
            student_name = record.get('ad_soyad', '').strip()
            
            # Manuel mapping varsa önce onu kontrol et
            if student_name in manual_mappings:
                target_student_name = manual_mappings[student_name]
                # Manuel eşleştirmeyi bul
                matched_student = next((s for s in students if s.get('name', '') == target_student_name), None)
                
                if matched_student:
                    print(f"[OK] Manuel eslestirme: {student_name} -> {target_student_name}")
                    matched_records.append({
                        'record': record,
                        'student': matched_student,
                        'match_confidence': 1.0  # Manuel eşleştirme = %100
                    })
                    continue
            
            # Otomatik eşleştirme
            student, confidence = find_student_by_name(student_name, students)
            
            if student:
                print(f"[OK] Eslesti: {student_name} -> {student.get('name', '')} ({confidence:.0%})")
                matched_records.append({
                    'record': record,
                    'student': student,
                    'match_confidence': confidence
                })
            else:
                print(f"[UYARI] Eslesme bulunamadi: {student_name}")
                unmatched_records.append(record)
        
        # 4. Mevcut sınavları yükle
        existing_exams = load_existing_exams()
        print(f"[OK] {len(existing_exams)} mevcut sinav bulundu")
        
        # 5. Yeni sınavları ekle
        imported_count = 0
        
        for matched in matched_records:
            # Kazanım çıkarımı için sayfa metnini al
            page_text = matched['record'].get('_page_text', '')
            
            exam_entry = convert_pdf_record_to_exam_format(
                matched['record'],
                matched['student'],
                exam_name,
                exam_date,
                page_text
            )
            
            # Aynı öğrenci + aynı sınav adı + aynı tarih kontrolü (HER ZAMAN)
            found = False
            for i, existing in enumerate(existing_exams):
                if (existing.get('profile') == exam_entry['profile'] and 
                    existing.get('name') == exam_entry['name'] and
                    existing.get('date') == exam_entry['date']):
                    # Duplicate bulundu
                    if options.get('overwrite'):
                        # Overwrite aktifse güncelle
                        existing_exams[i] = exam_entry
                        print(f"[OK] Guncellendi: {matched['record']['ad_soyad']}")
                        found = True
                    else:
                        # Overwrite değilse skip et
                        print(f"[ATLANDI] Zaten var: {matched['record']['ad_soyad']} - {exam_entry['name']}")
                        found = True
                    break
            
            if not found:
                # Yeni kayıt, ekle
                existing_exams.append(exam_entry)
                print(f"[OK] Eklendi: {matched['record']['ad_soyad']}")
            
            if not found or options.get('overwrite'):
                imported_count += 1
        
        # 6. Yeni kazanımları topla ve ekle (Türkçe ve İngilizce için)
        new_kazanimlar_to_add = []
        
        for matched in matched_records:
            # Her sınav kaydının kazanımlarını kontrol et
            achievements = matched['record'].get('_achievements', {})
            sinif = matched['record'].get('sinif', '5')
            
            # Sınıf numarasını çıkar (örn: "5A" -> 5)
            try:
                grade = int(''.join(filter(str.isdigit, sinif)))
            except:
                grade = 5
            
            # Sadece Türkçe ve İngilizce kazanımlarını ekle
            for csv_key, kazanim_list in achievements.items():
                # CSV key'i ders adına çevir
                subject_map = {
                    'turkce': 'Türkçe',
                    'ingilizce': 'İngilizce'
                }
                
                subject_name = subject_map.get(csv_key)
                
                if subject_name and kazanim_list:
                    for kazanim_text in kazanim_list:
                        # Boş veya çok kısa kazanımları atlayın
                        if kazanim_text and len(kazanim_text.strip()) > 10:
                            new_kazanimlar_to_add.append({
                                'subject': subject_name,
                                'grade': grade,
                                'kazanim': kazanim_text.strip()
                            })
        
        # Yeni kazanımları Kazanımlar.json'a ekle
        if new_kazanimlar_to_add:
            print(f"\n[BİLGİ] {len(new_kazanimlar_to_add)} yeni kazanım bulundu, Kazanımlar.json'a ekleniyor...")
            try:
                stats = add_multiple_kazanimlar(new_kazanimlar_to_add)
                print(f"[OK] Kazanım ekleme: {stats['added']} eklendi, {stats['skipped']} zaten var, {stats['errors']} hata")
            except Exception as e:
                print(f"[UYARI] Kazanım ekleme başarısız: {e}")
        
        # 7. Sınavları kaydet
        save_exams(existing_exams)
        
        # 8. Özet
        print("=" * 80)
        print("ISLEM OZETI")
        print("-" * 80)
        print(f"Toplam Cikarilan: {len(valid_records)}")
        print(f"Eslesen: {len(matched_records)}")
        print(f"Eslesmeyen: {len(unmatched_records)}")
        print(f"Supheli: {len(suspicious_records)}")
        print(f"Import Edilen: {imported_count}")
        if new_kazanimlar_to_add:
            print(f"Yeni Kazanimlar: {stats['added']} eklendi, {stats['skipped']} atlandı")
        print("=" * 80)
        
        return {
            'success': True,
            'imported_count': imported_count,
            'unmatched_count': len(unmatched_records),
            'suspicious_count': len(suspicious_records),
            'unmatched_names': [r.get('ad_soyad', '') for r in unmatched_records],
            'unmatched_records': [{'name': r.get('ad_soyad', ''), 'sinif': r.get('sinif', ''), 'numara': r.get('numara', '')} for r in unmatched_records],
            'format_name': extraction_result.get('format_name', 'Bilinmeyen')
        }
        
    except Exception as e:
        log_error_details(e, 'pdf_import_error.log')
        error_info = get_user_friendly_message(e)
        print(f"[HATA] {error_info['title']}: {error_info['message']}")
        return {
            'success': False,
            'error': error_info['message'],
            'technical': error_info.get('technical', str(e))
        }


if __name__ == '__main__':
    # Test
    import sys
    import json
    
    if len(sys.argv) < 2:
        print("Kullanim: python pdf_exam_importer.py <pdf_path> [exam_name] [exam_date] [--overwrite] [--manual-mappings JSON]")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    exam_name = sys.argv[2] if len(sys.argv) > 2 else None
    exam_date = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Overwrite flag
    overwrite = '--overwrite' in sys.argv
    
    # Manuel mappings
    manual_mappings = {}
    if '--manual-mappings' in sys.argv:
        idx = sys.argv.index('--manual-mappings')
        if idx + 1 < len(sys.argv):
            try:
                manual_mappings = json.loads(sys.argv[idx + 1])
            except json.JSONDecodeError as e:
                print(f"[UYARI] Manuel mappings parse edilemedi: {e}")
    
    result = import_pdf_exams(
        pdf_path, 
        exam_name, 
        exam_date, 
        options={
            'overwrite': overwrite,
            'manual_mappings': manual_mappings
        }
    )
    
    if result['success']:
        print(f"\n[OK] Import basarili! {result['imported_count']} kayit eklendi.")
    else:
        print(f"\n[HATA] Import basarisiz: {result.get('error')}")
        sys.exit(1)

