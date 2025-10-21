# -*- coding: utf-8 -*-
import json, pathlib
path = pathlib.Path(r'data\\Kazanımlar.json')
text = path.read_text(encoding='utf-8')
if 'rasyonel' in text:
    print('found')
else:
    print('not found')
