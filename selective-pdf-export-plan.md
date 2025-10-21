# 📄 Seçici PDF Export ve Toplu Rapor Sistemi - Geliştirme Planı

## 🎯 Problemler

### Problem 1: Sadece İstenen Bölümü PDF Olarak Kaydetme
**Mevcut Durum:**
- `window.electronAPI.exportToPDF()` **tüm sayfayı** yazdırıyor
- Kullanıcı sadece belirli bir grafik/tablo/rapor istese bile tüm sayfa PDF'e dönüşüyor

**İstenen Durum:**
- Kullanıcı **sadece istediği bölümü** (grafik, tablo, rapor) PDF olarak kaydedebilmeli
- Her bölüm için ayrı "PDF olarak kaydet" butonu olmalı

### Problem 2: Toplu Rapor Oluşturma
**Mevcut Durum:**
- Her öğrenci için tek tek rapor sekmesine gidip PDF kaydetmek gerekiyor
- Toplu export sistemi yok

**İstenen Durum:**
- Seçilen öğrenciler için **toplu rapor** oluşturabilme
- Örnek: "8/A sınıfındaki tüm öğrencilerin performans raporunu PDF olarak kaydet"
- Her öğrenci için ayrı PDF veya tek PDF içinde birden fazla sayfa

## 🔍 Mevcut Sistem Analizi

### PDF Export Mekanizması (src/main.js)
```javascript
ipcMain.handle('export-to-pdf', async (event) => {
  // TÜM PENCEREYI YAZDIRIR
  const pdfData = await win.webContents.printToPDF(pdfOptions);
  
  // Kullanıcıya kaydetme dialogu göster
  const result = await dialog.showSaveDialog(win, {...});
  
  // PDF dosyasını kaydet
  fs.writeFileSync(result.filePath, pdfData);
});
```

**Problem:** `win.webContents.printToPDF()` tüm window'u yazdırır, seçici değil.

### Mevcut PDF Export Kullanımları
1. **Raporlar** (`exportReportsToPDF()`) - Tüm raporlar sekmesi
2. **Etütler** (`exportEtutToPDF()`) - Tüm etüt sayfası
3. **Değerlendirme** (`exportEvaluationToPDF()`) - Tüm değerlendirme sayfası
4. **Sınıf Analizi** (`exportClassAnalysisToPDF()`) - Tüm sınıf analizi
5. **Hafta Sonu Programı** (`exportWeekendScheduleToPDF()`) - Tüm program

## 💡 Çözüm Yaklaşımları

### Yaklaşım 1: CSS Print Media Queries ile Seçici Yazdırma (ÖNERİLEN) ⭐

**Nasıl Çalışır:**
1. Her PDF export edilebilir bölüme unique ID/class ver
2. CSS `@media print` ile sadece istenen bölümü görünür yap
3. Diğer tüm bölümleri `display: none` yap
4. PDF oluşturduktan sonra CSS'i geri al

**Avantajlar:**
- ✅ Mevcut altyapıyı kullanır
- ✅ Hızlı ve verimli
- ✅ Electron'un native PDF özelliği
- ✅ Az kod değişikliği

**Dezavantajlar:**
- ⚠️ CSS yönetimi gerekli
- ⚠️ Print preview kontrolü

### Yaklaşım 2: HTML to Canvas to PDF (jsPDF + html2canvas)

**Nasıl Çalışır:**
1. Belirli DOM elementini seç
2. `html2canvas` ile canvas'a dönüştür
3. `jsPDF` ile PDF oluştur

**Avantajlar:**
- ✅ Çok esnek
- ✅ Belirli element seçimi kolay
- ✅ Özelleştirilebilir

**Dezavantajlar:**
- ❌ Ekstra kütüphane gerekiyor
- ❌ Daha yavaş
- ❌ Grafiklerde kalite kaybı olabilir

### Yaklaşım 3: Toplu Rapor için Backend PDF Generator

**Nasıl Çalışır:**
1. Backend'de PDF oluşturma servisi
2. Öğrenci verilerini al
3. Her öğrenci için HTML rapor oluştur
4. Tek PDF'de birleştir

**Avantajlar:**
- ✅ Çok güçlü
- ✅ Server-side işlem
- ✅ Toplu işlem için ideal

**Dezavantajlar:**
- ❌ Karmaşık
- ❌ Ekstra kütüphane (puppeteer, PDFKit)
- ❌ Uzun geliştirme süresi

