# -*- coding: utf-8 -*-
import json
import pathlib
import re

path = pathlib.Path(r'data\\Kazanımlar.json')
data = json.loads(path.read_text(encoding='utf-8'))
pattern = re.compile(r'^[A-ZÇĞİÖŞÜ]{1,4}\.\d[\d.]*\s*')

def clean(text):
    return pattern.sub('', text).strip()

for grade in sorted(data['Matematik'].keys(), key=int):
    print('Grade', grade)
    for item in data['Matematik'][grade][:3]:
        text = item['kazanim'] if isinstance(item, dict) else item
        print('orig:', text)
        print('clean:', clean(text))
    print()
