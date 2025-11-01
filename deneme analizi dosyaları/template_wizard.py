#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Template Wizard - Yarı-otomatik şablon oluşturucu
"""

import os
import re
import tkinter as tk
from tkinter import ttk, messagebox, filedialog, scrolledtext
from typing import Dict, List, Tuple, Optional
import fitz  # PyMuPDF
from PIL import Image, ImageTk
import io


class PDFRegionSelector(tk.Toplevel):
    """PDF'den bölge seçimi için yardımcı pencere"""
    
    def __init__(self, parent, pdf_page, page_num: int):
        super().__init__(parent)
        self.title(f"PDF Sayfa {page_num} - Bölge Seç")
        self.geometry("900x700")
        
        self.pdf_page = pdf_page
        self.page_num = page_num
        self.selected_rect = None
        self.extracted_text = ""
        
        # PDF'i render et
        pix = pdf_page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        self.original_img = img
        self.photo = ImageTk.PhotoImage(img)
        
        # Canvas oluştur
        self.canvas = tk.Canvas(self, bg='white', cursor='cross')
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.canvas_img = self.canvas.create_image(0, 0, anchor=tk.NW, image=self.photo)
        
        # Mouse events
        self.start_x = None
        self.start_y = None
        self.rect_id = None
        
        self.canvas.bind("<Button-1>", self.on_mouse_down)
        self.canvas.bind("<B1-Motion>", self.on_mouse_drag)
        self.canvas.bind("<ButtonRelease-1>", self.on_mouse_up)
        
        # Butonlar
        btn_frame = tk.Frame(self)
        btn_frame.pack(side=tk.BOTTOM, fill=tk.X, padx=10, pady=10)
        
        tk.Button(btn_frame, text="Tamam", command=self.accept, 
                 bg='#4CAF50', fg='white', font=('Arial', 10, 'bold')).pack(side=tk.RIGHT, padx=5)
        tk.Button(btn_frame, text="İptal", command=self.cancel,
                 bg='#f44336', fg='white', font=('Arial', 10, 'bold')).pack(side=tk.RIGHT)
        tk.Button(btn_frame, text="Temizle", command=self.clear_selection).pack(side=tk.LEFT)
        
        # Seçili metin gösterimi
        tk.Label(btn_frame, text="Seçili Metin:", font=('Arial', 9, 'bold')).pack(side=tk.LEFT, padx=(20, 5))
        self.text_preview = tk.Label(btn_frame, text="", font=('Arial', 9), 
                                     fg='blue', wraplength=400)
        self.text_preview.pack(side=tk.LEFT)
        
        self.result = None
    
    def on_mouse_down(self, event):
        self.start_x = event.x
        self.start_y = event.y
    
    def on_mouse_drag(self, event):
        if self.rect_id:
            self.canvas.delete(self.rect_id)
        self.rect_id = self.canvas.create_rectangle(
            self.start_x, self.start_y, event.x, event.y,
            outline='red', width=2
        )
    
    def on_mouse_up(self, event):
        if self.start_x and self.start_y:
            # Koordinatları normalize et
            x1 = min(self.start_x, event.x)
            y1 = min(self.start_y, event.y)
            x2 = max(self.start_x, event.x)
            y2 = max(self.start_y, event.y)
            
            # PDF koordinatlarına dönüştür (2x zoom kullandık)
            scale = 0.5
            pdf_rect = fitz.Rect(x1 * scale, y1 * scale, x2 * scale, y2 * scale)
            
            # Metni çıkart
            self.extracted_text = self.pdf_page.get_text("text", clip=pdf_rect).strip()
            self.selected_rect = pdf_rect
            
            # Önizleme göster
            preview = self.extracted_text[:50] + ('...' if len(self.extracted_text) > 50 else '')
            self.text_preview.config(text=preview)
    
    def clear_selection(self):
        if self.rect_id:
            self.canvas.delete(self.rect_id)
        self.rect_id = None
        self.selected_rect = None
        self.extracted_text = ""
        self.text_preview.config(text="")
    
    def accept(self):
        if self.selected_rect:
            self.result = {
                'rect': self.selected_rect,
                'text': self.extracted_text
            }
            self.destroy()
        else:
            messagebox.showwarning("Uyarı", "Lütfen bir bölge seçin.")
    
    def cancel(self):
        self.result = None
        self.destroy()


