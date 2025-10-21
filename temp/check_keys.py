# -*- coding: utf-8 -*-
import json, pathlib
path = pathlib.Path(r'data\\Kazanımlar.json')
data = json.loads(path.read_text(encoding='utf-8'))
keys = list(data['Sosyal Bilgiler'].keys())
print(keys)
for k in keys:
    print(repr(k))
