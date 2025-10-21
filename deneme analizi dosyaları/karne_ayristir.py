#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Karne PDF'sinden her öğrencinin bilgilerini ayrı dosyalara çıkartan betik
"""

import re
import sys

def parse_student_page(text):
    """Bir sayfadaki öğrenci bilgilerini parse eder"""
    student_data = {}
    
    # Öğrenci adı
    name_match = re.search(r'Öğrenci.*?Numara.*?Sınıf\s+(\S.*?)\s+(\d+)\s+([\d\-A-Z]+)', text, re.DOTALL)
    if name_match:
        student_data['ad_soyad'] = name_match.group(1).strip()
        student_data['numara'] = name_match.group(2).strip()
        student_data['sinif'] = name_match.group(3).strip()
    
    # LGS Puanı ve derece
    lgs_match = re.search(r'LGS\s+([\d,]+)\s+([\d,]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)', text)
    if lgs_match:
        student_data['lgs_puan'] = lgs_match.group(1)
        student_data['lgs_ortalama'] = lgs_match.group(2)
        student_data['sinif_derecesi'] = lgs_match.group(3)
        student_data['kurum_derecesi'] = lgs_match.group(4)
        student_data['ilce_derecesi'] = lgs_match.group(5)
        student_data['il_derecesi'] = lgs_match.group(6)
        student_data['genel_derece'] = lgs_match.group(7)
    
    # Katılımlar
    katilim_match = re.search(r'Katılımlar:\s+([\d\s]+)', text)
    if katilim_match:
        student_data['katilimlar'] = katilim_match.group(1).strip()
    
    # Ders bilgileri (Türkçe, Tarih, Din, İngilizce, Matematik, Fen)
    dersler = {}
    
    # Türkçe (15 veya 20 soru olabilir)
    turk_match = re.search(r'Türkçe\s+(15|20)\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)', text)
    if turk_match:
        dersler['Türkçe'] = {
            'dogru': turk_match.group(2),
            'yanlis': turk_match.group(3),
            'net': turk_match.group(4),
            'basari': turk_match.group(5),
            'sinif_ort': turk_match.group(6),
            'kurum_ort': turk_match.group(7),
            'genel_ort': turk_match.group(8)
        }
    
    # Tarih veya Sosyal Bilgiler (sınıfa göre değişir)
    # Önce Tarih dene (8. sınıf)
    tarih_match = re.search(r'Tarih\s+10\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)', text)
    if tarih_match:
        dersler['Tarih'] = {
            'dogru': tarih_match.group(1),
            'yanlis': tarih_match.group(2),
            'net': tarih_match.group(3),
            'basari': tarih_match.group(4),
            'sinif_ort': tarih_match.group(5),
            'kurum_ort': tarih_match.group(6),
            'genel_ort': tarih_match.group(7)
        }
    else:
        # Sosyal Bilgiler dene (5-7. sınıflar) - büyük veya küçük harf
        sos_match = re.search(r'(?:Sosyal Bilgiler|SOSYAL BİLGİLER)\s+10\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)', text)
        if sos_match:
            dersler['Sosyal Bilgiler'] = {
                'dogru': sos_match.group(1),
                'yanlis': sos_match.group(2),
                'net': sos_match.group(3),
                'basari': sos_match.group(4),
                'sinif_ort': sos_match.group(5),
                'kurum_ort': sos_match.group(6),
                'genel_ort': sos_match.group(7)
            }
    
    # Din Kültürü
    din_match = re.search(r'Din K\.ve A\.B\.\s+10\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)', text)
    if din_match:
        dersler['Din Kültürü'] = {
            'dogru': din_match.group(1),
            'yanlis': din_match.group(2),
            'net': din_match.group(3),
            'basari': din_match.group(4),
            'sinif_ort': din_match.group(5),
            'kurum_ort': din_match.group(6),
            'genel_ort': din_match.group(7)
        }
    
    # İngilizce
    ing_match = re.search(r'İngilizce\s+10\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)', text)
    if ing_match:
        dersler['İngilizce'] = {
            'dogru': ing_match.group(1),
            'yanlis': ing_match.group(2),
            'net': ing_match.group(3),
            'basari': ing_match.group(4),
            'sinif_ort': ing_match.group(5),
            'kurum_ort': ing_match.group(6),
            'genel_ort': ing_match.group(7)
        }
    
    # Matematik (15 veya 20 soru olabilir)
    mat_match = re.search(r'Matematik\s+(15|20)\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)', text)
    if mat_match:
        dersler['Matematik'] = {
            'dogru': mat_match.group(2),
            'yanlis': mat_match.group(3),
            'net': mat_match.group(4),
            'basari': mat_match.group(5),
            'sinif_ort': mat_match.group(6),
            'kurum_ort': mat_match.group(7),
            'genel_ort': mat_match.group(8)
        }
    
    # Fen (15 veya 20 soru olabilir)
    fen_match = re.search(r'Fen\s+(15|20)\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)', text)
    if fen_match:
        dersler['Fen'] = {
            'dogru': fen_match.group(2),
            'yanlis': fen_match.group(3),
            'net': fen_match.group(4),
            'basari': fen_match.group(5),
            'sinif_ort': fen_match.group(6),
            'kurum_ort': fen_match.group(7),
            'genel_ort': fen_match.group(8)
        }
    
    # Toplam (75 veya 90 soru olabilir)
    toplam_match = re.search(r'Toplam:\s+(75|90)\s+(\d+)\s+(\d+)\s+([\d,]+)\s+(\d+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)', text)
    if toplam_match:
        dersler['Toplam'] = {
            'dogru': toplam_match.group(2),
            'yanlis': toplam_match.group(3),
            'net': toplam_match.group(4),
            'basari': toplam_match.group(5),
            'sinif_ort': toplam_match.group(6),
            'kurum_ort': toplam_match.group(7),
            'genel_ort': toplam_match.group(8)
        }
    
    student_data['dersler'] = dersler
    
    # Cevap anahtarları
    cevaplar = {}
    
    # Türkçe cevaplar
    turk_cevap = re.search(r'Sözel \(TÜR\)\s+([A-Za-z]+)\s+Cevap Anh\.\s+[AB]\s+([A-Za-z]+)', text)
    if turk_cevap:
        cevaplar['Türkçe'] = {
            'ogrenci': turk_cevap.group(1),
            'dogru_cevap': turk_cevap.group(2)
        }
    
    # Tarih veya Sosyal Bilgiler cevapları
    tar_cevap = re.search(r'Sözel \(TAR\)\s+([A-Za-z]+)\s+Cevap Anh\.\s+[AB]\s+([A-Za-z]+)', text)
    if tar_cevap:
        cevaplar['Tarih'] = {
            'ogrenci': tar_cevap.group(1),
            'dogru_cevap': tar_cevap.group(2)
        }
    else:
        # Sosyal Bilgiler dene
        sos_cevap = re.search(r'Sözel \(SOS\)\s+([A-Za-z]+)\s+Cevap Anh\.\s+[AB]\s+([A-Za-z]+)', text)
        if sos_cevap:
            cevaplar['Sosyal Bilgiler'] = {
                'ogrenci': sos_cevap.group(1),
                'dogru_cevap': sos_cevap.group(2)
            }
    
    # Din cevaplar
    din_cevap = re.search(r'Sözel \(DİN\)\s+([A-Za-z]+)\s+Cevap Anh\.\s+[AB]\s+([A-Za-z]+)', text)
    if din_cevap:
        cevaplar['Din'] = {
            'ogrenci': din_cevap.group(1),
            'dogru_cevap': din_cevap.group(2)
        }
    
    # İngilizce cevaplar
    ing_cevap = re.search(r'Sözel \(İNG\)\s+([A-Za-z]+)\s+Cevap Anh\.\s+[AB]\s+([A-Za-z]+)', text)
    if ing_cevap:
        cevaplar['İngilizce'] = {
            'ogrenci': ing_cevap.group(1),
            'dogru_cevap': ing_cevap.group(2)
        }
    
    # Matematik cevaplar
    mat_cevap = re.search(r'Sayısal \(MAT\)\s+([A-Za-z\s]+)\s+Cevap Anh\.\s+[AB]\s+([A-Za-z]+)', text)
    if mat_cevap:
        cevaplar['Matematik'] = {
            'ogrenci': mat_cevap.group(1).strip(),
            'dogru_cevap': mat_cevap.group(2)
        }
    
    # Fen cevaplar
    fen_cevap = re.search(r'Sayısal \(FEN\)\s+([A-Za-z\s]+)\s+Cevap Anh\.\s+[AB]\s+([A-Za-z]+)', text)
    if fen_cevap:
        cevaplar['Fen'] = {
            'ogrenci': fen_cevap.group(1).strip(),
            'dogru_cevap': fen_cevap.group(2)
        }
    
    student_data['cevaplar'] = cevaplar
    
    # Kazanım bilgileri
    kazanimlar = {}
    
    # Tüm kazanımları bul
    # Türkçe kazanımları
    turk_kazanim_pattern = r'Sözel \(TÜR\)\s+Türkçe\s+S\s+D\s+Y\s+B%\s+(.*?)(?=Sözel \(TAR\)|Sayısal|$)'
    turk_kazanim_match = re.search(turk_kazanim_pattern, text, re.DOTALL)
    if turk_kazanim_match:
        kazanim_text = turk_kazanim_match.group(1)
        turk_kazanimlar = []
        for line in kazanim_text.strip().split('\n'):
            kazanim_match = re.match(r'(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$', line.strip())
            if kazanim_match:
                turk_kazanimlar.append({
                    'kazanim': kazanim_match.group(1).strip(),
                    'soru': kazanim_match.group(2),
                    'dogru': kazanim_match.group(3),
                    'yanlis': kazanim_match.group(4),
                    'basari': kazanim_match.group(5)
                })
        if turk_kazanimlar:
            kazanimlar['Türkçe'] = turk_kazanimlar
    
    # Tarih veya Sosyal Bilgiler kazanımları
    tarih_kazanim_pattern = r'Sözel \(TAR\)\s+Tarih\s+S\s+D\s+Y\s+B%\s+(.*?)(?=Sözel \(DİN\)|KAZANIM|$)'
    tarih_kazanim_match = re.search(tarih_kazanim_pattern, text, re.DOTALL)
    if tarih_kazanim_match:
        kazanim_text = tarih_kazanim_match.group(1)
        tarih_kazanimlar = []
        for line in kazanim_text.strip().split('\n'):
            kazanim_match = re.match(r'(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$', line.strip())
            if kazanim_match:
                tarih_kazanimlar.append({
                    'kazanim': kazanim_match.group(1).strip(),
                    'soru': kazanim_match.group(2),
                    'dogru': kazanim_match.group(3),
                    'yanlis': kazanim_match.group(4),
                    'basari': kazanim_match.group(5)
                })
        if tarih_kazanimlar:
            kazanimlar['Tarih'] = tarih_kazanimlar
    else:
        # Sosyal Bilgiler dene
        sos_kazanim_pattern = r'Sözel \(SOS\)\s+Sosyal Bilgiler\s+S\s+D\s+Y\s+B%\s+(.*?)(?=Sözel \(DİN\)|KAZANIM|$)'
        sos_kazanim_match = re.search(sos_kazanim_pattern, text, re.DOTALL)
        if sos_kazanim_match:
            kazanim_text = sos_kazanim_match.group(1)
            sos_kazanimlar = []
            for line in kazanim_text.strip().split('\n'):
                kazanim_match = re.match(r'(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$', line.strip())
                if kazanim_match:
                    sos_kazanimlar.append({
                        'kazanim': kazanim_match.group(1).strip(),
                        'soru': kazanim_match.group(2),
                        'dogru': kazanim_match.group(3),
                        'yanlis': kazanim_match.group(4),
                        'basari': kazanim_match.group(5)
                    })
            if sos_kazanimlar:
                kazanimlar['Sosyal Bilgiler'] = sos_kazanimlar
    
    # Din kazanımları
    din_kazanim_pattern = r'Sözel \(DİN\)\s+Din K\.ve A\.B\.\s+S\s+D\s+Y\s+B%\s+(.*?)(?=Sözel \(İNG\)|KAZANIM|$)'
    din_kazanim_match = re.search(din_kazanim_pattern, text, re.DOTALL)
    if din_kazanim_match:
        kazanim_text = din_kazanim_match.group(1)
        din_kazanimlar = []
        for line in kazanim_text.strip().split('\n'):
            kazanim_match = re.match(r'(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$', line.strip())
            if kazanim_match:
                din_kazanimlar.append({
                    'kazanim': kazanim_match.group(1).strip(),
                    'soru': kazanim_match.group(2),
                    'dogru': kazanim_match.group(3),
                    'yanlis': kazanim_match.group(4),
                    'basari': kazanim_match.group(5)
                })
        if din_kazanimlar:
            kazanimlar['Din'] = din_kazanimlar
    
    # İngilizce kazanımları
    ing_kazanim_pattern = r'Sözel \(İNG\)\s+İngilizce\s+S\s+D\s+Y\s+B%\s+(.*?)(?=Sayısal|KAZANIM|$)'
    ing_kazanim_match = re.search(ing_kazanim_pattern, text, re.DOTALL)
    if ing_kazanim_match:
        kazanim_text = ing_kazanim_match.group(1)
        ing_kazanimlar = []
        for line in kazanim_text.strip().split('\n'):
            # İngilizce kazanımları çok uzun olabilir, sadece sayıları al
            if re.search(r'\d+\s+\d+\s+\d+\s+\d+\s*$', line):
                parts = line.rsplit(None, 4)  # Son 4 sayıyı al
                if len(parts) == 5:
                    ing_kazanimlar.append({
                        'kazanim': parts[0].strip(),
                        'soru': parts[1],
                        'dogru': parts[2],
                        'yanlis': parts[3],
                        'basari': parts[4]
                    })
        if ing_kazanimlar:
            kazanimlar['İngilizce'] = ing_kazanimlar
    
    # Matematik kazanımları
    mat_kazanim_pattern = r'Sayısal \(MAT\)\s+Matematik\s+S\s+D\s+Y\s+B%\s+(.*?)(?=Sayısal \(FEN\)|$)'
    mat_kazanim_match = re.search(mat_kazanim_pattern, text, re.DOTALL)
    if mat_kazanim_match:
        kazanim_text = mat_kazanim_match.group(1)
        mat_kazanimlar = []
        for line in kazanim_text.strip().split('\n'):
            if re.search(r'\d+\s+\d+\s+\d+\s+\d+\s*$', line):
                parts = line.rsplit(None, 4)
                if len(parts) == 5:
                    mat_kazanimlar.append({
                        'kazanim': parts[0].strip(),
                        'soru': parts[1],
                        'dogru': parts[2],
                        'yanlis': parts[3],
                        'basari': parts[4]
                    })
        if mat_kazanimlar:
            kazanimlar['Matematik'] = mat_kazanimlar
    
    # Fen kazanımları
    fen_kazanim_pattern = r'Sayısal \(FEN\)\s+Fen\s+S\s+D\s+Y\s+B%\s+(.*?)(?=Powered by|$)'
    fen_kazanim_match = re.search(fen_kazanim_pattern, text, re.DOTALL)
    if fen_kazanim_match:
        kazanim_text = fen_kazanim_match.group(1)
        fen_kazanimlar = []
        for line in kazanim_text.strip().split('\n'):
            if re.search(r'\d+\s+\d+\s+\d+\s+\d+\s*$', line):
                parts = line.rsplit(None, 4)
                if len(parts) == 5:
                    fen_kazanimlar.append({
                        'kazanim': parts[0].strip(),
                        'soru': parts[1],
                        'dogru': parts[2],
                        'yanlis': parts[3],
                        'basari': parts[4]
                    })
        if fen_kazanimlar:
            kazanimlar['Fen'] = fen_kazanimlar
    
    student_data['kazanimlar'] = kazanimlar
    
    return student_data

def format_student_data(data):
    """Öğrenci verisini düzenli formatta string'e çevirir"""
    output = []
    output.append("=" * 80)
    output.append(f"ÖĞRENCİ BİLGİLERİ")
    output.append("=" * 80)
    output.append(f"Ad Soyad: {data.get('ad_soyad', 'Bulunamadı')}")
    output.append(f"Numara: {data.get('numara', 'Bulunamadı')}")
    output.append(f"Sınıf: {data.get('sinif', 'Bulunamadı')}")
    output.append(f"Katılımlar: {data.get('katilimlar', 'Bulunamadı')}")
    output.append("")
    
    output.append("-" * 80)
    output.append("LGS PUANLARI VE DERECELER")
    output.append("-" * 80)
    output.append(f"LGS Puanı: {data.get('lgs_puan', 'Bulunamadı')}")
    output.append(f"LGS Ortalaması: {data.get('lgs_ortalama', 'Bulunamadı')}")
    output.append(f"Sınıf Derecesi: {data.get('sinif_derecesi', 'Bulunamadı')}")
    output.append(f"Kurum Derecesi: {data.get('kurum_derecesi', 'Bulunamadı')}")
    output.append(f"İlçe Derecesi: {data.get('ilce_derecesi', 'Bulunamadı')}")
    output.append(f"İl Derecesi: {data.get('il_derecesi', 'Bulunamadı')}")
    output.append(f"Genel Derece: {data.get('genel_derece', 'Bulunamadı')}")
    output.append("")
    
    output.append("-" * 80)
    output.append("DERS BAŞARI ANALİZİ")
    output.append("-" * 80)
    output.append(f"{'Ders':<15} {'Doğru':<8} {'Yanlış':<8} {'Net':<10} {'Başarı%':<10} {'Sınıf Ort':<12} {'Kurum Ort':<12} {'Genel Ort':<12}")
    output.append("-" * 80)
    
    dersler = data.get('dersler', {})
    # Dinamik ders listesi - Tarih veya Sosyal Bilgiler olabilir
    ders_listesi = ['Türkçe', 'Tarih', 'Sosyal Bilgiler', 'Din Kültürü', 'İngilizce', 'Matematik', 'Fen', 'Toplam']
    for ders_adi in ders_listesi:
        if ders_adi in dersler:
            ders = dersler[ders_adi]
            output.append(f"{ders_adi:<15} {ders.get('dogru', '-'):<8} {ders.get('yanlis', '-'):<8} {ders.get('net', '-'):<10} {ders.get('basari', '-'):<10} {ders.get('sinif_ort', '-'):<12} {ders.get('kurum_ort', '-'):<12} {ders.get('genel_ort', '-'):<12}")
    
    output.append("")
    output.append("-" * 80)
    output.append("CEVAP ANAHTARLARI")
    output.append("-" * 80)
    
    cevaplar = data.get('cevaplar', {})
    # Dinamik ders listesi - Tarih veya Sosyal Bilgiler olabilir
    cevap_dersleri = ['Türkçe', 'Tarih', 'Sosyal Bilgiler', 'Din', 'İngilizce', 'Matematik', 'Fen']
    for ders_adi in cevap_dersleri:
        if ders_adi in cevaplar:
            cevap = cevaplar[ders_adi]
            output.append(f"\n{ders_adi}:")
            output.append(f"  Öğrenci Cevapları: {cevap.get('ogrenci', '-')}")
            output.append(f"  Doğru Cevaplar:   {cevap.get('dogru_cevap', '-')}")
    
    # Kazanım bilgileri
    output.append("")
    output.append("-" * 80)
    output.append("KAZANIM ANALİZİ (Ders Bazlı Detaylar)")
    output.append("-" * 80)
    
    kazanimlar = data.get('kazanimlar', {})
    if kazanimlar:
        # Dinamik ders listesi - Tarih veya Sosyal Bilgiler olabilir
        kazanim_dersleri = ['Türkçe', 'Tarih', 'Sosyal Bilgiler', 'Din', 'İngilizce', 'Matematik', 'Fen']
        for ders_adi in kazanim_dersleri:
            if ders_adi in kazanimlar:
                output.append(f"\n### {ders_adi} Kazanımları ###")
                output.append(f"{'Kazanım':<70} {'S':<5} {'D':<5} {'Y':<5} {'B%':<5}")
                output.append("-" * 80)
                for kazanim in kazanimlar[ders_adi]:
                    kazanim_text = kazanim['kazanim'][:70]  # İlk 70 karakter
                    output.append(f"{kazanim_text:<70} {kazanim['soru']:<5} {kazanim['dogru']:<5} {kazanim['yanlis']:<5} {kazanim['basari']:<5}")
    else:
        output.append("\nKazanım bilgisi bulunamadı.")
    
    output.append("")
    output.append("=" * 80)
    
    return "\n".join(output)