## 📋 ÖNERİLEN ÇÖZÜM: Hibrit Yaklaşım

### Faz 1: Seçici PDF Export (CSS Print Media)

#### 1.1 CSS Print Stilleri Ekle

```css
/* Varsayılan: Yazdırırken her şeyi gizle */
@media print {
  body * {
    visibility: hidden !important;
  }
  
  /* Sadece print edilecek bölümü göster */
  .print-target,
  .print-target * {
    visibility: visible !important;
  }
  
  .print-target {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  
  /* Navigasyon, sidebar vb. gizle */
  .sidebar,
  .nav,
  header,
  footer,
  .no-print {
    display: none !important;
  }
}
```

#### 1.2 JavaScript Print Helper Fonksiyonu

```javascript
/**
 * Belirli bir DOM elementini PDF olarak kaydet
 * @param {string} elementId - PDF'e dönüştürülecek element ID
 * @param {string} fileName - Kaydedilecek dosya adı
 * @param {object} options - Ek seçenekler
 */
async function exportElementToPDF(elementId, fileName = 'Rapor.pdf', options = {}) {
  const element = document.getElementById(elementId);
  
  if (!element) {
    showToast('Hata', 'Dışa aktarılacak içerik bulunamadı', 'error');
    return;
  }
  
  // Önceki print-target'ları temizle
  document.querySelectorAll('.print-target').forEach(el => {
    el.classList.remove('print-target');
  });
  
  // Bu elementi print-target olarak işaretle
  element.classList.add('print-target');
  
  try {
    // Main process'e element bilgisi gönder
    const result = await window.electronAPI.exportToPDF({
      fileName: fileName,
      targetElement: elementId,
      ...options
    });
    
    if (result.success) {
      showToast('Başarılı', `${fileName} kaydedildi`, 'success');
    }
  } catch (error) {
    console.error('PDF export hatası:', error);
    showToast('Hata', 'PDF oluşturma başarısız', 'error');
  } finally {
    // print-target class'ını kaldır
    element.classList.remove('print-target');
  }
}
```

#### 1.3 Her Bölüm İçin Export Butonları

```html
<!-- Performans Karşılaştırma Grafiği -->
<div id="performance-comparison-section" class="chart-container">
  <div class="section-header">
    <h3>📊 Son Deneme vs Genel Ortalama</h3>
    <button 
      onclick="exportElementToPDF('performance-comparison-section', 'Performans-Karsilastirma.pdf')"
      class="btn-icon"
      title="Bu grafiği PDF olarak kaydet">
      📄
    </button>
  </div>
  <canvas id="performance-comparison-chart"></canvas>
  <div id="performance-trends"></div>
</div>

<!-- Ders Bazında Ortalama Netler -->
<div id="subject-average-section" class="chart-container">
  <div class="section-header">
    <h3>Ders Bazında Ortalama Netler</h3>
    <button 
      onclick="exportElementToPDF('subject-average-section', 'Ders-Ortalamalari.pdf')"
      class="btn-icon">
      📄
    </button>
  </div>
  <canvas id="avg-net-by-subject-chart"></canvas>
</div>
```

### Faz 2: Toplu Rapor Sistemi

#### 2.1 Toplu Rapor UI (Sınıf Analizi Bölümü)

