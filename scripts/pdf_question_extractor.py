

import fitz  # PyMuPDF
import os
import re
import json

def is_formula(text):
    """A simple heuristic to guess if a text block is a formula."""
    math_chars = len(re.findall(r'[=+\u2212\u00b7$^\u00b0\u221a\u2260\u2264\u2265\u00d7\u00f7]', text))
    if math_chars > 1:
        return True
    
    alnum_len = len(re.findall(r'[a-zA-Z]', text))
    total_len = len(text)
    if total_len > 5 and alnum_len > 0 and total_len / alnum_len > 3:
        return True
        
    return False

def extract_questions_from_pdf(pdf_path):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    output_dir_images = os.path.join(base_dir, 'output', 'extracted_images')
    output_dir_json = os.path.join(base_dir, 'output', 'questions_json')
    
    if not os.path.exists(output_dir_images):
        os.makedirs(output_dir_images)
    if not os.path.exists(output_dir_json):
        os.makedirs(output_dir_json)

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening PDF: {e}")
        return

    questions_data = []

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        
        blocks = page.get_text("dict", sort=True)["blocks"]
        images = page.get_images(full=True)

        q_start_indices = [i for i, b in enumerate(blocks) if b.get('type') == 0 and b.get('lines') and re.match(r'^\s*\d+\.\s*', "".join([s['text'] for l in b['lines'] for s in l['spans']]).strip())]

        for i, block_idx in enumerate(q_start_indices):
            start_block = blocks[block_idx]
            
            y_start = start_block['bbox'][1]
            next_q_start_idx = q_start_indices[i+1] if i + 1 < len(q_start_indices) else len(blocks)
            y_end = blocks[next_q_start_idx]['bbox'][1] if i + 1 < len(q_start_indices) else page.rect.height

            q_num_match = re.match(r'^\s*(\d+)', "".join([s['text'] for l in start_block['lines'] for s in l['spans']]).strip())
            q_num = int(q_num_match.group(1)) if q_num_match else i + 1
            
            current_question = {
                "question_number": q_num,
                "question_body": "",
                "options": {},
                "image": None,
                "formula_images": []
            }

            body_text_parts = []
            
            for j in range(block_idx, next_q_start_idx):
                block = blocks[j]
                if block['type'] != 0: continue
                
                block_text = " ".join([span['text'] for line in block.get("lines", []) for span in line.get("spans", [])]).strip()
                
                if is_formula(block_text):
                    pix = page.get_pixmap(clip=block['bbox'])
                    img_filename = f"q{q_num}_p{page_num+1}_formula_{j}.png"
                    image_path = os.path.join(output_dir_images, img_filename)
                    pix.save(image_path)
                    current_question['formula_images'].append(os.path.abspath(image_path).replace('\\', '/'))
                    continue

                option_match = re.match(r'^\s*([A-D])\)\s*(.*)', block_text, re.DOTALL)
                if option_match:
                    current_question['options'][option_match.group(1)] = option_match.group(2).strip()
                    continue

                multi_option_match = re.findall(r'([A-D])\)\s*(.*?)(?=\s*[A-D]\)|$)', block_text)
                if len(multi_option_match) > 1 and len(multi_option_match) <= 4:
                     for letter, text in multi_option_match:
                        current_question["options"][letter.upper()] = text.strip()
                     continue

                body_text_parts.append(block_text)

            full_body = " ".join(body_text_parts)
            current_question['question_body'] = re.sub(r'^\s*\d+\.\s*', '', full_body).strip()

            for img_index, img in enumerate(images):
                img_bbox = page.get_image_bbox(img)
                if y_start < (img_bbox.y0 + img_bbox.y1) / 2 < y_end:
                    xref = img[0]
                    try:
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        image_ext = base_image["ext"]
                        img_filename = f"q{q_num}_p{page_num+1}_main_{img_index}.{image_ext}"
                        image_path = os.path.join(output_dir_images, img_filename)
                        with open(image_path, "wb") as img_file:
                            img_file.write(image_bytes)
                        current_question['image'] = os.path.abspath(image_path).replace('\\', '/')
                        break
                    except Exception:
                        continue
            
            if current_question['question_body'] or current_question['options']:
                questions_data.append(current_question)

    doc.close()

    base_name = os.path.basename(pdf_path)
    file_name_without_ext = os.path.splitext(base_name)[0]
    output_path_json = os.path.join(output_dir_json, f"{file_name_without_ext}_parsed_final.json")

    with open(output_path_json, 'w', encoding='utf-8') as f:
        json.dump(questions_data, f, ensure_ascii=False, indent=4)

    print(f"Successfully extracted questions (final). JSON saved to: {output_path_json}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    pdf_file_to_find = "mat_tek_1.pdf"
    target_file = os.path.join(project_root, 'assets', pdf_file_to_find)

    if os.path.exists(target_file):
        extract_questions_from_pdf(target_file)
    else:
        print(f"Error: Could not find the file: {target_file}")