class TemplateWizard(tk.Toplevel):
    """Şablon oluşturma sihirbazı"""
    
    def __init__(self, parent, pdf_path: str):
        super().__init__(parent)
        self.title("Şablon Oluşturma Sihirbazı")
        self.geometry("1000x750")
        
        self.pdf_path = pdf_path
        self.pdf_doc = None
        self.current_page = 0
        self.template_data = {
            'name': '',
            'signatures': [],
            'student_info': {},
            'subjects': [],
            'score_block': {},
            'rank_block': {}
        }
        
        # PDF aç
        try:
            self.pdf_doc = fitz.open(pdf_path)
            # İlk öğrenci sayfasını bul (genellikle 1. veya 2. sayfa)
            self.current_page = 1 if len(self.pdf_doc) > 1 else 0
        except Exception as e:
            messagebox.showerror("Hata", f"PDF açılamadı: {e}")
            self.destroy()
            return
        
        self.create_widgets()
        self.load_page()
    
    def create_widgets(self):
        """UI bileşenlerini oluştur"""
        
        # Ana container
        main_frame = tk.Frame(self, bg='#f5f5f5')
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Sol panel - Form
        left_panel = tk.Frame(main_frame, bg='white', relief=tk.RAISED, bd=2)
        left_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=False, padx=(0, 5))
        left_panel.config(width=400)
        
        # Başlık
        tk.Label(left_panel, text="Yeni Şablon Oluştur", 
                font=('Arial', 14, 'bold'), bg='white').pack(pady=10)
        
        # Scroll frame
        canvas = tk.Canvas(left_panel, bg='white')
        scrollbar = tk.Scrollbar(left_panel, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='white')
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        form = scrollable_frame
        
        # 1. Şablon Adı
        section_label("1. Şablon Adı (Yayınevi)", form).pack(pady=(10, 5))
        self.entry_name = tk.Entry(form, font=('Arial', 11), width=35)
        self.entry_name.pack(pady=5)
        
        # 2. Format İmzaları
        section_label("2. Format İmzaları (Her satır bir imza)", form).pack(pady=(15, 5))
        self.text_signatures = scrolledtext.ScrolledText(form, height=4, width=35, font=('Arial', 10))
        self.text_signatures.pack(pady=5)
        tk.Label(form, text="Örn: ÖĞRENCİ SINAV\nSONUÇ BELGESİ", 
                font=('Arial', 8), fg='gray', bg='white').pack()
        
        # 3. Öğrenci Bilgileri
        section_label("3. Öğrenci Bilgileri", form).pack(pady=(15, 5))
        
        tk.Button(form, text="📌 İsim Bölgesini Seç", 
                 command=lambda: self.select_region('student_name'),
                 bg='#2196F3', fg='white', font=('Arial', 10, 'bold')).pack(pady=5)
        self.label_student_name = tk.Label(form, text="Seçilmedi", fg='red', bg='white')
        self.label_student_name.pack()
        
        tk.Button(form, text="📌 Sınıf/Numara Bölgesini Seç",
                 command=lambda: self.select_region('student_class'),
                 bg='#2196F3', fg='white', font=('Arial', 10, 'bold')).pack(pady=5)
        self.label_student_class = tk.Label(form, text="Seçilmedi", fg='red', bg='white')
        self.label_student_class.pack()
        
        # 4. Dersler
        section_label("4. Dersler", form).pack(pady=(15, 5))
        
        self.subjects_frame = tk.Frame(form, bg='white')
        self.subjects_frame.pack(fill=tk.BOTH, pady=5)
        
        tk.Button(form, text="+ Ders Ekle", 
                 command=self.add_subject,
                 bg='#4CAF50', fg='white', font=('Arial', 10, 'bold')).pack(pady=5)
        
        # 5. Puan Bloğu
        section_label("5. Toplam Puan/Sıralama", form).pack(pady=(15, 5))
        
        tk.Button(form, text="📌 Puan Bölgesini Seç",
                 command=lambda: self.select_region('score_block'),
                 bg='#2196F3', fg='white', font=('Arial', 10, 'bold')).pack(pady=5)
        self.label_score = tk.Label(form, text="Seçilmedi", fg='red', bg='white')
        self.label_score.pack()
        
        # Sağ panel - PDF Preview
        right_panel = tk.Frame(main_frame, bg='white', relief=tk.RAISED, bd=2)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(5, 0))
        
        tk.Label(right_panel, text="PDF Önizleme", 
                font=('Arial', 12, 'bold'), bg='white').pack(pady=10)
        
        # PDF Canvas
        self.pdf_canvas = tk.Canvas(right_panel, bg='#eeeeee')
        self.pdf_canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Alt butonlar
        bottom_frame = tk.Frame(self, bg='#f5f5f5')
        bottom_frame.pack(side=tk.BOTTOM, fill=tk.X, padx=10, pady=10)
        
        tk.Button(bottom_frame, text="Test Et", command=self.test_template,
                 bg='#FF9800', fg='white', font=('Arial', 11, 'bold'), 
                 width=15).pack(side=tk.LEFT, padx=5)
        
        tk.Button(bottom_frame, text="💾 Kaydet", command=self.save_template,
                 bg='#4CAF50', fg='white', font=('Arial', 11, 'bold'), 
                 width=15).pack(side=tk.RIGHT, padx=5)
        
        tk.Button(bottom_frame, text="❌ İptal", command=self.destroy,
                 bg='#f44336', fg='white', font=('Arial', 11, 'bold'),
                 width=15).pack(side=tk.RIGHT, padx=5)
    
    def load_page(self):
        """PDF sayfasını yükle ve göster"""
        if not self.pdf_doc:
            return
        
        page = self.pdf_doc[self.current_page]
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        self.pdf_preview = ImageTk.PhotoImage(img)
        self.pdf_canvas.delete("all")
        self.pdf_canvas.create_image(10, 10, anchor=tk.NW, image=self.pdf_preview)
        self.pdf_canvas.config(scrollregion=self.pdf_canvas.bbox("all"))
    
    def select_region(self, field_type: str):
        """PDF'den bölge seç"""
        if not self.pdf_doc:
            return
        
        page = self.pdf_doc[self.current_page]
        selector = PDFRegionSelector(self, page, self.current_page + 1)
        self.wait_window(selector)
        
        if selector.result:
            text = selector.result['text']
            pattern = self.suggest_pattern(text, field_type)
            
            if field_type == 'student_name':
                self.template_data['student_info']['name_pattern'] = pattern
                self.label_student_name.config(
                    text=f"✓ {text[:30]}... → {pattern[:40]}...",
                    fg='green'
                )
            elif field_type == 'student_class':
                self.template_data['student_info']['class_pattern'] = pattern
                self.label_student_class.config(
                    text=f"✓ {text[:30]}... → {pattern[:40]}...",
                    fg='green'
                )
            elif field_type == 'score_block':
                self.template_data['score_block']['pattern'] = pattern
                self.label_score.config(
                    text=f"✓ {text[:30]}... → {pattern[:40]}...",
                    fg='green'
                )
    
    def suggest_pattern(self, text: str, field_type: str) -> str:
        """Metin için regex pattern öner"""
        if field_type == 'student_name':
            # İsim pattern - büyük harfler ve boşluk
            return r'([A-ZÇĞİÖŞÜ\s]{3,50})'
        elif field_type == 'student_class':
            # Sınıf/numara pattern
            if re.search(r'(\d+)/([A-Z]+)', text):
                return r'(\d+)/([A-Z]+)\s*-\s*(\d+)'
            return r'(\d{1,2})-([A-Z])\s+(\d+)'
        elif field_type == 'score_block':
            # Puan pattern
            return r'PUAN\s+([\d\.]+)'
        return text
    
    def add_subject(self):
        """Ders ekle"""
        subject_frame = tk.Frame(self.subjects_frame, bg='#f9f9f9', relief=tk.RIDGE, bd=1)
        subject_frame.pack(fill=tk.X, pady=5, padx=5)
        
        tk.Label(subject_frame, text="Ders Adı:", bg='#f9f9f9').grid(row=0, column=0, padx=5, pady=5)
        entry_subject = tk.Entry(subject_frame, width=20)
        entry_subject.grid(row=0, column=1, padx=5, pady=5)
        
        tk.Button(subject_frame, text="📌 Bölge Seç", 
                 command=lambda e=entry_subject: self.select_subject_region(e),
                 bg='#2196F3', fg='white', font=('Arial', 9)).grid(row=0, column=2, padx=5, pady=5)
        
        tk.Button(subject_frame, text="❌", command=subject_frame.destroy,
                 bg='#f44336', fg='white').grid(row=0, column=3, padx=5)
    
    def select_subject_region(self, subject_entry):
        """Ders bölgesini seç"""
        if not self.pdf_doc:
            return
        
        subject_name = subject_entry.get().strip()
        if not subject_name:
            messagebox.showwarning("Uyarı", "Önce ders adını girin.")
            return
        
        page = self.pdf_doc[self.current_page]
        selector = PDFRegionSelector(self, page, self.current_page + 1)
        self.wait_window(selector)
        
        if selector.result:
            text = selector.result['text']
            # Basit pattern önerisi
            pattern = f"{subject_name.upper()}[\\s\\S]*?Net[\\s\\n]+(\\d+)"
            
            self.template_data['subjects'].append({
                'name': subject_name,
                'pattern': pattern,
                'sample_text': text
            })
    
    def test_template(self):
        """Şablonu test et"""
        # Basit test - tüm sayfaları dene
        try:
            from modules.detector import FormatDetector
            from modules.extractors.template_extractor import TemplateExtractor
            
            # Şablon verilerini hazırla
            template = self.build_template_dict()
            if not template['name']:
                messagebox.showwarning("Uyarı", "Lütfen şablon adı girin.")
                return
            
            # Test
            extractor = TemplateExtractor()
            page_text = self.pdf_doc[self.current_page].get_text()
            data, conf = extractor.extract(page_text, template, None)
            
            # Sonuç göster
            result_text = f"Test Sonucu:\n\n"
            result_text += f"Güven Skoru: {conf:.2%}\n\n"
            result_text += f"Çıkarılan Veriler:\n"
            for key, value in data.items():
                if not key.startswith('_'):
                    result_text += f"  {key}: {value}\n"
            
            messagebox.showinfo("Test Sonucu", result_text)
        except Exception as e:
            messagebox.showerror("Test Hatası", f"Test başarısız: {e}")
    
    def build_template_dict(self) -> Dict:
        """Form verilerinden şablon dict oluştur"""
        import yaml
        
        template = {
            'name': self.entry_name.get().strip(),
            'priority': 10,
            'signatures': [s.strip() for s in self.text_signatures.get('1.0', 'end').split('\n') if s.strip()],
            'student_block': self.template_data['student_info'],
            'subjects': self.template_data['subjects'],
            'score_block': self.template_data['score_block'],
            'validation': {
                'min_confidence': 0.5,
                'min_valid_records': 0.6
            }
        }
        
        return template
    
    def save_template(self):
        """Şablonu YAML olarak kaydet"""
        template = self.build_template_dict()
        
        if not template['name']:
            messagebox.showwarning("Uyarı", "Lütfen şablon adı girin.")
            return
        
        # Dosya seç
        filename = filedialog.asksaveasfilename(
            defaultextension=".yaml",
            filetypes=[("YAML files", "*.yaml"), ("All files", "*.*")],
            initialfile=f"{template['name'].lower().replace(' ', '_')}.yaml"
        )
        
        if filename:
            try:
                import yaml
                with open(filename, 'w', encoding='utf-8') as f:
                    yaml.dump(template, f, allow_unicode=True, sort_keys=False)
                
                messagebox.showinfo("Başarılı", f"Şablon kaydedildi:\n{filename}")
                self.destroy()
            except Exception as e:
                messagebox.showerror("Hata", f"Kaydetme başarısız: {e}")


def section_label(text, parent):
    """Bölüm başlığı widget'ı"""
    return tk.Label(parent, text=text, font=('Arial', 11, 'bold'), 
                   bg='white', anchor='w')


# Örnek kullanım:
if __name__ == '__main__':
    root = tk.Tk()
    root.withdraw()
    
    pdf_path = filedialog.askopenfilename(
        title="PDF Seçin",
        filetypes=[("PDF files", "*.pdf")]
    )
    
    if pdf_path:
        wizard = TemplateWizard(root, pdf_path)
        root.mainloop()