def extract_from_text_file(input_file, output_dir):
    """Text dosyasından öğrenci bilgilerini çıkarır"""
    import os
    
    # Output dizinini oluştur
    os.makedirs(output_dir, exist_ok=True)
    
    # Dosyayı oku
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Sayfaları ayır (her sayfa "SONUÇ BELGESİ" ile başlar)
    pages = re.split(r'(?=SONUÇ BELGESİ)', content)
    
    print(f"Toplam {len(pages)} sayfa bulundu.")
    
    for i, page in enumerate(pages):
        if not page.strip() or 'SONUÇ BELGESİ' not in page:
            continue
        
        print(f"\nSayfa {i+1} işleniyor...")
        
        # Öğrenci bilgilerini parse et
        student_data = parse_student_page(page)
        
        if not student_data.get('ad_soyad'):
            print(f"  Sayfa {i+1}: Öğrenci adı bulunamadı, atlanıyor.")
            continue
        
        # Dosya adını oluştur
        ad_soyad = student_data['ad_soyad'].replace(' ', '_')
        # Türkçe karakterleri düzelt
        ad_soyad = ad_soyad.replace('İ', 'I').replace('ı', 'i').replace('Ğ', 'G').replace('ğ', 'g')
        ad_soyad = ad_soyad.replace('Ü', 'U').replace('ü', 'u').replace('Ş', 'S').replace('ş', 's')
        ad_soyad = ad_soyad.replace('Ö', 'O').replace('ö', 'o').replace('Ç', 'C').replace('ç', 'c')
        
        output_file = os.path.join(output_dir, f"{ad_soyad}.txt")
        
        # Formatlanmış veriyi yaz
        formatted_data = format_student_data(student_data)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(formatted_data)
        
        print(f"  ✓ {student_data['ad_soyad']} için dosya oluşturuldu: {output_file}")

