import json
import os
import sys

# Hardcoded values for this run (will be set for each file)
input_file = r'C:\Users\Program Geliştirme\Desktop\Koçluk programı\8. Sınıf Sosyal Bilgiler.txt' # Example
subject_key = "inkilap" # Example
grade_level = "8" # Example

output_file = r'C:\Users\Program Geliştirme\Desktop\Koçluk programı\haftalikPlan.json'

# Load existing haftalikPlan.json if it exists
if os.path.exists(output_file):
    try:
        with open(output_file, 'r', encoding='utf8') as f:
            loaded_data = json.load(f) # Load into a temporary variable
        haftalik_plan = loaded_data # Assign after successful load
        print(f"DEBUG: Loaded existing haftalik_plan (keys): {haftalik_plan.keys()}") # NEW DEBUG PRINT
        print(f"DEBUG: Loaded existing haftalik_plan (full): {haftalik_plan}") # NEW DEBUG PRINT
    except json.JSONDecodeError as e:
        print(f"Warning: {output_file} is malformed ({e}). Starting with an empty plan.")
        haftalik_plan = {}
else:
    haftalik_plan = {}

# Ensure the grade and subject structure exists
if grade_level not in haftalik_plan:
    haftalik_plan[grade_level] = {}
if subject_key not in haftalik_plan[grade_level]:
    haftalik_plan[grade_level][subject_key] = {}


try:
    with open(input_file, 'rb') as f: # Read as binary
        raw_content = f.read()
    
    # Decode using cp1254
    content = raw_content.decode('cp1254')

    # Split by '\r' to get all individual fields. This assumes '\r' is the primary delimiter.
    all_fields = [field.strip() for field in content.split('\r') if field.strip()]

    if not all_fields:
        print("Input file is empty or could not be parsed.")
        sys.exit(1)

    # Assuming the first 9 fields are headers
    num_headers = 9 # TARIH, HAFTA, SAAT, ÖGRENME ALANI, IÇERIK ÇERÇEVESI, ÖGRENME ÇIKTILARI, SÜREÇ BILESENLERI, ÖGRENME BECERILERI, DEGERLER
    if len(all_fields) < num_headers:
        print(f"Error: Not enough fields to extract headers. Expected at least {num_headers}, found {len(all_fields)}.")
        sys.exit(1)

    headers = all_fields[0:num_headers]

    # Find indices of HAFTA and KAZANIM
    try:
        hafta_idx = headers.index('HAFTA')
        # Try to find 'KAZANIM' first, then 'ÖGRENME ÇIKTILARI'
        if 'KAZANIM' in headers:
            kazanim_idx = headers.index('KAZANIM')
        elif 'ÖGRENME ÇIKTILARI' in headers:
            kazanim_idx = headers.index('ÖGRENME ÇIKTILARI')
        else:
            raise ValueError("Neither 'KAZANIM' nor 'ÖGRENME ÇIKTILARI' header found.")
    except ValueError as e:
        print(f"Required header not found: {e}")
        print(f"Headers found: {headers}")
        sys.exit(1)

    # Process data fields, starting after the headers
    data_fields = all_fields[num_headers:]
    
    for i in range(0, len(data_fields), num_headers):
        row_parts = data_fields[i : i + num_headers]
        if len(row_parts) == num_headers: # Ensure it's a complete row
            hafta_str = row_parts[hafta_idx].strip()
            kazanim_full_text = row_parts[kazanim_idx].strip()

            # Remove the ID part (e.g., "ITA.8.1.1.")
            kazanim_display = kazanim_full_text
            if '.' in kazanim_full_text and kazanim_full_text.split('.')[0].isupper():
                kazanim_display = '.'.join(kazanim_full_text.split('.')[1:]).strip()
            
            # Further shorten if still too long, e.g., take first 10 words or first sentence
            if len(kazanim_display) > 50: # If it's still long
                first_sentence_end = kazanim_display.find('.')
                if first_sentence_end != -1 and first_sentence_end < 50:
                    kazanim_display = kazanim_display[:first_sentence_end + 1]
                else:
                    # Take first 10 words and add ellipsis
                    words = kazanim_display.split(' ')
                    kazanim_display = ' '.join(words[:10])
                    if len(words) > 10:
                        kazanim_display += '...'
            
            kazanim = kazanim_display # Use the shortened version

            if hafta_str and kazanim:
                # Extract week number (e.g., "1. Hafta" -> "1")
                week_num_match = ''.join(filter(str.isdigit, hafta_str.split('.')[0]))
                if week_num_match:
                    week_num = int(week_num_match)
                    if str(week_num) not in haftalik_plan[grade_level][subject_key]:
                        haftalik_plan[grade_level][subject_key][str(week_num)] = []
                    if kazanim not in haftalik_plan[grade_level][subject_key][str(week_num)]:
                        haftalik_plan[grade_level][subject_key][str(week_num)].append(kazanim)

except FileNotFoundError:
    print(f"Error: Input file not found at {input_file}")
    sys.exit(1)
except Exception as e:
    print(f"An unexpected error occurred: {e}")
    sys.exit(1)

try:
    with open(output_file, 'w', encoding='utf8') as f:
        json.dump(haftalik_plan, f, ensure_ascii=False, indent=2)
    print(f"Successfully created {output_file}")
except Exception as e:
    print(f"Error writing to output file: {e}")