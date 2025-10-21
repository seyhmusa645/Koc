# -*- coding: utf-8 -*-
import json, pathlib, itertools

path = pathlib.Path(r'data\\Kazanımlar.json')
data = json.loads(path.read_text(encoding='utf-8'))
for subject in data:
    print('Subject:', subject)
    for grade, items in data[subject].items():
        sample = list(itertools.islice((item['kazanim'] if isinstance(item, dict) else item for item in items), 3))
        print(' ', grade, 'samples:')
        for s in sample:
            print('    ', s)
    print()
