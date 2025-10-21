import os
import re
import json
from bs4 import BeautifulSoup
import sys

def parse_html_to_json(html_path):
    """
    Parses an HTML file exported from Word, extracts questions, options, and images,
    and saves them to a JSON file.
    """
    try:
        with open(html_path, 'r', encoding='windows-1254') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file {html_path}: {e}")
        return

    soup = BeautifulSoup(content, 'html.parser')
    questions_data = []
    
    # Regex to find question numbers like "1.", "2.", etc.
    # It looks for a paragraph that starts with a bold number.
    question_start_regex = re.compile(r'^\s*\d+\.')

    # Find all potential question starting points
    potential_starts = soup.find_all('p')

    current_question = None

    for p_tag in potential_starts:
        # Check if this tag marks the beginning of a new question
        b_tag = p_tag.find('b')
        is_new_question = b_tag and question_start_regex.match(b_tag.get_text(strip=True))

        if is_new_question:
            # If we were processing a question, save it before starting a new one
            if current_question:
                questions_data.append(current_question)

            # Start a new question object
            q_num_text = b_tag.get_text(strip=True)
            q_num = int(re.match(r'(\d+)', q_num_text).group(1))
            current_question = {
                "question_number": q_num,
                "question_body": "",
                "options": {},
                "image": None
            }
            
            # Extract text from the same paragraph, excluding the question number
            b_tag.extract() # Remove the bold tag to avoid re-reading the number
            body_text = p_tag.get_text(" ", strip=True)
            if body_text:
                current_question["question_body"] += body_text + " "

            # Find associated image
            img_tag = p_tag.find('v:imagedata')
            if img_tag and img_tag.get('src'):
                current_question["image"] = img_tag['src'].replace('%20', ' ')

            # The main question text is often in the next <h1> tag
            next_tag = p_tag.find_next_sibling()
            if next_tag and next_tag.name == 'h1':
                current_question["question_body"] += next_tag.get_text(" ", strip=True)
                # This tag is processed, so we should skip it in the next iteration
                next_tag.decompose() 

        elif current_question:
            # This tag is part of the current question (options or more body text)
            text = p_tag.get_text(" ", strip=True)
            
            # Regex for options like "A) ... B) ... C) ... D) ..."
            multi_option_match = re.findall(r'([A-D])\)(.*?)(?=\s*[A-D]\)|$)', text, re.IGNORECASE)
            
            if len(multi_option_match) > 1: # Handles single-line multiple options
                for letter, option_text in multi_option_match:
                    current_question["options"][letter.upper()] = option_text.strip()
            else:
                # Regex for single options like "A) ..."
                single_option_match = re.match(r'^\s*([A-D])\)(.*)', text, re.IGNORECASE)
                if single_option_match:
                    letter = single_option_match.group(1).upper()
                    option_text = single_option_match.group(2).strip()
                    current_question["options"][letter] = option_text

    # Append the very last question found
    if current_question:
        questions_data.append(current_question)

    # Clean up whitespace in question bodies
    for q in questions_data:
        q["question_body"] = re.sub(r'\\s+', ' ', q["question_body"]).strip()

    # Define output path
    output_dir = os.path.join(os.path.dirname(html_path), '..', '..', 'output', 'questions_json')
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    base_name = os.path.basename(html_path)
    file_name_without_ext = os.path.splitext(base_name)[0]
    output_path = os.path.join(output_dir, f"{file_name_without_ext}.json")

    # Write to JSON file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(questions_data, f, ensure_ascii=False, indent=4)

    print(f"Successfully parsed and saved to {output_path}")


if __name__ == "__main__":
    # Hardcoded path to avoid shell argument parsing issues
    html_file_to_parse = "C:\\Users\\Program Geliştirme\\Desktop\\Koçluk programı - soru tabanlı kullanıcı tabanlı\\input\\html\\İTA 1. ünite.htm"
    parse_html_to_json(html_file_to_parse)
