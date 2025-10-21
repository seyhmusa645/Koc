# -*- coding: utf-8 -*-
import json
import pathlib
import re

path = pathlib.Path(r'data\\Kazanımlar.json')
text = path.read_text(encoding='utf-8')
data = json.loads(text)
pattern = re.compile(r'^[A-ZÇĞİÖŞÜ]{1,4}\.[\d.]+')
found = 0
examples = []
for subject, grades in data.items():
    for grade, items in grades.items():
        for raw in items:
            if isinstance(raw, dict):
                kazanim_text = raw.get('kazanim') or raw.get('description') or ''
            else:
                kazanim_text = str(raw)
            if pattern.match(kazanim_text.strip()):
                found += 1
                if len(examples) < 10:
                    examples.append((subject, grade, kazanim_text.strip()))
print('code-like entries:', found)
for ex in examples:
    print('example:', ex)