```html
<!-- Sınıf Analizi -> Toplu Rapor -->
<div class="analysis-card bulk-report-generator">
  <h3>📊 Toplu Öğrenci Raporu</h3>
  <p>Seçilen öğrenciler için otomatik rapor oluştur</p>
  
  <!-- Öğrenci Seçimi -->
  <div class="student-selection">
    <label>
      <input type="checkbox" id="select-all-students" onchange="toggleAllStudents()">
      <strong>Tüm Öğrencileri Seç</strong>
    </label>
    
    <div id="student-list" class="student-checkboxes">
      <!-- Öğrenciler buraya dinamik yüklenecek -->
    </div>
  </div>
  
  <!-- Rapor Türü Seçimi -->
  <div class="report-type-selection">
    <h4>Rapor Türü:</h4>
    <label>
      <input type="radio" name="report-type" value="performance" checked>
      Performans Analizi
    </label>
    <label>
      <input type="radio" name="report-type" value="comparison">
      Karşılaştırmalı Analiz
    </label>
    <label>
      <input type="radio" name="report-type" value="detailed">
      Detaylı Rapor
    </label>
  </div>
  
  <!-- Export Seçenekleri -->
  <div class="export-options">
    <h4>Export Formatı:</h4>
    <label>
      <input type="radio" name="export-format" value="single-pdf" checked>
      Tek PDF (Tüm öğrenciler birlikte)
    </label>
    <label>
      <input type="radio" name="export-format" value="multiple-pdf">
      Ayrı PDF'ler (Her öğrenci için)
    </label>
    <label>
      <input type="radio" name="export-format" value="zip">
      ZIP Dosyası (Tüm PDF'ler arşivlenmiş)
    </label>
  </div>
  
  <!-- Oluştur Butonu -->
  <button id="generate-bulk-report-btn" class="btn-primary" onclick="generateBulkReport()">
    📄 Toplu Rapor Oluştur (<span id="selected-count">0</span> öğrenci)
  </button>
  
  <!-- Progress Bar -->
  <div id="bulk-report-progress" style="display: none;">
    <div class="progress-bar">
      <div class="progress-fill" id="report-progress-fill"></div>
    </div>
    <p id="progress-text">Hazırlanıyor... (0/0)</p>
  </div>
</div>
```

#### 2.2 Toplu Rapor JavaScript Fonksiyonları

```javascript
// Toplu rapor oluşturma sistemi
let selectedStudentsForReport = [];

function toggleAllStudents() {
  const selectAll = document.getElementById('select-all-students').checked;
  const checkboxes = document.querySelectorAll('.student-checkbox');
  
  checkboxes.forEach(cb => {
    cb.checked = selectAll;
  });
  
  updateSelectedStudents();
}

function updateSelectedStudents() {
  const checkboxes = document.querySelectorAll('.student-checkbox:checked');
  selectedStudentsForReport = Array.from(checkboxes).map(cb => cb.value);
  
  document.getElementById('selected-count').textContent = selectedStudentsForReport.length;
}

async function generateBulkReport() {
  if (selectedStudentsForReport.length === 0) {
    showToast('Uyarı', 'Lütfen en az bir öğrenci seçin', 'warning');
    return;
  }
  
  const reportType = document.querySelector('input[name="report-type"]:checked').value;
  const exportFormat = document.querySelector('input[name="export-format"]:checked').value;
  
  // Progress bar göster
  const progressDiv = document.getElementById('bulk-report-progress');
  progressDiv.style.display = 'block';
  
  try {
    if (exportFormat === 'single-pdf') {
      // Tek PDF - Tüm öğrenciler birlikte
      await generateSinglePDFReport(selectedStudentsForReport, reportType);
    } else if (exportFormat === 'multiple-pdf') {
      // Ayrı PDF'ler
      await generateMultiplePDFReports(selectedStudentsForReport, reportType);
    } else if (exportFormat === 'zip') {
      // ZIP arşivi
      await generateZippedReports(selectedStudentsForReport, reportType);
    }
    
    showToast('Başarılı', 'Toplu rapor oluşturuldu!', 'success');
  } catch (error) {
    console.error('Toplu rapor hatası:', error);
    showToast('Hata', 'Rapor oluşturma başarısız', 'error');
  } finally {
    progressDiv.style.display = 'none';
  }
}

// Tek PDF - Tüm öğrenciler
async function generateSinglePDFReport(students, reportType) {
  const reports = [];
  
  for (let i = 0; i < students.length; i++) {
    const studentId = students[i];
    updateProgress(i + 1, students.length, `${studentId} işleniyor...`);
    
    const reportHtml = await generateStudentReportHTML(studentId, reportType);
    reports.push(reportHtml);
  }
  
  // Tüm raporları birleştir
  const combinedHTML = `
    <div class="bulk-report">
      ${reports.join('<div class="page-break"></div>')}
    </div>
  `;
  
  // Geçici div oluştur
  const tempDiv = document.createElement('div');
  tempDiv.id = 'temp-bulk-report';
  tempDiv.innerHTML = combinedHTML;
  tempDiv.style.display = 'none';
  document.body.appendChild(tempDiv);
  
  // PDF export
  await exportElementToPDF('temp-bulk-report', 'Toplu-Rapor.pdf', {
    pageSize: 'A4',
    orientation: 'portrait'
  });
  
  // Temizlik
  document.body.removeChild(tempDiv);
}

// Ayrı PDF'ler
async function generateMultiplePDFReports(students, reportType) {
  for (let i = 0; i < students.length; i++) {
    const studentId = students[i];
    updateProgress(i + 1, students.length, `${studentId} için PDF oluşturuluyor...`);
    
    const reportHtml = await generateStudentReportHTML(studentId, reportType);
    
    // Geçici div
    const tempDiv = document.createElement('div');
    tempDiv.id = `temp-report-${studentId}`;
    tempDiv.innerHTML = reportHtml;
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    
    // PDF export
    await exportElementToPDF(tempDiv.id, `${studentId}-Rapor.pdf`);
    
    // Temizlik
    document.body.removeChild(tempDiv);
    
    // Kısa bekleme (sistem yükü)
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// ZIP arşivi
async function generateZippedReports(students, reportType) {
  // Önce tüm PDF'leri oluştur
  const pdfFiles = [];
  
  for (let i = 0; i < students.length; i++) {
    const studentId = students[i];
    updateProgress(i + 1, students.length, `${studentId} işleniyor...`);
    
    const reportHtml = await generateStudentReportHTML(studentId, reportType);
    const pdfData = await createPDFFromHTML(reportHtml);
    
    pdfFiles.push({
      name: `${studentId}-Rapor.pdf`,
      data: pdfData
    });
  }
  
  // Main process'e ZIP oluşturma isteği gönder
  const result = await window.electronAPI.createZipArchive(pdfFiles, 'Toplu-Raporlar.zip');
  
  if (result.success) {
    showToast('Başarılı', 'ZIP arşivi oluşturuldu', 'success');
  }
}

// Öğrenci raporu HTML oluştur
async function generateStudentReportHTML(studentId, reportType) {
  const student = getStudents().find(s => s.id === studentId);
  const studentExams = allExams.filter(exam => exam.profile === student.name);
  
  // Rapor türüne göre HTML oluştur
  switch (reportType) {
    case 'performance':
      return generatePerformanceReport(student, studentExams);
    case 'comparison':
      return generateComparisonReport(student, studentExams);
    case 'detailed':
      return generateDetailedReport(student, studentExams);
    default:
      return '';
  }
}

// Progress bar güncelle
function updateProgress(current, total, message) {
  const percentage = (current / total) * 100;
  const progressFill = document.getElementById('report-progress-fill');
  const progressText = document.getElementById('progress-text');
  
  progressFill.style.width = `${percentage}%`;
  progressText.textContent = `${message} (${current}/${total})`;
}
```

