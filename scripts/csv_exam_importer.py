import csv
import json
import os
from datetime import datetime

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
        print(f"✅ Öğrenci verisi yüklendi: {students_path}")
        return students_data['students']
    except FileNotFoundError:
        print(f"❌ Öğrenci dosyası bulunamadı: {students_path}")
        return []
    except Exception as e:
        print(f"❌ Öğrenci dosyası okunamadı: {e}")
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
        print(f"❌ Sınav dosyası bulunamadı: {data_path}")
        return []
    except Exception as e:
        print(f"❌ Sınav dosyası okunamadı: {e}")
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
            print(f"✅ Yedek oluşturuldu: {backup_path}")
        except Exception as e:
            print(f"⚠️ Yedek oluşturulamadı: {e}")
    
    data_to_save = {
        "value": exams,
        "Count": len(exams),
        "lastUpdated": datetime.now().isoformat()
    }
    
    try:
        with open(data_path, 'w', encoding='utf-8') as f:
            json.dump(data_to_save, f, ensure_ascii=False, indent=2)
        print(f"✅ Sınav verisi kaydedildi: {data_path}")
    except Exception as e:
        print(f"❌ Sınav verisi kaydedilemedi: {e}")
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

def calculate_similarity(str1, str2):
    """İki string arasındaki benzerlik oranı"""
    if len(str1) == 0 and len(str2) == 0:
        return 1.0
    
    longer = str1 if len(str1) > len(str2) else str2
    shorter = str2 if len(str1) > len(str2) else str1
    
    if len(longer) == 0:
        return 1.0
    
    distance = levenshtein_distance(longer, shorter)
    return (len(longer) - distance) / len(longer)

def normalize_turkish_text(text):
    """Türkçe karakterleri normalize eder"""
    if not text:
        return ''
    
    return text.strip().replace('İ', 'i').replace('I', 'ı').replace('Ğ', 'ğ').replace('Ü', 'ü').replace('Ş', 'ş').replace('Ö', 'ö').replace('Ç', 'ç').lower()

def normalize_name_parts(name):
    """İsmi parçalara ayırır ve normalize eder"""
    if not name:
        return []
    
    return [normalize_turkish_text(part.strip()) for part in name.strip().split() if part.strip()]

def calculate_lgs_score(exam_data):
    """LGS puanını hesapla (MEB resmi formülü)"""
    # LGS 2024-2025 ağırlıklandırma katsayıları (MEB resmi)
    weights = {
        'turkce': 4,      # Türkçe
        'matematik': 4,   # Matematik  
        'fen': 4,         # Fen Bilimleri
        'inkilap': 1,     # T.C. İnkılap Tarihi ve Atatürkçülük
        'din': 1,         # Din Kültürü ve Ahlak Bilgisi
        'ingilizce': 1,   # Yabancı Dil (İngilizce)
    }
    
    # Soru sayıları (8. sınıf)
    question_counts = {
        'turkce': 20,
        'matematik': 20,
        'fen': 20,
        'inkilap': 10,
        'din': 10,
        'ingilizce': 10,
    }
    
    total_weighted_score = 0
    total_max_weighted_score = 0
    
    for subject_key, course in exam_data['courses'].items():
        if subject_key in weights:
            # Net puan hesapla (4 yanlış = 1 doğru götürür)
            net = course['correct'] - (course['incorrect'] / 4)
            net = max(0, net)  # Negatif olamaz
            
            subject_weight = weights[subject_key]
            subject_max_questions = question_counts[subject_key]
            
            total_weighted_score += net * subject_weight
            total_max_weighted_score += subject_max_questions * subject_weight
    
    # LGS puanı hesaplama (100-500 arası)
    # MEB'in kullandığı formül: 100 + (TASP / MaxTASP) * 400
    lgs_score = 100 + (total_weighted_score / total_max_weighted_score) * 400
    
    # Puan aralığını sınırla
    return max(100, min(500, lgs_score))

