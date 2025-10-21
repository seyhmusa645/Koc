import os
import json
import re
import sys

# Ensure UTF-8 for stdout
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def parse_and_convert_to_json(source_dir, output_file):
    """
    Parses .txt files from a source directory, converts them to a specific JSON
    structure, and saves them to an output file.
    """
    all_questions = []
    
    # This regex is designed to capture questions and their options.
    # It looks for a question number, the question text, and then the A, B, C, D options.
    # re.DOTALL (or s) flag is crucial for '.' to match newlines.
    # It handles multi-line questions and options.
    question_pattern = re.compile(
        r"(\d+)\.\s*(.*?)\nA\)\s*(.*?)\nB\)\s*(.*?)\nC\)\s*(.*?)\nD\)\s*(.*?)(?=\n\n\d+\.|\Z)",
        re.DOTALL
    )

    print(f"''{source_dir}'' dizinindeki .txt dosyaları okunuyor...")

    # Ensure the source directory exists
    if not os.path.isdir(source_dir):
        print(f"Hata: Kaynak dizin bulunamadı: {source_dir}")
        return

    txt_files = [f for f in os.listdir(source_dir) if f.lower().endswith('.txt')]
    if not txt_files:
        print("Uyarı: İşlenecek .txt dosyası bulunamadı.")
        return

    for filename in txt_files:
        file_path = os.path.join(source_dir, filename)
        print(f"  -> İşleniyor: {filename}")
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Add newlines at the beginning and end to help the regex
            # This ensures questions at the very start or end are found.
            content = "\n\n" + content.strip() + "\n\n"

            matches = question_pattern.findall(content)
            
            if not matches:
                print(f"     ! Uyarı: {filename} içinde soru bulunamadı. Format kontrol edilebilir.")
                continue

            for match in matches:
                q_number, q_text, opt_a, opt_b, opt_c, opt_d = [item.strip() for item in match]
                
                pdf_name_base = os.path.splitext(filename)[0]
                
                question_data = {
                    "id": f"{pdf_name_base}_q{q_number}",
                    "pdf_name": pdf_name_base,
                    "page": 1, # Page info is not available in txt files
                    "question_number": q_number,
                    "question_text": q_text,
                    "options": {
                        "A": opt_a,
                        "B": opt_b,
                        "C": opt_c,
                        "D": opt_d
                    },
                    "answer": None,
                    "kazanim": None,
                    "subject": "Sosyal Bilgiler",
                    "outcome": None,
                    "outcome_text": None,
                    "matching_score": None
                }
                all_questions.append(question_data)
        
        except Exception as e:
            print(f"     ! Hata: {filename} işlenirken bir sorun oluştu: {e}")

    # Ensure the output directory exists
    output_dir = os.path.dirname(output_file)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Oluşturuldu: {output_dir} dizini.")

    # Write the JSON file
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(all_questions, f, ensure_ascii=False, indent=2)
        print(f"\nBaşarıyla {len(all_questions)} soru ''{output_file}'' dosyasına yazıldı.")
    except Exception as e:
        print(f"\n! Hata: JSON dosyası yazılırken bir sorun oluştu: {e}")


if __name__ == "__main__":
    # Define paths relative to the script's location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    
    source_directory = os.path.join(base_dir, "sosyal bilgiler 7 karışık")
    output_json_file = os.path.join(base_dir, "json", "sosyal bilgiler 7.json")
    
    parse_and_convert_to_json(source_directory, output_json_file)
