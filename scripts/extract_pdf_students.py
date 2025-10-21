import io
import re
from pathlib import Path

import fitz
import numpy as np
import pandas as pd
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "Sonuclar-Ortaokul-Rapor (2).pdf"
OUTPUT_CSV = ROOT / "students_summary.csv"

ABILITY_LABELS = [
    ("visual_spatial", "Görsel Uzamsal Düşünme, Zihinsel Çevirme, Küp ve Modeller"),
    ("coding", "Kodlama"),
    ("analogies", "Analojiler, Diziler ve Sayısal Akıl Yürütme"),
    ("visual_reasoning", "Parça-Bütün, Görsel Akıl Yürütme"),
    ("verbal_reasoning", "Sözel Akıl Yürütme"),
    ("relational", "İlişkisel Düşünme"),
]

LEVEL_SCORES = {"red": 1, "yellow": 2, "green": 3}


def classify_color(color: np.ndarray) -> str:
    r, g, b = (int(color[0]), int(color[1]), int(color[2]))
    if g > 200 and r < 210:
        return "green"
    if g > 150:
        return "yellow"
    return "red"


def extract_chart_levels(doc: fitz.Document, page: fitz.Page) -> list[str] | None:
    for info in page.get_images(full=True):
        xref, _, width, height, _, _, _, _, _, _ = info
        if width < 600 or height < 150 or height > 400:
            continue
        pix = fitz.Pixmap(doc, xref)
        if pix.n > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        image = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
        array = np.array(image)
        mask = (array[:, :, 2] > 180) & (array[:, :, 0] < 180)
        ys, xs = np.where(mask)
        if len(xs) == 0:
            continue
        order = np.argsort(xs)
        xs = xs[order]
        ys = ys[order]
        clusters: list[list[tuple[int, int]]] = []
        current = [(int(xs[0]), int(ys[0]))]
        for x, y in zip(xs[1:], ys[1:]):
            if x - current[-1][0] > 10:
                clusters.append(current)
                current = [(int(x), int(y))]
            else:
                current.append((int(x), int(y)))
        clusters.append(current)
        if len(clusters) != len(ABILITY_LABELS):
            continue
        levels: list[str] = []
        for cluster in clusters:
            xs_cluster = np.array([point[0] for point in cluster])
            ys_cluster = np.array([point[1] for point in cluster])
            x_mean = int(xs_cluster.mean())
            y_mean = int(ys_cluster.mean())
            y_sample = max(min(y_mean - 10, array.shape[0] - 1), 0)
            color = array[y_sample, x_mean]
            levels.append(classify_color(color))
        return levels
    return None


def parse_student_blocks(doc: fitz.Document) -> pd.DataFrame:
    records: list[dict[str, object]] = []
    current: dict[str, object] | None = None
    pending_chart = False

    for page_index, page in enumerate(doc, start=1):
        text = page.get_text()
        has_student_header = "Öğrenci No:" in text

        if has_student_header:
            if current is not None:
                records.append(current)
            current = {"page_start": page_index}
            pending_chart = False

            number_match = re.search(r"Öğrenci No:\s*(\d+)", text)
            name_match = re.search(r"Adı Soyadı:\s*(.+?)\s*\nCinsiyeti", text, re.S)
            style_match = re.search(r"Öğrencinin Öğrenme Stili:\s*([\wÇĞİÖŞÜÂÊÎÔÛ/ ]+)", text)
            birth_match = re.search(r"Doğum Tarihi:\s*([0-9/]+)", text)
            class_match = re.search(r"Sınıfı:\s*([A-Z0-9/ ]+)", text)

            if number_match:
                current["student_no"] = number_match.group(1)
            if name_match:
                current["name"] = name_match.group(1).strip()
            if style_match:
                current["learning_style"] = style_match.group(1).strip()
            if birth_match:
                current["birthdate"] = birth_match.group(1)
            if class_match:
                current["class"] = class_match.group(1).strip()

            levels = extract_chart_levels(doc, page)
            if levels is None:
                pending_chart = True
            else:
                for (_, label), level in zip(ABILITY_LABELS, levels):
                    current[label] = level
                    current[f"{label} (score)"] = LEVEL_SCORES[level]

        elif pending_chart and current is not None:
            levels = extract_chart_levels(doc, page)
            if levels is not None:
                for (_, label), level in zip(ABILITY_LABELS, levels):
                    current[label] = level
                    current[f"{label} (score)"] = LEVEL_SCORES[level]
                pending_chart = False

    if current is not None:
        records.append(current)

    if not records:
        return pd.DataFrame()

    df = pd.DataFrame(records)
    base_columns = ["student_no", "name", "learning_style", "birthdate", "class", "page_start"]
    ability_columns: list[str] = []
    for _, label in ABILITY_LABELS:
        ability_columns.append(label)
        ability_columns.append(f"{label} (score)")
    ordered_columns = [col for col in base_columns if col in df.columns] + ability_columns
    return df.reindex(columns=ordered_columns)


def main() -> None:
    if not PDF_PATH.exists():
        raise FileNotFoundError(f"PDF not found: {PDF_PATH}")
    doc = fitz.open(PDF_PATH)
    df = parse_student_blocks(doc)
    if df.empty:
        raise RuntimeError("No student data extracted.")
    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    print(f"Extracted {len(df)} students to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
