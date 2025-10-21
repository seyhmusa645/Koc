# 📊 Performans Karşılaştırma Grafiği - Geliştirme Planı

## 🎯 Hedef
Raporlar bölümündeki **Ders Analizleri** sekmesine yeni bir **Grouped Bar Chart** eklemek. Grafik, öğrencinin tüm denemelerdeki ortalama performansı ile son deneme performansını ders bazında karşılaştıracak ve düşüş/yükseliş durumunu görsel olarak işaretleyecek.

## 📋 Gereksinimler

### 1. Veri Yapısı
```javascript
const performanceComparisonData = {
  subjects: ['Türkçe', 'Matematik', 'Fen', 'İnkılap', 'İngilizce', 'Din'],
  overallAverage: [17.5, 15.2, 14.8, 9.3, 8.7, 9.1],      // Tüm denemelerin ortalaması
  lastExam: [18.5, 12.0, 16.0, 9.0, 9.5, 8.5],            // Son deneme
  trends: ['up', 'down', 'up', 'down', 'up', 'down']      // Trend yönü
};
```

### 2. Grafik Özellikleri
**Tip:** Grouped Bar Chart (Yan yana çubuk grafik)

**Renkler:**
- 🔵 **Genel Ortalama:** Mavi (`#3498db`)
- 🟢 **Son Deneme (Yükseliş):** Yeşil (`#27ae60`)
- 🔴 **Son Deneme (Düşüş):** Kırmızı (`#e74c3c`)

**İşaretler:**
- ⬆️ **Yükseliş:** Yeşil yukarı ok (Son deneme > Genel ortalama)
- ⬇️ **Düşüş:** Kırmızı aşağı ok (Son deneme < Genel ortalama)

### 3. Konum
**Raporlar Bölümü → Ders Analizleri Sekmesi**
- Mevcut "Ders Bazında Ortalama Netler" grafiğinin **altına** veya **üstüne** eklenecek
- Veya yan yana 2 sütun layout ile yerleştirilecek

## 🎨 UI Tasarımı

### HTML Yapısı
```html
<div id="tab-subjects" class="tab-panel">
  <!-- Mevcut grafikler -->
  <div class="chart-container">
    <h3>Ders Bazında Ortalama Netler</h3>
    <canvas id="avg-net-by-subject-chart"></canvas>
  </div>
  
  <!-- 🆕 YENİ: Performans Karşılaştırma Grafiği -->
  <div class="chart-container performance-comparison">
    <h3>📊 Son Deneme vs Genel Ortalama Karşılaştırması</h3>
    <p class="chart-description">
      🔵 Mavi: Tüm denemelerin ortalaması | 
      🟢 Yeşil: İyileşme | 
      🔴 Kırmızı: Düşüş
    </p>
    <canvas id="performance-comparison-chart"></canvas>
    <div id="performance-trends" class="trend-indicators">
      <!-- Trend ok işaretleri buraya gelecek -->
    </div>
  </div>
  
  <!-- Mevcut diğer grafik -->
  <div class="chart-container">
    <h3>Ders Bazında Gelişim Trendi</h3>
    <canvas id="subject-trend-chart"></canvas>
  </div>
</div>
```

### CSS Stilleri
```css
/* Performans karşılaştırma grafiği */
.performance-comparison {
  margin: 30px 0;
  padding: 25px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.performance-comparison h3 {
  margin-bottom: 10px;
  color: #2c3e50;
  font-size: 1.3em;
}

.chart-description {
  margin-bottom: 20px;
  color: #7f8c8d;
  font-size: 0.95em;
  text-align: center;
}

/* Trend göstergeleri */
.trend-indicators {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.trend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.trend-subject {
  font-weight: 600;
  color: #34495e;
  font-size: 0.9em;
}

.trend-arrow {
  font-size: 2em;
  font-weight: bold;
  animation: pulse 1.5s ease-in-out infinite;
}

.trend-arrow.up {
  color: #27ae60;
}

.trend-arrow.down {
  color: #e74c3c;
}

.trend-arrow.stable {
  color: #95a5a6;
  transform: rotate(90deg);
}

.trend-value {
  font-size: 0.85em;
  color: #7f8c8d;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .trend-indicators {
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .trend-item {
    flex: 0 0 45%;
  }
}
```

## 💻 JavaScript Implementasyonu

