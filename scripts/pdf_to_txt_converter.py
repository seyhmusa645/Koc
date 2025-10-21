
'''
This script reads a temporary text file (containing extracted PDF content),
extracts text-based multiple-choice questions, cleans them, and saves them
into a single, formatted TXT file.
'''
import re

def format_questions_to_txt(text_content: str) -> str:
    '''
    Parses a large string of text, extracts valid questions, and formats them for a TXT file.
    '''
    # Normalize line endings and remove some common noise from OCR
    text_content = text_content.replace('\r\n', '\n').replace('\r', '\n')
    text_content = re.sub(r"TEST-\d+", "", text_content)
    text_content = re.sub(r"T.C. İNKILAP TARİHİ ve ATATÜRKÇÜLÜK", "", text_content, flags=re.IGNORECASE)
    text_content = re.sub(r"Mehmet ÖZKÜZ", "", text_content, flags=re.IGNORECASE)
    text_content = re.sub(r"Küre Yatılı Bölge Ortaokulu/Kastamonu", "", text_content, flags=re.IGNORECASE)
    text_content = re.sub(r"\d+\. Sınıf", "", text_content)
    text_content = re.sub(r"\d+\. Ünite: [\w\s]+", "", text_content)
    text_content = re.sub(r"Test \d+-[\w\s]+", "", text_content)
    text_content = re.sub(r"CEVAPLAR[\s\S]*", "", text_content) # Remove answer key sections and everything after

    # Split text into potential question blocks. A question starts with a number followed by a dot.
    question_blocks = re.split(r'\n(?=\d+\.)', text_content.strip())

    formatted_questions = []
    question_counter = 1

    for block in question_blocks:
        block = block.strip()
        if not block or len(block) < 20: # Skip empty or very short blocks
            continue

        # --- Visual Question Filtering ---
        visual_keywords = ["harita", "görsel", "tablo", "şema", "grafik", "haritaya göre"]
        if any(keyword in block.lower() for keyword in visual_keywords):
            # More specific check for phrases that strongly imply a visual element
            if re.search(r"(bu|aşağıdaki|yukarıdaki|verilen)\s+(haritaya|görsele|tabloya)", block.lower()):
                clean_block_snippet = block[:60].replace('\n', ' ')
                print(f"Skipping visual question: '{clean_block_snippet}...' ")
                continue

        # --- Parsing Logic ---
        # A question is everything before the first option.
        first_option_match = re.search(r'\n[A-D]\)', block)
        if not first_option_match:
            continue
            
        first_option_start_index = first_option_match.start()
        question_text = block[:first_option_start_index].strip()
        options_text = block[first_option_start_index:].strip()

        # Clean up question text
        question_text = re.sub(r'^\d+\.\s*', '', question_text).strip()
        question_text = re.sub(r'\s+', ' ', question_text.replace('\n', ' '))

        if not question_text:
            continue

        # Extract options from the options_text
        options_dict = {}
        option_lines = re.split(r'\n(?=[A-D])', options_text)
        
        for line in option_lines:
            line = line.strip()
            if not line:
                continue
            match = re.match(r'([A-D])\)(.*)', line)
            if match:
                letter, option_text = match.groups()
                option_text = re.sub(r'\s+', ' ', option_text.replace('\n', ' ')).strip()
                if option_text:
                    options_dict[letter] = option_text

        if len(options_dict) < 2: # Ensure we have at least two valid options
            continue

        # Format the final output string for this question
        current_question_str = f"{question_counter}. {question_text}\n"
        for letter in sorted(options_dict.keys()):
            current_question_str += f"{letter}) {options_dict[letter]}\n"
        
        formatted_questions.append(current_question_str)
        question_counter += 1

    return "\n\n".join(formatted_questions)

def main():
    '''
    Main function to read the temp file, process it, and save the final TXT.
    '''
    temp_file_path = "C:\\Users\\Program Geliştirme\\Desktop\\Koçluk programı\\temp_pdf_text.txt"
    output_file_path = "C:\\Users\\Program Geliştirme\\Desktop\\Koçluk programı\\extracted_questions.txt"

    try:
        with open(temp_file_path, 'r', encoding='utf-8') as f:
            print(f"Reading content from {temp_file_path}...")
            content = f.read()
        
        print("Formatting text and extracting questions...")
        formatted_text = format_questions_to_txt(content)
        
        with open(output_file_path, 'w', encoding='utf-8') as f:
            f.write(formatted_text)
        
        print(f"\nSuccessfully created the formatted TXT file at: {output_file_path}")
        num_questions = len(formatted_text.split('\n\n'))
        print(f"{num_questions} questions were extracted.")

    except FileNotFoundError:
        print(f"Error: The temporary file was not found at {temp_file_path}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
