import json
import csv
import random
from datetime import datetime, timedelta

def load_students():
    """Öğrenci listesini yükle"""
    students_path = r"C:\Users\Program Geliştirme\AppData\Roaming\kapsul-kocluk-programi\students.json"
    
    with open(students_path, 'r', encoding='utf-8') as f:
        students_data = json.load(f)
    
    return students_data['students']

def load_kazanimlar():
    """Kazanımları yükle"""
    with open('Kazanımlar.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def get_random_outcomes(subject_key, grade, kazanimlar, count=3):
    """Rastgele kazanım seç"""
    try:
        if subject_key in kazanimlar and str(grade) in kazanimlar[subject_key]:
            outcomes = kazanimlar[subject_key][str(grade)]
            if isinstance(outcomes, list) and len(outcomes) > 0:
                # En fazla mevcut kazanım sayısı kadar seç
                actual_count = min(count, len(outcomes))
                selected = random.sample(outcomes, actual_count)
                
                # Kazanım kodlarını çıkar
                outcome_codes = []
                for outcome in selected:
                    if isinstance(outcome, dict):
                        if 'kazanim' in outcome:
                            outcome_codes.append(outcome['kazanim'])
                        elif 'ogrenme_cikti' in outcome:
                            outcome_codes.append(outcome['ogrenme_cikti'])
                    elif isinstance(outcome, str):
                        outcome_codes.append(outcome)
                
                return outcome_codes[:count]  # İstenen sayı kadar döndür
    except:
        pass
    
    # Eğer kazanım bulunamazsa sadece gerçek kazanımları olan dersler için fallback kodlar
    fallback_outcomes = {
        # 'Türkçe': [],  # Türkçe kazanımları henüz eklenmedi - sahte kod üretme
        'Matematik': [f'M.{grade}.{i}.{j}' for i in range(1,5) for j in range(1,4)], 
        'Fen Bilimleri': [f'F.{grade}.{i}.{j}' for i in range(1,5) for j in range(1,4)],
        'Sosyal Bilgiler': [f'SB.{grade}.{i}.{j}' for i in range(1,5) for j in range(1,4)],
        # 'İngilizce': [],  # İngilizce kazanımları henüz eklenmedi - sahte kod üretme
        'Din Kültürü ve Ahlak Bilgisi': [f'DK.{grade}.{i}.{j}' for i in range(1,3) for j in range(1,3)]
    }
    
    if subject_key in fallback_outcomes and len(fallback_outcomes[subject_key]) > 0:
        return random.sample(fallback_outcomes[subject_key], min(count, len(fallback_outcomes[subject_key])))
    
    # Kazanımı olmayan dersler için boş liste döndür (sahte kod üretme)
    return []

def create_deneme2_csv():
    """Deneme2 CSV dosyası oluştur - daha iyi performans, daha az hata"""
    print("📊 Deneme2 CSV dosyası oluşturuluyor...")
    
    # Öğrencileri yükle
    students = load_students()
    print(f"👥 {len(students)} öğrenci yüklendi")
    
    # Kazanımları yükle
    try:
        kazanimlar = load_kazanimlar()
        print("📚 Kazanımlar yüklendi")
    except:
        print("⚠️ Kazanımlar yüklenemedi, genel kodlar kullanılacak")
        kazanimlar = {}
    
    # CSV verisi oluştur
    csv_data = []
    
    # Header
    header = [
        'Öğrenci Adı', 'Sınıf', 'Sınav Adı', 'Sınav Tarihi',
        'Türkçe_Doğru', 'Türkçe_Yanlış', 'Türkçe_Boş', 'Türkçe_Yanlış_Kazanımlar',
        'Matematik_Doğru', 'Matematik_Yanlış', 'Matematik_Boş', 'Matematik_Yanlış_Kazanımlar',
        'Fen_Doğru', 'Fen_Yanlış', 'Fen_Boş', 'Fen_Yanlış_Kazanımlar',
        'Sosyal_Doğru', 'Sosyal_Yanlış', 'Sosyal_Boş', 'Sosyal_Yanlış_Kazanımlar',
        'İngilizce_Doğru', 'İngilizce_Yanlış', 'İngilizce_Boş', 'İngilizce_Yanlış_Kazanımlar',
        'Din_Doğru', 'Din_Yanlış', 'Din_Boş', 'Din_Yanlış_Kazanımlar'
    ]
    csv_data.append(header)
    
    # Ders mapping
    subject_mapping = {
        'Türkçe': 'Türkçe',
        'Matematik': 'Matematik', 
        'Fen': 'Fen Bilimleri',
        'Sosyal': 'Sosyal Bilgiler',
        'İngilizce': 'İngilizce',
        'Din': 'Din Kültürü ve Ahlak Bilgisi'
    }
    
    # Her öğrenci için rastgele veri - Deneme2 için daha iyi performans
    exam_date = (datetime.now() - timedelta(days=3)).strftime('%Y-%m-%d')  # 3 gün önce
    
    # Tüm öğrenciler için sınav verisi oluştur
    for student in students:
        name = student['name']
        grade = student['grade']
        
        row = [name, grade, 'Deneme2', exam_date]
        
        # Her ders için daha iyi performans - %70-95 başarı
        # LGS soru dağılımı: Türkçe=20, Matematik=20, Fen=20, Sosyal=10, İngilizce=10, Din=10 (Toplam=90)
        question_counts = {
            'Türkçe': 20,
            'Matematik': 20, 
            'Fen': 20,
            'Sosyal': 10,
            'İngilizce': 10,
            'Din': 10
        }
        
        for subject_short, subject_full in subject_mapping.items():
            total_questions = question_counts[subject_short]
            
            # Sınıf seviyesine göre başarı oranı
            if grade == '5':
                success_rate = random.uniform(0.60, 0.85)  # 5. sınıf %60-85
            elif grade == '6':
                success_rate = random.uniform(0.65, 0.90)  # 6. sınıf %65-90
            elif grade == '7':
                success_rate = random.uniform(0.70, 0.90)  # 7. sınıf %70-90
            else:  # 8. sınıf
                success_rate = random.uniform(0.75, 0.95)  # 8. sınıf %75-95
            
            correct = int(total_questions * success_rate)
            # Daha az yanlış, daha az boş
            incorrect = random.randint(1, max(1, total_questions - correct - 2))
            blank = total_questions - correct - incorrect
            
            # Negatif değerleri düzelt
            if blank < 0:
                incorrect += blank
                blank = 0
            if incorrect < 0:
                incorrect = 0
            
            # Yanlış kazanımlar (yanlış sayısına göre)
            wrong_outcomes = []
            if incorrect > 0:
                outcome_count = min(incorrect, 3)  # En fazla 3 kazanım
                wrong_outcomes = get_random_outcomes(subject_full, grade, kazanimlar, outcome_count)
            
            # CSV'ye ekle
            row.extend([
                correct, 
                incorrect, 
                blank, 
                ' | '.join(wrong_outcomes) if wrong_outcomes else ''
            ])
        
        csv_data.append(row)
        # Toplam doğru hesapla (her 4. eleman doğru sayısı)
        total_correct = sum([row[i] for i in range(4, len(row), 4)])
        print(f"✅ {name} ({grade}. sınıf) verisi oluşturuldu - Net: {total_correct}/90")
    
    # CSV dosyasına kaydet
    csv_filename = 'Deneme2_Sınav_Sonuçları.csv'
    with open(csv_filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(csv_data)
    
    print(f"\n🎉 CSV dosyası oluşturuldu: {csv_filename}")
    print(f"📊 {len(csv_data)-1} öğrenci için sınav verisi")
    print(f"📅 Sınav tarihi: {exam_date}")
    print(f"📈 Daha iyi performans seviyeleri kullanıldı!")
    
    return csv_filename

if __name__ == "__main__":
    create_deneme2_csv()
