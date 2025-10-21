# -*- coding: utf-8 -*-
import json, pathlib
path = pathlib.Path(r'data\\Kazanımlar.json')
data = json.loads(path.read_text(encoding='utf-8'))
for item in data['Matematik']['7'][:20]:
    print(item['kazanim'] if isinstance(item, dict) else item)
