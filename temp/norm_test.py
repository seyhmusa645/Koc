# -*- coding: utf-8 -*-
import re

M = 'İTA.8.3.7. Milli Mücadele...'

def normalize(text):
    return re.sub(r'\s+', ' ', re.sub(r'[.,;:!?()]', '', text.lower())).strip()

text = normalize(M)
print(text.encode('utf-8'))