### 1. Veri Hazırlama Fonksiyonu
```javascript
function preparePerformanceComparisonData(profileExams) {
  if (!profileExams || profileExams.length === 0) {
    return null;
  }
  
  const subjects = {
    'turkce': { name: 'Türkçe', overall: [], last: 0 },
    'matematik': { name: 'Matematik', overall: [], last: 0 },
    'fen': { name: 'Fen', overall: [], last: 0 },
    'inkilap': { name: 'İnkılap', overall: [], last: 0 },
    'ingilizce': { name: 'İngilizce', overall: [], last: 0 },
    'din': { name: 'Din', overall: [], last: 0 }
  };
  
  // Tüm denemelerdeki netleri topla
  profileExams.forEach((exam, index) => {
    Object.keys(subjects).forEach(subjectKey => {
      if (exam.courses && exam.courses[subjectKey]) {
        const net = exam.courses[subjectKey].net || 0;
        subjects[subjectKey].overall.push(net);
        
        // Son deneme
        if (index === profileExams.length - 1) {
          subjects[subjectKey].last = net;
        }
      }
    });
  });
  
  // Ortalamaları hesapla ve trend belirle
  const comparisonData = {
    labels: [],
    overallAverage: [],
    lastExam: [],
    trends: [],
    trendData: []
  };
  
  Object.keys(subjects).forEach(subjectKey => {
    const subject = subjects[subjectKey];
    const average = subject.overall.length > 0 
      ? subject.overall.reduce((a, b) => a + b, 0) / subject.overall.length 
      : 0;
    
    comparisonData.labels.push(subject.name);
    comparisonData.overallAverage.push(parseFloat(average.toFixed(2)));
    comparisonData.lastExam.push(subject.last);
    
    // Trend belirleme
    const diff = subject.last - average;
    let trend = 'stable';
    if (diff > 0.5) trend = 'up';
    else if (diff < -0.5) trend = 'down';
    
    comparisonData.trends.push(trend);
    comparisonData.trendData.push({
      subject: subject.name,
      trend: trend,
      diff: parseFloat(diff.toFixed(2)),
      average: parseFloat(average.toFixed(2)),
      last: subject.last
    });
  });
  
  return comparisonData;
}
```

