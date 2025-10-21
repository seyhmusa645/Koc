# -*- coding: utf-8 -*-
import json
import pathlib

path = pathlib.Path(r'data\\Kazanımlar.json')
print('exists', path.exists(), 'size', path.stat().st_size)
for enc in ['utf-8', 'utf-8-sig', 'utf-16', 'utf-16-le', 'utf-16-be', 'latin-1']:
    try:
        text = path.read_text(encoding=enc)
        data = json.loads(text)
        print('decoded with', enc, 'keys', list(data.keys())[:5])
        break
    except Exception as e:
        print('encoding', enc, 'failed:', e)
