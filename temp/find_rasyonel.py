# -*- coding: utf-8 -*-
import json, pathlib
path = pathlib.Path(r'data\\Kazanımlar.json')
data = json.loads(path.read_text(encoding='utf-8'))
for item in data['Matematik']['7']:
    text = item['kazanim'] if isinstance(item, dict) else item
    if 'rasyonel' in text.lower():
        print(text)
