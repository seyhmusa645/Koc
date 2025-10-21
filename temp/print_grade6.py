# -*- coding: utf-8 -*-
import json, pathlib
path = pathlib.Path(r'data\\Kazanımlar.json')
data = json.loads(path.read_text(encoding='utf-8'))
for subject in ['Matematik','Fen Bilimleri','Türkçe','Din Kültürü ve Ahlak Bilgisi','İngilizce']:
    print(subject, 'grade 6 sample:')
    items = data[subject]['6'][:5]
    for item in items:
        text = item['kazanim'] if isinstance(item, dict) else item
        print(' ', text)
    print()