def find_student_advanced(csv_student_name, students):
    """Gelişmiş öğrenci eşleştirme fonksiyonu - 5 seviye eşleştirme stratejisi"""
    if not csv_student_name or not students:
        return None
    
    csv_name = csv_student_name.strip()
    csv_name_normalized = normalize_turkish_text(csv_name)
    csv_name_parts = normalize_name_parts(csv_name)
    
    print(f"🔍 Eşleştirme: '{csv_name}'")
    print(f"  📊 Normalize edilmiş: '{csv_name_normalized}'")
    print(f"  📊 Parçalar: {csv_name_parts}")
    
    # SEVİYE 1: Tam Eşleşme (Türkçe karakter desteği ile)
    print(f"  📊 Seviye 1 (Tam): Kontrol ediliyor...")
    for student in students:
        if normalize_turkish_text(student['name'].strip()) == csv_name_normalized:
            print(f"  ✅ Seviye 1 (Tam): Bulundu - {student['name']}")
            return {'student': student, 'method': 'Tam eşleşme', 'confidence': 1.0}
    print(f"  ❌ Seviye 1 (Tam): Bulunamadı")
    
    # SEVİYE 2: Ad + Soyad Eşleşmesi (sıra bağımsız, çoklu isim desteği)
    if len(csv_name_parts) >= 2:
        print(f"  📊 Seviye 2 (Ad+Soyad): Kontrol ediliyor...")
        for student in students:
            s_name_parts = normalize_name_parts(student['name'])
            if len(s_name_parts) >= 2:
                # İlk ve son isimleri al (orta isimleri atla)
                csv_first = csv_name_parts[0]
                csv_last = csv_name_parts[-1]
                s_first = s_name_parts[0]
                s_last = s_name_parts[-1]
                
                # Normal sıra: Ahmet Yılmaz
                normal_order = s_first == csv_first and s_last == csv_last
                
                # Ters sıra: Yılmaz Ahmet
                reverse_order = s_first == csv_last and s_last == csv_first
                
                if normal_order or reverse_order:
                    print(f"  ✅ Seviye 2 (Ad+Soyad): Bulundu - {student['name']}")
                    return {'student': student, 'method': 'Ad + Soyad eşleşmesi', 'confidence': 0.95}
        print(f"  ❌ Seviye 2 (Ad+Soyad): Bulunamadı")
    else:
        print(f"  📊 Seviye 2 (Ad+Soyad): Yeterli parça yok")
    
    # SEVİYE 3: Sadece Ad Eşleşmesi
    if len(csv_name_parts) >= 1:
        print(f"  📊 Seviye 3 (Sadece Ad): Kontrol ediliyor...")
        matches = []
        for student in students:
            s_name_parts = normalize_name_parts(student['name'])
            if len(s_name_parts) >= 1 and s_name_parts[0] == csv_name_parts[0]:
                matches.append(student)
        
        if len(matches) == 1:
            print(f"  ✅ Seviye 3 (Sadece Ad): Bulundu - {matches[0]['name']}")
            return {'student': matches[0], 'method': 'Sadece ad eşleşmesi', 'confidence': 0.7}
        elif len(matches) > 1:
            print(f"  ⚠️ Seviye 3 (Sadece Ad): {len(matches)} aday bulundu")
            return {'student': matches[0], 'method': 'Sadece ad eşleşmesi (çoklu)', 'confidence': 0.6}
        print(f"  ❌ Seviye 3 (Sadece Ad): Bulunamadı")
    else:
        print(f"  📊 Seviye 3 (Sadece Ad): Parça yok")
    
    # SEVİYE 4: Benzerlik Algoritması
    print(f"  📊 Seviye 4 (Benzerlik): Kontrol ediliyor...")
    best_match = None
    best_score = 0
    
    for student in students:
        similarity = calculate_similarity(csv_name_normalized, normalize_turkish_text(student['name']))
        if similarity > best_score and similarity > 0.8:
            best_match = student
            best_score = similarity
    
    if best_match:
        print(f"  ✅ Seviye 4 (Benzerlik): Bulundu - {best_match['name']} ({best_score*100:.1f}%)")
        return {'student': best_match, 'method': f'Benzerlik eşleşmesi ({best_score*100:.1f}%)', 'confidence': best_score}
    
    print(f"  ❌ Seviye 4 (Benzerlik): Bulunamadı")
    print(f"  ❌ Hiçbir seviyede eşleşme bulunamadı")
    return None

def find_student_by_name(name, students):
    """İsimle öğrenci bul - eski yöntem (geriye uyumluluk için)"""
    result = find_student_advanced(name, students)
    return result['student'] if result else None

