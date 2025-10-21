# -*- coding: utf-8 -*-
import json, pathlib
path = pathlib.Path(r'data\\Kazanımlar.json')
data = json.loads(path.read_text(encoding='utf-8'))
for subject, grades in data.items():
    for grade, items in grades.items():
        print(f"{subject} {grade}: {len(items)} entries")
