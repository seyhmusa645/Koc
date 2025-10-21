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

def create_sample_csv():
    """Örnek CSV dosyası oluştur"""
    print("📊 Örnek sınav CSV dosyası oluşturuluyor...")
    
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
    
    # Her öğrenci için rastgele veri
    exam_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    
    for student in students:
        name = student['name']
        grade = student['grade']
        
        row = [name, grade, 'Deneme1', exam_date]
        
        # Her ders için rastgele sonuçlar
        for subject_short, subject_full in subject_mapping.items():
            # 20 soru üzerinden rastgele dağılım
            total_questions = 20
            
            # Başarı oranına göre rastgele sonuç (ortalama %60-80 başarı)
            success_rate = random.uniform(0.4, 0.9)  # %40-90 başarı
            correct = int(total_questions * success_rate)
            incorrect = random.randint(1, total_questions - correct)
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
                outcome_count = min(incorrect, 5)  # En fazla 5 kazanım
                wrong_outcomes = get_random_outcomes(subject_full, grade, kazanimlar, outcome_count)
            
            # CSV'ye ekle
            row.extend([
                correct, 
                incorrect, 
                blank, 
                ' | '.join(wrong_outcomes) if wrong_outcomes else ''
            ])
        
        csv_data.append(row)
        print(f"✅ {name} ({grade}. sınıf) verisi oluşturuldu")
    
    # CSV dosyasına kaydet
    csv_filename = 'Deneme1_Sınav_Sonuçları.csv'
    with open(csv_filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(csv_data)
    
    print(f"\n🎉 CSV dosyası oluşturuldu: {csv_filename}")
    print(f"📊 {len(csv_data)-1} öğrenci için sınav verisi")
    print(f"📅 Sınav tarihi: {exam_date}")
    
    return csv_filename

if __name__ == "__main__":
    create_sample_csv()
