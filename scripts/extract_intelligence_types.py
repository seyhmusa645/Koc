import json
import re

# Word'den çıkarılan veriyi oku
with open('complete_students_data.json', 'r', encoding='utf-8') as f:
    word_students = json.load(f)

# Zeka türü eşleştirme sözlüğü
intelligence_mapping = {
    'Sözel/Dilsel Zeka': 'verbal',
    'Matematiksel/Mantıksal Zeka': 'logical', 
    'Görsel/Uzamsal Zeka': 'visual',
    'Müziksel/Ritmik Zeka': 'musical',
    'Bedensel/Kinestetik Zeka': 'kinesthetic',
    'Kişiler Arası Zeka': 'interpersonal',
    'İçsel/Öze Dönük Zeka': 'intrapersonal',
    'Doğa Zekası': 'naturalist'
}

def extract_intelligence_types(strong_areas):
    """Güçlü alanlardan zeka türlerini çıkar"""
    intelligence_scores = {
        'verbal': 0,
        'logical': 0,
        'visual': 0,
        'musical': 0,
        'kinesthetic': 0,
        'interpersonal': 0,
        'intrapersonal': 0,
        'naturalist': 0
    }
    
    if not strong_areas:
        return intelligence_scores
    
    # Her güçlü alan için zeka türü puanı ver
    for area in strong_areas:
        area_lower = area.lower()
        
        # Sözel/Dilsel Zeka
        if any(word in area_lower for word in ['türkçe', 'dil', 'yazı', 'okuma', 'anlatım', 'kompozisyon']):
            intelligence_scores['verbal'] += 1
            
        # Matematiksel/Mantıksal Zeka
        if any(word in area_lower for word in ['matematik', 'sayı', 'hesap', 'problem', 'mantık', 'analiz']):
            intelligence_scores['logical'] += 1
            
        # Görsel/Uzamsal Zeka
        if any(word in area_lower for word in ['görsel', 'resim', 'şekil', 'harita', 'grafik', 'uzay', 'geometri']):
            intelligence_scores['visual'] += 1
            
        # Müziksel/Ritmik Zeka
        if any(word in area_lower for word in ['müzik', 'ritim', 'ses', 'melodi', 'şarkı', 'enstrüman']):
            intelligence_scores['musical'] += 1
            
        # Bedensel/Kinestetik Zeka
        if any(word in area_lower for word in ['beden', 'hareket', 'spor', 'dans', 'el', 'pratik']):
            intelligence_scores['kinesthetic'] += 1
            
        # Kişiler Arası Zeka
        if any(word in area_lower for word in ['sosyal', 'iletişim', 'grup', 'liderlik', 'takım', 'arkadaş']):
            intelligence_scores['interpersonal'] += 1
            
        # İçsel/Öze Dönük Zeka
        if any(word in area_lower for word in ['bireysel', 'kendini', 'hedef', 'planlama', 'düşünce', 'refleksiyon']):
            intelligence_scores['intrapersonal'] += 1
            
        # Doğa Zekası
        if any(word in area_lower for word in ['doğa', 'çevre', 'hayvan', 'bitki', 'fen', 'bilim', 'keşif']):
            intelligence_scores['naturalist'] += 1
    
    return intelligence_scores

# Öğrencileri işle
processed_students = []

for student in word_students:
    # Zeka türlerini çıkar
    intelligence_types = extract_intelligence_types(student.get('strong_areas', []))
    
    # Öğrenci verisini güncelle
    student['intelligence_types'] = intelligence_types
    processed_students.append(student)

# Sonuçları kaydet
with open('students_with_intelligence.json', 'w', encoding='utf-8') as f:
    json.dump(processed_students, f, ensure_ascii=False, indent=2)

print(f'✅ {len(processed_students)} öğrenci için zeka türleri çıkarıldı!')

# Zeka türü dağılımını göster
intelligence_stats = {}
for student in processed_students:
    for int_type, score in student['intelligence_types'].items():
        if score > 0:
            intelligence_stats[int_type] = intelligence_stats.get(int_type, 0) + 1

print('\n=== ZEKA TÜRÜ DAĞILIMI ===')
for int_type, count in sorted(intelligence_stats.items(), key=lambda x: x[1], reverse=True):
    print(f'{int_type}: {count} öğrenci')

# Örnek öğrenci göster
print('\n=== ÖRNEK ÖĞRENCİ ===')
sample_student = processed_students[0]
print(f'İsim: {sample_student["name"]}')
print(f'Güçlü Alanlar: {sample_student["strong_areas"]}')
print(f'Zeka Türleri: {sample_student["intelligence_types"]}')