#### 2.3 Backend (main.js) - ZIP Oluşturma

```javascript
// ZIP arşivi oluşturma handler
ipcMain.handle('create-zip-archive', async (event, files, zipName) => {
  const archiver = require('archiver');
  const fs = require('fs');
  const path = require('path');
  const { dialog } = require('electron');
  
  try {
    const win = BrowserWindow.getFocusedWindow();
    
    // Kaydetme yeri seç
    const result = await dialog.showSaveDialog(win, {
      title: 'ZIP Arşivini Kaydet',
      defaultPath: path.join(require('os').homedir(), 'Desktop', zipName),
      filters: [
        { name: 'ZIP Arşivi', extensions: ['zip'] }
      ]
    });
    
    if (result.canceled) {
      return { canceled: true };
    }
    
    // ZIP oluştur
    const output = fs.createWriteStream(result.filePath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    output.on('close', () => {
      console.log(`ZIP oluşturuldu: ${archive.pointer()} bytes`);
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    archive.pipe(output);
    
    // Dosyaları ekle
    for (const file of files) {
      archive.append(Buffer.from(file.data), { name: file.name });
    }
    
    await archive.finalize();
    
    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('ZIP oluşturma hatası:', error);
    return { error: error.message };
  }
});
```

## 🎨 UI İyileştirmeleri

### 1. Bölüm Başlıklarına Export Butonları

```css
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.btn-icon {
  background: none;
  border: 1px solid #ddd;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2em;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: #f0f0f0;
  transform: scale(1.1);
}

.btn-icon:active {
  transform: scale(0.95);
}
```

### 2. Toplu Rapor Progress Bar

```css
.progress-bar {
  width: 100%;
  height: 25px;
  background: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  margin: 15px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

#progress-text {
  text-align: center;
  color: #666;
  font-size: 0.9em;
}
```