def validate_csv_structure(csv_filename):
    """CSV dosyasının yapısını kontrol et"""
    required_columns = [
        'Öğrenci Adı', 'Sınav Adı', 'Sınav Tarihi', 'LGS_Puanı',
        'Türkçe_Doğru', 'Türkçe_Yanlış', 'Türkçe_Boş',
        'Matematik_Doğru', 'Matematik_Yanlış', 'Matematik_Boş',
        'Fen_Doğru', 'Fen_Yanlış', 'Fen_Boş',
        'Sosyal_Doğru', 'Sosyal_Yanlış', 'Sosyal_Boş',
        'İngilizce_Doğru', 'İngilizce_Yanlış', 'İngilizce_Boş',
        'Din_Doğru', 'Din_Yanlış', 'Din_Boş'
    ]
    
    try:
        with open(csv_filename, 'r', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            csv_columns = reader.fieldnames
            
            missing_columns = [col for col in required_columns if col not in csv_columns]
            if missing_columns:
                print(f"❌ CSV dosyasında eksik sütunlar: {missing_columns}")
                return False
            
            print(f"✅ CSV dosyası yapısı doğrulandı")
            return True
            
    except Exception as e:
        print(f"❌ CSV dosyası okunamadı: {e}")
        return False

def import_csv_exams(csv_filename):
    """CSV dosyasından sınavları içe aktar - Güncellenmiş versiyon"""
    print(f"📤 CSV dosyası içe aktarılıyor: {csv_filename}")
    print(f"🕐 Başlangıç zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if not os.path.exists(csv_filename):
        print(f"❌ CSV dosyası bulunamadı: {csv_filename}")
        return
    
    # CSV yapısını kontrol et
    if not validate_csv_structure(csv_filename):
        return
    
    # Öğrencileri yükle
    students = load_students()
    print(f"👥 {len(students)} öğrenci yüklendi")
    
    if len(students) == 0:
        print("❌ Öğrenci verisi bulunamadı! CSV import iptal edildi.")
        return
    
    # Mevcut sınavları yükle
    existing_exams = load_existing_exams()
    print(f"📊 {len(existing_exams)} mevcut sınav bulundu")
    
    # CSV'yi oku
    imported_count = 0
    error_count = 0
    unmatched_students = []
    
    with open(csv_filename, 'r', encoding='utf-8-sig') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row_num, row in enumerate(reader, start=2):  # Satır numarası (header dahil)
            try:
                # Gelişmiş öğrenci eşleştirme sistemi
                student_name = row['Öğrenci Adı'].strip()
                if not student_name:
                    print(f"⚠️ Satır {row_num}: Boş öğrenci adı, atlanıyor")
                    continue
                
                match_result = find_student_advanced(student_name, students)
                
                if not match_result:
                    print(f"❌ Satır {row_num}: Öğrenci bulunamadı: {student_name}")
                    unmatched_students.append(student_name)
                    error_count += 1
                    continue
                
                student = match_result['student']
                confidence = match_result['confidence']
                method = match_result['method']
                
                # Eşleştirme bilgisini logla
                if confidence >= 0.9:
                    print(f"✅ Satır {row_num}: {student_name} → {student['name']} ({method}, {confidence*100:.1f}%)")
                elif confidence >= 0.7:
                    print(f"⚠️ Satır {row_num}: {student_name} → {student['name']} ({method}, {confidence*100:.1f}% - Dikkat!)")
                else:
                    print(f"⚠️ Satır {row_num}: {student_name} → {student['name']} ({method}, {confidence*100:.1f}% - Belirsiz eşleşme!)")
                
                # Sınav verisi oluştur
                exam_id = int(datetime.now().timestamp() * 1000) + row_num  # Unique ID
                
                exam_data = {
                    "id": exam_id,
                    "profile": student['name'],  # Profile name kullan
                    "name": row['Sınav Adı'],
                    "date": row['Sınav Tarihi'],
                    "courses": {
                        "turkce": {
                            "correct": int(row['Türkçe_Doğru']) if row['Türkçe_Doğru'] else 0,
                            "incorrect": int(row['Türkçe_Yanlış']) if row['Türkçe_Yanlış'] else 0,
                            "blank": int(row['Türkçe_Boş']) if row['Türkçe_Boş'] else 0,
                            "incorrectOutcomes": row['Türkçe_Yanlış_Kazanımlar'].split(' | ') if row['Türkçe_Yanlış_Kazanımlar'] else []
                        },
                        "matematik": {
                            "correct": int(row['Matematik_Doğru']) if row['Matematik_Doğru'] else 0,
                            "incorrect": int(row['Matematik_Yanlış']) if row['Matematik_Yanlış'] else 0,
                            "blank": int(row['Matematik_Boş']) if row['Matematik_Boş'] else 0,
                            "incorrectOutcomes": row['Matematik_Yanlış_Kazanımlar'].split(' | ') if row['Matematik_Yanlış_Kazanımlar'] else []
                        },
                        "fen": {
                            "correct": int(row['Fen_Doğru']) if row['Fen_Doğru'] else 0,
                            "incorrect": int(row['Fen_Yanlış']) if row['Fen_Yanlış'] else 0,
                            "blank": int(row['Fen_Boş']) if row['Fen_Boş'] else 0,
                            "incorrectOutcomes": row['Fen_Yanlış_Kazanımlar'].split(' | ') if row['Fen_Yanlış_Kazanımlar'] else []
                        },
                        "inkilap": {
                            "correct": int(row['Sosyal_Doğru']) if row['Sosyal_Doğru'] else 0,
                            "incorrect": int(row['Sosyal_Yanlış']) if row['Sosyal_Yanlış'] else 0,
                            "blank": int(row['Sosyal_Boş']) if row['Sosyal_Boş'] else 0,
                            "incorrectOutcomes": row['Sosyal_Yanlış_Kazanımlar'].split(' | ') if row['Sosyal_Yanlış_Kazanımlar'] else []
                        },
                        "ingilizce": {
                            "correct": int(row['İngilizce_Doğru']) if row['İngilizce_Doğru'] else 0,
                            "incorrect": int(row['İngilizce_Yanlış']) if row['İngilizce_Yanlış'] else 0,
                            "blank": int(row['İngilizce_Boş']) if row['İngilizce_Boş'] else 0,
                            "incorrectOutcomes": row['İngilizce_Yanlış_Kazanımlar'].split(' | ') if row['İngilizce_Yanlış_Kazanımlar'] else []
                        },
                        "din": {
                            "correct": int(row['Din_Doğru']) if row['Din_Doğru'] else 0,
                            "incorrect": int(row['Din_Yanlış']) if row['Din_Yanlış'] else 0,
                            "blank": int(row['Din_Boş']) if row['Din_Boş'] else 0,
                            "incorrectOutcomes": row['Din_Yanlış_Kazanımlar'].split(' | ') if row['Din_Yanlış_Kazanımlar'] else []
                        }
                    }
                }
                
                # LGS Puanını ekle (CSV'den oku, yoksa hesapla)
                lgs_score = 0
                if 'LGS_Puanı' in row and row['LGS_Puanı']:
                    try:
                        lgs_score = float(row['LGS_Puanı'])
                    except (ValueError, TypeError):
                        lgs_score = 0
                
                # Eğer CSV'de LGS puanı yoksa veya 0 ise hesapla
                if lgs_score == 0:
                    lgs_score = calculate_lgs_score(exam_data)
                
                exam_data['lgsScore'] = lgs_score
                
                existing_exams.append(exam_data)
                imported_count += 1
                print(f"✅ Satır {row_num}: {student_name} sınavı eklendi (LGS: {lgs_score:.2f})")
                
            except Exception as e:
                print(f"❌ Satır {row_num}: İşlenirken hata: {e}")
                error_count += 1
    
    # Sınavları kaydet
    if imported_count > 0:
        save_exams(existing_exams)
    
    # Sonuç raporu
    print(f"\n🎉 CSV İçe Aktarım Tamamlandı!")
    print(f"🕐 Bitiş zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"✅ Başarıyla eklenen: {imported_count} sınav")
    print(f"❌ Hata olan: {error_count} satır")
    print(f"📊 Toplam sınav sayısı: {len(existing_exams)}")
    
    # Detaylı eşleştirme raporu
    if imported_count > 0:
        print(f"\n📋 Eşleştirme Detayları:")
        print(f"🔍 Toplam işlenen satır: {imported_count + error_count}")
        print(f"✅ Başarılı eşleştirme: {imported_count}")
        print(f"⚠️ Manuel müdahale gerekli: {error_count}")
        print(f"📈 Otomatik eşleştirme oranı: {((imported_count / (imported_count + error_count)) * 100):.1f}%")
    
    # Eşleşmeyen öğrencileri raporla
    if unmatched_students:
        print(f"\n⚠️ Eşleşmeyen öğrenciler ({len(unmatched_students)} adet):")
        for student in unmatched_students:
            print(f"  - {student}")
    
    # Örnek veriler göster
    if imported_count > 0:
        print(f"\n📋 Örnek sınav verisi:")
        sample_exam = existing_exams[-1]  # Son eklenen
        print(f"  👤 Öğrenci: {sample_exam['profile']}")
        print(f"  📝 Sınav: {sample_exam['name']}")
        print(f"  📅 Tarih: {sample_exam['date']}")
        print(f"  📊 Matematik: {sample_exam['courses']['matematik']['correct']} doğru, {sample_exam['courses']['matematik']['incorrect']} yanlış")
        print(f"  🎯 LGS Puanı: {sample_exam['lgsScore']:.2f}")

if __name__ == "__main__":
    # Test için - 6 ata dosyasını dene
    csv_file = "deneme analizi dosyaları/Csv çıktı dosyaları/6 ata.xlsx.csv"
    import_csv_exams(csv_file)
