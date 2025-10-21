# -*- coding: utf-8 -*-
from pathlib import Path
text = Path(r'src\\renderer.js').read_text(encoding='utf-8')
start = text.index('function generateAutoOutcomes')
print(text[start:start+600])
