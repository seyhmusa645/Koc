import json
from datetime import datetime

def upgrade_student_grades():
    """Tüm öğrencileri bir sınıf yukarı taşı"""
    print("🆙 Öğrenciler yeni akademik yıl için sınıf yükseltiliyor...")
    
    # AppData'daki students.json'ı yükle
    students_path = r"C:\Users\Program Geliştirme\AppData\Roaming\kapsul-kocluk-programi\students.json"
    
    try:
        with open(students_path, 'r', encoding='utf-8') as f:
            students_data = json.load(f)
        
        print(f"📚 {len(students_data['students'])} öğrenci bulundu")
        
        upgrade_count = 0
        graduate_count = 0
        
        for student in students_data['students']:
            old_grade = student['grade']
            old_class = student.get('class', '')
            
            # Sınıf yükseltme
            if old_grade == '5':
                new_grade = '6'
                new_class = old_class.replace('5', '6') if old_class else None
            elif old_grade == '6':
                new_grade = '7' 
                new_class = old_class.replace('6', '7') if old_class else None
            elif old_grade == '7':
                new_grade = '8'
                new_class = old_class.replace('7', '8') if old_class else None
            elif old_grade == '8':
                # 8. sınıflar mezun oldu - silinebilir veya arşivlenebilir
                print(f"🎓 {student['name']} mezun oldu (8. sınıf)")
                graduate_count += 1
                continue
            else:
                print(f"⚠️ Bilinmeyen sınıf: {old_grade} - {student['name']}")
                continue
            
            # Güncelleme
            student['grade'] = new_grade
            if new_class:
                student['class'] = new_class
            student['updatedAt'] = datetime.now().isoformat()
            
            print(f"📈 {student['name']}: {old_grade} → {new_grade} ({old_class} → {new_class})")
            upgrade_count += 1
        
        # Mezun olan 8. sınıfları kaldır (isteğe bağlı)
        # students_data['students'] = [s for s in students_data['students'] if s['grade'] != '8']
        
        # Güncelleme zamanını kaydet
        students_data['lastUpdated'] = datetime.now().isoformat()
        
        # Kaydet
        with open(students_path, 'w', encoding='utf-8') as f:
            json.dump(students_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ TAMAMLANDI!")
        print(f"📈 Yükseltilen: {upgrade_count} öğrenci")
        print(f"🎓 Mezun olan: {graduate_count} öğrenci")
        print(f"📊 Toplam aktif: {len(students_data['students'])} öğrenci")
        
        # Sınıf dağılımını göster
        grade_distribution = {}
        for student in students_data['students']:
            grade = student['grade']
            if grade not in grade_distribution:
                grade_distribution[grade] = 0
            grade_distribution[grade] += 1
        
        print(f"\n📋 Yeni Sınıf Dağılımı:")
        for grade in sorted(grade_distribution.keys()):
            print(f"  {grade}. Sınıf: {grade_distribution[grade]} öğrenci")
            
    except Exception as e:
        print(f"❌ Hata: {e}")

if __name__ == "__main__":
    upgrade_student_grades()
