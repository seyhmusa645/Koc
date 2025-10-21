# -*- coding: utf-8 -*-
import json
import pathlib
import re
from collections import defaultdict

path = pathlib.Path(r'data\\Kazanımlar.json')
data = json.loads(path.read_text(encoding='utf-8'))
pattern = re.compile(r'^[A-ZÇĞİÖŞÜ]+\.[\d]+')
summary = defaultdict(lambda: defaultdict(int))
examples = defaultdict(list)
for subject, grades in data.items():
    for grade, items in grades.items():
        for item in items:
            text = item['kazanim'] if isinstance(item, dict) else item
            if isinstance(text, str) and pattern.match(text.strip()):
                summary[subject][grade] += 1
                if len(examples[(subject, grade)]) < 3:
                    examples[(subject, grade)].append(text.strip())

print('Subjects:', list(data.keys()))
print('\nCounts of code-like entries:')
for subject, grades in summary.items():
    for grade, count in sorted(grades.items(), key=lambda x: int(re.sub(r"^\\D+", '', x[0]) or '0')):
        total = len(data[subject][grade])
        print(f"- {subject} {grade}: {count}/{total} entries look like codes")
        for ex in examples[(subject, grade)]:
            print(f"    example: {ex}")
if not summary:
    print('No code-like entries found.')
