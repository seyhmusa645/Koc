# -*- coding: utf-8 -*-
import json
import pathlib
import re
from collections import defaultdict

path = pathlib.Path(r'data\\Kazanımlar.json')
data = json.loads(path.read_text(encoding='utf-8'))
norm_pattern = re.compile(r'\s+')

subjects = defaultdict(lambda: defaultdict(dict))
for subject, grades in data.items():
    for grade, items in grades.items():
        total = len(items)
        code_only = 0
        code_and_text = 0
        text_only = 0
        sample_code_only = []
        sample_code_mixed = []
        sample_text = []
        for raw in items:
            if isinstance(raw, dict):
                text = raw.get('kazanim') or raw.get('description') or ''
            else:
                text = str(raw)
            stripped = text.strip()
            if not stripped:
                continue
            has_code = bool(re.match(r'^[A-ZÇĞİÖŞÜ]{1,4}\.[\d.]+', stripped))
            has_sentence = bool(re.search(r'[a-zçğıöşü]{3,}', stripped, re.IGNORECASE))
            if has_code and not has_sentence:
                code_only += 1
                if len(sample_code_only) < 2:
                    sample_code_only.append(stripped)
            elif has_code and has_sentence:
                code_and_text += 1
                if len(sample_code_mixed) < 2:
                    sample_code_mixed.append(stripped)
            else:
                text_only += 1
                if len(sample_text) < 2:
                    sample_text.append(stripped)
        subjects[subject][grade] = {
            'total': total,
            'code_only': code_only,
            'code_and_text': code_and_text,
            'text_only': text_only,
            'sample_code_only': sample_code_only,
            'sample_code_mixed': sample_code_mixed,
            'sample_text': sample_text
        }

for subject in sorted(subjects.keys()):
    print(subject)
    for grade in sorted(subjects[subject].keys(), key=lambda g: int(g)):
        info = subjects[subject][grade]
        print(f"  Grade {grade}: total={info['total']}, code_only={info['code_only']}, code+text={info['code_and_text']}, text_only={info['text_only']}")
        if info['sample_code_only']:
            print('    code-only sample:', info['sample_code_only'][0])
        if info['sample_code_mixed']:
            print('    code+text sample:', info['sample_code_mixed'][0])
        if info['sample_text']:
            print('    text-only sample:', info['sample_text'][0])
