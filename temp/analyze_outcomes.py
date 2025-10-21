# -*- coding: utf-8 -*-
import csv, pathlib, re, json

kazanımlar_path = pathlib.Path(r'data\\Kazanımlar.json')
kazanımlar = json.loads(kazanımlar_path.read_text(encoding='utf-8'))

# Build normalized index for existing kazanımlar
import unicodedata

def normalize(text):
    return re.sub(r'\s+', ' ', ''.join(ch for ch in text.lower() if ch.isalnum() or ch.isspace())).strip()

index = {}
for subject, grades in kazanımlar.items():
    for grade, items in grades.items():
        for item in items:
            text = item['kazanim'] if isinstance(item, dict) else item
            norm = normalize(text)
            key = (subject, grade)
            index.setdefault(key, set()).add(norm)

# analyze CSV outcomes
csv_files = [pathlib.Path(r'data\\Deneme1_Sınav_Sonuçları.csv'), pathlib.Path(r'data\\Deneme2_Sınav_Sonuçları.csv')]
report = {}
code_pattern = re.compile(r'^[A-ZÇĞİÖŞÜ]{1,4}\.[\d.]+')

for csv_path in csv_files:
    with csv_path.open(encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            grade = row['Sınıf']
            for prefix, subject_name in [('Türkçe', 'Türkçe'), ('Matematik','Matematik'), ('Fen','Fen Bilimleri'), ('Sosyal','Sosyal Bilgiler'), ('Din','Din Kültürü ve Ahlak Bilgisi'), ('İngilizce','İngilizce')]:
                outcomes_cell = row.get(f'{prefix}_Yanlış_Kazanımlar')
                if not outcomes_cell:
                    continue
                raw_outcomes = [o.strip() for o in outcomes_cell.split('|') if o.strip()]
                for raw in raw_outcomes:
                    has_code = bool(code_pattern.match(raw))
                    norm_raw = normalize(raw)
                    key = (subject_name, grade)
                    exists = norm_raw in index.get(key, set())
                    if key not in report:
                        report[key] = {'total':0,'with_code':0,'matched':0,'examples_miss':[],'examples_code':[]}
                    report[key]['total'] += 1
                    if has_code:
                        report[key]['with_code'] += 1
                        if len(report[key]['examples_code']) < 3:
                            report[key]['examples_code'].append(raw)
                    if exists:
                        report[key]['matched'] += 1
                    elif len(report[key]['examples_miss']) < 3:
                        report[key]['examples_miss'].append(raw)

for key, stats in sorted(report.items()):
    subject, grade = key
    print(f"{subject} Grade {grade}: total={stats['total']}, codes={stats['with_code']}, matched={stats['matched']}")
    if stats['examples_code']:
        print('  code examples:', stats['examples_code'])
    if stats['examples_miss']:
        print('  missing examples:', stats['examples_miss'])
