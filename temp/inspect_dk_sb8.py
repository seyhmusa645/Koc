# -*- coding: utf-8 -*-
import json, pathlib
path = pathlib.Path(r"data\\Kazanımlar.json")
data = json.loads(path.read_text(encoding='utf-8'))
print('Din 8 first entries:')
for item in data['Din Kültürü ve Ahlak Bilgisi']['8'][:10]:
    if isinstance(item, dict):
        text = item.get('kazanim') or item.get('description') or str(item)
    else:
        text = str(item)
    print('-', text)
print('\nSosyal 8 first entries:')
for item in data['Sosyal Bilgiler']['8'][:10]:
    if isinstance(item, dict):
        text = item.get('kazanim') or item.get('description') or str(item)
    else:
        text = str(item)
    print('-', text)
