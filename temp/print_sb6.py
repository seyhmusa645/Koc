# -*- coding: utf-8 -*-
import json, pathlib
import unicodedata

path = pathlib.Path(r'data\\Kazanımlar.json')
data = json.loads(path.read_text(encoding='utf-8'))
print(len(data['Sosyal Bilgiler']['6']))
for item in data['Sosyal Bilgiler']['6'][:10]:
    text = item['kazanim'] if isinstance(item, dict) else item
    print(text)