## 📊 Rapor Şablonları

### Performans Raporu Şablonu

```javascript
function generatePerformanceReport(student, exams) {
  const latestExam = exams[exams.length - 1];
  const avgPerformance = calculateAveragePerformance(exams);
  
  return `
    <div class="student-report performance-report">
      <div class="report-header">
        <h2>${student.name} - Performans Raporu</h2>
        <p>📅 ${new Date().toLocaleDateString('tr-TR')}</p>
      </div>
      
      <div class="report-section">
        <h3>📊 Son Deneme Sonuçları</h3>
        <table>
          <thead>
            <tr>
              <th>Ders</th>
              <th>Net</th>
              <th>Doğru</th>
              <th>Yanlış</th>
              <th>Boş</th>
            </tr>
          </thead>
          <tbody>
            ${generateExamTable(latestExam)}
          </tbody>
        </table>
      </div>
      
      <div class="report-section">
        <h3>📈 Genel Ortalama</h3>
        <div class="average-stats">
          ${generateAverageStats(avgPerformance)}
        </div>
      </div>
      
      <div class="report-section">
        <h3>⚠️ Eksik Kazanımlar</h3>
        <ul>
          ${generateWeakOutcomesList(student, exams)}
        </ul>
      </div>
    </div>
  `;
}
```

## 🚀 Uygulama Adımları

### Faz 1: Seçici PDF Export (1-2 gün)

1. ✅ CSS print media queries ekle
2. ✅ `exportElementToPDF()` helper fonksiyonu yaz
3. ✅ Her grafik/tablo için unique ID ver
4. ✅ Export butonlarını ekle
5. ✅ Test et

### Faz 2: Toplu Rapor UI (2-3 gün)

6. ✅ Sınıf analizi bölümüne toplu rapor card'ı ekle
7. ✅ Öğrenci seçim listesi oluştur
8. ✅ Rapor türü seçimi ekle
9. ✅ Export format seçimi ekle
10. ✅ Progress bar ekle

### Faz 3: Toplu Rapor Logic (3-4 gün)

11. ✅ `generateBulkReport()` fonksiyonu
12. ✅ `generateSinglePDFReport()` - Tek PDF
13. ✅ `generateMultiplePDFReports()` - Ayrı PDF'ler
14. ✅ `generateZippedReports()` - ZIP arşivi
15. ✅ Rapor şablonları (HTML)

### Faz 4: Backend & Test (2 gün)

16. ✅ ZIP oluşturma handler (main.js)
17. ✅ PDF oluşturma optimizasyonu
18. ✅ Kapsamlı test
19. ✅ Performans iyileştirme

## 🎯 Beklenen Sonuçlar

### Seçici PDF Export
- ✅ Kullanıcı sadece istediği grafiği PDF olarak kaydedebilir
- ✅ Her bölüm için ayrı export butonu
- ✅ Hızlı ve verimli

### Toplu Rapor Sistemi
- ✅ Çoklu öğrenci seçimi
- ✅ 3 rapor türü (performans, karşılaştırmalı, detaylı)
- ✅ 3 export formatı (tek PDF, ayrı PDF'ler, ZIP)
- ✅ Progress bar ile ilerleme takibi
- ✅ 25 öğrenci için ~1-2 dakika

## 💡 Alternatif Yaklaşım: jsPDF + html2canvas

Eğer CSS print media queries yeterli olmazsa:

```javascript
async function exportElementToPDFWithCanvas(elementId, fileName) {
  const element = document.getElementById(elementId);
  
  // html2canvas ile canvas'a dönüştür
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false
  });
  
  // jsPDF ile PDF oluştur
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/png');
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(fileName);
}
```

## 📋 Gerekli Paketler

Eğer alternatif yaklaşım kullanılırsa:

```bash
npm install jspdf html2canvas archiver
```

## 🎉 Sonuç

Bu plan ile:
1. **Seçici PDF Export**: Kullanıcılar sadece istedikleri bölümü PDF'e dönüştürebilir
2. **Toplu Rapor Sistemi**: Çoklu öğrenci için otomatik rapor oluşturma
3. **Esnek Format**: Tek PDF, ayrı PDF'ler veya ZIP arşivi
4. **Kullanıcı Dostu**: Progress bar ve açık arayüz

İlk hangi fazdan başlamak istersiniz?
