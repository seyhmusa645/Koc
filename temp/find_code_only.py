# -*- coding: utf-8 -*-
import json
import pathlib
import re
from collections import defaultdict

path = pathlib.Path(r'data\\Kazanımlar.json')
data = json.loads(path.read_text(encoding='utf-8'))
pattern_code_only = re.compile(r'^[A-ZÇĞİÖŞÜ]+\.[\d.]+$')
found = []
for subject, grades in data.items():
    for grade, items in grades.items():
        for item in items:
            text = item['kazanim'] if isinstance(item, dict) else item
            if isinstance(text, str) and pattern_code_only.match(text.strip()):
                found.append((subject, grade, text.strip()))

print('code-only entries count:', len(found))
for subject, grade, text in found[:20]:
    print(subject, grade, text)