### 2. Grafik Oluşturma Fonksiyonu
```javascript
let performanceComparisonChart = null;

function createPerformanceComparisonChart(comparisonData) {
  const ctx = document.getElementById('performance-comparison-chart');
  if (!ctx) return;
  
  // Mevcut grafiği yok et
  if (performanceComparisonChart) {
    performanceComparisonChart.destroy();
  }
  
  // Son deneme için renk belirleme (trend'e göre)
  const lastExamColors = comparisonData.trends.map(trend => {
    if (trend === 'up') return '#27ae60';      // Yeşil
    if (trend === 'down') return '#e74c3c';    // Kırmızı
    return '#95a5a6';                           // Gri (stable)
  });
  
  performanceComparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: comparisonData.labels,
      datasets: [
        {
          label: 'Genel Ortalama',
          data: comparisonData.overallAverage,
          backgroundColor: '#3498db',
          borderColor: '#2980b9',
          borderWidth: 2,
          borderRadius: 6,
          barThickness: 40
        },
        {
          label: 'Son Deneme',
          data: comparisonData.lastExam,
          backgroundColor: lastExamColors,
          borderColor: lastExamColors.map(color => color),
          borderWidth: 2,
          borderRadius: 6,
          barThickness: 40
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 13,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y || 0;
              const dataIndex = context.dataIndex;
              const trend = comparisonData.trends[dataIndex];
              const diff = comparisonData.trendData[dataIndex].diff;
              
              let trendText = '';
              if (trend === 'up') {
                trendText = ` ⬆️ (+${diff.toFixed(2)})`;
              } else if (trend === 'down') {
                trendText = ` ⬇️ (${diff.toFixed(2)})`;
              }
              
              return `${label}: ${value.toFixed(2)} net${trendText}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 20,
          ticks: {
            stepSize: 2,
            font: {
              size: 12
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            display: false
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
  
  // Trend göstergelerini oluştur
  createTrendIndicators(comparisonData.trendData);
}
```

### 3. Trend Göstergeleri Oluşturma
```javascript
function createTrendIndicators(trendData) {
  const container = document.getElementById('performance-trends');
  if (!container) return;
  
  container.innerHTML = '';
  
  trendData.forEach(item => {
    const trendItem = document.createElement('div');
    trendItem.className = 'trend-item';
    
    // Ok işareti
    let arrow = '➡️';
    let arrowClass = 'stable';
    if (item.trend === 'up') {
      arrow = '⬆️';
      arrowClass = 'up';
    } else if (item.trend === 'down') {
      arrow = '⬇️';
      arrowClass = 'down';
    }
    
    trendItem.innerHTML = `
      <div class="trend-subject">${item.subject}</div>
      <div class="trend-arrow ${arrowClass}">${arrow}</div>
      <div class="trend-value">
        ${item.diff > 0 ? '+' : ''}${item.diff.toFixed(2)} net
      </div>
    `;
    
    container.appendChild(trendItem);
  });
}
```

### 4. Mevcut updateCharts Fonksiyonuna Entegrasyon
```javascript
function updateCharts(profileExams) {
  // ... mevcut grafikler ...
  
  // 🆕 YENİ: Performans Karşılaştırma Grafiği
  const comparisonData = preparePerformanceComparisonData(profileExams);
  if (comparisonData) {
    createPerformanceComparisonChart(comparisonData);
  }
}
```

## 📊 Örnek Görünüm

### Grafik Başlığı
```
📊 Son Deneme vs Genel Ortalama Karşılaştırması
🔵 Mavi: Tüm denemelerin ortalaması | 🟢 Yeşil: İyileşme | 🔴 Kırmızı: Düşüş
```

### Bar Chart
```
   20 ┤
   18 ┤    ██       ██
   16 ┤    ██  ██   ██  ██
   14 ┤    ██  ██   ██  ██
   12 ┤ ██ ██  ██   ██  ██  ██
   10 ┤ ██ ██  ██ █ ██  ██  ██
    8 ┤ ██ ██  ██ █ ██  ██  ██ ██
    6 ┤ ██ ██  ██ █ ██  ██  ██ ██
    4 ┤ ██ ██  ██ █ ██  ██  ██ ██
    2 ┤ ██ ██  ██ █ ██  ██  ██ ██
    0 ┼────────────────────────────
       T   M   F   İ   İn  D
       
Mavi: Genel Ortalama
Yeşil/Kırmızı: Son Deneme
```

### Trend Göstergeleri (Grafik Altında)
```
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Türkçe  │Matematik│  Fen    │ İnkılap │İngilizce│   Din   │
│   ⬆️    │   ⬇️    │   ⬆️    │   ⬇️    │   ⬆️    │   ⬇️    │
│ +1.0    │ -3.2    │ +1.2    │ -0.3    │ +0.8    │ -0.6    │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

## 🔧 Implementasyon Adımları

### Adım 1: HTML Yapısını Ekle
- `src/index.html` dosyasında `tab-subjects` içine yeni grafik konteynerini ekle
- Trend göstergeleri için div ekle

### Adım 2: CSS Stillerini Ekle
- `src/style.css` dosyasına yeni stilleri ekle
- Animasyonları ve responsive tasarımı ekle

### Adım 3: JavaScript Fonksiyonlarını Ekle
- `src/renderer.js` dosyasına veri hazırlama fonksiyonunu ekle
- Grafik oluşturma fonksiyonunu ekle
- Trend göstergeleri fonksiyonunu ekle

### Adım 4: updateCharts Fonksiyonunu Güncelle
- Yeni grafik fonksiyonunu çağır
- Veri kontrolü ekle

### Adım 5: Test ve İyileştirme
- Farklı veri setleri ile test et
- Görsel iyileştirmeler yap
- Responsive tasarımı kontrol et

## 📋 Başarı Kriterleri

- ✅ Grafik doğru verilerle oluşturulur
- ✅ Renkler trend'e göre otomatik değişir
- ✅ Ok işaretleri doğru yönde gösterilir
- ✅ Tooltip'ler anlamlı bilgi verir
- ✅ Animasyonlar düzgün çalışır
- ✅ Mobil uyumlu görünüm
- ✅ Performans sorunsuz

## 🎯 Örnek Senaryo

**Öğrenci: ESAD AY**

**Genel Ortalama (3 deneme):**
- Türkçe: 18.67 net
- Matematik: 18.22 net
- Fen: 14.22 net
- İnkılap: 10.00 net
- İngilizce: 10.00 net
- Din: 10.00 net

**Son Deneme:**
- Türkçe: 20.00 net ⬆️ (+1.33)
- Matematik: 18.67 net ⬆️ (+0.45)
- Fen: 14.67 net ⬆️ (+0.45)
- İnkılap: 10.00 net ➡️ (0.00)
- İngilizce: 10.00 net ➡️ (0.00)
- Din: 10.00 net ➡️ (0.00)

**Grafik Görünümü:**
- Türkçe: Yeşil bar (yükseliş)
- Matematik: Yeşil bar (yükseliş)
- Fen: Yeşil bar (yükseliş)
- İnkılap, İngilizce, Din: Gri bar (stabil)

## 🚀 Sonuç

Bu grafik sayesinde:
- Öğrenci performansı hızlıca değerlendirilir
- Düşüş gösteren dersler net olarak görülür
- Yükseliş gösteren dersler motive eder
- Öğretmen ve veli için anlaşılır rapor
- Veri tabanlı karar verme kolaylaşır