def main():
    """Ana fonksiyon"""
    import os
    
    # Kullanım
    print("=" * 80)
    print("KARNE PDF'DEN ÖĞRENCİ BİLGİLERİ ÇIKARMA ARACI")
    print("=" * 80)
    print()
    
    if len(sys.argv) < 2:
        print("Kullanım: python karne_ayristir.py <pdf_dosyasi_veya_text_dosyasi> [cikti_dizini]")
        print()
        print("Örnek:")
        print("  python karne_ayristir.py karne.pdf")
        print("  python karne_ayristir.py karne.txt ogrenciler/")
        return
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "ogrenci_karnelik"
    
    if not os.path.exists(input_file):
        print(f"HATA: {input_file} dosyası bulunamadı!")
        return
    
    # PDF ise önce text'e çevir
    if input_file.lower().endswith('.pdf'):
        print("PDF dosyası tespit edildi. PyMuPDF ile metne çeviriliyor...")
        try:
            import fitz  # PyMuPDF
            
            # PDF'i aç
            doc = fitz.open(input_file)
            
            # Tüm sayfaları text olarak çıkar
            all_text = ""
            for page_num in range(len(doc)):
                page = doc[page_num]
                all_text += page.get_text()
            
            # Geçici text dosyasına yaz
            temp_text_file = input_file.replace('.pdf', '_temp.txt')
            with open(temp_text_file, 'w', encoding='utf-8') as f:
                f.write(all_text)
            
            print(f"PDF {len(doc)} sayfa olarak text'e çevrildi.")
            doc.close()
            
            # Text dosyasından çıkar
            extract_from_text_file(temp_text_file, output_dir)
            
            # Geçici dosyayı sil
            os.remove(temp_text_file)
            
        except ImportError:
            print("HATA: PyMuPDF (fitz) yüklü değil!")
            print("Yüklemek için: pip install PyMuPDF")
            return
    else:
        # Direkt text dosyası
        extract_from_text_file(input_file, output_dir)
    
    print()
    print("=" * 80)
    print(f"İşlem tamamlandı! Tüm öğrenci dosyaları '{output_dir}' dizinine kaydedildi.")
    print("=" * 80)

if __name__ == "__main__":
    main()
