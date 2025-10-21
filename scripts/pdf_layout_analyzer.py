import fitz  # PyMuPDF
import os

def analyze_pdf_layout(pdf_path):
    """
    Analyzes the layout of a PDF file, printing the coordinates and content
    of text blocks and images for each page.
    """
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"Error opening or reading PDF file: {e}")
        return

    print(f"Analyzing layout for: {pdf_path}\n")

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        print(f"--- PAGE {page_num + 1} ---")

        # Get text blocks with coordinates
        blocks = page.get_text("blocks")
        blocks.sort(key=lambda b: (b[1], b[0]))  # Sort by vertical, then horizontal position

        for b in blocks:
            x0, y0, x1, y1, text, _, _ = b
            # Clean up text and print block info
            clean_text = text.strip().replace('\n', ' ')
            if clean_text:
                print(f"TEXT BLOCK: ({x0:.2f}, {y0:.2f}, {x1:.2f}, {y1:.2f}) -> \"{clean_text}\"")

        # Get images with coordinates
        images = page.get_images(full=True)
        
        for img_index, img in enumerate(images):
            xref = img[0]
            # The bbox is the last element in the list returned by get_images
            try:
                bbox = page.get_image_bbox(img)
                print(f"IMAGE: xref={xref} at ({bbox.x0:.2f}, {bbox.y0:.2f}, {bbox.x1:.2f}, {bbox.y1:.2f})")
            except ValueError:
                print(f"IMAGE: xref={xref} - Could not get bounding box.")
            
        print("\n")

    doc.close()

if __name__ == "__main__":
    # Hardcode the path to avoid shell argument issues
    pdf_file_to_analyze = r"C:\Users\Program Geliştirme\Desktop\Koçluk programı - soru tabanlı kullanıcı tabanlı\assets\mat_tek_1.pdf"
    analyze_pdf_layout(pdf_file_to_analyze)
