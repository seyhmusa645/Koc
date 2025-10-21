# -*- coding: utf-8 -*-
import json
import pathlib
import re

path = pathlib.Path(r'data\\Kazanımlar.json')
data = json.loads(path.read_text(encoding='utf-8'))
pattern = re.compile(r'^[A-ZÇĞİÖŞÜ]{1,4}\.\d')

for grade in sorted(data['Matematik'].keys(), key=int):
    for item in data['Matematik'][grade][:5]:
        text = item['kazanim'] if isinstance(item, dict) else item
        cleaned = pattern.sub('', text).lstrip('. ').strip()
        print(text)
        print('->', cleaned)
    break
