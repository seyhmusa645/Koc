'''
This script parses multiple-choice questions from TXT files.
It extracts questions and options into a JSON format.
'''
import re
import json

def parse_questions_from_text(text_content: str, starting_id: int) -> list[dict]:
    '''
    Parses questions and their options from a given text content.

    Args:
        text_content: The text containing the questions.
        starting_id: The starting ID for the questions.

    Returns:
        A list of dictionaries, each containing the question text and options.
    '''
    # Normalize line endings
    text_content = text_content.replace('\r\n', '\n').replace('\r', '\n')

    # Split text into potential question blocks. A question starts with a number followed by a dot.
    # We use a lookahead to keep the delimiter.
    question_blocks = re.split(r'(?=\n\d+\.\s)', text_content.strip())

    parsed_questions = []
    current_id = starting_id

    for i, block in enumerate(question_blocks):
        if not block.strip():
            continue

        # The first block might not start with a number, so we handle it specially
        if i == 0 and not re.match(r'^\d+\.\s', block.strip()):
             # This is likely a continuation of a previous block or header, ignore for now
             # A more robust solution could be to prepend it to the next block
             pass # for now we just process it as a normal block

        # More robust option pattern
        option_pattern = re.compile(r'([A-D])\)\s*(.*?)(?=\s*[A-D]\)|\n\n|\u2028|\Z)', re.DOTALL)
        matches = list(option_pattern.finditer(block))

        if not matches:
            continue

        options = {}
        first_option_start_index = matches[0].start()
        question_text = block[:first_option_start_index].strip()

        # Clean up question text
        question_text = re.sub(r'^\d+\.\s*', '', question_text).strip()
        question_text = re.sub(r'\s+', ' ', question_text.replace('\n', ' '))

        for match in matches:
            letter = match.group(1)
            option_text = match.group(2)
            option_text = option_text.replace('\n', ' ').strip()
            option_text = re.sub(r'\s+', ' ', option_text)
            options[letter] = option_text

        if len(options) > 0:
            parsed_questions.append({
                "id": current_id,
                "text": question_text,
                "options": options
            })
            current_id += 1

    return parsed_questions

def main():
    '''
    Main function to read files, parse them, and print the results.
    '''
    files_to_parse = [
        "C:\\Users\\Program Geliştirme\\Desktop\\Koçluk programı\\2. Mustafa Kemal'in Hayatı.txt",
        "C:\\Users\\Program Geliştirme\\Desktop\\Koçluk programı\\8. Sınıf İnkılap Branş Deneme 25li- 2023 - SON VİRAJ_Ornek.txt"
    ]

    all_parsed_data = []
    question_id_counter = 1
    for file_path in files_to_parse:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                print(f"--- Parsing {file_path}... ---")
                parsed_data = parse_questions_from_text(content, question_id_counter)
                all_parsed_data.extend(parsed_data)
                question_id_counter += len(parsed_data)
                print(f"Successfully parsed {len(parsed_data)} questions.\n")
        except FileNotFoundError:
            print(f"Error: File not found at {file_path}")
        except Exception as e:
            print(f"An error occurred while processing {file_path}: {e}")

    print("--- All Parsed Questions (JSON) ---")
    print(json.dumps(all_parsed_data, ensure_ascii=False, indent=2))

    output_file = "C:\\Users\\Program Geliştirme\\Desktop\\Koçluk programı\\question-bank\\data\\parsed_questions_v2.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_parsed_data, f, ensure_ascii=False, indent=2)
    print(f"\nResults saved to '{output_file}'")

if __name__ == "__main__":
    main()