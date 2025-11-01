#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

# Ensure module path
BASE_DIR = os.path.dirname(__file__) or '.'
sys.path.insert(0, BASE_DIR)

from karne_excel_v2 import extract_to_excel_v2


class KarneGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Karne PDF -> Excel")
        self.geometry("720x420")
        self.resizable(False, False)

        self.pdf_path_var = tk.StringVar()
        self.out_path_var = tk.StringVar(value=os.path.join(BASE_DIR, "ogrenci_karneleri.xlsx"))
        self.status_var = tk.StringVar(value="Hazır")

        self.create_widgets()

    def create_widgets(self):
        pad = 10

        frm = ttk.Frame(self)
        frm.pack(fill=tk.BOTH, expand=True, padx=pad, pady=pad)

        # PDF file selector
        ttk.Label(frm, text="PDF Dosyası:").grid(row=0, column=0, sticky=tk.W)
        pdf_entry = ttk.Entry(frm, textvariable=self.pdf_path_var, width=70)
        pdf_entry.grid(row=1, column=0, columnspan=2, sticky=tk.W)
        ttk.Button(frm, text="Gözat...", command=self.browse_pdf).grid(row=1, column=2, sticky=tk.W, padx=(6,0))

        # Output file selector
        ttk.Label(frm, text="Çıktı Excel Dosyası:").grid(row=2, column=0, sticky=tk.W, pady=(pad,0))
        out_entry = ttk.Entry(frm, textvariable=self.out_path_var, width=70)
        out_entry.grid(row=3, column=0, columnspan=2, sticky=tk.W)
        ttk.Button(frm, text="Kaydet...", command=self.browse_output).grid(row=3, column=2, sticky=tk.W, padx=(6,0))

        # Run button
        self.run_btn = ttk.Button(frm, text="Çalıştır", command=self.on_run)
        self.run_btn.grid(row=4, column=0, sticky=tk.W, pady=(pad,0))
        ttk.Button(frm, text="Klasörü Aç", command=self.open_folder).grid(row=4, column=1, sticky=tk.W, pady=(pad,0))

        # Status
        ttk.Label(frm, textvariable=self.status_var).grid(row=4, column=2, sticky=tk.E)

        # Log area
        ttk.Label(frm, text="İşlem Günlüğü:").grid(row=5, column=0, sticky=tk.W, pady=(pad,0))
        self.log = tk.Text(frm, height=14, width=92, state=tk.DISABLED)
        self.log.grid(row=6, column=0, columnspan=3, sticky=tk.W)

        # Grid weights
        for c in range(3):
            frm.grid_columnconfigure(c, weight=1)

    def browse_pdf(self):
        path = filedialog.askopenfilename(
            title="PDF Seç",
            filetypes=[("PDF", "*.pdf"), ("Tümü", "*.*")],
            initialdir=BASE_DIR,
        )
        if path:
            self.pdf_path_var.set(path)
            # Suggest output name
            base = os.path.splitext(os.path.basename(path))[0]
            self.out_path_var.set(os.path.join(os.path.dirname(path), f"{base}.xlsx"))

    def browse_output(self):
        path = filedialog.asksaveasfilename(
            title="Excel Kaydet",
            defaultextension=".xlsx",
            filetypes=[("Excel", "*.xlsx")],
            initialdir=BASE_DIR,
            initialfile=os.path.basename(self.out_path_var.get()) or "ogrenci_karneleri.xlsx",
        )
        if path:
            self.out_path_var.set(path)

    def open_folder(self):
        out_path = self.out_path_var.get().strip()
        folder = os.path.dirname(out_path) if out_path else BASE_DIR
        if os.path.isdir(folder):
            if sys.platform.startswith("win"):
                os.startfile(folder)
            elif sys.platform == "darwin":
                os.system(f"open '{folder}'")
            else:
                os.system(f"xdg-open '{folder}'")

    def on_run(self):
        pdf = self.pdf_path_var.get().strip()
        out = self.out_path_var.get().strip()

        if not pdf or not os.path.exists(pdf):
            messagebox.showerror("Hata", "PDF dosyası seçilmedi veya bulunamadı.")
            return
        if not out:
            messagebox.showerror("Hata", "Çıktı dosyası yolu geçersiz.")
            return

        self.run_btn.config(state=tk.DISABLED)
        self.append_log("[OK] İşlem başladı\n")
        self.status_var.set("Çalışıyor...")

        t = threading.Thread(target=self.worker, args=(pdf, out), daemon=True)
        t.start()

    def worker(self, pdf, out):
        # Redirect stdout to log
        class LogWriter:
            def __init__(self, cb):
                self.cb = cb
            def write(self, s):
                if s:
                    self.cb(s)
            def flush(self):
                pass
        prev_stdout = sys.stdout
        sys.stdout = LogWriter(self.append_log)
        try:
            extract_to_excel_v2(pdf, out)
            self.append_log("\n[OK] Bitti\n")
            self.status_var.set("Tamamlandı")
            messagebox.showinfo("Tamam", f"Excel oluşturuldu:\n{out}")
        except Exception as e:
            self.append_log(f"\n[HATA] {e}\n")
            self.status_var.set("Hata")
            messagebox.showerror("Hata", str(e))
        finally:
            sys.stdout = prev_stdout
            self.run_btn.config(state=tk.NORMAL)

    def append_log(self, text):
        self.log.configure(state=tk.NORMAL)
        self.log.insert(tk.END, text)
        self.log.see(tk.END)
        self.log.configure(state=tk.DISABLED)


if __name__ == "__main__":
    app = KarneGUI()
    app.mainloop()
