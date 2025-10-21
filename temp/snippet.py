# -*- coding: utf-8 -*-
from pathlib import Path
path = Path(r'src\\renderer.js')
text = path.read_text(encoding='utf-8')
lines = text.splitlines()
start = 3020
end = 3210
import sys
for idx in range(start, min(end, len(lines))):
    line = lines[idx]
    safe = line.encode('utf-8')
    sys.stdout.buffer.write(f"{idx+1}:".encode('utf-8') + safe + b"\n")
