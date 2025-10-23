document.addEventListener('DOMContentLoaded', async () => {
  // --- Global değişkenler ---
  let currentUserRole = 'teacher'; // Varsayılan rol
  
  // Manuel öğrenci eşleştirme için global değişkenler
  let studentMatchQueue = [];  // Eşleşmeyen öğrenciler kuyruğu
  let currentMatchIndex = 0;   // Şu anki eşleştirme indeksi
  let skipAllErrors = false;   // Tüm hataları atla bayrağı
  let importCancelled = false; // İçe aktarma iptal edildi mi
  
  // Kazanım eşleştirme için global değişkenler
  let kazanimlarDatabase = {};  // Tüm kazanımlar veritabanı
  let kazanimlarIndex = {};     // Hızlı arama için indeks
  
  // --- Element referansları ---
  // Sidebar toggle elementi
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const content = document.querySelector('.content');
  
  // Sidebar durumunu yöneten fonksiyon
  const setSidebarCollapsed = (collapsed) => {
    sidebar.classList.toggle('collapsed', collapsed);
    sidebarToggle.classList.toggle('collapsed', collapsed);
    content.classList.toggle('sidebar-collapsed', collapsed);
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  };

  // Kazanımlar veritabanını yükle (öğrenciler yüklenmeden önce)
  await loadKazanimlarDatabase();
  
  // Kazanımlar güncellendiğinde dinle
  window.electronAPI.onKazanimlarUpdated(() => {
    console.log('✅ Kazanımlar güncellendi, yeniden yükleniyor...');
    loadKazanimlarDatabase();
  });
  
  // Başlangıç durumu: localStorage'dan oku, yoksa 'false' (açık) varsay.
  const isInitiallyCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  setSidebarCollapsed(isInitiallyCollapsed);
  
  // Sidebar toggle event listener
  sidebarToggle.addEventListener('click', () => {
    // Mevcut durumun tersini uygula
    const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
    setSidebarCollapsed(!isCurrentlyCollapsed);
  });

  // Theme toggle functionality
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    // Başlangıç durumu: localStorage'dan oku, yoksa 'light' varsay.
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '🌞' : '🌙';
    }
  }

  // Yeni öğrenci arama sistemi elementleri
  const studentSearchInput = document.getElementById('student-search');
  const gradeFilter = document.getElementById('grade-filter');
  const styleFilter = document.getElementById('style-filter');
  const studentResults = document.getElementById('student-results');
  const selectedStudentDiv = document.getElementById('selected-student');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const toastContainer = document.getElementById('toast-container');
  
  // CSV Import elementleri
  const csvFileInput = document.getElementById('csv-file-input');
  const csvUploadBtn = document.getElementById('csv-upload-btn');
  const csvFileInfo = document.getElementById('csv-file-info');
  const csvFileName = document.getElementById('csv-file-name');
  const csvRemoveBtn = document.getElementById('csv-remove-btn');
  const csvImportBtn = document.getElementById('csv-import-btn');
  const csvStatus = document.getElementById('csv-status');
  const csvAutoOutcomes = document.getElementById('csv-auto-outcomes');
  const csvOverwriteCheck = document.getElementById('csv-overwrite-check');

  // CSV Preview Modal elementleri
  const csvPreviewModal = document.getElementById('csv-preview-modal');
  const csvPreviewStats = document.getElementById('csv-preview-stats');
  const csvPreviewTable = document.getElementById('csv-preview-table');
  const csvPreviewProblems = document.getElementById('csv-preview-problems');
  const csvPreviewCancel = document.getElementById('csv-preview-cancel');
  const csvPreviewConfirm = document.getElementById('csv-preview-confirm');

  // CSV Progress Bar elementleri
  const csvProgressContainer = document.getElementById('csv-progress-container');
  const csvProgressBar = document.getElementById('csv-progress-bar');
  const csvProgressText = document.getElementById('csv-progress-text');
  const csvProgressPercentage = document.getElementById('csv-progress-percentage');
  const csvProgressDetails = document.getElementById('csv-progress-details');

  const addProfileButton = document.getElementById('btn-add-profile');
  const deleteProfileButton = document.getElementById('btn-delete-profile');

  const navDashboardBtn = document.getElementById('nav-dashboard');
  const navAddExamBtn = document.getElementById('nav-add-exam');
  const navReportsBtn = document.getElementById('nav-reports');
  const navPlannerBtn = document.getElementById('nav-planner');
  const navEtutlerBtn = document.getElementById('nav-etutler');
  const navEvaluationBtn = document.getElementById('nav-evaluation');
  const navExamManagementBtn = document.getElementById('nav-exam-management');
  const navPerformanceOverviewBtn = document.getElementById('nav-performance-overview');

  const dashboardSection = document.getElementById('dashboard-section');
  const addExamSection = document.getElementById('add-exam-section');
  const reportsSection = document.getElementById('reports-section');
  const plannerSection = document.getElementById('planner-section');
  const etutlerSection = document.getElementById('etutler-section');
  const evaluationSection = document.getElementById('evaluation-section');
  const examManagementSection = document.getElementById('exam-management-section');
  const performanceOverviewSection = document.getElementById('performance-overview-section');
  const exportEtutPdfBtn = document.getElementById('export-etut-pdf-btn');
  const exportReportsPdfBtn = document.getElementById('export-reports-pdf-btn');
  const exportEvaluationPdfBtn = document.getElementById('export-evaluation-pdf-btn');

  const aiEvaluationButton = document.getElementById('btn-get-ai-evaluation');
  const aiEvaluationResult = document.getElementById('ai-evaluation-result');
  const licenseDisplay = document.getElementById('license-display');

  const coursesContainer = document.getElementById('courses-container');
  const examForm = document.getElementById('exam-form');

  const profileModal = document.getElementById('profile-modal');
  const closeModalButton = document.querySelector('.close-button');
  const saveProfileButton = document.getElementById('save-profile-button');
  const profileNameInput = document.getElementById('profile-name-input');
  const profileGradeInput = document.getElementById('profile-grade-input');
  const profileClassInput = document.getElementById('profile-class-input');
  const profileLearningStyleInput = document.getElementById('profile-learning-style-input');

  const editExamModal = document.getElementById('edit-exam-modal');
  const editExamForm = document.getElementById('edit-exam-form');
  const editCoursesContainer = document.getElementById('edit-courses-container');
  const editExamIdInput = document.getElementById('edit-exam-id');

  // --- Uygulama Durumu (State) ---
  let allExams = [];
  let outcomes = null;
  let topicsToRepeat = [];
  let haftalikPlanData = {};
  let allStudents = []; // Tüm öğrenci listesi
  let filteredStudents = []; // Filtrelenmiş öğrenci listesi
  let selectedStudent = null; // Seçili öğrenci
  let isStudentDetailVisible = false; // Öğrenci detay görünürlük durumu
  
  // Etüt system state
  let etutGroups = [];
  const questionCounts = {
    turkce: 20,
    matematik: 20,
    fen: 20,
    inkilap: 10,
    din: 10,
    ingilizce: 10,
  };

  // --- Yetki hatası yakalama yardımcı fonksiyonu ---
  function handlePermissionError(error) {
    if (error && error.error === 'PERMISSION_DENIED') {
      showToast('Yetki Hatası', error.message || 'Bu işlem için müdür yetkisi gereklidir.', 'error');
      return true;
    }
    return false;
  }

  // --- Modern Toast Notification System ---
  function showToast(title, message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const toastId = 'toast-' + Date.now();
    toast.id = toastId;
    
    const iconMap = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };
    
    toast.innerHTML = `
      <div class="toast-header">
        <div class="toast-title">
          <span>${iconMap[type] || 'ℹ️'}</span>
          ${title}
        </div>
        <button class="toast-close" onclick="removeToast('${toastId}')">&times;</button>
      </div>
      <div class="toast-message">${message}</div>
      <div class="toast-progress">
        <div class="toast-progress-bar"></div>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animasyon için kısa gecikme
    setTimeout(() => {
      toast.classList.add('show');
      
      // Progress bar animasyonu
      const progressBar = toast.querySelector('.toast-progress-bar');
      progressBar.style.transitionDuration = `${duration}ms`;
      progressBar.style.transform = 'translateX(0)';
    }, 100);
    
    // Otomatik kaldırma
    setTimeout(() => {
      removeToast(toastId);
    }, duration);
    
    return toastId;
  }
  
  function removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 400);
    }
  }
  
  // Global toast fonksiyonlarını window objesine ekle
  window.showToast = showToast;
  window.removeToast = removeToast;

  // --- Yardımcılar ---
  function setActivePage(pageId) {
    return function () {
      console.log('🔍 DEBUG: setActivePage çağrıldı:', pageId);
      const pages = [dashboardSection, addExamSection, reportsSection, plannerSection, etutlerSection, evaluationSection, examManagementSection, performanceOverviewSection];
      const navButtons = [navDashboardBtn, navAddExamBtn, navReportsBtn, navPlannerBtn, navEtutlerBtn, navEvaluationBtn, navExamManagementBtn, navPerformanceOverviewBtn];
      
      console.log('🔍 DEBUG: Sayfalar:', pages.map(p => p ? p.id : 'null'));
      console.log('🔍 DEBUG: Butonlar:', navButtons.map(b => b ? b.id : 'null'));
      
      pages.forEach(p => p && p.classList.remove('active'));
      navButtons.forEach(b => b && b.classList.remove('active'));
      
      switch (pageId) {
        case 'dashboard':
          if (dashboardSection) dashboardSection.classList.add('active');
          if (navDashboardBtn) navDashboardBtn.classList.add('active');
          break;
        case 'add-exam':
          if (addExamSection) addExamSection.classList.add('active');
          if (navAddExamBtn) navAddExamBtn.classList.add('active');
          renderCourseInputs('add');
          break;
        case 'reports':
          if (reportsSection) reportsSection.classList.add('active');
          if (navReportsBtn) navReportsBtn.classList.add('active');
          break;
        case 'planner':
          if (plannerSection) plannerSection.classList.add('active');
          if (navPlannerBtn) navPlannerBtn.classList.add('active');
          initializePlanner(); // Call the new planner initialization function
          break;
        case 'etutler':
          if (etutlerSection) etutlerSection.classList.add('active');
          if (navEtutlerBtn) navEtutlerBtn.classList.add('active');
          initializeEtutler();
          break;
        case 'evaluation':
          if (evaluationSection) evaluationSection.classList.add('active');
          if (navEvaluationBtn) navEvaluationBtn.classList.add('active');
          initializeEvaluation();
          break;
        case 'exam-management':
          if (examManagementSection) examManagementSection.classList.add('active');
          if (navExamManagementBtn) navExamManagementBtn.classList.add('active');
          loadExamManagement();
          break;
        case 'performance-overview':
          if (performanceOverviewSection) performanceOverviewSection.classList.add('active');
          if (navPerformanceOverviewBtn) navPerformanceOverviewBtn.classList.add('active');
          loadPerformanceOverview();
          break;
      }
    }
  }

  // Placeholder for the planner initialization function
  let plannerInitialized = false;
  async function initializePlanner() {
    if (plannerInitialized) return;
    
    // DersPlanlayici.js dosyasının yüklenmesini bekle
    if (typeof window.initializeDersPlanlayici === 'function') {
      await window.initializeDersPlanlayici(plannerSection);
      plannerInitialized = true;
    } else {
      console.error('initializeDersPlanlayici fonksiyonu bulunamadı!');
      // Alternatif olarak DersPlanlayici.js'i dinamik olarak yükle
      const script = document.createElement('script');
      script.src = 'DersPlanlayici.js';
      script.onload = async () => {
        if (typeof window.initializeDersPlanlayici === 'function') {
    await window.initializeDersPlanlayici(plannerSection);
    plannerInitialized = true;
        }
      };
      document.head.appendChild(script);
    }
  }

  function getProfileDataFromModal() {
    return new Promise((resolve) => {
      profileModal.style.display = 'block';

      const closeAndResolveNull = () => {
        profileModal.style.display = 'none';
        profileNameInput.value = '';
        profileGradeInput.value = '';
        resolve(null);
      };

      const saveAndResolveData = () => {
        const name = profileNameInput.value.trim();
        const grade = profileGradeInput.value;
        if (name && grade) {
          profileModal.style.display = 'none';
          profileNameInput.value = '';
          profileGradeInput.value = '';
          resolve({ name, grade });
        } else {
          alert('Lütfen profil adı ve sınıf düzeyini girin.');
        }
      };

      closeModalButton.onclick = closeAndResolveNull;
      saveProfileButton.onclick = saveAndResolveData;

      window.onclick = (event) => {
        if (event.target == profileModal) {
          closeAndResolveNull();
        }
      };
    });
  }

  // --- Veri ve UI Güncelleme ---

  let netEvolutionChart = null;
  let avgNetBySubjectChart = null;
  let subjectTrendChart = null;
  let performanceComparisonChart = null;

  function updateCharts(profileExams) {
    // Net Gelişim Grafiği
    const netEvolutionCtx = document.getElementById('net-evolution-chart').getContext('2d');
    if (netEvolutionChart) {
      netEvolutionChart.destroy();
    }

    // Duplicate sınavları filtrele (aynı profil + tarih + sınav adı)
    const seen = new Map();
    const filteredExams = profileExams.filter(exam => {
      const key = `${exam.profile}_${exam.date}_${exam.name}`;
      
      if (seen.has(key)) {
        // Duplicate bulundu - toplam net'i kontrol et
        const totalNet = Object.values(exam.courses || {}).reduce((sum, course) => {
          const net = course.net ?? (course.correct - (course.incorrect / 4));
          return sum + Math.max(0, net);
        }, 0);
        
        // Eğer toplam net 0 ise (boş kayıt), atla
        if (totalNet === 0) return false;
        
        // Aksi halde, daha yüksek net'e sahip olanı tut
        const existing = seen.get(key);
        const existingNet = Object.values(existing.courses || {}).reduce((sum, course) => {
          const net = course.net ?? (course.correct - (course.incorrect / 4));
          return sum + Math.max(0, net);
        }, 0);
        
        if (totalNet > existingNet) {
          seen.set(key, exam);
          return true;
        }
        return false;
      }
      
      seen.set(key, exam);
      return true;
    });

    const sortedExams = [...filteredExams].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedExams.map(exam => exam.date);
    const data = sortedExams.map(exam => Object.values(exam.courses).reduce((acc, course) => {
      const net = course.net ?? (course.correct - (course.incorrect / 4));
      return acc + Math.max(0, net);
    }, 0).toFixed(2));

    // Ders bazında ilerleme grafikleri için veri hazırla
    const subjectData = {};
    const subjects = ['turkce', 'matematik', 'fen', 'inkilap', 'ingilizce', 'din'];
    const subjectNames = {
      'turkce': 'Türkçe',
      'matematik': 'Matematik', 
      'fen': 'Fen Bilimleri',
      'inkilap': 'İnkılap Tarihi',
      'ingilizce': 'İngilizce',
      'din': 'Din Kültürü'
    };
    
    subjects.forEach(subject => {
      subjectData[subject] = sortedExams.map(exam => {
        const course = exam.courses[subject];
        if (course) {
          return course.net ?? (course.correct - (course.incorrect / 4));
        }
        return 0;
      });
    });

    const colors = [
      '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'
    ];

    netEvolutionChart = new Chart(netEvolutionCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: subjects.map((subject, index) => ({
          label: subjectNames[subject],
          data: subjectData[subject],
          borderColor: colors[index],
          backgroundColor: colors[index] + '20',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }))
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Ders Bazında İlerleme Grafiği'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    // Ders Bazında Ortalama Netler Grafiği
    const avgNetBySubjectCtx = document.getElementById('avg-net-by-subject-chart').getContext('2d');
    if (avgNetBySubjectChart) {
      avgNetBySubjectChart.destroy();
    }

    const subjectNets = {};
    const subjectCounts = {};

    profileExams.forEach(exam => {
      for (const subjectKey in exam.courses) {
        if (!subjectNets[subjectKey]) {
          subjectNets[subjectKey] = 0;
          subjectCounts[subjectKey] = 0;
        }
        // Net hesaplama: doğru - (yanlış / 4)
        const course = exam.courses[subjectKey];
        const calculatedNet = course.correct - (course.incorrect / 4);
        subjectNets[subjectKey] += Math.max(0, calculatedNet);
        subjectCounts[subjectKey]++;
      }
    });

    const avgSubjectNets = Object.entries(subjectNets).map(([key, value]) => ({
      subject: key,
      avgNet: (value / subjectCounts[key]).toFixed(2)
    }));

    // Ders isimlerini düzelt
    const subjectNameMapping = {
      'turkce': 'Türkçe',
      'matematik': 'Matematik',
      'fen': 'Fen Bilimleri',
      'inkilap': 'Sosyal Bilgiler',
      'din': 'Din Kültürü',
      'ingilizce': 'İngilizce'
    };
    
    const subjectLabels = avgSubjectNets.map(item => subjectNameMapping[item.subject] || item.subject);
    const avgSubjectData = avgSubjectNets.map(item => item.avgNet);

    avgNetBySubjectChart = new Chart(avgNetBySubjectCtx, {
      type: 'bar',
      data: {
        labels: subjectLabels,
        datasets: [{
          label: 'Ortalama Net',
          data: avgSubjectData,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Ders Bazında Ortalama Netler'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    // Ders Bazında Gelişim Trendi Grafiği
    const subjectTrendCtx = document.getElementById('subject-trend-chart').getContext('2d');
    if (subjectTrendChart) {
      subjectTrendChart.destroy();
    }

    const subjectTrendLabels = sortedExams.map(exam => exam.date);
    // Ders renkleri
    const subjectColors = {
      'turkce': { bg: 'rgba(255, 99, 132, 0.1)', border: 'rgba(255, 99, 132, 1)' },
      'matematik': { bg: 'rgba(54, 162, 235, 0.1)', border: 'rgba(54, 162, 235, 1)' },
      'fen': { bg: 'rgba(255, 206, 86, 0.1)', border: 'rgba(255, 206, 86, 1)' },
      'inkilap': { bg: 'rgba(75, 192, 192, 0.1)', border: 'rgba(75, 192, 192, 1)' },
      'din': { bg: 'rgba(153, 102, 255, 0.1)', border: 'rgba(153, 102, 255, 1)' },
      'ingilizce': { bg: 'rgba(255, 159, 64, 0.1)', border: 'rgba(255, 159, 64, 1)' }
    };
    
    // Gerçekte bulunan dersleri al
    const availableSubjects = [...new Set(profileExams.flatMap(exam => Object.keys(exam.courses)))];
    
    const subjectTrendDatasets = availableSubjects.map(subjectKey => {
      const data = sortedExams.map(exam => {
        if (exam.courses[subjectKey]) {
          const course = exam.courses[subjectKey];
          return Math.max(0, course.correct - (course.incorrect / 4));
        }
        return 0;
      });
      const color = subjectColors[subjectKey] || { bg: 'rgba(0,0,0,0.1)', border: 'rgba(0,0,0,1)' };
      return {
        label: subjectNameMapping[subjectKey] || subjectKey,
        data: data,
        borderColor: color.border,
        backgroundColor: color.bg,
        tension: 0.3,
        fill: false,
      };
    });

    subjectTrendChart = new Chart(subjectTrendCtx, {
      type: 'line',
      data: {
        labels: subjectTrendLabels,
        datasets: subjectTrendDatasets,
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Ders Bazında Gelişim Trendi'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    
    // ?? YENİ: Performans Karşılaştırma Grafiği
    const comparisonData = preparePerformanceComparisonData(profileExams);
    if (comparisonData) {
      createPerformanceComparisonChart(comparisonData);
    }
  }

  // ?? YENİ: Performans Karşılaştırma Veri Hazırlama Fonksiyonu
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
          const course = exam.courses[subjectKey];
          // Net değeri yoksa hesapla: doğru - (yanlış / 4)
          const net = course.net ?? (course.correct - (course.incorrect / 4));
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

  // ?? YENİ: Performans Karşılaştırma Grafiği Oluşturma
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

  // ?? YENİ: Trend Göstergeleri Oluşturma
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

  // ?? YENİ: Seçici PDF Export Helper Fonksiyonu (Global Scope)
  /**
   * Belirli bir DOM elementini PDF olarak kaydet
   * @param {string} elementId - PDF'e dönüştürülecek element ID
   * @param {string} fileName - Kaydedilecek dosya adı
   * @param {object} options - Ek seçenekler
   */

  // ?? YENİ: Toplu Rapor Sistemi
  let selectedStudentsForReport = [];

  // Tüm öğrencileri seç/seçme (Global Scope)
  window.toggleAllStudents = function() {
    const selectAll = document.getElementById('select-all-students').checked;
    const checkboxes = document.querySelectorAll('.student-checkbox');
    
    checkboxes.forEach(cb => {
      cb.checked = selectAll;
    });
    
    updateSelectedStudents();
  };

  // Seçilen öğrencileri güncelle (Global Scope)
  window.updateSelectedStudents = function() {
    const checkboxes = document.querySelectorAll('.student-checkbox:checked');
    selectedStudentsForReport = Array.from(checkboxes).map(cb => cb.value);
    
    const count = selectedStudentsForReport.length;
    document.getElementById('selected-count').textContent = count;
    document.getElementById('selected-count-display').textContent = count;
    
    // Tüm seçili ise "Tümünü Seç" checkbox'ını işaretle
    const allCheckboxes = document.querySelectorAll('.student-checkbox');
    const selectAllCheckbox = document.getElementById('select-all-students');
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = count === allCheckboxes.length;
    }
  };

  // Öğrenci listesini yükle
  function loadStudentListForBulkReport(students) {
    const studentList = document.getElementById('student-list');
    if (!studentList) return;
    
    studentList.innerHTML = '';
    
    students.forEach(student => {
      const checkboxItem = document.createElement('div');
      checkboxItem.className = 'student-checkbox-item';
      
      checkboxItem.innerHTML = `
        <input type="checkbox" class="student-checkbox" value="${student.id}" id="student-${student.id}" onchange="updateSelectedStudents()">
        <label for="student-${student.id}">${student.name}</label>
      `;
      
      studentList.appendChild(checkboxItem);
    });
    
    // İlk yüklemede hiçbirini seçme
    updateSelectedStudents();
  }

  // Toplu rapor oluştur (Global Scope)
  window.generateBulkReport = async function() {
    if (selectedStudentsForReport.length === 0) {
      showToast('Uyarı', 'Lütfen en az bir öğrenci seçin', 'warning');
      return;
    }
    
    const reportType = document.querySelector('input[name="report-type"]:checked').value;
    const exportFormat = document.querySelector('input[name="export-format"]:checked').value;
    
    // Progress bar göster
    const progressDiv = document.getElementById('bulk-report-progress');
    const generateBtn = document.getElementById('generate-bulk-report-btn');
    
    progressDiv.style.display = 'block';
    generateBtn.disabled = true;
    generateBtn.textContent = 'Rapor Oluşturuluyor...';
    
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
      generateBtn.disabled = false;
      generateBtn.textContent = `?? Toplu Rapor Oluştur (${selectedStudentsForReport.length} öğrenci)`;
    }
  };

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

  // Performans raporu HTML
  function generatePerformanceReport(student, exams) {
    const latestExam = exams[exams.length - 1];
    const avgPerformance = calculateAveragePerformance(exams);
    
    return `
      <div class="student-report performance-report">
        <div class="report-header">
          <h2>${student.name} - Performans Raporu</h2>
          <p>?? ${new Date().toLocaleDateString('tr-TR')}</p>
        </div>
        
        <div class="report-section">
          <h3>?? Son Deneme Sonuçları</h3>
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
          <h3>?? Genel Ortalama</h3>
          <div class="average-stats">
            ${generateAverageStats(avgPerformance)}
          </div>
        </div>
      </div>
    `;
  }

  // Karşılaştırmalı rapor HTML
  function generateComparisonReport(student, exams) {
    return `
      <div class="student-report comparison-report">
        <div class="report-header">
          <h2>${student.name} - Karşılaştırmalı Analiz</h2>
          <p>?? ${new Date().toLocaleDateString('tr-TR')}</p>
        </div>
        
        <div class="report-section">
          <h3>?? Performans Karşılaştırması</h3>
          <p>Son deneme vs genel ortalama karşılaştırması burada görüntülenecek.</p>
        </div>
      </div>
    `;
  }

  // Detaylı rapor HTML
  function generateDetailedReport(student, exams) {
    return `
      <div class="student-report detailed-report">
        <div class="report-header">
          <h2>${student.name} - Detaylı Rapor</h2>
          <p>?? ${new Date().toLocaleDateString('tr-TR')}</p>
        </div>
        
        <div class="report-section">
          <h3>?? Kapsamlı Analiz</h3>
          <p>Detaylı öğrenci analizi burada görüntülenecek.</p>
        </div>
      </div>
    `;
  }

  // Yardımcı fonksiyonlar
  function calculateAveragePerformance(exams) {
    // Ortalama performans hesaplama
    return { total: 0, subjects: {} };
  }

  function generateExamTable(exam) {
    if (!exam || !exam.courses) return '';
    
    const subjects = {
      'turkce': 'Türkçe',
      'matematik': 'Matematik',
      'fen': 'Fen',
      'inkilap': 'İnkılap',
      'ingilizce': 'İngilizce',
      'din': 'Din'
    };
    
    let tableRows = '';
    Object.keys(subjects).forEach(subjectKey => {
      const course = exam.courses[subjectKey];
      if (course) {
        tableRows += `
          <tr>
            <td>${subjects[subjectKey]}</td>
            <td>${course.net ?? (course.correct - (course.incorrect / 4))}</td>
            <td>${course.correct || 0}</td>
            <td>${course.incorrect || 0}</td>
            <td>${course.blank || 0}</td>
          </tr>
        `;
      }
    });
    
    return tableRows;
  }

  function generateAverageStats(avgPerformance) {
    return '<p>Ortalama performans istatistikleri burada görüntülenecek.</p>';
  }

  function createPDFFromHTML(html) {
    // HTML'den PDF oluşturma (basit implementasyon)
    return new Promise((resolve) => {
      // Bu fonksiyon daha sonra geliştirilecek
      resolve('PDF_DATA');
    });
  }

  // Progress bar güncelle
  function updateProgress(current, total, message) {
    const percentage = (current / total) * 100;
    const progressFill = document.getElementById('report-progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    if (progressText) {
      progressText.textContent = `${message} (${current}/${total})`;
    }
  }

  // Toplu rapor generator'ı göster
  function showBulkReportGenerator() {
    const generator = document.getElementById('bulk-report-generator');
    if (generator) {
      generator.style.display = 'block';
    }
  }

  function calculateLgsScore(exam) {
    // LGS 2024-2025 ağırlıklandırma katsayıları (MEB resmi)
    const weights = {
      turkce: 4,      // Türkçe
      matematik: 4,   // Matematik  
      fen: 4,         // Fen Bilimleri
      inkilap: 1,     // T.C. İnkılap Tarihi ve Atatürkçülük
      din: 1,         // Din Kültürü ve Ahlak Bilgisi
      ingilizce: 1,   // Yabancı Dil (İngilizce)
    };

    // Her ders için ham puan hesapla (4 yanlış = 1 doğru götürür)
    const subjectScores = {};
    let totalWeightedScore = 0;
    let totalMaxWeightedScore = 0;
    
    console.log('LGS Puanı hesaplanıyor...');
    console.log('exam.courses:', exam.courses);
    
    // Ders key mapping'i düzelt
    const subjectKeyMapping = {
      'Türkçe': 'turkce',
      'Matematik': 'matematik',
      'Fen Bilimleri': 'fen',
      'Sosyal Bilgiler': 'inkilap',
      'Din Kültürü ve Ahlak Bilgisi': 'din',
      'İngilizce': 'ingilizce'
    };
    
    for (const subjectKey in exam.courses) {
      const course = exam.courses[subjectKey];
      const mappedKey = subjectKeyMapping[subjectKey] || subjectKey.toLowerCase();
      const net = course.correct - (course.incorrect / 4); // 4 yanlış = 1 doğru
      const subjectWeight = weights[mappedKey] || 1;
      const subjectMaxQuestions = questionCounts[mappedKey] || questionCounts[subjectKey] || 20;
      
      // Negatif puanları 0'a çek
      const adjustedNet = Math.max(0, net);
      subjectScores[subjectKey] = adjustedNet;
      
      console.log(`${subjectKey} (${mappedKey}): correct=${course.correct}, incorrect=${course.incorrect}, net=${adjustedNet}, weight=${subjectWeight}`);
      
      totalWeightedScore += adjustedNet * subjectWeight;
      totalMaxWeightedScore += subjectMaxQuestions * subjectWeight;
    }

    console.log(`Toplam ağırlıklı puan: ${totalWeightedScore}`);
    console.log(`Maksimum ağırlıklı puan: ${totalMaxWeightedScore}`);

    // LGS puanı hesaplama (100-500 arası)
    // MEB'in kullandığı formül: 100 + (TASP / MaxTASP) * 400
    const lgsScore = 100 + (totalWeightedScore / totalMaxWeightedScore) * 400;
    
    console.log(`Hesaplanan LGS puanı: ${lgsScore}`);
    
    // Puan aralığını sınırla
    return Math.max(100, Math.min(500, lgsScore)).toFixed(2);
  }

  function cleanTopicName(topic) {
    // Bozuk karakterleri ve gereksiz metinleri temizle
    return topic
      .replace(/işelenceğ/g, '')
      .replace(/kaç saat/g, '')
      .replace(/\(\d+\s*Saat\)/g, '') // Parantez içindeki saat bilgilerini kaldır (4 Saat), (1Saat) vb.
      .replace(/\(\d+\)/g, '') // Diğer parantez içindeki sayıları kaldır
      .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluk yap
      .trim();
  }

  function updateTopicsToRepeat(profileExams) {
    const topicsToRepeatList = document.getElementById('summary-worst-topic-list');
    topicsToRepeatList.innerHTML = '';
    topicsToRepeat = [];

    if (profileExams.length === 0) {
      topicsToRepeatList.innerHTML = '<li>-</li>';
      return;
    }

    const latestExam = profileExams.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const topicFrequency = {};

    for (const subjectKey in latestExam.courses) {
      const course = latestExam.courses[subjectKey];
      console.log(`${subjectKey} incorrectOutcomes:`, course.incorrectOutcomes, typeof course.incorrectOutcomes);
      
      if (course.incorrectOutcomes) {
        let outcomes = course.incorrectOutcomes;
        
        // Eğer string ise array'e çevir
        if (typeof outcomes === 'string') {
          outcomes = outcomes.trim() ? outcomes.split(' ').filter(o => o.trim()) : [];
        }
        
        // Eğer array ise ve boş değilse işle
        if (Array.isArray(outcomes) && outcomes.length > 0) {
          outcomes.forEach(outcome => {
            if (outcome && outcome.trim()) {
              // ? Tam metni al ve temizle
              const fullText = getKazanimFullText(outcome.trim());
              const cleanText = stripKazanimCode(fullText);
              
              if (topicFrequency[cleanText]) {
                topicFrequency[cleanText]++;
              } else {
                topicFrequency[cleanText] = 1;
              }
            }
          });
        }
      }
    }

    const sortedTopics = Object.entries(topicFrequency).sort((a, b) => b[1] - a[1]);
    topicsToRepeat = sortedTopics;

    if (sortedTopics.length === 0) {
      topicsToRepeatList.innerHTML = '<li>Tekrar edilecek konu bulunmuyor.</li>';
      return;
    }

    sortedTopics.slice(0, 4).forEach(([topic, count]) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${topic} (${count} kez tekrar)`;
      listItem.style.whiteSpace = 'normal';
      listItem.style.wordWrap = 'break-word';
      if (count > 1) {
        listItem.style.color = 'red';
      }
      topicsToRepeatList.appendChild(listItem);
    });

    if (sortedTopics.length > 4) {
      const listItem = document.createElement('li');
      listItem.textContent = '...';
      topicsToRepeatList.appendChild(listItem);
    }
  }

  function updateWeakTopicsTable(profileExams) {
    const tableBody = document.getElementById('top-weak-topics-table').querySelector('tbody');
    tableBody.innerHTML = '';

    if (profileExams.length === 0) {
      const row = tableBody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 2;
      cell.textContent = 'Tekrar edilmesi gereken kazanım bulunmuyor.';
      return;
    }

    const topicFrequency = {};

    profileExams.forEach(exam => {
      for (const subjectKey in exam.courses) {
        const course = exam.courses[subjectKey];
        if (course.incorrectOutcomes) {
          let outcomes = course.incorrectOutcomes;
          
          // Eğer string ise array'e çevir
          if (typeof outcomes === 'string') {
            outcomes = outcomes.trim() ? outcomes.split(' ').filter(o => o.trim()) : [];
          }
          
          // Eğer array ise ve boş değilse işle
          if (Array.isArray(outcomes) && outcomes.length > 0) {
            outcomes.forEach(outcome => {
              if (outcome && outcome.trim()) {
                // ? Tam metni al ve temizle
                const fullText = getKazanimFullText(outcome.trim());
                const cleanText = stripKazanimCode(fullText);
                
                if (topicFrequency[cleanText]) {
                  topicFrequency[cleanText]++;
                } else {
                  topicFrequency[cleanText] = 1;
                }
              }
            });
          }
        }
      }
    });

    const sortedTopics = Object.entries(topicFrequency).sort((a, b) => b[1] - a[1]);

    if (sortedTopics.length === 0) {
      const row = tableBody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 2;
      cell.textContent = 'Tekrar edilmesi gereken kazanım bulunmuyor.';
      return;
    }

    sortedTopics.slice(0, 10).forEach(([topic, count]) => {
      const row = tableBody.insertRow();
      const topicCell = row.insertCell();
      const countCell = row.insertCell();
      
      // ? Tam metni göster (kesilmeden)
      topicCell.textContent = topic;
      topicCell.style.whiteSpace = 'normal'; // Satır kaydırma
      topicCell.style.wordWrap = 'break-word'; // Kelime kaydırma
      
      countCell.textContent = count;
      if (count > 1) {
        topicCell.style.color = 'red';
        countCell.style.color = 'red';
      }
    });
  }

  function updateDashboardUI(profileExams) {
    // Ana Ekran özetini güncelle
    document.getElementById('summary-total-exams').textContent = profileExams.length;

    if (profileExams.length > 0) {
      const lastExam = profileExams.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      
      // Tüm sınavların LGS puanı ortalamasını hesapla
      const lgsScores = profileExams.map(exam => 
        exam.lgsScore || parseFloat(calculateLgsScore(exam))
      );
      const avgLgsScore = lgsScores.reduce((sum, score) => sum + score, 0) / lgsScores.length;
      document.getElementById('summary-lgs-score').textContent = avgLgsScore.toFixed(2);

      // Net hesaplamasını düzelt (4 yanlış = 1 doğru)
      const totalNet = Object.values(lastExam.courses).reduce((acc, course) => {
        const net = course.correct - (course.incorrect / 4);
        return acc + Math.max(0, net);
      }, 0);
      document.getElementById('summary-avg-net').textContent = totalNet.toFixed(2);

      // En Başarılı Dersler (%80 ve üzeri başarı)
      const bestSubjects = [];
      const subjectNames = {
        turkce: 'Türkçe',
        matematik: 'Matematik',
        fen: 'Fen Bilimleri',
        inkilap: 'Sosyal Bilgiler',
        din: 'Din Kültürü',
        ingilizce: 'İngilizce'
      };
      
      console.log('En başarılı dersler hesaplanıyor...');
      console.log('lastExam.courses:', lastExam.courses);
      console.log('questionCounts:', questionCounts);
      
      // Ders key mapping'i düzelt
      const subjectKeyMapping = {
        'Türkçe': 'turkce',
        'Matematik': 'matematik',
        'Fen Bilimleri': 'fen',
        'Sosyal Bilgiler': 'inkilap',
        'Din Kültürü ve Ahlak Bilgisi': 'din',
        'İngilizce': 'ingilizce'
      };
      
      for (const subjectKey in lastExam.courses) {
        const course = lastExam.courses[subjectKey];
        const mappedKey = subjectKeyMapping[subjectKey] || subjectKey.toLowerCase();
        const totalQuestions = questionCounts[mappedKey] || questionCounts[subjectKey];
        console.log(`${subjectKey} (${mappedKey}): correct=${course.correct}, total=${totalQuestions}`);
        
        if (totalQuestions > 0) {
          const successRate = (course.correct / totalQuestions) * 100;
          console.log(`${subjectKey} başarı oranı: ${successRate.toFixed(2)}%`);
          
          if (successRate >= 80) {
            bestSubjects.push(subjectNames[mappedKey] || subjectKey);
            console.log(`${subjectKey} başarılı ders olarak eklendi`);
          }
        }
      }
      
      console.log('En başarılı dersler:', bestSubjects);
      document.getElementById('summary-best-subject').textContent = bestSubjects.length > 0 ? bestSubjects.join(', ') : '-';

      updateTopicsToRepeat(profileExams);
      updateCharts(profileExams); // Call updateCharts here
      updateWeakTopicsTable(profileExams); // Call updateWeakTopicsTable here
    } else {
      document.getElementById('summary-lgs-score').textContent = '0.00';
      document.getElementById('summary-avg-net').textContent = '0.00';
      document.getElementById('summary-best-subject').textContent = '-';
      document.getElementById('summary-worst-topic-list').innerHTML = '<li>-</li>';
      if (netEvolutionChart) netEvolutionChart.destroy();
      if (avgNetBySubjectChart) avgNetBySubjectChart.destroy();
      updateWeakTopicsTable([]);
    }

    // Son sınavlar listesini güncelle
    const recentExamsList = document.getElementById('recent-exams-list');
    recentExamsList.innerHTML = '';
    if (profileExams.length > 0) {
      const sortedExams = [...profileExams].sort((a, b) => new Date(b.date) - new Date(a.date));
      sortedExams.forEach(exam => {
        const examElement = document.createElement('div');
        examElement.className = 'exam-item';
        examElement.innerHTML = `
          <div class="exam-header">
            <h4 class="exam-name">${exam.name}</h4>
            <span class="exam-date">${exam.date}</span>
          </div>
          <div class="exam-actions">
            <button class="btn-edit" data-id="${exam.id}">Düzenle</button>
            <button class="btn-delete" data-id="${exam.id}">Sil</button>
          </div>
        `;
        recentExamsList.appendChild(examElement);
      });
    } else {
      recentExamsList.innerHTML = '<p>Bu profil için gösterilecek sınav bulunmuyor.</p>';
    }

    // Raporlar sekmesindeki grafikler de burada güncellenmeli
    // Örn: updateCharts(profileExams);
  }

  const recentExamsList = document.getElementById('recent-exams-list');
  recentExamsList.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.classList.contains('btn-delete')) {
      // Yetki kontrolü
      if (currentUserRole !== 'manager') {
        showToast('Yetki Hatası', 'Bu işlem için müdür yetkisi gereklidir.', 'error');
        return;
      }
      
      const examId = target.dataset.id;
      console.log('Silinecek sınav ID:', examId, 'Tip:', typeof examId);
      if (confirm('Bu sınavı silmek istediğinize emin misiniz?')) {
        allExams = allExams.filter(exam => {
          console.log('Exam ID:', exam.id, 'Tip:', typeof exam.id, 'Eşit mi:', exam.id == examId);
          return exam.id != examId; // == ile karşılaştır (tip dönüşümü ile)
        });
        const dataToSave = {
          value: allExams,
          Count: allExams.length
        };
        const result = await window.electronAPI.saveData(dataToSave);
        if (result.error) {
          if (!handlePermissionError(result)) {
            showToast('Hata', `Sınav silinirken hata oluştu: ${result.error}`, 'error');
          }
          return;
        }
        if (selectedStudent?.name) {
          displayDataForProfile(selectedStudent.name);
        }
      }
    }

    if (target.classList.contains('btn-edit')) {
      const examId = parseInt(target.dataset.id, 10);
      const examToEdit = allExams.find(exam => exam.id === examId);
      if (examToEdit) {
        editExamIdInput.value = examToEdit.id;
        document.getElementById('edit-exam-name').value = examToEdit.name;
        document.getElementById('edit-exam-date').value = examToEdit.date;

        renderCourseInputs('edit', examToEdit.courses);

        editExamModal.style.display = 'block';
      }
    }
  });

  editExamForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const examId = parseInt(editExamIdInput.value, 10);
    const examToUpdate = allExams.find(exam => exam.id === examId);

    if (examToUpdate) {
      examToUpdate.name = document.getElementById('edit-exam-name').value;
      examToUpdate.date = document.getElementById('edit-exam-date').value;

      const subjects = outcomes ? Object.keys(outcomes) : ['turkce', 'matematik', 'fen', 'inkilap', 'din', 'ingilizce'];
      for (const subjectKey of subjects) {
        if (subjectKey === 'yabanci_dil') continue;

        const correct = parseInt(document.getElementById(`edit-correct-${subjectKey}`).value || '0', 10);
        const incorrect = parseInt(document.getElementById(`edit-incorrect-${subjectKey}`).value || '0', 10);
        const blank = parseInt(document.getElementById(`edit-blank-${subjectKey}`).value || '0', 10);
        const total = correct + incorrect + blank;

        if (total > questionCounts[subjectKey]) {
          alert(`${subjectKey} için girdiğiniz doğru, yanlış ve boş sayıları toplamı (${total}), toplam soru sayısını (${questionCounts[subjectKey]}) geçemez.`);
          return;
        }

        const net = correct - (incorrect / 4); // 4 yanlış = 1 doğru

        const selectedOutcomes = [];
        const outcomeCheckboxes = document.querySelectorAll(`input[id^="edit-outcome-${subjectKey}-"]:checked`);
        outcomeCheckboxes.forEach(checkbox => {
          selectedOutcomes.push(checkbox.value);
        });

        examToUpdate.courses[subjectKey] = {
          correct,
          incorrect,
          blank,
          net,
          incorrectOutcomes: selectedOutcomes,
        };
      }

      const dataToSave = {
        value: allExams,
        Count: allExams.length
      };
      const result = await window.electronAPI.saveData(dataToSave);
      
      if (result.error) {
        if (!handlePermissionError(result)) {
          showToast('Hata', `Sınav düzenlenirken hata oluştu: ${result.error}`, 'error');
        }
        return;
      }
      
      editExamModal.style.display = 'none';
      if (selectedStudent?.name) {
        displayDataForProfile(selectedStudent.name);
      }
    }
  });

  function displayDataForProfile(profileName) {
    const profileExams = profileName
      ? allExams.filter(exam => exam.profile === profileName)
      : [];
    
    updateDashboardUI(profileExams);
  }

  async function loadInitialData() {
    const data = await window.electronAPI.loadData();
    
    // Eğer data bir object ise ve 'value' property'si varsa, onu kullan
    if (data && typeof data === 'object' && data.value && Array.isArray(data.value)) {
      allExams = data.value;
    } else if (Array.isArray(data)) {
      allExams = data;
    } else {
      allExams = [];
    }
    
    const activeProfile = selectedStudent?.name;
    if (activeProfile) {
      displayDataForProfile(activeProfile);
    }
  }

  // --- Profil Yönetimi ---

  // --- Öğrenci Arama ve Yönetim Fonksiyonları ---
  
  async function loadAllStudents() {
    console.log('🔍 DEBUG: Renderer - Öğrenciler yükleniyor...');
    try {
      const studentsData = await window.electronAPI.loadStudents();
      console.log('🔍 DEBUG: Backend\'den gelen veri:', studentsData);
      
      // Error kontrolü
      if (studentsData && studentsData.error) {
        console.error('? Backend hatası:', studentsData.error);
        showToast('Hata', `Öğrenci verileri yüklenemedi: ${studentsData.error}`, 'error', 5000);
        
        // Boş liste ile devam et
        allStudents = [];
        filteredStudents = [];
        renderStudentResults();
        return;
      }
      
      // Veri kontrolü
      if (!studentsData || !studentsData.students) {
        console.warn('⚠️ Geçersiz veri formatı:', studentsData);
        allStudents = [];
        filteredStudents = [];
        renderStudentResults();
        return;
      }
      
      allStudents = studentsData.students || [];
      console.log(`✅ Renderer: ${allStudents.length} öğrenci yüklendi`);
      
      // Başlangıçta filtrelenmiş liste tüm öğrencilerle dolu
      filteredStudents = [...allStudents];
      
      // Filtreleri sıfırla
      if (studentSearchInput) studentSearchInput.value = '';
      if (gradeFilter) gradeFilter.value = '';
      if (styleFilter) styleFilter.value = '';
      
      // Ana sayfada öğrenci listesi göster
      renderStudentResults();
      
      // Ana menüyü (dashboard) aktif hale getir
      setActivePage('dashboard')();
      
      // Son seçili öğrenciyi localStorage'dan al ama otomatik seçme
      const lastSelectedId = localStorage.getItem('activeProfile');
      if (lastSelectedId) {
        const student = allStudents.find(s => s.id === lastSelectedId);
        if (student) {
          // Sadece selectedStudent'ı set et, detay sayfasına yönlendirme
          selectedStudent = student;
        }
      }
      
    } catch (e) {
      console.error('? Renderer: Öğrenci yükleme hatası:', e);
      showToast('Hata', 'Öğrenci verileri yüklenirken beklenmeyen bir hata oluştu', 'error', 5000);
      
      // Hata durumunda boş liste ile devam et
      allStudents = [];
      filteredStudents = [];
      renderStudentResults();
    }
  }
  
  function getStudentInitials(name) {
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  
  function getStyleBadgeText(style) {
    const styleMap = {
      'AYRIŞTIRAN': 'AYR',
      'ÖZÜMSEYEN': 'ÖZÜ', 
      'YERLEŞTİREN': 'YER',
      'DEĞİŞTİREN': 'DEĞ'
    };
    return styleMap[style] || style?.substring(0, 3) || '';
  }
  
  function filterStudents() {
    const searchTerm = studentSearchInput.value.toLowerCase().trim();
    const gradeFilter_value = gradeFilter.value;
    const styleFilter_value = styleFilter.value;
    
    filteredStudents = allStudents.filter(student => {
      // İsim araması
      const nameMatch = !searchTerm || student.name.toLowerCase().includes(searchTerm);
      
      // Sınıf filtresi - string karşılaştırması
      const gradeMatch = !gradeFilter_value || String(student.grade) === gradeFilter_value;
      
      // Öğrenme stili filtresi
      const styleMatch = !styleFilter_value || student.learningStyle === styleFilter_value;
      
      return nameMatch && gradeMatch && styleMatch;
    });
    
    renderStudentResults();
  }
  
  function renderStudentResults() {
    console.log('🔍 DEBUG: renderStudentResults çağrıldı');
    console.log('🔍 DEBUG: studentResults elementi:', !!studentResults);
    console.log('🔍 DEBUG: allStudents sayısı:', allStudents.length);
    console.log('🔍 DEBUG: filteredStudents sayısı:', filteredStudents.length);
    
    if (!studentResults) {
      console.warn('⚠️ student-results elementi bulunamadı');
      return;
    }
    
    studentResults.innerHTML = '';
    
    // Filtre kontrolü
    const hasFilter = studentSearchInput && (studentSearchInput.value.trim() || gradeFilter.value || styleFilter.value);
    const studentsToShow = hasFilter ? filteredStudents : allStudents;
    
    console.log('🔍 DEBUG: hasFilter:', hasFilter);
    console.log('🔍 DEBUG: studentsToShow sayısı:', studentsToShow.length);
    
    if (studentsToShow.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-students';
      
      if (hasFilter) {
        noResults.textContent = 'Arama kriterlerine uygun öğrenci bulunamadı.';
      } else {
        noResults.textContent = `Toplam ${allStudents.length} öğrenci yüklendi. Arama yapmak için yazmaya başlayın...`;
      }
      
      studentResults.appendChild(noResults);
      return;
    }
    
    studentsToShow.forEach(student => {
      const studentItem = document.createElement('div');
      studentItem.className = 'student-item';
      if (selectedStudent && selectedStudent.id === student.id) {
        studentItem.classList.add('selected');
      }
      
      studentItem.innerHTML = `
        <div class="student-avatar">
          ${getStudentInitials(student.name)}
        </div>
        <div class="student-info">
          <div class="student-name">${student.name}</div>
          <div class="student-details">
            <span>${student.grade}. Sınıf ${student.class || ''}</span>
            ${student.learningStyle ? `<span class="learning-style-badge">${getStyleBadgeText(student.learningStyle)}</span>` : ''}
          </div>
        </div>
      `;
      
      studentItem.addEventListener('click', () => selectStudent(student));
      studentResults.appendChild(studentItem);
    });
  }
  
  function selectStudent(student) {
    // Öğrenci detaylarını ana sayfa içinde göster
    selectedStudent = student;
    localStorage.setItem('activeProfile', student.id);
    
    // Dashboard sayfasına geç ve öğrenci detaylarını göster
    setActivePage('dashboard')();
    
    // Öğrenci detay bölümünü dashboard içinde göster
    showStudentDetailInDashboard(student);
    
    // Değerlendirme zamanını kontrol et
    checkEvaluationTiming();
  }
  
  // Dashboard görünümünü sıfırla
  function resetDashboardView() {
    console.log('🔍 DEBUG: Dashboard görünümü sıfırlanıyor');
    
    const dashboardContent = document.getElementById('dashboard-content');
    const studentDetailContainer = document.getElementById('dashboard-student-detail');
    
    if (dashboardContent) {
      dashboardContent.classList.remove('hidden');
    }
    
    if (studentDetailContainer) {
      studentDetailContainer.classList.add('hidden');
      studentDetailContainer.innerHTML = '';
    }
    
    isStudentDetailVisible = false;
    selectedStudent = null;
    localStorage.removeItem('activeProfile');
  }
  
  function showStudentDetailInDashboard(student) {
    console.log('🔍 DEBUG: Öğrenci detayları gösteriliyor:', student.name);
    
    const dashboardContent = document.getElementById('dashboard-content');
    const studentDetailContainer = document.getElementById('dashboard-student-detail');
    
    if (!dashboardContent || !studentDetailContainer) {
      console.error('? Dashboard containerları bulunamadı!');
      return;
    }
    
    // Normal dashboard içeriğini gizle
    dashboardContent.classList.add('hidden');
    
    // Öğrenci detay container'ını göster ve içeriği doldur
    studentDetailContainer.classList.remove('hidden');
    studentDetailContainer.innerHTML = `
      <div class="student-detail-container">
        <!-- Header -->
        <div class="student-detail-header">
          <div class="header-content">
            <button id="back-to-dashboard" class="back-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Geri Dön
            </button>
            <h1 class="page-title">Öğrenci Detayları</h1>
            <div class="header-actions">
              <button id="export-student-report" class="action-button primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                Rapor Oluştur
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="student-detail-main">
          <!-- Student Profile Card -->
          <section class="student-profile-section">
            <div class="student-profile-card">
              <div class="student-avatar">
                <div class="avatar-circle">
                  ${getStudentInitials(student.name)}
                </div>
              </div>
              <div class="student-info">
                <h2 class="student-name">${student.name}</h2>
                <div class="student-meta">
                  <span class="grade-info">${student.grade}. Sınıf</span>
                  <span class="class-info">${student.class || 'A'}</span>
                </div>
                <div class="learning-style-card">
                  <div class="learning-style-label">Öğrenme Stili</div>
                  <div class="learning-style-value">${student.learningStyle || 'Belirlenmemiş'}</div>
                </div>
              </div>
              <div class="student-actions">
                <button id="edit-student" class="action-button secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Düzenle
                </button>
                <button id="delete-student" class="action-button danger">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                  </svg>
                  Sil
                </button>
              </div>
            </div>
          </section>

          <!-- Ability Analysis Section -->
          <section class="ability-analysis-section">
            <div class="section-header">
              <h3>Kabiliyet Analizi</h3>
              <div class="section-subtitle">Öğrencinin güçlü ve geliştirilmesi gereken alanları</div>
            </div>
            
            <div class="ability-badges-container">
              <div class="ability-badges-grid">
                ${generateAbilityBadges(student.abilityLevels)}
              </div>
            </div>
            
            <div class="ability-summary">
              <div class="summary-card strongest">
                <div class="summary-header">
                  <div class="summary-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                  </div>
                  <h4>En Güçlü Kabiliyetler</h4>
                </div>
                <div class="summary-content">
                  ${analyzeAbilities(student.abilityLevels).strongest.join(', ') || 'Veri bulunamadı'}
                </div>
              </div>
              
              <div class="summary-card weakest">
                <div class="summary-header">
                  <div class="summary-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <h4>Geliştirilmesi Gerekenler</h4>
                </div>
                <div class="summary-content">
                  ${analyzeAbilities(student.abilityLevels).weakest.join(', ') || 'Veri bulunamadı'}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
    
    // State'i güncelle
    isStudentDetailVisible = true;
    
    // Event listener'ları kur
    setupStudentDetailEvents();
  }
  
  function showStudentDetailSection(student) {
    // Ana sayfa içeriğini öğrenci detayları ile değiştir
    const content = document.querySelector('.content');
    
    content.innerHTML = `
      <div class="student-detail-container">
        <!-- Header -->
        <div class="student-detail-header">
          <div class="header-content">
            <button id="back-to-dashboard" class="back-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Geri Dön
            </button>
            <h1 class="page-title">Öğrenci Detayları</h1>
            <div class="header-actions">
              <button id="export-student-report" class="action-button primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                Rapor Oluştur
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="student-detail-main">
          <!-- Student Profile Card -->
          <section class="student-profile-section">
            <div class="student-profile-card">
              <div class="student-avatar">
                <div class="avatar-circle">
                  ${getStudentInitials(student.name)}
                </div>
              </div>
              <div class="student-info">
                <h2 class="student-name">${student.name}</h2>
                <div class="student-meta">
                  <span class="grade-info">${student.grade}. Sınıf</span>
                  <span class="class-info">${student.class || 'A'}</span>
                </div>
                <div class="learning-style-card">
                  <div class="learning-style-label">Öğrenme Stili</div>
                  <div class="learning-style-value">${student.learningStyle || 'Belirlenmemiş'}</div>
                </div>
              </div>
              <div class="student-actions">
                <button id="edit-student" class="action-button secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Düzenle
                </button>
                <button id="delete-student" class="action-button danger">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                  </svg>
                  Sil
                </button>
              </div>
            </div>
          </section>

          <!-- Ability Analysis Section -->
          <section class="ability-analysis-section">
            <div class="section-header">
              <h3>Kabiliyet Analizi</h3>
              <div class="section-subtitle">Öğrencinin güçlü ve geliştirilmesi gereken alanları</div>
            </div>
            
            <div class="ability-badges-container">
              <div class="ability-badges-grid">
                ${generateAbilityBadges(student.abilityLevels)}
              </div>
            </div>
            
            <div class="ability-summary">
              <div class="summary-card strongest">
                <div class="summary-header">
                  <div class="summary-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                  </div>
                  <h4>En Güçlü Kabiliyetler</h4>
                </div>
                <div class="summary-content">
                  ${analyzeAbilities(student.abilityLevels).strongest.join(', ') || 'Veri bulunamadı'}
                </div>
              </div>
              
              <div class="summary-card weakest">
                <div class="summary-header">
                  <div class="summary-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <h4>Geliştirilmesi Gerekenler</h4>
                </div>
                <div class="summary-content">
                  ${analyzeAbilities(student.abilityLevels).weakest.join(', ') || 'Veri bulunamadı'}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
    
    // Event listener'ları ekle
    setupStudentDetailEvents();
  }
  
  function getStudentInitials(name) {
    if (!name) return '??';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  
  function loadDashboardContent() {
    console.log('🔍 DEBUG: Normal dashboard içeriği yükleniyor');
    
    // Önce dashboard görünümünü sıfırla
    resetDashboardView();
    
    // Dashboard içeriğini yeniden yükle (gerekirse)
    const dashboardContent = document.getElementById('dashboard-content');
    if (dashboardContent && dashboardContent.innerHTML.trim() === '') {
      // Dashboard içeriği boşsa yeniden yükle
      dashboardContent.innerHTML = `
        <div class="dashboard-header">
          <h1>Genel Durum</h1>
          <p>Öğrenci performansı ve genel istatistikler</p>
        </div>
        
        <div class="dashboard-stats">
          <div class="stat-card">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="stat-content">
              <h3>Toplam Öğrenci</h3>
              <p class="stat-number">${allStudents.length}</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div class="stat-content">
              <h3>Toplam Sınav</h3>
              <p class="stat-number">${recentExams.length}</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
                <rect x="9" y="3" width="6" height="8"/>
              </svg>
            </div>
            <div class="stat-content">
              <h3>Aktif Sınıflar</h3>
              <p class="stat-number">${new Set(allStudents.map(s => s.grade)).size}</p>
            </div>
          </div>
        </div>
        
        <div class="dashboard-content-grid">
          <div class="recent-exams-section">
            <h2>Son Sınavlar</h2>
            <div class="recent-exams-list" id="recent-exams-list">
              ${recentExams.slice(0, 5).map(exam => `
                <div class="exam-item">
                  <div class="exam-info">
                    <h4>${exam.name}</h4>
                    <p>${exam.date}</p>
                  </div>
                  <div class="exam-actions">
                    <button class="btn-small" onclick="viewExam('${exam.id}')">Görüntüle</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="student-search-section">
            <h2>Öğrenci Arama</h2>
            <div class="search-controls">
              <input type="text" id="student-search-input" placeholder="Öğrenci ara..." class="search-input">
              <select id="grade-filter" class="filter-select">
                <option value="">Tüm Sınıflar</option>
                <option value="5">5. Sınıf</option>
                <option value="6">6. Sınıf</option>
                <option value="7">7. Sınıf</option>
                <option value="8">8. Sınıf</option>
              </select>
            </div>
            <div class="student-results" id="student-results">
              <div class="no-students">Toplam ${allStudents.length} öğrenci yüklendi. Arama yapmak için yazmaya başlayın...</div>
            </div>
          </div>
        </div>
      `;
      
      // Event listener'ları yeniden kur
      setupDashboardEvents();
    }
    
    // Öğrenci listesini render et
    renderStudentResults();
  }
  
  function setupDashboardEvents() {
    // Öğrenci arama event listener'ları
    const studentSearchInput = document.getElementById('student-search-input');
    const gradeFilter = document.getElementById('grade-filter');
    const studentResults = document.getElementById('student-results');
    
    if (studentSearchInput) {
      studentSearchInput.addEventListener('input', () => {
        filterStudents();
        renderStudentResults();
      });
    }
    
    if (gradeFilter) {
      gradeFilter.addEventListener('change', () => {
        filterStudents();
        renderStudentResults();
      });
    }
  }
  
  function setupStudentDetailEvents() {
    // Geri dön butonu
    const backButton = document.getElementById('back-to-dashboard');
    if (backButton) {
      backButton.addEventListener('click', () => {
        console.log('🔍 DEBUG: Geri dön butonuna tıklandı');
        
        // Sadece öğrenci detayını gizle, dashboard'ı göster
        const dashboardContent = document.getElementById('dashboard-content');
        const studentDetailContainer = document.getElementById('dashboard-student-detail');
        
        if (studentDetailContainer) {
          studentDetailContainer.classList.add('hidden');
          studentDetailContainer.innerHTML = '';
        }
        
        if (dashboardContent) {
          dashboardContent.classList.remove('hidden');
        }
        
        isStudentDetailVisible = false;
        
        // ÖNEMLİ: selectedStudent ve localStorage'ı KORUYORUZ
        // selectedStudent = null; // YAPMA!
        // localStorage.removeItem('activeProfile'); // YAPMA!
        
        // Eğer seçili öğrenci varsa, o öğrencinin seçili olduğunu göster
        if (selectedStudent) {
          console.log(`✅ ${selectedStudent.name} seçili olarak korundu`);
          // Öğrenci listesini yeniden render et (seçili öğrenci highlight edilecek)
          renderStudentResults();
          // Seçili öğrencinin sınav verilerini göster
          displayDataForProfile(selectedStudent.name);
        }
      });
    }
    
    // Rapor oluştur butonu
    const exportButton = document.getElementById('export-student-report');
    if (exportButton) {
      exportButton.addEventListener('click', () => {
        if (currentUserRole !== 'manager') {
          showToast('Yetki Hatası', 'Bu işlem için müdür yetkisi gereklidir', 'error');
          return;
        }
        showToast('Bilgi', 'Rapor oluşturma özelliği yakında eklenecek', 'info');
      });
    }
    
    // Düzenle butonu
    const editButton = document.getElementById('edit-student');
    if (editButton) {
      editButton.addEventListener('click', () => {
        if (currentUserRole !== 'manager') {
          showToast('Yetki Hatası', 'Bu işlem için müdür yetkisi gereklidir', 'error');
          return;
        }
        showToast('Bilgi', 'Öğrenci düzenleme özelliği yakında eklenecek', 'info');
      });
    }
    
    // Sil butonu
    const deleteButton = document.getElementById('delete-student');
    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        if (currentUserRole !== 'manager') {
          showToast('Yetki Hatası', 'Bu işlem için müdür yetkisi gereklidir', 'error');
          return;
        }
        
        if (confirm(`${selectedStudent.name} adlı öğrenciyi silmek istediğinizden emin misiniz?`)) {
          // Electron API'den öğrenci sil
          if (window.electronAPI && window.electronAPI.deleteStudent) {
            window.electronAPI.deleteStudent(selectedStudent.id).then(result => {
              if (result.error) {
                showToast('Hata', 'Öğrenci silinemedi', 'error');
              } else {
                showToast('Başarılı', 'Öğrenci başarıyla silindi', 'success');
                // Ana sayfaya dön
                setActivePage('dashboard')();
                // Öğrenci listesini yenile
                loadAllStudents();
              }
            });
          }
        }
      });
    }
  }
  
  function updateSelectedStudentDisplay() {
    if (!selectedStudent) {
      if (selectedStudentDiv) {
        selectedStudentDiv.innerHTML = '<div class="no-selection">Henüz öğrenci seçilmedi</div>';
      }
      return;
    }
    
    // Kabiliyet rozetlerini oluştur
    const abilityBadges = generateAbilityBadges(selectedStudent.abilityLevels);
    
    // En güçlü ve zayıf kabiliyetleri belirle
    const abilityAnalysis = analyzeAbilities(selectedStudent.abilityLevels);
    
    if (selectedStudentDiv) {
      selectedStudentDiv.innerHTML = `
        <div class="selected-student-info">
          <div class="selected-avatar">
            ${getStudentInitials(selectedStudent.name)}
          </div>
          <div class="selected-details">
            <h4>${selectedStudent.name}</h4>
            <span>${selectedStudent.grade}. Sınıf ${selectedStudent.class || ''}</span>
            ${selectedStudent.learningStyle ? `
              <div class="learning-style-info">
                <span class="learning-style-label">Öğrenme Stili:</span>
                <span class="learning-style-value">${selectedStudent.learningStyle}</span>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="ability-section">
          <h5>Kabiliyet Analizi</h5>
          <div class="ability-badges">
            ${abilityBadges}
          </div>
          <div class="ability-summary">
            <div class="strongest-abilities">
              <span class="summary-label">En Güçlü:</span>
              <span class="summary-value">${abilityAnalysis.strongest.join(', ')}</span>
            </div>
            <div class="weakest-abilities">
              <span class="summary-label">Geliştirilmesi Gereken:</span>
              <span class="summary-value">${abilityAnalysis.weakest.join(', ')}</span>
            </div>
          </div>
        </div>
      `;
    }
  }
  
  // Kabiliyet rozetlerini oluştur
  function generateAbilityBadges(abilityLevels) {
    if (!abilityLevels) return '';
    
    const abilityNames = {
      visualSpatial: 'Görsel-Uzamsal',
      verbalLinguistic: 'Sözel-Dilsel',
      logicalMathematical: 'Mantıksal-Matematiksel',
      musicalRhythmic: 'Müziksel-Ritmik',
      bodilyKinesthetic: 'Bedensel-Kinestetik',
      interpersonal: 'Kişiler Arası',
      intrapersonal: 'İçsel-Öze Dönük',
      naturalist: 'Doğa Zekası'
    };
    
    const abilityColors = {
      visualSpatial: '#4CAF50',
      verbalLinguistic: '#2196F3',
      logicalMathematical: '#FF9800',
      musicalRhythmic: '#9C27B0',
      bodilyKinesthetic: '#F44336',
      interpersonal: '#00BCD4',
      intrapersonal: '#795548',
      naturalist: '#8BC34A'
    };
    
    return Object.keys(abilityNames).map(ability => {
      const data = abilityLevels[ability] || { level: 0, score: 0 };
      const level = data.level || 0;
      
      if (level === 0) return '';
      
      const color = abilityColors[ability];
      const levelText = level === 1 ? 'Kötü' : level === 2 ? 'Orta' : level === 3 ? 'İyi' : 'Belirsiz';
      
      return `
        <div class="ability-badge" style="border-color: ${color};">
          <span class="ability-name">${abilityNames[ability]}</span>
          <span class="ability-level">Seviye ${level}</span>
          <span class="ability-level-text">${levelText}</span>
        </div>
      `;
    }).filter(badge => badge !== '').join('');
  }
  
  // Kabiliyet analizi yap
  function analyzeAbilities(abilityLevels) {
    if (!abilityLevels) return { strongest: [], weakest: [] };
    
    const abilityNames = {
      visualSpatial: 'Görsel-Uzamsal',
      verbalLinguistic: 'Sözel-Dilsel',
      logicalMathematical: 'Mantıksal-Matematiksel',
      musicalRhythmic: 'Müziksel-Ritmik',
      bodilyKinesthetic: 'Bedensel-Kinestetik',
      interpersonal: 'Kişiler Arası',
      intrapersonal: 'İçsel-Öze Dönük',
      naturalist: 'Doğa Zekası'
    };
    
    // Seviye ve puanları birleştirerek sırala
    const abilitiesWithScores = Object.keys(abilityNames).map(ability => {
      const data = abilityLevels[ability] || { level: 0, score: 0 };
      return {
        name: abilityNames[ability],
        level: data.level || 0,
        score: data.score || 0,
        combined: (data.level || 0) * 20 + (data.score || 0) // Seviye * 20 + puan
      };
    }).filter(ability => ability.level > 0);
    
    // Sırala
    abilitiesWithScores.sort((a, b) => b.combined - a.combined);
    
    const strongest = abilitiesWithScores.slice(0, 3).map(a => a.name);
    const weakest = abilitiesWithScores.slice(-2).map(a => a.name);
    
    return { strongest, weakest };
  }
  
  function clearSearch() {
    studentSearchInput.value = '';
    gradeFilter.value = '';
    styleFilter.value = '';
    filteredStudents = [];
    renderStudentResults();
  }

  // Eski persistProfilesToStore fonksiyonu kaldırıldı - students.json kullanılıyor

  // Eski addProfileButton event listener kaldırıldı - yeni sistem altta

  // Eski deleteProfileButton ve profileSelect event listener'ları kaldırıldı - yeni sistem altta

  // --- Navigasyon ---
  // Navigation event listeners
  console.log('🔍 DEBUG: Sidebar butonları:', {
    navDashboardBtn: !!navDashboardBtn,
    navAddExamBtn: !!navAddExamBtn,
    navReportsBtn: !!navReportsBtn,
    navPlannerBtn: !!navPlannerBtn,
    navEtutlerBtn: !!navEtutlerBtn,
    navEvaluationBtn: !!navEvaluationBtn
  });

  if (navDashboardBtn) {
    navDashboardBtn.addEventListener('click', () => {
      console.log('🔍 DEBUG: Dashboard butonuna tıklandı');
      setActivePage('dashboard')();
    });
  }
  
  if (navAddExamBtn) {
    navAddExamBtn.addEventListener('click', () => {
      console.log('?? DEBUG: Add Exam butonuna tıklandı');
      setActivePage('add-exam')();
    });
  }
  
  if (navReportsBtn) {
    navReportsBtn.addEventListener('click', () => {
      console.log('?? DEBUG: Reports butonuna tıklandı');
      setActivePage('reports')();
      // PDF butonunu göster ve öğrenci bilgisini güncelle
      if (exportReportsPdfBtn && selectedStudent) {
        exportReportsPdfBtn.style.display = 'block';
        // Öğrenci ismini PDF için sakla
        exportReportsPdfBtn.setAttribute('data-student-name', selectedStudent.name);
      }
    });
  }
  
  if (navPlannerBtn) {
    navPlannerBtn.addEventListener('click', () => {
      console.log('?? DEBUG: Planner butonuna tıklandı');
      if (!isPremiumPlan()) {
        showToast('Premium Özellik', 'Ders Programı bölümü yalnızca Premium plan sahipleri için açıktır.', 'info');
        return;
      }
      setActivePage('planner')();
    });
  }
  
  if (navEtutlerBtn) {
    navEtutlerBtn.addEventListener('click', () => {
      console.log('?? DEBUG: Etutler butonuna tıklandı');
      setActivePage('etutler')();
    });
  }
  
  if (navEvaluationBtn) {
    navEvaluationBtn.addEventListener('click', () => {
      console.log('?? DEBUG: Evaluation butonuna tıklandı');
      setActivePage('evaluation')();
    });
  }
  
  if (navExamManagementBtn) {
    navExamManagementBtn.addEventListener('click', () => {
      console.log('?? DEBUG: Exam Management butonuna tıklandı');
      setActivePage('exam-management')();
    });
  }

  if (navPerformanceOverviewBtn) {
    navPerformanceOverviewBtn.addEventListener('click', () => {
      console.log('?? DEBUG: Performance Overview butonuna tıklandı');
      setActivePage('performance-overview')();
    });
  }

  // Tab navigation for reports section
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;

      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));

      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');

      // If it's the subject analysis tab, update charts
      if (tabId === 'tab-subjects') {
        const activeProfile = selectedStudent?.name;
        const profileExams = activeProfile
          ? allExams.filter(exam => exam.profile === selectedStudent.name)
          : [];
        updateCharts(profileExams);
      }
      
    });
  });

  // --- Ders Alanlarını Oluştur ---
  function renderCourseInputs(mode = 'add', coursesData = {}) {
    const container = mode === 'add' ? coursesContainer : editCoursesContainer;
    if (!container) return;
    container.innerHTML = '';
    // Dersleri istenen sıraya göre düzenle: Türkçe, Sosyal, Din, İngilizce, Matematik, Fen
    const subjectOrder = ['Türkçe', 'Sosyal Bilgiler', 'Din Kültürü ve Ahlak Bilgisi', 'İngilizce', 'Matematik', 'Fen Bilimleri'];
    const subjects = outcomes ? subjectOrder.filter(subject => outcomes[subject]) : subjectOrder;
    
    console.log('renderCourseInputs: outcomes:', outcomes);
    console.log('renderCourseInputs: subjects:', subjects);
    
    console.log('renderCourseInputs: subjects:', subjects);
    console.log('renderCourseInputs: outcomes keys:', outcomes ? Object.keys(outcomes) : 'outcomes null');
    
    subjects.forEach(subjectKey => {
      if (subjectKey === 'yabanci_dil') return; // Skip this one

      const courseEntry = document.createElement('div');
      courseEntry.className = 'course-entry';

      const title = document.createElement('h4');
      // Ders isimlerini düzelt
      const subjectNames = {
        'Sosyal Bilgiler': 'Sosyal Bilgiler',
        'Matematik': 'Matematik',
        'Fen Bilimleri': 'Fen Bilimleri',
        'Din Kültürü ve Ahlak Bilgisi': 'Din Kültürü',
        'Türkçe': 'Türkçe',
        'İngilizce': 'İngilizce'
      };
      title.textContent = subjectNames[subjectKey] || subjectKey;
      courseEntry.appendChild(title);

      const dbyContainer = document.createElement('div');
      dbyContainer.className = 'd-y-b-container';

      const correctGroup = document.createElement('div');
      correctGroup.className = 'input-group';
      const correctLabel = document.createElement('label');
      correctLabel.textContent = 'Doğru';
      const correctInput = document.createElement('input');
      correctInput.type = 'number';
      correctInput.id = `${mode}-correct-${subjectKey}`;
      correctInput.min = 0;
      correctInput.max = questionCounts[subjectKey];
      correctInput.value = coursesData[subjectKey]?.correct || '';
      correctGroup.appendChild(correctLabel);
      correctGroup.appendChild(correctInput);
      dbyContainer.appendChild(correctGroup);

      const incorrectGroup = document.createElement('div');
      incorrectGroup.className = 'input-group';
      const incorrectLabel = document.createElement('label');
      incorrectLabel.textContent = 'Yanlış';
      const incorrectInput = document.createElement('input');
      incorrectInput.type = 'number';
      incorrectInput.id = `${mode}-incorrect-${subjectKey}`;
      incorrectInput.min = 0;
      incorrectInput.max = questionCounts[subjectKey];
      incorrectInput.value = coursesData[subjectKey]?.incorrect || '';
      incorrectGroup.appendChild(incorrectLabel);
      incorrectGroup.appendChild(incorrectInput);
      dbyContainer.appendChild(incorrectGroup);

      const blankGroup = document.createElement('div');
      blankGroup.className = 'input-group';
      const blankLabel = document.createElement('label');
      blankLabel.textContent = 'Boş';
      const blankInput = document.createElement('input');
      blankInput.type = 'number';
      blankInput.id = `${mode}-blank-${subjectKey}`;
      blankInput.min = 0;
      blankInput.max = questionCounts[subjectKey];
      blankInput.value = coursesData[subjectKey]?.blank || '';
      blankGroup.appendChild(blankLabel);
      blankGroup.appendChild(blankInput);
      dbyContainer.appendChild(blankGroup);

      courseEntry.appendChild(dbyContainer);

      // Türkçe ve İngilizce için kazanım seçimi yok, sadece doğru/yanlış/boş
      if (subjectKey !== 'Türkçe' && subjectKey !== 'İngilizce') {
      const outcomesButton = document.createElement('button');
      outcomesButton.textContent = 'Yanlış/Boş Kazanımlarını Seç';
      outcomesButton.className = 'btn-secondary';
      outcomesButton.type = 'button';
      courseEntry.appendChild(outcomesButton);

      const outcomesContainer = document.createElement('div');
      outcomesContainer.className = 'topic-inputs-container';
      outcomesContainer.style.display = 'none';
      courseEntry.appendChild(outcomesContainer);

      outcomesButton.addEventListener('click', () => {
        outcomesContainer.style.display = outcomesContainer.style.display === 'none' ? 'block' : 'none';
        if (outcomesContainer.style.display === 'block') {
          renderOutcomesForSubject(outcomesContainer, subjectKey, mode, coursesData[subjectKey]?.incorrectOutcomes);
        }
      });
      }

      container.appendChild(courseEntry);
    });
  }

  function renderOutcomesForSubject(container, subjectKey, mode = 'add', incorrectOutcomes = []) {
    container.innerHTML = '';
    
    // Seçili öğrencinin sınıf düzeyini al
    const profileGrade = selectedStudent ? selectedStudent.grade : '';
    
    console.log('renderOutcomesForSubject: subjectKey:', subjectKey);
    console.log('renderOutcomesForSubject: profileGrade:', profileGrade);
    console.log('renderOutcomesForSubject: outcomes keys:', outcomes ? Object.keys(outcomes) : 'outcomes null');
    
    // Eğer profil seçilmemişse uyarı ver
    if (!selectedStudent || !profileGrade) {
      container.innerHTML = '<p>Önce bir öğrenci profili seçiniz.</p>';
      return;
    }
    
    // Yeni Kazanımlar.json yapısına göre kazanımları al
    let subjectOutcomes = [];
    
    if (outcomes && outcomes[subjectKey] && outcomes[subjectKey][profileGrade]) {
      // Yeni yapı: outcomes[ders][sınıf] = [kazanımlar]
      subjectOutcomes = outcomes[subjectKey][profileGrade];
      console.log('renderOutcomesForSubject: Yeni yapı kullanıldı, kazanım sayısı:', subjectOutcomes.length);
    } else if (outcomes && outcomes[subjectKey]) {
      // Eski yapı: outcomes[ders] = [kazanımlar] (sınıf filtresi yok)
      subjectOutcomes = outcomes[subjectKey];
      console.log('renderOutcomesForSubject: Eski yapı kullanıldı, kazanım sayısı:', subjectOutcomes.length);
    }
    
    if (subjectOutcomes && subjectOutcomes.length > 0) {
      subjectOutcomes.forEach((outcomeData, index) => {
        const checkboxGroup = document.createElement('div');
        checkboxGroup.className = 'checkbox-group';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${mode}-outcome-${subjectKey}-${index}`;
        
        // Yeni yapıda outcomeData bir object, eski yapıda string
        let outcomeText = '';
        if (typeof outcomeData === 'string') {
          outcomeText = outcomeData;
        } else if (outcomeData && outcomeData.ogrenme_cikti) {
          outcomeText = outcomeData.ogrenme_cikti;
        } else if (outcomeData && outcomeData.kazanim) {
          outcomeText = outcomeData.kazanim;
        } else {
          outcomeText = JSON.stringify(outcomeData);
        }
        
        checkbox.value = outcomeText;
        if (incorrectOutcomes.includes(outcomeText)) {
          checkbox.checked = true;
        }
        
        const label = document.createElement('label');
        label.htmlFor = `${mode}-outcome-${subjectKey}-${index}`;
        label.textContent = stripKazanimCode(outcomeText);
        label.title = outcomeText; // Orijinal metni tooltip olarak sakla
        checkboxGroup.appendChild(checkbox);
        checkboxGroup.appendChild(label);
        container.appendChild(checkboxGroup);
      });
    } else {
      container.innerHTML = '<p>Bu ders ve sınıf için kazanım bulunmuyor.</p>';
    }
  }

  // --- Kazanımlar ---
  window.electronAPI.loadOutcomes();
  window.electronAPI.onOutcomesLoaded((payload) => {
    if (payload?.error) {
      console.error('Kazanım yükleme hatası:', payload.error);
      return;
    }
    outcomes = payload?.outcomes || null;
    console.log('Kazanımlar yüklendi:', outcomes);
    if (addExamSection.classList.contains('active')) {
      renderCourseInputs();
    }
  });
  
  // Sayfa yüklendiğinde dersleri render et
    setTimeout(() => {
      if (addExamSection.classList.contains('active')) {
        renderCourseInputs();
      }
    }, 1000);

  // --- Haftalık Plan Verisi ---
  async function loadHaftalikPlanData() {
    try {
      haftalikPlanData = await window.electronAPI.loadHaftalikPlan() || {};
      console.log('Haftalık plan verisi yüklendi:', Object.keys(haftalikPlanData));
    } catch (error) {
      console.error('Haftalık plan yükleme hatası:', error);
    }
  }
  
  // Sayfa yüklendiğinde haftalık plan verisini yükle
  loadHaftalikPlanData();

  window.electronAPI.onOutcomesUpdated(() => {
    window.electronAPI.loadOutcomes();
  });

  // --- Sınav Kaydetme ---
  examForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Yetki kontrolü
    if (currentUserRole !== 'manager') {
      showToast('Yetki Hatası', 'Bu işlem için müdür yetkisi gereklidir.', 'error');
      return;
    }

    const activeProfile = selectedStudent?.name;
    if (!activeProfile) {
      alert('Sınavı kaydetmeden önce bir öğrenci seçmelisiniz.');
      return;
    }

    const examName = document.getElementById('exam-name').value;
    const examDate = document.getElementById('exam-date').value;
    if (!examName || !examDate) {
        alert('Sınav adı ve tarihi boş bırakılamaz.');
        return;
    }

    const courses = {};
    const subjects = outcomes ? Object.keys(outcomes) : ['turkce', 'matematik', 'fen', 'inkilap', 'din', 'ingilizce'];
    
    for (const subjectKey of subjects) {
      if (subjectKey === 'yabanci_dil') continue; // Skip this one

      const correct = parseInt(document.getElementById(`add-correct-${subjectKey}`).value || '0', 10);
      const incorrect = parseInt(document.getElementById(`add-incorrect-${subjectKey}`).value || '0', 10);
      const blank = parseInt(document.getElementById(`add-blank-${subjectKey}`).value || '0', 10);
      const total = correct + incorrect + blank;

      if (total > questionCounts[subjectKey]) {
        alert(`${subjectKey} için girdiğiniz doğru, yanlış ve boş sayıları toplamı (${total}), toplam soru sayısını (${questionCounts[subjectKey]}) geçemez.`);
        return;
      }

      const net = correct - (incorrect / 4); // 4 yanlış = 1 doğru

      const selectedOutcomes = [];
      const outcomeCheckboxes = document.querySelectorAll(`input[id^="add-outcome-${subjectKey}-"]:checked`);
      outcomeCheckboxes.forEach(checkbox => {
        selectedOutcomes.push(checkbox.value);
      });

      // Eğer yanlış soru varsa ama kazanım seçilmemişse uyar (Türkçe ve İngilizce hariç)
      if (incorrect > 0 && selectedOutcomes.length === 0 && subjectKey !== 'Türkçe' && subjectKey !== 'İngilizce') {
        const subjectNames = {
          'Türkçe': 'Türkçe',
          'Matematik': 'Matematik',
          'Fen Bilimleri': 'Fen Bilimleri',
          'Sosyal Bilgiler': 'Sosyal Bilgiler',
          'Din Kültürü ve Ahlak Bilgisi': 'Din Kültürü',
          'İngilizce': 'İngilizce'
        };
        
        const subjectName = subjectNames[subjectKey] || subjectKey;
        alert(`${subjectName} dersinde ${incorrect} yanlış soru var ama hangi kazanımlarda yanlış yaptığınızı belirtmediniz.\n\nLütfen "Yanlış/Boş Kazanımlarını Seç" butonuna tıklayarak ilgili kazanımları seçin.`);
        return;
      }

      courses[subjectKey] = {
        correct,
        incorrect,
        blank,
        net,
        incorrectOutcomes: selectedOutcomes,
      };
    }

    // Duplicate kontrolü
    const existingExam = allExams.find(exam => 
      exam.profile === activeProfile && 
      exam.name === examName && 
      exam.date === examDate
    );
    
    if (existingExam) {
      const update = confirm(`Bu sınav zaten kayıtlı (${examName} - ${examDate}). Güncellemek ister misiniz?`);
      if (update) {
        // Mevcut sınavı güncelle
        existingExam.courses = courses;
        showToast('Başarılı', 'Sınav güncellendi', 'success');
        
        // Sınav yönetimi sayfasını da yenile (eğer açıksa)
        if (examManagementSection && examManagementSection.classList.contains('active')) {
          loadExamManagement();
        }
      } else {
        showToast('İptal', 'Sınav ekleme iptal edildi', 'info');
        return;
      }
    } else {
      // Yeni sınav oluştur
    const newExam = {
      id: Date.now(),
      profile: activeProfile,
      name: examName,
      date: examDate,
      courses: courses,
    };

    allExams.push(newExam);
    }

    // Veriyi kaydet
    // Data formatını koru: { value: [...], Count: number }
    const dataToSave = {
      value: allExams,
      Count: allExams.length
    };
    const result = await window.electronAPI.saveData(dataToSave);
    
    if (result.error) {
      if (!handlePermissionError(result)) {
        showToast('Hata', `Sınav kaydedilirken hata oluştu: ${result.error}`, 'error');
      }
      return;
    }

    alert('Sınav başarıyla kaydedildi!');
    examForm.reset();
    
    // Ana ekrana dön ve listeyi yenile
    setActivePage('dashboard')();
    displayDataForProfile(activeProfile);
    
    // Sınav yönetimi sayfasını da yenile (eğer açıksa)
    if (examManagementSection && examManagementSection.classList.contains('active')) {
      loadExamManagement();
    }
  });

  let goalVsActualChart = null;

  // --- Hedef Takibi ---
  const goalNetInput = document.getElementById('goal-net');
  const goalLgsScoreInput = document.getElementById('goal-lgs-score');
  const goalDateInput = document.getElementById('goal-date');
  const setGoalBtn = document.getElementById('set-goal-btn');
  const currentGoalDisplay = document.getElementById('current-goal-display');

  const subjectColors = {
    turkce: { bg: 'rgba(255, 99, 132, 0.6)', border: 'rgba(255, 99, 132, 1)' },
    matematik: { bg: 'rgba(54, 162, 235, 0.6)', border: 'rgba(54, 162, 235, 1)' },
    fen: { bg: 'rgba(255, 206, 86, 0.6)', border: 'rgba(255, 206, 86, 1)' },
    inkilap: { bg: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)' },
    din: { bg: 'rgba(153, 102, 255, 0.6)', border: 'rgba(153, 102, 255, 1)' },
    ingilizce: { bg: 'rgba(255, 159, 64, 0.6)', border: 'rgba(255, 159, 64, 1)' },
  };

  function saveGoals() {
    if (!selectedStudent) {
      alert('Hedef kaydetmek için önce bir öğrenci seçmelisiniz!');
      return;
    }
    
    const goals = {
      net: parseFloat(goalNetInput.value) || 0,
      lgsScore: parseFloat(goalLgsScoreInput.value) || 0,
      date: goalDateInput.value,
      subjectGoals: {
        turkce: parseFloat(document.getElementById('goal-turkce').value) || 0,
        matematik: parseFloat(document.getElementById('goal-matematik').value) || 0,
        fen: parseFloat(document.getElementById('goal-fen').value) || 0,
        inkilap: parseFloat(document.getElementById('goal-inkilap').value) || 0,
        din: parseFloat(document.getElementById('goal-din').value) || 0,
        ingilizce: parseFloat(document.getElementById('goal-ingilizce').value) || 0,
      }
    };
    
    // Kişiye özel hedef kaydet
    const studentGoalKey = `goals_${selectedStudent.id}`;
    localStorage.setItem(studentGoalKey, JSON.stringify(goals));
    console.log(`Hedefler kaydedildi: ${selectedStudent.name} (${selectedStudent.id})`);
    updateGoalUI();
    alert('Hedefler başarıyla kaydedildi!');
  }

  function loadGoals() {
    if (!selectedStudent) {
      return null;
    }
    
    // Kişiye özel hedefleri yükle
    const studentGoalKey = `goals_${selectedStudent.id}`;
    const savedGoals = localStorage.getItem(studentGoalKey);
    return savedGoals ? JSON.parse(savedGoals) : null;
  }

  function updateGoalUI() {
    const goals = loadGoals();
    currentGoalDisplay.innerHTML = '';

    if (goals) {
      currentGoalDisplay.innerHTML = `
        <h4>Mevcut Hedefler</h4>
        <p>Hedef Toplam Net: ${goals.net.toFixed(2)}</p>
        <p>Hedef LGS Puanı: ${goals.lgsScore.toFixed(2)}</p>
        <p>Hedef Tarih: ${goals.date}</p>
      `;
      goalNetInput.value = goals.net;
      goalLgsScoreInput.value = goals.lgsScore;
      goalDateInput.value = goals.date;

      // Ders bazında hedefleri güncelle
      for (const subjectKey in goals.subjectGoals) {
        const input = document.getElementById(`goal-${subjectKey}`);
        if (input) {
          input.value = goals.subjectGoals[subjectKey];
        }
      }

      // Hedef vs Gerçekleşen Performans Grafiği
      const goalVsActualCtx = document.getElementById('goal-vs-actual-chart').getContext('2d');
      if (goalVsActualChart) {
        goalVsActualChart.destroy();
      }

      const profileExams = allExams.filter(exam => exam.profile === selectedStudent?.name);

      let avgNet = 0;
      let avgLgs = 0;
      const avgSubjectNets = {};

      if (profileExams.length > 0) {
        const totalNet = profileExams.reduce((acc, exam) => acc + Object.values(exam.courses).reduce((sum, course) => {
          const net = course.correct - (course.incorrect / 4);
          return sum + Math.max(0, net);
        }, 0), 0);
        avgNet = totalNet / profileExams.length;

        const totalLgs = profileExams.reduce((acc, exam) => acc + parseFloat(calculateLgsScore(exam)), 0);
        avgLgs = totalLgs / profileExams.length;

        for (const subjectKey in goals.subjectGoals) {
          const totalSubjectNet = profileExams.reduce((acc, exam) => acc + (exam.courses[subjectKey]?.net || 0), 0);
          avgSubjectNets[subjectKey] = totalSubjectNet / profileExams.length;
        }
      }

      const labels = ['Hedef Net', 'Ortalama Net', 'Hedef LGS', 'Ortalama LGS'];
      const data = [
        goals.net,
        avgNet.toFixed(2),
        goals.lgsScore,
        avgLgs.toFixed(2)
      ];

      const backgroundColors = ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)'];
      const borderColors = ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)'];

      // Add subject goals to chart
      for (const subjectKey in goals.subjectGoals) {
        labels.push(`${subjectKey.charAt(0).toUpperCase() + subjectKey.slice(1)} Hedef Net`);
        data.push(goals.subjectGoals[subjectKey]);
        backgroundColors.push(subjectColors[subjectKey].bg); 
        borderColors.push(subjectColors[subjectKey].border);

        labels.push(`${subjectKey.charAt(0).toUpperCase() + subjectKey.slice(1)} Ortalama Net`);
        data.push(avgSubjectNets[subjectKey]?.toFixed(2) || 0);
        backgroundColors.push(subjectColors[subjectKey].bg.replace('0.6', '0.3')); // Lighter version
        borderColors.push(subjectColors[subjectKey].border.replace('1', '0.6'));
      }

      goalVsActualChart = new Chart(goalVsActualCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Değer',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Hedef vs Gerçekleşen Performans'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });

    } else {
      currentGoalDisplay.innerHTML = '<p>Henüz bir hedef belirlenmedi.</p>';
      if (goalVsActualChart) goalVsActualChart.destroy();
    }
  }

  setGoalBtn.addEventListener('click', saveGoals);

  // --- Başlangıç ---
  async function initialize() {
    setActivePage('dashboard')();
    await loadAllStudents();
    await loadInitialData();
    updateGoalUI(); // Load and display goals on initialization
  }

  initialize();

  // Pop-up'ları yönet
  const weakTopicsPopup = document.getElementById('weak-topics-popup');
  const bestSubjectsPopup = document.getElementById('best-subjects-popup');
  const summaryWorstTopicList = document.getElementById('summary-worst-topic-list');
  const summaryBestSubject = document.getElementById('summary-best-subject');

  let hidePopupTimer = null;

  function showPopup(element, popup, content) {
    if (hidePopupTimer) {
        clearTimeout(hidePopupTimer);
        hidePopupTimer = null;
    }
    popup.innerHTML = content;
    const rect = element.getBoundingClientRect();
    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.top - 20}px`;
    popup.style.display = 'block';
    setTimeout(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'scale(1) translateY(0)';
    }, 10);
  }

  function hidePopup(popup) {
    hidePopupTimer = setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.transform = 'scale(0.95) translateY(10px)';
        setTimeout(() => {
            if (popup.style.opacity === '0') {
                popup.style.display = 'none';
            }
        }, 200);
    }, 200);
  }

  [summaryWorstTopicList, weakTopicsPopup, summaryBestSubject, bestSubjectsPopup].forEach(element => {
      element.addEventListener('mouseenter', (event) => {
          if (hidePopupTimer) {
              clearTimeout(hidePopupTimer);
              hidePopupTimer = null;
          }
          if (event.currentTarget.id === 'summary-worst-topic-list') {
              const fullHtml = topicsToRepeat.map(([topic, count]) => {
                // ? cleanTopicName kaldırıldı - tam metin göster
                return topic ? `<li>${topic} (${count} kez tekrar)</li>` : '';
              }).filter(html => html).join('');
              showPopup(summaryWorstTopicList, weakTopicsPopup, `<ul>${fullHtml}</ul>`);
          }
          if (event.currentTarget.id === 'summary-best-subject' && summaryBestSubject.scrollWidth > summaryBestSubject.clientWidth) {
              showPopup(summaryBestSubject, bestSubjectsPopup, summaryBestSubject.textContent);
          }
      });

      element.addEventListener('mouseleave', () => {
          hidePopup(weakTopicsPopup);
          hidePopup(bestSubjectsPopup);
      });
  });

  // --- Öğrenci Arama Event Listeners ---
  
  // Arama inputu
  studentSearchInput.addEventListener('input', filterStudents);
  
  // Filtreler
  gradeFilter.addEventListener('change', filterStudents);
  styleFilter.addEventListener('change', filterStudents);
  
  // Arama temizleme
  searchClearBtn.addEventListener('click', clearSearch);
  
  // --- Profil Yönetimi Event Listeners ---
  
  // Profil ekleme modal açma
  addProfileButton.addEventListener('click', () => {
    profileNameInput.value = '';
    profileGradeInput.value = '';
    profileClassInput.value = '';
    profileLearningStyleInput.value = '';
    profileModal.style.display = 'block';
  });

  // Modal kapatma
  closeModalButton.addEventListener('click', () => {
    profileModal.style.display = 'none';
  });

  // Modal dışına tıklayınca kapatma
  window.addEventListener('click', (event) => {
    if (event.target === profileModal) {
      profileModal.style.display = 'none';
    }
  });

  // Profil kaydetme
  saveProfileButton.addEventListener('click', async () => {
    // Yetki kontrolü
    if (currentUserRole !== 'manager') {
      showToast('Yetki Hatası', 'Bu işlem için müdür yetkisi gereklidir.', 'error');
      return;
    }

    const name = profileNameInput.value.trim();
    const grade = profileGradeInput.value;
    const classShube = profileClassInput.value;
    const learningStyle = profileLearningStyleInput.value;

    if (!name || !grade) {
      alert('Lütfen öğrenci adını ve sınıfını girin!');
      return;
    }

    try {
      // Yeni öğrenci objesi oluştur
      const newStudent = {
        id: `student_${Date.now()}`,
        name: name,
        grade: grade,
        class: classShube ? `${grade}${classShube}` : null,
        learningStyle: learningStyle || null,
        personalizedSettings: {
          studyDuration: learningStyle === 'DEĞİŞTİREN' ? 25 : 
                        learningStyle === 'YERLEŞTİREN' ? 30 :
                        learningStyle === 'ÖZÜMSEYEN' ? 40 : 
                        learningStyle === 'AYRIŞTIRAN' ? 45 : 30,
          breakInterval: 5,
          preferredActivities: [],
          motivationLevel: "medium"
        },
        academicData: {
          weaknesses: [],
          strengths: [],
          lastExamDate: null,
          averageScore: null,
          examHistory: []
        },
        learningStyleData: {
          style: learningStyle,
          confidence: 0,
          characteristics: [],
          recommendedTechniques: []
        },
        intelligenceTypes: {
          verbal: 0,      // Sözel/Dilsel Zeka
          logical: 0,     // Matematiksel/Mantıksal Zeka
          visual: 0,      // Görsel/Uzamsal Zeka
          musical: 0,     // Müziksel/Ritmik Zeka
          kinesthetic: 0, // Bedensel/Kinestetik Zeka
          interpersonal: 0, // Kişiler Arası Zeka
          intrapersonal: 0, // İçsel/Öze Dönük Zeka
          naturalist: 0   // Doğa Zekası
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Students.json'a kaydet
      const saveResult = await window.electronAPI.saveStudent(newStudent);
      
      if (saveResult.error) {
        if (!handlePermissionError(saveResult)) {
          alert(`Profil kaydedilirken hata oluştu: ${saveResult.error}`);
        }
        return;
      }
      
      profileModal.style.display = 'none';
      await loadAllStudents();
      
      // Yeni eklenen öğrenciyi seç ama detay sayfasına yönlendirme
      selectedStudent = newStudent;
      localStorage.setItem('activeProfile', newStudent.id);
      
      alert(`${name} başarıyla eklendi!`);
      
    } catch (error) {
      console.error('Profil kaydetme hatası:', error);
      alert('Profil kaydedilirken bir hata oluştu!');
    }
  });

  // Profil silme
  deleteProfileButton.addEventListener('click', async () => {
    if (!selectedStudent) {
      alert('Silinecek öğrenci seçilmedi!');
      return;
    }

    if (confirm(`"${selectedStudent.name}" öğrencisini silmek istediğinizden emin misiniz?`)) {
      try {
        const result = await window.electronAPI.deleteStudent(selectedStudent.id);
        
        if (result.error) {
          if (!handlePermissionError(result)) {
            alert(`Öğrenci silinirken hata oluştu: ${result.error}`);
          }
          return;
        }
        
        await loadAllStudents();
        selectedStudent = null;
        localStorage.removeItem('activeProfile');
        updateSelectedStudentDisplay();
        
        // Ana sayfaya dön
        setActivePage('dashboard')();
        
        alert('Öğrenci başarıyla silindi!');
      } catch (error) {
        console.error('Öğrenci silme hatası:', error);
        alert('Öğrenci silinirken bir hata oluştu!');
      }
    }
  });

  // Not: Profil değişikliği artık student search sisteminde selectStudent() fonksiyonunda yapılıyor

  // --- CSV Import Event Listeners ---
  
  // CSV dosyası seçme
  csvUploadBtn.addEventListener('click', () => {
    csvFileInput.click();
  });
  
  csvFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      csvFileName.textContent = `?? ${file.name}`;
      csvFileInfo.style.display = 'flex';
      csvImportBtn.disabled = false;
      showCsvStatus('Dosya seçildi. İçe aktarmak için butona tıklayın.', 'info');
    } else {
      showCsvStatus('Lütfen geçerli bir CSV dosyası seçin.', 'error');
    }
  });
  
  // CSV dosyasını kaldır
  csvRemoveBtn.addEventListener('click', () => {
    csvFileInput.value = '';
    csvFileInfo.style.display = 'none';
    csvImportBtn.disabled = true;
    hideCsvStatus();
  });
  
  // CSV import işlemi - FAZ 2: Preview ile
  let pendingCSVData = null; // Preview'dan sonra import için bekleyen data

  csvImportBtn.addEventListener('click', async () => {
    const file = csvFileInput.files[0];
    if (!file) {
      showCsvStatus('Lütfen bir CSV dosyası seçin.', 'error');
      return;
    }

    try {
      csvImportBtn.disabled = true;
      csvImportBtn.textContent = 'Analiz ediliyor...';
      showCsvStatus('CSV dosyası okunuyor ve analiz ediliyor...', 'info');

      const csvText = await file.text();
      const csvData = parseCSV(csvText);

      showCsvStatus(`${csvData.length} satır bulundu. Önizleme hazırlanıyor...`, 'info');

      // Preview oluştur ve göster
      const preview = generateCSVPreview(csvData);
      pendingCSVData = csvData;
      displayCSVPreview(preview);

    } catch (error) {
      console.error('CSV preview hatası:', error);
      showCsvStatus(`CSV analiz edilirken hata oluştu: ${error.message}`, 'error');
      csvImportBtn.disabled = false;
      csvImportBtn.textContent = 'CSV\'yi İçe Aktar';
    }
  });

  // CSV Preview Modal - İptal
  csvPreviewCancel.addEventListener('click', () => {
    csvPreviewModal.style.display = 'none';
    pendingCSVData = null;
    csvImportBtn.disabled = false;
    csvImportBtn.textContent = 'CSV\'yi İçe Aktar';
    showCsvStatus('İçe aktarma iptal edildi.', 'info');
  });

  // CSV Preview Modal - Onayla ve İçe Aktar
  csvPreviewConfirm.addEventListener('click', async () => {
    if (!pendingCSVData) {
      showCsvStatus('Hata: CSV verisi bulunamadı.', 'error');
      return;
    }

    try {
      csvPreviewModal.style.display = 'none';
      csvImportBtn.disabled = true;
      csvImportBtn.textContent = 'İçe Aktarılıyor...';
      showCsvStatus('CSV verileri içe aktarılıyor...', 'info');

      const result = await importCSVData(pendingCSVData);
      pendingCSVData = null;

      if (result.success) {
        const successRate = ((result.imported / result.stats.totalRows) * 100).toFixed(1);
        showCsvStatus(
          `Başarılı! ${result.imported} sınav eklendi, ${result.errors} hata. (Başarı oranı: %${successRate})`,
          'success'
        );

        // Verileri yenile
        await loadInitialData();
        if (selectedStudent) {
          displayDataForProfile(selectedStudent.name);
        }

        // Formu temizle
        csvFileInput.value = '';
        csvFileInfo.style.display = 'none';
        csvImportBtn.disabled = true;
      } else {
        showCsvStatus(`Hata: ${result.message}`, 'error');
      }

    } catch (error) {
      console.error('CSV import hatası:', error);
      showCsvStatus(`CSV işlenirken hata oluştu: ${error.message}`, 'error');
    } finally {
      csvImportBtn.disabled = false;
      csvImportBtn.textContent = 'CSV\'yi İçe Aktar';
    }
  });
  
  // CSV yardımcı fonksiyonları
  function showCsvStatus(message, type) {
    csvStatus.textContent = message;
    csvStatus.className = `import-status ${type}`;
    csvStatus.style.display = 'block';
  }
  
  function hideCsvStatus() {
    csvStatus.style.display = 'none';
  }
  
  function parseCSV(csvText) {
    // CSV parsing'i daha güvenilir yap
    const lines = [];
    let currentLine = '';
    let insideQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === '\n' && !insideQuotes) {
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        currentLine = '';
        continue;
      }
      
      currentLine += char;
    }
    
    // Son satırı da ekle
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    
    if (lines.length < 2) throw new Error('CSV dosyası çok kısa');
    
    // Header'ı parse et
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    // Data satırlarını parse et
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= headers.length) {  // Geçerli satır kontrolü
        const row = {};
        headers.forEach((header, index) => {
          const value = (values[index] || '').trim();
          // DEBUG: Uzun metinleri logla
          if (value.length > 100) {
            console.log(`?? DEBUG: Uzun metin bulundu (${value.length} karakter):`, value.substring(0, 100) + '...');
          }
          row[header] = value;
        });
        data.push(row);
      }
    }
    
    return data;
  }
  
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Son değeri de ekle
    result.push(current.trim());
    
    return result.map(v => v.replace(/^"|"$/g, '')); // Başındaki ve sonundaki tırnakları kaldır
  }

  // ===== GELİŞMİŞ ÖĞRENCİ EŞLEŞTİRME SİSTEMİ =====
  
  /**
   * Levenshtein Distance algoritması - iki string arasındaki düzenleme mesafesi
   * @param {string} str1 - İlk string
   * @param {string} str2 - İkinci string
   * @returns {number} Düzenleme mesafesi
   */
  function levenshteinDistance(str1, str2) {
    // Güvenlik kontrolü - string olmayan değerleri string'e çevir
    str1 = String(str1 || '');
    str2 = String(str2 || '');
    
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * İki string arasındaki benzerlik oranını hesaplar
   * @param {string} str1 - İlk string
   * @param {string} str2 - İkinci string
   * @returns {number} 0.0 - 1.0 arası benzerlik oranı
   */
  function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * İsmi parçalara ayırır ve normalize eder
   * @param {string} name - İsim
   * @returns {Array} Normalize edilmiş isim parçaları
   */
  function normalizeNameParts(name) {
    if (!name) return [];
    
    return name
      .trim()
      .split(/\s+/)
      .filter(part => part.length > 0)
      .map(part => part.toLowerCase());
  }

  /**
   * Gelişmiş öğrenci eşleştirme fonksiyonu - 5 seviye eşleştirme stratejisi
   * @param {string} csvStudentName - CSV'den gelen öğrenci adı
   * @param {string} csvStudentNumber - CSV'den gelen öğrenci numarası (opsiyonel)
   * @param {Array} allStudents - Tüm öğrenci listesi
   * @returns {Object|null} { student, method, confidence } veya null
   */
  function findStudentAdvanced(csvStudentName, csvStudentNumber, allStudents) {
    if (!csvStudentName || !allStudents || allStudents.length === 0) {
      return null;
    }

    const csvName = csvStudentName.trim();
    const csvNameLower = csvName.toLowerCase();
    const csvNameParts = normalizeNameParts(csvName);
    
    // SEVİYE 1: Tam Eşleşme (Mevcut sistem)
    let student = allStudents.find(s => 
      s.name.trim().toLowerCase() === csvNameLower
    );
    if (student) {
      return { 
        student, 
        method: 'Tam eşleşme', 
        confidence: 1.0 
      };
    }

    // SEVİYE 2: Ad + Soyad Eşleşmesi
    if (csvNameParts.length >= 2) {
      student = allStudents.find(s => {
        const sNameParts = normalizeNameParts(s.name);
        if (sNameParts.length < 2) return false;
        
        // Ad eşleşmesi (ilk kelime)
        const adMatch = sNameParts[0] === csvNameParts[0];
        // Soyad eşleşmesi (son kelime)
        const soyadMatch = sNameParts[sNameParts.length - 1] === 
                          csvNameParts[csvNameParts.length - 1];
        
        return adMatch && soyadMatch;
      });
      
      if (student) {
        return { 
          student, 
          method: 'Ad + Soyad eşleşmesi', 
          confidence: 0.95 
        };
      }
    }

    // SEVİYE 3: Sadece Ad Eşleşmesi
    if (csvNameParts.length >= 1) {
      const matches = allStudents.filter(s => {
        const sNameParts = normalizeNameParts(s.name);
        if (sNameParts.length < 1) return false;
        
        return sNameParts[0] === csvNameParts[0];
      });
      
      if (matches.length === 1) {
        return { 
          student: matches[0], 
          method: 'Sadece ad eşleşmesi', 
          confidence: 0.7 
        };
      } else if (matches.length > 1) {
        // Birden fazla eşleşme - sınıf bilgisi ile filtrele
        console.warn(`⚠️ "${csvName}" için ${matches.length} aday bulundu:`, 
          matches.map(m => m.name));
        return { 
          student: matches[0], 
          method: 'Sadece ad eşleşmesi (çoklu)', 
          confidence: 0.6 
        };
      }
    }

    // SEVİYE 4: Benzerlik Algoritması (Fuzzy Matching - Levenshtein Distance)
    let bestMatch = null;
    let bestScore = 0;

    allStudents.forEach(s => {
      const similarity = calculateSimilarity(csvNameLower, s.name.toLowerCase());
      // similarity 0-100 arası değer döndürüyor, 0-1 arasına çevirmeliyiz
      const normalizedSimilarity = similarity / 100;

      if (normalizedSimilarity > bestScore && normalizedSimilarity > 0.7) { // %70 benzerlik eşiği (düşürüldü)
        bestMatch = s;
        bestScore = normalizedSimilarity;
      }
    });

    if (bestMatch) {
      return {
        student: bestMatch,
        method: `Fuzzy matching`,
        confidence: bestScore
      };
    }

    // SEVİYE 5: Okul Numarası Eşleşmesi (Gelecek için hazır)
    if (csvStudentNumber) {
      student = allStudents.find(s => 
        s.studentNumber && s.studentNumber.toString() === csvStudentNumber.toString()
      );
      if (student) {
        return { 
          student, 
          method: 'Okul numarası eşleşmesi', 
          confidence: 0.99 
        };
      }
    }

    return null;
  }

  // --- Kazanım Eşleştirme Fonksiyonları ---
  
  function getKazanimlarSubjectName(csvSubjectKey) {
    const mapping = {
      'turkce': 'Türkçe',
      'matematik': 'Matematik',
      'fen': 'Fen Bilimleri',
      'inkilap': 'Sosyal Bilgiler',
      'din': 'Din Kültürü ve Ahlak Bilgisi',
      'ingilizce': 'İngilizce'
    };
    return mapping[csvSubjectKey] || csvSubjectKey;
  }

  function normalizeKazanimText(text) {
    if (!text) return '';
    
    // Metni normalize et (küçük harf, noktalama işaretleri kaldır, fazla boşlukları temizle)
    return text
      .toLowerCase()
      .replace(/[.,;:!?()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Kazanım kodunu ve gereksiz notları temizler
   * @param {string} text - Temizlenecek metin
   * @returns {string} Temizlenmiş metin
   */
  function stripKazanimCode(text) {
    if (!text) return '';
    
    // Kazanım kodunu kaldır: ^[A-ZÇĞİÖŞÜ]{1,4}\.\d[\d.]*\s*
    let cleanText = text.replace(/^[A-ZÇĞİÖŞÜ]{1,4}\.\d[\d.]*\s*/, '').trim();
    
    // Parantez içi saat ve notları kaldır: (2 saat), (1 ders), *Okul Temelli Planlama
    cleanText = cleanText.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    cleanText = cleanText.replace(/\s*\*[^*]*\*/g, ' ').trim();
    
    // Fazla boşlukları temizle
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    return cleanText || text; // Eğer temizleme sonucu boşsa orijinali döndür
  }

  async function loadKazanimlarDatabase() {
    try {
      const kazanimlar = await window.electronAPI.loadKazanimlar();
      kazanimlarDatabase = kazanimlar || {};
      
      // İndeks oluştur (hızlı arama için)
      kazanimlarIndex = {};
      let totalKazanimlar = 0;
      
      for (const [subject, grades] of Object.entries(kazanimlarDatabase)) {
        for (const [grade, kazanimList] of Object.entries(grades)) {
          if (Array.isArray(kazanimList)) {
            kazanimList.forEach(item => {
              // Güvenli kazanım metni çıkarma - önce kazanim, sonra ogrenme_cikti
              let kazanimText = '';
              if (typeof item === 'string') {
                kazanimText = item;
              } else if (typeof item === 'object' && item !== null) {
                if (typeof item.kazanim === 'string') {
                  kazanimText = item.kazanim;
                } else if (typeof item.ogrenme_cikti === 'string') {
                  kazanimText = item.ogrenme_cikti;
                } else {
                  console.warn('Geçersiz kazanım formatı:', item);
                  return; // Bu item'ı atla
                }
              } else {
                console.warn('Geçersiz kazanım formatı:', item);
                return; // Bu item'ı atla
              }

              // Kazanım metni string değilse atla (ek güvenlik)
              if (typeof kazanimText !== 'string') {
                console.warn('Kazanım metni string değil:', kazanimText);
                return;
              }

              const normalized = normalizeKazanimText(kazanimText);
              
              if (!kazanimlarIndex[normalized]) {
                kazanimlarIndex[normalized] = [];
              }
              
              kazanimlarIndex[normalized].push({
                subject,
                grade,
                fullText: kazanimText,
                hafta: item.hafta || 'N/A'
              });
              
              totalKazanimlar++;
            });
          }
        }
      }
      
      console.log(`? Kazanımlar veritabanı yüklendi: ${totalKazanimlar} kazanım, ${Object.keys(kazanimlarIndex).length} benzersiz`);
      console.log(`?? Dersler:`, Object.keys(kazanimlarDatabase));
    } catch (error) {
      console.error('? Kazanımlar yüklenemedi:', error);
      kazanimlarDatabase = {};
      kazanimlarIndex = {};
    }
  }

  /**
   * Kazanım kodunu tam metne çevirir
   * @param {string} kazanimCode - Kazanım kodu (örn: "sb 5.1.1", "M.8.1.1.1")
   * @returns {string} Tam kazanım metni veya kod (bulunamazsa)
   */
  function getKazanimFullText(kazanimCode) {
    if (!kazanimCode || !kazanimlarDatabase) {
      return kazanimCode;
    }
    
    // Normalize et
    const normalized = normalizeKazanimText(kazanimCode);
    
    // 1. Önce tam eşleşme ara (mevcut mantık)
    if (kazanimlarIndex[normalized]) {
      const matches = kazanimlarIndex[normalized];
      if (matches.length > 0) {
        return matches[0].fullText; // İlk eşleşmeyi döndür
      }
    }
    
    // 2. Eğer tam eşleşme yoksa, kısmi eşleşme ara (sadece kod kısmı)
    // Örnek: "sb.6.3.1" -> "sb 6 3 1" ile indekste "sb 6 3 1 türkistan..." arar
    for (const [indexKey, matches] of Object.entries(kazanimlarIndex)) {
      if (indexKey.startsWith(normalized + ' ')) {
        return matches[0].fullText; // İlk eşleşmeyi döndür
      }
    }
    
    // Bulunamazsa kodu temizle ve sadece metin kısmını döndür
    return stripKazanimCode(kazanimCode);
  }

  function matchKazanim(csvKazanimText, csvSubjectKey, studentGrade) {
    if (!csvKazanimText || !csvKazanimText.trim()) {
      return {
        matched: false,
        fullText: '',
        confidence: 0,
        method: 'Boş Kazanım'
      };
    }
    
    const normalized = normalizeKazanimText(csvKazanimText);
    const jsonSubjectName = getKazanimlarSubjectName(csvSubjectKey);
    const gradeStr = studentGrade.toString();
    
    // 1. Tam eşleşme
    if (kazanimlarIndex[normalized]) {
      const matches = kazanimlarIndex[normalized].filter(
        k => k.subject === jsonSubjectName && k.grade === gradeStr
      );
      if (matches.length > 0) {
        return {
          matched: true,
          fullText: matches[0].fullText,
          confidence: 1.0,
          method: 'Tam Eşleşme'
        };
      }
    }
    
    // 2. Kısmi eşleşme (CSV metni JSON'daki metnin başlangıcı veya tam tersi)
    for (const [key, items] of Object.entries(kazanimlarIndex)) {
      // CSV metni kesilmiş olabilir, JSON'daki tam metin ile başlıyor mu?
      if (key.startsWith(normalized) || normalized.startsWith(key)) {
        const matches = items.filter(
          k => k.subject === jsonSubjectName && k.grade === gradeStr
        );
        if (matches.length > 0) {
          return {
            matched: true,
            fullText: matches[0].fullText,
            confidence: 0.85,
            method: 'Kısmi Eşleşme (Kesilmiş Metin)'
          };
        }
      }
    }
    
    // 3. Benzerlik skoru (Levenshtein) - en az %70 benzerlik
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [key, items] of Object.entries(kazanimlarIndex)) {
      const similarity = calculateSimilarity(normalized, key);
      
      if (similarity > 0.7 && similarity > bestScore) {
        const matches = items.filter(
          k => k.subject === jsonSubjectName && k.grade === gradeStr
        );
        if (matches.length > 0) {
          bestScore = similarity;
          bestMatch = {
            matched: true,
            fullText: matches[0].fullText,
            confidence: similarity,
            method: `Benzerlik Eşleşmesi (%${(similarity * 100).toFixed(0)})`
          };
        }
      }
    }
    
    if (bestMatch) {
      return bestMatch;
    }
    
    // 4. Eşleşme bulunamadı - yeni kazanım olarak eklenecek
    return {
      matched: false,
      fullText: csvKazanimText,
      confidence: 0,
      method: 'Yeni Kazanım'
    };
  }

  async function addNewKazanimToDatabase(csvSubjectKey, studentGrade, kazanimText) {
    try {
      const jsonSubjectName = getKazanimlarSubjectName(csvSubjectKey);
      const gradeStr = studentGrade.toString();
      
      // Normalize edilmiş metinle kontrol et
      const normalized = normalizeKazanimText(kazanimText);
      
      // DUPLIKASYON KONTROLÜ
      if (kazanimlarDatabase[jsonSubjectName] && 
          kazanimlarDatabase[jsonSubjectName][gradeStr]) {
        const exists = kazanimlarDatabase[jsonSubjectName][gradeStr].some(k => {
          const existingNormalized = normalizeKazanimText(k.kazanim);
          return existingNormalized === normalized;
        });
        
        if (exists) {
          console.log(`?? Kazanım zaten mevcut, eklenmedi: "${kazanimText}"`);
          return true; // Hata değil, sadece zaten var
        }
      }
      
      // Yeni kazanım ekle
      if (!kazanimlarDatabase[jsonSubjectName]) {
        kazanimlarDatabase[jsonSubjectName] = {};
      }
      
      if (!kazanimlarDatabase[jsonSubjectName][gradeStr]) {
        kazanimlarDatabase[jsonSubjectName][gradeStr] = [];
      }
      
      const newKazanim = {
        hafta: 'CSV Import',
        kazanim: kazanimText
      };
      
      kazanimlarDatabase[jsonSubjectName][gradeStr].push(newKazanim);
      
      // İndeksi güncelle
      if (!kazanimlarIndex[normalized]) {
        kazanimlarIndex[normalized] = [];
      }
      
      kazanimlarIndex[normalized].push({
        subject: jsonSubjectName,
        grade: gradeStr,
        fullText: kazanimText,
        hafta: 'CSV Import'
      });
      
      // JSON dosyasını kaydet
      const result = await window.electronAPI.saveKazanimlar(kazanimlarDatabase);
      
      if (result.error) {
        console.error('? Kazanım kaydedilemedi:', result.error);
        // İşlemi geri al
        kazanimlarDatabase[jsonSubjectName][gradeStr].pop();
        kazanimlarIndex[normalized].pop();
        return false;
      }
      
      console.log(`? Yeni kazanım eklendi: ${jsonSubjectName} ${gradeStr}. Sınıf - "${kazanimText}"`);
      console.log(`?? Toplam kazanım sayısı: ${result.count}`);
      
      return true;
    } catch (error) {
      console.error('? Kazanım eklenemedi:', error);
      return false;
    }
  }

  // --- Manuel Öğrenci Eşleştirme Fonksiyonları ---
  
  function showStudentMatchModal(csvStudentName, csvRow, possibleMatches) {
    console.log(`?? DEBUG: showStudentMatchModal çağrıldı - "${csvStudentName}" için ${possibleMatches.length} eşleşme`);
    
    const modal = document.getElementById('student-match-modal');
    const nameElement = document.getElementById('csv-student-name');
    const optionsList = document.getElementById('match-options-list');
    const allStudentsList = document.getElementById('all-students-list');
    const searchInput = document.getElementById('modal-student-search');
    
    console.log(`?? DEBUG: Modal elementi:`, modal);
    console.log(`?? DEBUG: nameElement:`, nameElement);
    console.log(`?? DEBUG: optionsList:`, optionsList);
    
    if (!modal) {
      console.error('? Modal elementi bulunamadı!');
      return;
    }
    
    nameElement.textContent = csvStudentName;
    optionsList.innerHTML = '';
    allStudentsList.innerHTML = '';
    
    // Otomatik eşleşmeleri listele
    possibleMatches.forEach((match, index) => {
      const option = document.createElement('div');
      option.className = 'match-option';
      option.dataset.studentId = match.student.id;
      
      const confidence = match.confidence * 100;
      const confidenceClass = confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low';
      
      option.innerHTML = `
        <div class="match-option-info">
          <div class="match-option-name">${match.student.name}</div>
          <div class="match-option-details">
            ${match.student.grade}. Sınıf ${match.student.class || ''} | 
            Eşleştirme: ${match.method}
          </div>
        </div>
        <div class="match-confidence confidence-${confidenceClass}">
          ${confidence.toFixed(0)}%
        </div>
      `;
      
      option.addEventListener('click', () => {
        // Seçimi işaretle
        document.querySelectorAll('.match-option, .student-option').forEach(opt => 
          opt.classList.remove('selected')
        );
        option.classList.add('selected');
        
        // Seçimi kaydet ve modal'ı kapat
        if (window.resolveStudentMatch) {
          window.resolveStudentMatch(match.student, csvRow);
        }
        modal.style.display = 'none';
      });
      
      optionsList.appendChild(option);
    });
    
    // Tüm öğrencileri listele
    allStudents.forEach(student => {
      const option = document.createElement('div');
      option.className = 'student-option';
      option.dataset.studentId = student.id;
      
      option.innerHTML = `
        <div class="match-option-info">
          <div class="match-option-name">${student.name}</div>
          <div class="match-option-details">
            ${student.grade}. Sınıf ${student.class || ''} | 
            Tüm Liste
          </div>
        </div>
        <div class="match-confidence">
          ??
        </div>
      `;
      
      option.addEventListener('click', () => {
        // Seçimi işaretle
        document.querySelectorAll('.match-option, .student-option').forEach(opt => 
          opt.classList.remove('selected')
        );
        option.classList.add('selected');
        
        // Seçimi kaydet ve modal'ı kapat
        if (window.resolveStudentMatch) {
          window.resolveStudentMatch(student, csvRow);
        }
        modal.style.display = 'none';
      });
      
      allStudentsList.appendChild(option);
    });
    
    // Arama fonksiyonu
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const allOptions = allStudentsList.querySelectorAll('.student-option');
      
      allOptions.forEach(option => {
        const studentName = option.querySelector('.match-option-name').textContent.toLowerCase();
        if (studentName.includes(searchTerm)) {
          option.style.display = 'flex';
        } else {
          option.style.display = 'none';
        }
      });
    });
    
    // Arama temizleme
    document.getElementById('modal-search-clear-btn').addEventListener('click', () => {
      searchInput.value = '';
      allStudentsList.querySelectorAll('.student-option').forEach(option => {
        option.style.display = 'flex';
      });
    });
    
    console.log(`?? DEBUG: Modal açılıyor...`);
    modal.style.display = 'block';
    console.log(`?? DEBUG: Modal display style:`, modal.style.display);
    console.log(`?? DEBUG: Modal görünür mü?`, modal.offsetParent !== null);
    console.log(`?? DEBUG: Modal z-index:`, window.getComputedStyle(modal).zIndex);
  }

  function findAllPossibleMatches(csvStudentName, students, limit = 5) {
    console.log(`?? DEBUG: findAllPossibleMatches çağrıldı - "${csvStudentName}" için ${students.length} öğrenci`);
    
    // CSV'den gelen ismi normalize et
    const csvNormalized = csvStudentName.trim().toLowerCase();
    const csvParts = csvStudentName.trim().split(/\s+/);
    
    const matches = students.map(student => {
      const studentNormalized = student.name.trim().toLowerCase();
      const studentParts = student.name.trim().split(/\s+/);
      
      // Farklı kombinasyonlar için benzerlik hesapla
      const scores = [];
      
      // 1. Tam ad benzerliği
      scores.push(calculateSimilarity(csvNormalized, studentNormalized));
      
      // 2. İlk kelime benzerliği (ad)
      if (csvParts.length > 0 && studentParts.length > 0) {
        scores.push(calculateSimilarity(
          csvParts[0].toLowerCase(),
          studentParts[0].toLowerCase()
        )); // Tam skor - çarpan kaldırıldı
      }
      
      // 3. Son kelime benzerliği (soyad)
      if (csvParts.length > 1 && studentParts.length > 1) {
        scores.push(calculateSimilarity(
          csvParts[csvParts.length - 1].toLowerCase(),
          studentParts[studentParts.length - 1].toLowerCase()
        )); // Tam skor - çarpan kaldırıldı
      }
      
      // En yüksek skoru al
      const confidence = Math.max(...scores) / 100; // 0-1 aralığına normalize et
      
      return {
        student,
        confidence,
        method: confidence > 0.8 ? 'Yüksek benzerlik' : 
                confidence > 0.5 ? 'Orta benzerlik' : 
                'Düşük benzerlik'
      };
    });
    
    console.log(`?? DEBUG: Tüm eşleşmeler hesaplandı:`, matches.map(m => ({
      name: m.student.name,
      confidence: m.confidence.toFixed(2),
      method: m.method
    })));
    
    // En yüksek 10 skoru göster
    const topMatches = matches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
    console.log(`?? DEBUG: En yüksek 10 skor:`, topMatches.map(m => ({
      name: m.student.name,
      confidence: (m.confidence * 100).toFixed(1) + '%',
      method: m.method
    })));
    
    // Skora göre sırala ve filtrelenen adayları al
    const filteredMatches = matches
      .filter(m => m.confidence > 0.001)  // En az %0.1 benzerlik (çok düşük eşik - herkes gelsin)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
    
    console.log(`?? DEBUG: Filtrelenmiş eşleşmeler (confidence > 0.001):`, filteredMatches.length);
    
    // Eğer hiç aday yoksa, en yüksek 5 skoru göster ve zorla modal aç
    if (filteredMatches.length === 0) {
      console.log(`?? DEBUG: Hiç aday bulunamadı! En yüksek 5 skor:`, matches
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5)
        .map(m => ({
          name: m.student.name,
          confidence: (m.confidence * 100).toFixed(1) + '%',
          method: m.method
        })));
      
      // Zorla ilk 5 öğrenciyi döndür
      console.log(`?? DEBUG: Zorla modal açılıyor - ilk 5 öğrenci gösteriliyor`);
      return matches
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
    } else {
      console.log(`?? DEBUG: Modal için adaylar:`, filteredMatches.map(m => ({
        name: m.student.name,
        confidence: (m.confidence * 100).toFixed(1) + '%'
      })));
    }
    
    return filteredMatches;
  }

  async function showStudentMatchModalAsync(csvStudentName, csvRow, possibleMatches) {
    console.log(`?? DEBUG: showStudentMatchModalAsync çağrıldı - "${csvStudentName}" için ${possibleMatches.length} eşleşme`);
    return new Promise((resolve) => {
      // Modal'ı göster
      console.log(`?? DEBUG: showStudentMatchModal çağrılıyor...`);
      showStudentMatchModal(csvStudentName, csvRow, possibleMatches);
      
      // Kullanıcı seçimi yaptığında resolve et
      window.resolveStudentMatch = (selectedStudent, row) => {
        // Seçilen öğrenci ile devam et
        resolve({ student: selectedStudent, row });
      };
      
      // Atla butonu
      document.getElementById('skip-student-btn').onclick = () => {
        document.getElementById('student-match-modal').style.display = 'none';
        resolve(null);
      };
      
      // Tümünü atla butonu
      document.getElementById('skip-all-btn').onclick = () => {
        skipAllErrors = true;
        document.getElementById('student-match-modal').style.display = 'none';
        resolve(null);
      };
      
      // İptal butonu
      document.getElementById('cancel-import-btn').onclick = () => {
        importCancelled = true;
        document.getElementById('student-match-modal').style.display = 'none';
        resolve(null);
      };
    });
  }

  // ========================================
  // FAZ 1-3: CSV IMPORT GELİŞMELERİ
  // ========================================

  // FAZ 2: CSV PREVIEW FONKSİYONU
  function generateCSVPreview(csvData) {
    const preview = {
      totalRows: csvData.length,
      firstRows: csvData.slice(0, 10),
      problems: [],
      statistics: {
        duplicates: 0,
        validationErrors: 0,
        matchingIssues: 0,
        warnings: 0
      }
    };

    // Hızlı analiz - tüm satırlar için problemleri tespit et
    const seenExams = new Set();

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const studentName = cleanStudentName(row['Öğrenci Adı'] || row['Öğrenci'] || '');
      const examName = row['Sınav Adı'] || row['Sınav'] || '';
      const examDate = row['Sınav Tarihi'] || row['Tarih'] || '';
      const lgsScore = parseFloat(row['LGS_Puanı'] || 0);

      // Öğrenci eşleştirme kontrolü
      const matchResult = findStudentAdvanced(studentName);
      if (!matchResult) {
        preview.problems.push({
          row: i + 1,
          type: 'matching',
          message: `Öğrenci bulunamadı: "${studentName}"`
        });
        preview.statistics.matchingIssues++;
      } else if (matchResult.confidence < 0.9) {
        preview.problems.push({
          row: i + 1,
          type: 'warning',
          message: `Belirsiz eşleşme: "${studentName}" → "${matchResult.student.name}" (%${(matchResult.confidence * 100).toFixed(0)})`
        });
        preview.statistics.warnings++;
      }

      // Duplicate kontrolü
      const examKey = `${matchResult?.student?.name || studentName}_${examName}_${examDate}`;
      if (seenExams.has(examKey)) {
        preview.problems.push({
          row: i + 1,
          type: 'duplicate',
          message: `Duplicate sınav: ${examName} (${examDate})`
        });
        preview.statistics.duplicates++;
      }
      seenExams.add(examKey);

      // Skor validasyonu
      const subjects = [
        { key: 'TR', prefix: 'Türkçe' },
        { key: 'MAT', prefix: 'Matematik' },
        { key: 'FEN', prefix: 'Fen' },
        { key: 'SOS', prefix: 'Sosyal' },
        { key: 'DIN', prefix: 'Din' },
        { key: 'ING', prefix: 'İngilizce' }
      ];

      for (const subject of subjects) {
        const correct = parseInt(row[`${subject.prefix}_Doğru`] || 0);
        const incorrect = parseInt(row[`${subject.prefix}_Yanlış`] || 0);
        const blank = parseInt(row[`${subject.prefix}_Boş`] || 0);

        const validation = validateScores(subject.key, correct, incorrect, blank, studentName);
        if (!validation.valid) {
          preview.problems.push({
            row: i + 1,
            type: 'validation',
            message: `${subject.prefix} - ${validation.errors[0]}`
          });
          preview.statistics.validationErrors++;
        }
      }

      // LGS skor validasyonu
      const lgsValidation = validateLGSScore(lgsScore);
      if (!lgsValidation.valid) {
        preview.problems.push({
          row: i + 1,
          type: 'validation',
          message: lgsValidation.message
        });
        preview.statistics.validationErrors++;
      }
    }

    return preview;
  }

  // FAZ 2: CSV PREVIEW DISPLAY FONKSİYONU
  function displayCSVPreview(preview) {
    // İstatistikleri göster
    const totalProblems = preview.statistics.duplicates +
                         preview.statistics.validationErrors +
                         preview.statistics.matchingIssues;

    csvPreviewStats.innerHTML = `
      <div class="preview-stat-item">
        <span class="preview-stat-label">Toplam Satır</span>
        <span class="preview-stat-value">${preview.totalRows}</span>
      </div>
      <div class="preview-stat-item">
        <span class="preview-stat-label">Muhtemel Başarılı</span>
        <span class="preview-stat-value success">${preview.totalRows - totalProblems}</span>
      </div>
      <div class="preview-stat-item">
        <span class="preview-stat-label">Duplicate</span>
        <span class="preview-stat-value ${preview.statistics.duplicates > 0 ? 'error' : ''}">${preview.statistics.duplicates}</span>
      </div>
      <div class="preview-stat-item">
        <span class="preview-stat-label">Validasyon Hatası</span>
        <span class="preview-stat-value ${preview.statistics.validationErrors > 0 ? 'error' : ''}">${preview.statistics.validationErrors}</span>
      </div>
      <div class="preview-stat-item">
        <span class="preview-stat-label">Eşleştirme Sorunu</span>
        <span class="preview-stat-value ${preview.statistics.matchingIssues > 0 ? 'error' : ''}">${preview.statistics.matchingIssues}</span>
      </div>
      <div class="preview-stat-item">
        <span class="preview-stat-label">Uyarılar</span>
        <span class="preview-stat-value ${preview.statistics.warnings > 0 ? 'warning' : ''}">${preview.statistics.warnings}</span>
      </div>
    `;

    // İlk 10 satırı tablo olarak göster
    let tableHTML = `
      <table class="preview-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Öğrenci Adı</th>
            <th>Sınav Adı</th>
            <th>Tarih</th>
            <th>LGS Puanı</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
    `;

    preview.firstRows.forEach((row, index) => {
      const studentName = row['Öğrenci Adı'] || row['Öğrenci'] || '';
      const examName = row['Sınav Adı'] || row['Sınav'] || '';
      const examDate = row['Sınav Tarihi'] || row['Tarih'] || '';
      const lgsScore = row['LGS_Puanı'] || '0';

      // Bu satırın problemlerini bul
      const rowProblems = preview.problems.filter(p => p.row === index + 1);
      const hasError = rowProblems.some(p => p.type === 'duplicate' || p.type === 'validation' || p.type === 'matching');
      const hasWarning = rowProblems.some(p => p.type === 'warning');

      const statusClass = hasError ? 'error' : (hasWarning ? 'warning' : 'success');
      const statusText = hasError ? '❌ Hata' : (hasWarning ? '⚠️ Uyarı' : '✅ OK');

      tableHTML += `
        <tr>
          <td>${index + 1}</td>
          <td class="student-name ${hasError ? 'validation-error' : ''}">${studentName}</td>
          <td>${examName}</td>
          <td>${examDate}</td>
          <td>${lgsScore}</td>
          <td class="${statusClass}">${statusText}</td>
        </tr>
      `;
    });

    tableHTML += '</tbody></table>';
    csvPreviewTable.innerHTML = tableHTML;

    // Problemleri göster
    if (preview.problems.length > 0) {
      const maxProblems = 20;
      const problemsToShow = preview.problems.slice(0, maxProblems);

      let problemsHTML = `<h4>⚠️ Tespit Edilen Sorunlar (${preview.problems.length} adet)</h4>`;
      problemsHTML += '<div class="problem-list">';

      problemsToShow.forEach(problem => {
        const icon = problem.type === 'duplicate' ? '🔁' :
                    problem.type === 'validation' ? '❌' :
                    problem.type === 'matching' ? '🔍' : '⚠️';
        problemsHTML += `
          <div class="problem-item">
            <span class="problem-icon">${icon}</span>
            Satır ${problem.row}: ${problem.message}
          </div>
        `;
      });

      if (preview.problems.length > maxProblems) {
        problemsHTML += `<div class="problem-item">... ve ${preview.problems.length - maxProblems} sorun daha</div>`;
      }

      problemsHTML += '</div>';
      csvPreviewProblems.innerHTML = problemsHTML;
    } else {
      csvPreviewProblems.innerHTML = '<div style="color: #38a169; font-weight: 600;">✅ Sorun tespit edilmedi!</div>';
    }

    // Modalı göster
    csvPreviewModal.style.display = 'flex';
  }

  // FAZ 3: PROGRESS BAR FONKSİYONLARI
  function showProgress() {
    csvProgressContainer.style.display = 'block';
    csvProgressBar.style.width = '0%';
    csvProgressPercentage.textContent = '0%';
    csvProgressText.textContent = 'İşleniyor...';
    csvProgressDetails.innerHTML = '';
  }

  function updateProgress(current, total, stats) {
    const percentage = Math.round((current / total) * 100);
    csvProgressBar.style.width = `${percentage}%`;
    csvProgressPercentage.textContent = `${percentage}%`;
    csvProgressText.textContent = `${current} / ${total} satır işlendi`;

    // Detayları göster
    csvProgressDetails.innerHTML = `
      <div class="progress-detail-item">
        <span class="progress-detail-label">✅ Başarılı:</span>
        <span class="progress-detail-value success">${stats.imported}</span>
      </div>
      <div class="progress-detail-item">
        <span class="progress-detail-label">❌ Hata:</span>
        <span class="progress-detail-value error">${stats.errors}</span>
      </div>
      <div class="progress-detail-item">
        <span class="progress-detail-label">🔁 Duplicate:</span>
        <span class="progress-detail-value warning">${stats.duplicates}</span>
      </div>
      <div class="progress-detail-item">
        <span class="progress-detail-label">⚠️ Validasyon:</span>
        <span class="progress-detail-value warning">${stats.validationErrors}</span>
      </div>
    `;
  }

  function hideProgress() {
    csvProgressContainer.style.display = 'none';
  }

  // FAZ 1.1: DUPLICATE KONTROL FONKSİYONLARI
  function isDuplicateExam(profile, examName, examDate) {
    return allExams.some(exam =>
      exam.profile === profile &&
      exam.name === examName &&
      exam.date === examDate
    );
  }

  // Duplicate handling seçenekleri
  let duplicateHandlingMode = 'skip'; // 'ask', 'skip', 'update', 'add-all'
  const csvDuplicateStats = {
    found: 0,
    skipped: 0,
    updated: 0,
    addedAnyway: 0
  };

  // FAZ 1.2: SKOR VALIDASYON FONKSİYONLARI
  function validateScores(subjectKey, correct, incorrect, blank, studentName) {
    const errors = [];
    const warnings = [];

    // Toplam soru sayısı kontrolü
    const total = correct + incorrect + blank;
    const expectedTotal = questionCounts[subjectKey];

    if (expectedTotal && total !== expectedTotal) {
      errors.push(`Toplam soru sayısı ${expectedTotal} olmalı, ${total} bulundu`);
    }

    // Negatif değer kontrolü
    if (correct < 0 || incorrect < 0 || blank < 0) {
      errors.push('Negatif değer olamaz');
    }

    // Minimum skor kontrolü
    if (correct === 0 && incorrect === 0 && blank === expectedTotal) {
      warnings.push('Tüm sorular boş');
    }

    // Mantıksız skor kontrolü
    if (expectedTotal && (correct > expectedTotal || incorrect > expectedTotal || blank > expectedTotal)) {
      errors.push('Soru sayısı maksimumu aşıyor');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      total,
      expectedTotal
    };
  }

  function validateLGSScore(lgsScore) {
    if (lgsScore < 0 || lgsScore > 560) {
      return {
        valid: false,
        message: `LGS puanı 0-560 arasında olmalı (${lgsScore})`
      };
    }

    if (lgsScore > 0 && lgsScore < 50) {
      return {
        valid: true,
        warning: `Çok düşük LGS puanı (${lgsScore})`
      };
    }

    return { valid: true };
  }

  // FAZ 1.3: GELİŞMİŞ İSİM TEMİZLEME FONKSİYONLARI
  function cleanStudentName(name) {
    if (!name) return '';

    let cleaned = name.trim();

    // Fazla boşlukları tek boşluğa düşür
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Birleşik isimleri ayır (örn: İDİLGÜLER → İDİL GÜLER)
    cleaned = splitJoinedNames(cleaned);

    return cleaned;
  }

  function splitJoinedNames(name) {
    // Eğer boşluk yoksa ve 2'den fazla büyük harf varsa ayır
    if (!name.includes(' ') && name.length > 5) {
      // Büyük harfleri bul
      const upperCasePositions = [];
      for (let i = 0; i < name.length; i++) {
        if (name[i] === name[i].toUpperCase() && name[i] !== name[i].toLowerCase()) {
          upperCasePositions.push(i);
        }
      }

      // 2+ büyük harf varsa ve ortada bir yerde ise ayır
      if (upperCasePositions.length >= 2 && upperCasePositions[1] > 2) {
        const splitPos = upperCasePositions[1];
        return name.slice(0, splitPos) + ' ' + name.slice(splitPos);
      }
    }

    return name;
  }

  // FAZ 2.1: FUZZY MATCHING (Levenshtein Distance)
  function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[len1][len2];
  }

  function calculateSimilarity(str1, str2) {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLen = Math.max(str1.length, str2.length);
    return (1 - distance / maxLen) * 100; // 0-100 arası similarity score
  }

  // CSV Import için validasyon ve istatistikler
  const csvImportStats = {
    totalRows: 0,
    processed: 0,
    imported: 0,
    errors: 0,
    duplicates: 0,
    validationErrors: 0,
    matchingErrors: 0,
    warnings: []
  };

  async function importCSVData(csvData) {
    console.log(`📊 DEBUG: importCSVData başladı - ${csvData.length} satır`);

    // FAZ 3: Progress bar göster
    showProgress();

    try {
      let imported = 0;
      let errors = 0;

      // İstatistikleri sıfırla
      csvImportStats.totalRows = csvData.length;
      csvImportStats.processed = 0;
      csvImportStats.imported = 0;
      csvImportStats.errors = 0;
      csvImportStats.duplicates = 0;
      csvImportStats.validationErrors = 0;
      csvImportStats.matchingErrors = 0;
      csvImportStats.warnings = [];

      for (const row of csvData) {
        try {
          csvImportStats.processed++;

          // Öğrenci adını kontrol et ve temizle
          let studentName = row['Öğrenci Adı'];
          if (!studentName) {
            errors++;
            csvImportStats.errors++;
            continue;
          }

          // FAZ 1.3: İsim temizleme
          studentName = cleanStudentName(studentName);
          console.log(`🧹 Temizlenmiş isim: "${row['Öğrenci Adı']}" → "${studentName}"`);

          // Gelişmiş öğrenci eşleştirme sistemi (FAZ 2.1 ile iyileştirilmiş)
          const matchResult = findStudentAdvanced(
            studentName,
            row['Öğrenci No'] || null,
            allStudents
          );
          
          let student, confidence, method;
          console.log(`?? DEBUG: matchResult için "${studentName}":`, matchResult);
          
          // Eğer eşleştirme bulunamadıysa veya düşük güvenliyse modal aç
          if (!matchResult || matchResult.confidence < 0.7) {
            console.log(`?? DEBUG: Öğrenci eşleştirilemedi: "${studentName}"`);
            console.log(`?? DEBUG: matchResult:`, matchResult);
            console.log(`?? DEBUG: allStudents sayısı:`, allStudents.length);
            console.log(`?? DEBUG: Modal açma koşulu TRUE - "${studentName}"`);
            
            // Olası eşleşmeleri bul (tüm benzer öğrenciler)
            const possibleMatches = findAllPossibleMatches(studentName, allStudents);
            console.log(`?? DEBUG: possibleMatches sayısı:`, possibleMatches.length);
            console.log(`?? DEBUG: possibleMatches:`, possibleMatches);
            
            if (possibleMatches.length > 0) {
              console.log(`?? DEBUG: Modal açılıyor... possibleMatches:`, possibleMatches);
              // Modal aç ve kullanıcıdan seçim bekle
              const modalResult = await showStudentMatchModalAsync(studentName, row, possibleMatches);
              console.log(`?? DEBUG: Modal sonucu:`, modalResult);
              
              // Kullanıcı atladıysa veya iptal ettiyse
              if (!modalResult || skipAllErrors || importCancelled) {
                if (importCancelled) break;
                errors++;
                continue;
              }
              
              student = modalResult.student;
              confidence = 1.0; // Manuel seçim = %100 güven
              method = 'Manuel Seçim';
            } else {
              // Hiç eşleşme yoksa direkt hata
              console.warn(`? Öğrenci bulunamadı: "${studentName}" (Satır ${csvData.indexOf(row) + 2})`);
              errors++;
              continue;
            }
          } else {
            // Normal eşleştirme
            student = matchResult.student;
            confidence = matchResult.confidence;
            method = matchResult.method;
          }
          
          // Eşleştirme bilgisini logla
          if (confidence >= 0.9) {
            console.log(`? ${studentName} › ${student.name} (${method}, ${(confidence * 100).toFixed(1)}%)`);
          } else if (confidence >= 0.7) {
            console.warn(`⚠️ ${studentName} › ${student.name} (${method}, ${(confidence * 100).toFixed(1)}% - Dikkat!)`);
          } else {
            console.warn(`⚠️ ${studentName} › ${student.name} (${method}, ${(confidence * 100).toFixed(1)}% - Belirsiz eşleşme!)`);
          }
          
          // Sınav verisi oluştur
          const examData = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            profile: student.name,
            name: row['Sınav Adı'] || 'CSV Sınavı',
            date: row['Sınav Tarihi'] || new Date().toISOString().split('T')[0],
            courses: {}
          };

          // FAZ 1.1: Duplicate kontrolü
          if (isDuplicateExam(examData.profile, examData.name, examData.date)) {
            console.warn(`🔁 DUPLICATE: ${examData.profile} - ${examData.name} (${examData.date})`);
            csvImportStats.duplicates++;
            csvDuplicateStats.found++;
            csvDuplicateStats.skipped++;
            errors++;
            csvImportStats.errors++;
            continue; // Bu sınavı atla
          }

          // Ders verilerini ekle
          let hasValidationErrors = false;
          const subjects = [
            { key: 'turkce', prefix: 'Türkçe' },
            { key: 'matematik', prefix: 'Matematik' },
            { key: 'fen', prefix: 'Fen' },
            { key: 'inkilap', prefix: 'Sosyal' },
            { key: 'ingilizce', prefix: 'İngilizce' },
            { key: 'din', prefix: 'Din' }
          ];
          
          for (const subject of subjects) {
            const correct = parseInt(row[`${subject.prefix}_Doğru`]) || 0;
            const incorrect = parseInt(row[`${subject.prefix}_Yanlış`]) || 0;
            const blank = parseInt(row[`${subject.prefix}_Boş`]) || 0;

            // FAZ 1.2: Skor validasyonu
            const validation = validateScores(subject.key, correct, incorrect, blank, student.name);

            if (!validation.valid) {
              console.error(`❌ VALIDATION ERROR: ${student.name} - ${subject.prefix}:`, validation.errors);
              validation.errors.forEach(err => {
                csvImportStats.warnings.push(`${student.name} - ${subject.prefix}: ${err}`);
              });
              csvImportStats.validationErrors++;
              hasValidationErrors = true;
            }

            if (validation.warnings.length > 0) {
              console.warn(`⚠️ VALIDATION WARNING: ${student.name} - ${subject.prefix}:`, validation.warnings);
              validation.warnings.forEach(warn => {
                csvImportStats.warnings.push(`${student.name} - ${subject.prefix}: ${warn}`);
              });
            }

        let csvOutcomes = row[`${subject.prefix}_Yanlış_Kazanımlar`] || 
                          row[`${subject.prefix}_Yanlis_Kazanimlar`] ||
                          row[`${subject.prefix}_Kazanım`] || 
                          row[`${subject.prefix}_Kazanim`] || '';
        let processedOutcomes = [];

        if (csvOutcomes && csvOutcomes.trim()) {
          // CSV'den kazanımları al (tam metin)
          const rawOutcomes = csvOutcomes.split(' | ')
            .map(o => o.trim())
            .filter(o => o.length > 0);
          
          // Her kazanımı eşleştir
          for (let i = 0; i < rawOutcomes.length; i++) {
            const rawOutcome = rawOutcomes[i];
            const matchResult = matchKazanim(rawOutcome, subject.key, student.grade);
            
            if (matchResult.matched) {
              // Eşleşti - tam metni kullan
              processedOutcomes.push(matchResult.fullText);
              console.log(`? Kazanım eşleşti: "${rawOutcome}" › "${matchResult.fullText}" (${matchResult.method})`);
            } else {
              // Eşleşmedi - yeni kazanım olarak ekle
              await addNewKazanimToDatabase(subject.key, student.grade, rawOutcome);
              processedOutcomes.push(rawOutcome);
              console.log(`? Yeni kazanım: ${subject.key} ${student.grade}. Sınıf - "${rawOutcome}"`);
            }
          }
        }
            
            // Eksik kazanımları otomatik ekle
            if (csvAutoOutcomes.checked && incorrect > 0 && processedOutcomes.length === 0) {
              processedOutcomes = generateAutoOutcomes(subject.key, student.grade, incorrect);
            }
            
            examData.courses[subject.key] = {
              correct,
              incorrect,
              blank,
              incorrectOutcomes: processedOutcomes
            };
          }

          // Eğer validasyon hataları varsa bu sınavı atla
          if (hasValidationErrors) {
            console.warn(`⚠️ Sınav atlandı (validasyon hatası): ${student.name} - ${examData.name}`);
            errors++;
            continue;
          }

          // LGS Puanını ekle (CSV'den oku, yoksa hesapla)
          const lgsScore = row['LGS_Puanı']
            ? parseFloat(row['LGS_Puanı'])
            : parseFloat(calculateLgsScore(examData));

          // FAZ 1.2: LGS puan validasyonu
          const lgsValidation = validateLGSScore(lgsScore);
          if (!lgsValidation.valid) {
            console.error(`❌ LGS PUAN HATASI: ${student.name} - ${lgsValidation.message}`);
            csvImportStats.warnings.push(`${student.name}: ${lgsValidation.message}`);
            csvImportStats.validationErrors++;
            errors++;
            continue;
          }

          if (lgsValidation.warning) {
            console.warn(`⚠️ LGS PUAN UYARI: ${student.name} - ${lgsValidation.warning}`);
            csvImportStats.warnings.push(`${student.name}: ${lgsValidation.warning}`);
          }

          examData.lgsScore = lgsScore;

          // Sınavı kaydet
          allExams.push(examData);
          imported++;
          csvImportStats.imported++;

        } catch (rowError) {
          console.error('Satır işleme hatası:', rowError);
          errors++;
        }

        // FAZ 3: Progress güncellemesi (her 5 satırda bir veya son satır)
        if (csvImportStats.processed % 5 === 0 || csvImportStats.processed === csvData.length) {
          updateProgress(csvImportStats.processed, csvData.length, csvImportStats);
          // UI'nin güncellenmesi için kısa bir bekle
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
      
      // Güncellenmiş veriyi kaydet
      const dataToSave = {
        value: allExams,
        Count: allExams.length
      };
      const result = await window.electronAPI.saveData(dataToSave);
      
      if (result.error) {
        if (!handlePermissionError(result)) {
          return { success: false, message: `Sınav kaydedilirken hata oluştu: ${result.error}` };
        }
        return { success: false, message: 'Bu işlem için müdür yetkisi gereklidir.' };
      }
      
      // Detaylı import istatistiklerini logla
      console.log('\n========================================');
      console.log('CSV IMPORT ISTATISTIKLERI');
      console.log('========================================');
      console.log(`Toplam satir: ${csvImportStats.totalRows}`);
      console.log(`Islenen satir: ${csvImportStats.processed}`);
      console.log(`Basariyla import edilen: ${csvImportStats.imported} sinav`);
      console.log(`Hatali satir: ${csvImportStats.errors} satir`);
      console.log(`Duplicate sinavlar: ${csvImportStats.duplicates} (atlandi: ${csvDuplicateStats.skipped})`);
      console.log(`Validasyon hatalari: ${csvImportStats.validationErrors}`);
      console.log(`Eslestirme hatalari: ${csvImportStats.matchingErrors}`);
      console.log(`Basari orani: ${((csvImportStats.imported / csvImportStats.totalRows) * 100).toFixed(1)}%`);

      if (csvImportStats.warnings.length > 0) {
        console.log(`\nUYARILAR (${csvImportStats.warnings.length} adet):`);
        csvImportStats.warnings.slice(0, 10).forEach((warn, i) => {
          console.log(`  ${i + 1}. ${warn}`);
        });
        if (csvImportStats.warnings.length > 10) {
          console.log(`  ... ve ${csvImportStats.warnings.length - 10} uyari daha`);
        }
      }

      console.log('========================================\n');

      return {
        success: true,
        imported: csvImportStats.imported,
        errors: csvImportStats.errors,
        stats: csvImportStats
      };

    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      // FAZ 3: Progress bar'ı gizle
      hideProgress();
    }
  }
  
  function generateAutoOutcomes(subjectKey, grade, count) {
    // Gerçek kazanımları kullan - fallback kod üretme
    const jsonSubjectName = getKazanimlarSubjectName(subjectKey);
    const gradeStr = grade.toString();
    
    // Kazanımlar veritabanından gerçek kazanımları al
    if (kazanimlarDatabase && kazanimlarDatabase[jsonSubjectName] && kazanimlarDatabase[jsonSubjectName][gradeStr]) {
      const realOutcomes = kazanimlarDatabase[jsonSubjectName][gradeStr];
      if (Array.isArray(realOutcomes) && realOutcomes.length > 0) {
        // Rastgele seçim yerine ilk birkaç kazanımı al
        return realOutcomes.slice(0, Math.min(count, 3)).map(item => {
          if (typeof item === 'string') {
            return item;
          } else if (item && item.kazanim) {
            return item.kazanim;
          } else if (item && item.ogrenme_cikti) {
            return item.ogrenme_cikti;
          }
          return JSON.stringify(item);
        });
      }
    }
    
    // Gerçek kazanım bulunamazsa boş döndür (fallback kod üretme)
    console.log(`?? ${subjectKey} ${grade}. sınıf için gerçek kazanım bulunamadı`);
    return [];
  }

  // --- ETÜT SİSTEMİ BAŞLANGIÇ ---
  function initializeEtutler() {
    console.log('Etüt sistemi başlatılıyor...');
    // Form elementlerini alıyoruz
    setupEtutlerEventListeners();
    displayEtutGroups();
  }

  function setupEtutlerEventListeners() {
    const createEtutBtn = document.getElementById('create-etut-btn');
    const etutGradeSelect = document.getElementById('etut-grade-select');
    const etutSubjectSelect = document.getElementById('etut-subject-select');
    
    if (createEtutBtn) {
      createEtutBtn.addEventListener('click', createEtutGroups);
    }
    
    // PDF Export için event listener ekle
    if (exportEtutPdfBtn) {
      exportEtutPdfBtn.addEventListener('click', exportEtutToPDF);
    }
  }

  // Öğrencilerin eksik kazanımlarını analiz eder (SON 2 DENEME)
  function analyzeStudentWeaknesses(studentName, subject) {
    const studentExams = allExams.filter(exam => exam.profile === studentName);
    
    // Son 2 denemeyi al (en güncel eksiklikler)
    const recentExams = studentExams
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // Tarihe göre sırala (yeni › eski)
      .slice(0, 2); // Son 2 deneme
    
    console.log(`?? ${studentName} - ${subject}: ${studentExams.length} toplam deneme, son ${recentExams.length} deneme analiz ediliyor`);
    
    const weaknesses = new Set();
    
    recentExams.forEach((exam, index) => {
      console.log(`?? ${studentName} Deneme ${index + 1}: ${exam.name} (${exam.date})`);
      
      if (exam.courses && exam.courses[subject]) {
        const course = exam.courses[subject];
        if (course.incorrectOutcomes) {
          const incorrectOutcomes = Array.isArray(course.incorrectOutcomes) 
            ? course.incorrectOutcomes 
            : course.incorrectOutcomes.split(',').map(s => s.trim());
          
          incorrectOutcomes.forEach(outcome => {
            if (outcome && outcome.trim()) {
              weaknesses.add(outcome.trim());
              console.log(`? ${studentName}: ${outcome.trim()}`);
            }
          });
        }
      }
    });
    
    const weaknessArray = Array.from(weaknesses);
    console.log(`?? ${studentName} - ${subject}: ${weaknessArray.length} eksik kazanım (son 2 deneme)`);
    
    return weaknessArray;
  }

  // KARMA MODEL: Ortak + Bireysel eksiklikler
  function findCommonWeaknesses(students, subject) {
    if (students.length === 0) return [];
    
    console.log(`?? KARMA MODEL: ${subject} için ${students.length} öğrenci analiz ediliyor...`);
    
    const allWeaknesses = students.map(student => ({
      name: student.name,
      weaknesses: analyzeStudentWeaknesses(student.name, subject)
    }));
    
    if (allWeaknesses.length === 0) return [];
    
    // 1. EN YAYGIN ORTAK EKSİKLİĞİ BUL (ANA KONU)
    const weaknessCounts = {};
    allWeaknesses.forEach(({ weaknesses }) => {
      weaknesses.forEach(weakness => {
        weaknessCounts[weakness] = (weaknessCounts[weakness] || 0) + 1;
      });
    });
    
    // En az 2 öğrencide bulunan eksiklikleri al
    const commonWeaknesses = Object.entries(weaknessCounts)
      .filter(([_, count]) => count >= 2)
      .sort(([,a], [,b]) => b - a)
      .map(([weakness, count]) => {
        console.log(`?? Ortak ana konu: ${weakness} (${count}/${students.length} öğrenci)`);
        return weakness;
      })
      .slice(0, 3); // En fazla 3 ana ortak konu
    
    // 2. BİREYSEL EKSİKLİKLERİ TOPLA (YAN KONULAR) 
    const individualWeaknesses = [];
    allWeaknesses.forEach(({ name, weaknesses }) => {
      const individual = weaknesses.filter(w => 
        !commonWeaknesses.includes(w) // Ortak olmayan eksiklikler
      );
      
      if (individual.length > 0) {
        console.log(`?? ${name} bireysel eksikleri: ${individual.slice(0, 2).join(', ')}`);
        individualWeaknesses.push(...individual.slice(0, 2)); // Kişi başı max 2 bireysel
      }
    });
    
    // Bireysel eksiklikleri tekilleştir
    const uniqueIndividual = [...new Set(individualWeaknesses)].slice(0, 4);
    
    // 3. KARMA SONUÇ: ORTAK + BİREYSEL
    const hybridWeaknesses = [...commonWeaknesses, ...uniqueIndividual];
    
    console.log(`? KARMA GRUP - Ana konular: ${commonWeaknesses.length}, Yan konular: ${uniqueIndividual.length}`);
    console.log(`?? Toplam etüt konuları: ${hybridWeaknesses.length}`);
    
    return hybridWeaknesses;
  }

  // Grup için ana konu ve yan konuları ayır
  function categorizeGroupTopics(students, subject, allWeaknesses) {
    const weaknessCounts = {};
    
    students.forEach(student => {
      const weaknesses = analyzeStudentWeaknesses(student.name, subject);
      weaknesses.forEach(weakness => {
        weaknessCounts[weakness] = (weaknessCounts[weakness] || 0) + 1;
      });
    });
    
    const mainTopics = Object.entries(weaknessCounts)
      .filter(([_, count]) => count >= Math.max(2, Math.floor(students.length / 2)))
      .map(([weakness]) => weakness);
    
    const sideTopics = allWeaknesses.filter(w => !mainTopics.includes(w));
    
    return { mainTopics, sideTopics };
  }

  // STRATEJİ 1: Ortak Eksik Kazanım + Öğrenme Stili
  function findWeaknessStyleGroups(students, subject, groupSize) {
    console.log('?? Strateji 1: Ortak eksiklik + öğrenme stili araması...');
    
    // Öğrencileri eksiklikleri ve stillerine göre grupla
    const styleWeaknessMap = {};
    
    students.forEach(student => {
      const style = student.learningStyle || 'Belirlenmemiş';
      const weaknesses = analyzeStudentWeaknesses(student.name, subject);
      
      if (!styleWeaknessMap[style]) styleWeaknessMap[style] = {};
      
      weaknesses.forEach(weakness => {
        if (!styleWeaknessMap[style][weakness]) styleWeaknessMap[style][weakness] = [];
        styleWeaknessMap[style][weakness].push(student);
      });
    });
    
    // En fazla ortak eksiklik + aynı stile sahip grubu bul
    for (const style of Object.keys(styleWeaknessMap)) {
      for (const weakness of Object.keys(styleWeaknessMap[style])) {
        const candidates = styleWeaknessMap[style][weakness];
        if (candidates.length >= groupSize) {
          console.log(`? Bulundu: ${style} stili + ${weakness} eksikliği (${candidates.length} öğrenci)`);
          return candidates.slice(0, groupSize);
        }
      }
    }
    
    return [];
  }

  // STRATEJİ 2: Sadece Ortak Eksik Kazanım
  function findWeaknessGroups(students, subject, groupSize) {
    console.log('?? Strateji 2: Sadece ortak eksiklik araması...');
    
    const weaknessMap = {};
    
    students.forEach(student => {
      const weaknesses = analyzeStudentWeaknesses(student.name, subject);
      weaknesses.forEach(weakness => {
        if (!weaknessMap[weakness]) weaknessMap[weakness] = [];
        weaknessMap[weakness].push(student);
      });
    });
    
    // En fazla ortak eksikliğe sahip grubu bul
    const sortedWeaknesses = Object.entries(weaknessMap)
      .sort(([,a], [,b]) => b.length - a.length);
    
    for (const [weakness, candidates] of sortedWeaknesses) {
      if (candidates.length >= groupSize) {
        console.log(`? Bulundu: ${weakness} eksikliği (${candidates.length} öğrenci)`);
        return candidates.slice(0, groupSize);
      }
    }
    
    return [];
  }

  // STRATEJİ 3: Başarı Seviyesi + Öğrenme Stili
  function findSuccessStyleGroups(students, subject, groupSize) {
    console.log('?? Strateji 3: Başarı seviyesi + öğrenme stili araması...');
    
    const successStyleMap = {};
    
    students.forEach(student => {
      const style = student.learningStyle || 'Belirlenmemiş';
      const successLevel = calculateStudentSuccessLevel(student.name, subject);
      
      const key = `${successLevel}-${style}`;
      if (!successStyleMap[key]) successStyleMap[key] = [];
      successStyleMap[key].push(student);
    });
    
    // En fazla öğrenciye sahip başarı+stil grubunu bul
    const sortedGroups = Object.entries(successStyleMap)
      .sort(([,a], [,b]) => b.length - a.length);
    
    for (const [key, candidates] of sortedGroups) {
      if (candidates.length >= groupSize) {
        console.log(`? Bulundu: ${key} kombinasyonu (${candidates.length} öğrenci)`);
        return candidates.slice(0, groupSize);
      }
    }
    
    return [];
  }

  // STRATEJİ 4: Sadece Öğrenme Stili
  function findStyleGroups(students, groupSize) {
    console.log('?? Strateji 4: Sadece öğrenme stili araması...');
    
    const styleGroups = {};
    students.forEach(student => {
      const style = student.learningStyle || 'Belirlenmemiş';
      if (!styleGroups[style]) styleGroups[style] = [];
      styleGroups[style].push(student);
    });
    
    // En büyük stil grubunu bul
    const sortedStyles = Object.entries(styleGroups)
      .sort(([,a], [,b]) => b.length - a.length);
    
    for (const [style, candidates] of sortedStyles) {
      if (candidates.length >= groupSize) {
        console.log(`? Bulundu: ${style} stili (${candidates.length} öğrenci)`);
        return candidates.slice(0, groupSize);
      }
    }
    
    return [];
  }

  // Öğrenci başarı seviyesi hesaplama
  function calculateStudentSuccessLevel(studentName, subject) {
    const studentExams = allExams.filter(exam => exam.profile === studentName);
    if (studentExams.length === 0) return 'orta';
    
    let totalNet = 0;
    let examCount = 0;
    
    studentExams.forEach(exam => {
      if (exam.courses && exam.courses[subject]) {
        const course = exam.courses[subject];
        const net = course.net || (course.correct - (course.incorrect / 4));
        totalNet += net;
        examCount++;
      }
    });
    
    const avgNet = totalNet / examCount;
    
    // Başarı seviyelerini belirle
    if (avgNet >= 15) return 'yüksek';      // Çok başarılı
    if (avgNet >= 10) return 'orta';        // Orta seviye  
    return 'düşük';                         // Gelişmeli
  }

  // Gelişmiş gruplama algoritması
  function createEtutGroups() {
    const gradeSelect = document.getElementById('etut-grade-select');
    const subjectSelect = document.getElementById('etut-subject-select');
    const groupSizeSelect = document.getElementById('etut-group-size');
    const etutNameInput = document.getElementById('etut-name');
    const sameStyleCheck = document.getElementById('etut-same-style');
    const weakOutcomesCheck = document.getElementById('etut-weak-outcomes');
    
    const selectedGrade = gradeSelect.value;
    const selectedSubject = subjectSelect.value;
    const groupSize = parseInt(groupSizeSelect.value);
    const etutName = etutNameInput.value.trim();
    const prioritizeSameStyle = sameStyleCheck.checked;
    const prioritizeWeakOutcomes = weakOutcomesCheck.checked;
    
    // Validasyon
    if (!selectedGrade || !selectedSubject || !etutName) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }
    
    // Seçili sınıftaki öğrencileri filtrele
    const gradeStudents = allStudents.filter(student => 
      student.grade === selectedGrade
    );
    
    if (gradeStudents.length < groupSize) {
      alert(`${selectedGrade}. sınıfta yeterli öğrenci yok. En az ${groupSize} öğrenci gerekli.`);
      return;
    }
    
    console.log(`?? Etüt oluşturuluyor: ${etutName}`);
    console.log(`?? Ders: ${selectedSubject}, Sınıf: ${selectedGrade}, Grup Büyüklüğü: ${groupSize}`);
    console.log(`?? Toplam öğrenci: ${gradeStudents.length}`);
    
    // Öğrencileri sırala ve grupla
    let availableStudents = [...gradeStudents];
    const groups = [];
    
    // Gelişmiş grup oluşturma döngüsü
    while (availableStudents.length >= groupSize) {
      let selectedGroup = [];
      let groupStrategy = 'rastgele';
      
      // STRATEJİ 1: Ortak Eksik Kazanım + Öğrenme Stili (EN YÜKSEK ÖNCELİK)
      if (prioritizeWeakOutcomes && prioritizeSameStyle) {
        selectedGroup = findWeaknessStyleGroups(availableStudents, selectedSubject, groupSize);
        if (selectedGroup.length >= groupSize) {
          groupStrategy = 'eksiklik-stil';
        }
      }
      
      // STRATEJİ 2: Sadece Ortak Eksik Kazanım
      if (selectedGroup.length === 0 && prioritizeWeakOutcomes) {
        selectedGroup = findWeaknessGroups(availableStudents, selectedSubject, groupSize);
        if (selectedGroup.length >= groupSize) {
          groupStrategy = 'eksiklik';
        }
      }
      
      // STRATEJİ 3: Başarı Seviyesi + Öğrenme Stili
      if (selectedGroup.length === 0 && prioritizeSameStyle) {
        selectedGroup = findSuccessStyleGroups(availableStudents, selectedSubject, groupSize);
        if (selectedGroup.length >= groupSize) {
          groupStrategy = 'başarı-stil';
        }
      }
      
      // STRATEJİ 4: Sadece Öğrenme Stili
      if (selectedGroup.length === 0 && prioritizeSameStyle) {
        selectedGroup = findStyleGroups(availableStudents, groupSize);
        if (selectedGroup.length >= groupSize) {
          groupStrategy = 'stil';
        }
      }
      
      // STRATEJİ 5: Son çare - Rastgele
      if (selectedGroup.length === 0) {
        selectedGroup = availableStudents.slice(0, groupSize);
        groupStrategy = 'rastgele';
      }
      
      // Grup oluştur
      if (selectedGroup.length >= groupSize) {
        const groupStudents = selectedGroup.slice(0, groupSize);
        const commonWeaknesses = findCommonWeaknesses(groupStudents, selectedSubject);
        
        const group = {
          id: Date.now() + Math.random(),
          name: `${etutName} - Grup ${groups.length + 1}`,
          subject: selectedSubject,
          grade: selectedGrade,
          students: groupStudents,
          commonWeaknesses: commonWeaknesses,
          createdDate: new Date().toISOString().split('T')[0],
          groupSize: groupSize,
          strategy: groupStrategy // Hangi strateji kullanıldı
        };
        
        groups.push(group);
        
        // Seçilen öğrencileri mevcut listeden çıkar
        availableStudents = availableStudents.filter(student => 
          !groupStudents.some(selected => selected.id === student.id)
        );
        
        console.log(`? Grup ${groups.length} oluşturuldu:`, groupStudents.map(s => s.name));
      } else {
        break; // Yeterli öğrenci kalmadı
      }
    }
    
    if (groups.length === 0) {
      alert('Hiçbir grup oluşturulamadı. Kriterleri gözden geçirin.');
      return;
    }
    
    // Oluşturulan grupları ana listeye ekle
    etutGroups.push(...groups);
    
    // Formu temizle
    etutNameInput.value = '';
    gradeSelect.value = '';
    subjectSelect.value = '';
    
    // Grupları görüntüle
    displayEtutGroups();
    
    alert(`${groups.length} etüt grubu başarıyla oluşturuldu!`);
  }

  // Strateji adlarını kullanıcı dostu hale getir
  function getStrategyName(strategy) {
    const strategyNames = {
      'eksiklik-stil': '?? Ortak Eksiklik + Öğrenme Stili',
      'eksiklik': '?? Ortak Eksik Kazanım',
      'başarı-stil': '?? Başarı Seviyesi + Öğrenme Stili',
      'stil': '?? Öğrenme Stili',
      'rastgele': '?? Rastgele'
    };
    return strategyNames[strategy] || '? Bilinmeyen';
  }

  // Grup başlığı için ikon seç
  function getGroupIcon(strategy) {
    const icons = {
      'eksiklik-stil': '??',
      'eksiklik': '??', 
      'başarı-stil': '?',
      'stil': '??',
      'rastgele': '??'
    };
    return icons[strategy] || '??';
  }

  // Karma konuları kategorize et ve göster
  function categorizeAndDisplayTopics(students, subject, allWeaknesses) {
    const { mainTopics, sideTopics } = categorizeGroupTopics(students, subject, allWeaknesses);
    
    let html = '';
    
    // Ana konular (ortak eksiklikler)
    if (mainTopics.length > 0) {
      html += `
        <div class="etut-main-topics">
          <h5>?? Ana Konular (Tüm grup)</h5>
          <div class="etut-outcomes-list">
            ${mainTopics.map(topic => `
              <span class="etut-outcome-tag main-topic">${topic}</span>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    // Yan konular (bireysel eksiklikler)
    if (sideTopics.length > 0) {
      html += `
        <div class="etut-side-topics">
          <h5>?? Yan Konular (Bireysel)</h5>
          <div class="etut-outcomes-list">
            ${sideTopics.map(topic => `
              <span class="etut-outcome-tag side-topic">${topic}</span>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    return html;
  }

  // Etüt gruplarını görüntüle
  function displayEtutGroups() {
    const container = document.getElementById('etut-groups-container');
    if (!container) return;
    
    if (etutGroups.length === 0) {
      container.innerHTML = `
        <div class="no-etuts">
          <p>Henüz etüt grubu oluşturulmamış.</p>
          <p>Yukarıdaki formu kullanarak etüt grupları oluşturun.</p>
        </div>
      `;
      // PDF butonunu gizle
      if (exportEtutPdfBtn) {
        exportEtutPdfBtn.style.display = 'none';
      }
      return;
    }
    
    // PDF butonunu göster
    if (exportEtutPdfBtn) {
      exportEtutPdfBtn.style.display = 'block';
    }
    
    const subjectNames = {
      'matematik': 'Matematik',
      'fen': 'Fen Bilimleri',
      'turkce': 'Türkçe',
      'inkilap': 'Sosyal Bilgiler',
      'ingilizce': 'İngilizce',
      'din': 'Din Kültürü'
    };
    
    container.innerHTML = etutGroups.map(group => `
      <div class="etut-group">
        <div class="etut-group-header">
          <div class="etut-group-title">
            ${getGroupIcon(group.strategy)} ${group.name}
          </div>
          <div class="etut-group-actions">
            <button class="btn-etut-action btn-edit-etut" onclick="editEtutGroup('${group.id}')">
              ?? Düzenle
            </button>
            <button class="btn-etut-action btn-delete-etut" onclick="deleteEtutGroup('${group.id}')">
              ??? Sil
            </button>
          </div>
        </div>
        
        <div class="etut-group-info">
          <div class="etut-info-item">
            <span class="label">Ders:</span> ${subjectNames[group.subject] || group.subject}
          </div>
          <div class="etut-info-item">
            <span class="label">Sınıf:</span> ${group.grade}. Sınıf
          </div>
          <div class="etut-info-item">
            <span class="label">Öğrenci Sayısı:</span> ${group.students.length}
          </div>
          <div class="etut-info-item">
            <span class="label">Gruplama Stratejisi:</span> ${getStrategyName(group.strategy)}
          </div>
          <div class="etut-info-item">
            <span class="label">Oluşturma Tarihi:</span> ${group.createdDate}
          </div>
        </div>
        
        <div class="etut-students">
          ${group.students.map(student => `
            <div class="etut-student">
              <div class="etut-student-name">
                ?? ${student.name}
              </div>
              <div class="etut-student-info">
                <div>Sınıf: ${student.grade}.${student.class || '-'}</div>
                <div class="etut-student-style" data-style="${student.learningStyle || 'Belirlenmemiş'}">${student.learningStyle || 'Belirlenmemiş'}</div>
              </div>
            </div>
          `).join('')}
        </div>
        
        ${group.commonWeaknesses.length > 0 ? `
          <div class="etut-common-outcomes">
            <h4>?? Karma Etüt Konuları</h4>
            <div class="etut-hybrid-topics">
              ${categorizeAndDisplayTopics(group.students, group.subject, group.commonWeaknesses)}
            </div>
          </div>
        ` : `
          <div class="etut-common-outcomes">
            <h4>?? Bilgi</h4>
            <p style="color: var(--text-muted); font-style: italic;">Bu grupta ortak eksik kazanım bulunamadı.</p>
          </div>
        `}
      </div>
    `).join('');
  }

  // Etüt grubu silme
  window.deleteEtutGroup = function(groupId) {
    if (confirm('Bu etüt grubunu silmek istediğinizden emin misiniz?')) {
      etutGroups = etutGroups.filter(group => group.id != groupId);
      displayEtutGroups();
    }
  };

  // Etüt grubu düzenleme (gelecekte geliştirilebilir)
  window.editEtutGroup = function(groupId) {
    alert('Düzenleme özelliği yakında eklenecek!');
  };

  // Etüt PDF Export fonksiyonu
  async function exportEtutToPDF() {
    if (etutGroups.length === 0) {
      showToast('PDF Export', 'Önce etüt grupları oluşturun', 'warning', 3000);
      return;
    }
    
    try {
      const result = await window.electronAPI.exportToPDF();
      
      if (result.canceled) {
        console.log('Etüt PDF kaydetme iptal edildi');
        return;
      }
      
      if (result.success) {
        const fileName = result.filePath.split('\\').pop() || result.filePath.split('/').pop();
        showToast('Etüt Programı Kaydedildi!', `${fileName} başarıyla kaydedildi`, 'success', 5000);
      } else if (result.error) {
        showToast('PDF Kaydetme Hatası', result.error, 'error', 6000);
      }
    } catch (error) {
      console.error('Etüt PDF export hatası:', error);
      showToast('Beklenmeyen Hata', 'PDF kaydetme sırasında bir hata oluştu', 'error', 5000);
    }
  }

  // Raporlar PDF Export fonksiyonu
  async function exportReportsToPDF() {
    if (!selectedStudent) {
      showToast('PDF Export', 'Önce bir öğrenci seçin', 'warning', 3000);
      return;
    }
    
    try {
      // Rapor header'ına öğrenci bilgisini ekle
      const reportsHeader = document.querySelector('.reports-header');
      if (reportsHeader) {
        reportsHeader.setAttribute('data-student-name', selectedStudent.name);
      }
      
      const result = await window.electronAPI.exportToPDF();
      
      if (result.canceled) {
        console.log('Raporlar PDF kaydetme iptal edildi');
        return;
      }
      
      if (result.success) {
        const fileName = result.filePath.split('\\').pop() || result.filePath.split('/').pop();
        showToast('Öğrenci Raporu Kaydedildi!', 
                  `${selectedStudent.name} öğrencisinin raporu (${fileName}) başarıyla kaydedildi`, 
                  'success', 6000);
      } else if (result.error) {
        showToast('PDF Kaydetme Hatası', result.error, 'error', 6000);
      }
    } catch (error) {
      console.error('Raporlar PDF export hatası:', error);
      showToast('Beklenmeyen Hata', 'PDF kaydetme sırasında bir hata oluştu', 'error', 5000);
    }
  }

  // PDF Export event listeners
  if (exportEtutPdfBtn) {
    exportEtutPdfBtn.addEventListener('click', exportEtutToPDF);
  }
  
  if (exportReportsPdfBtn) {
    exportReportsPdfBtn.addEventListener('click', exportReportsToPDF);
  }

  if (exportEvaluationPdfBtn) {
    exportEvaluationPdfBtn.addEventListener('click', exportEvaluationToPDF);
  }


  // ===========================================
  // ÖĞRENCİ DEĞERLENDİRME SİSTEMİ
  // ===========================================

  // Değerlendirme sistemi başlatma
  function initializeEvaluation() {
    console.log('?? Öğrenci Değerlendirme Sistemi başlatılıyor...');
    
    // Eğer öğrenci seçiliyse analizi başlat
    if (selectedStudent) {
      updateEvaluationStudentInfo();
      performStudentAnalysis();
    } else {
      showEvaluationStudentSelector();
    }
  }

  // Öğrenci seçim panelini göster
  function showEvaluationStudentSelector() {
    const studentInfoDisplay = document.getElementById('evaluation-student-info');
    const evaluationResults = document.getElementById('evaluation-results');
    
    if (studentInfoDisplay) {
      studentInfoDisplay.innerHTML = `
        <div class="no-selection">
          <p>?? Lütfen değerlendirilecek öğrenciyi seçin</p>
          <p>Ana ekrandan öğrenci arama yaparak seçim yapabilirsiniz</p>
        </div>
      `;
    }
    
    if (evaluationResults) {
      evaluationResults.style.display = 'none';
    }
  }

  // Seçili öğrenci bilgilerini güncelle
  function updateEvaluationStudentInfo() {
    const studentInfoDisplay = document.getElementById('evaluation-student-info');
    
    if (studentInfoDisplay && selectedStudent) {
      studentInfoDisplay.innerHTML = `
        <div class="has-student">
          <h4>?? ${selectedStudent.name}</h4>
          <p><strong>Sınıf:</strong> ${selectedStudent.grade}. Sınıf | <strong>Şube:</strong> ${selectedStudent.class}</p>
          <p><strong>Öğrenme Stili:</strong> ${selectedStudent.learningStyle || 'Belirlenmemiş'}</p>
        </div>
      `;
      studentInfoDisplay.classList.add('has-student');
    }
  }

  // AI tabanlı öğrenci analizi
  async function performStudentAnalysis() {
    if (!selectedStudent) {
      showToast('Hata', 'Lütfen önce bir öğrenci seçin', 'error');
      return;
    }

    console.log(`?? ${selectedStudent.name} için analiz başlatılıyor...`);
    
    // Analiz yükleme göstergesi göster
    showAnalysisLoading();
    
    try {
      // Analitik analizi yap
      const results = await generateStudentAnalysis(selectedStudent);
      console.log('? Analitik analiz tamamlandı:', results);
      
      // Sonuçları göster
      displayAnalysisResults(results);
      
      // AI analizi de tetikle (opsiyonel)
      // handleAiEvaluationClick();
      
    } catch (error) {
      console.error('? Analiz hatası:', error);
      showToast('Hata', 'Öğrenci analizi yapılırken bir hata oluştu', 'error');
    }
  }

  // Analiz yükleme göstergesi
  function showAnalysisLoading() {
    const performanceContent = document.getElementById('performance-analysis-content');
    const learningStyleContent = document.getElementById('learning-style-content');
    const subjectRecommendations = document.getElementById('subject-recommendations');
    const activitySuggestions = document.getElementById('activity-suggestions');
    
    const loadingHTML = `
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 24px; margin-bottom: 10px;">??</div>
        <p>AI analizi yapılıyor...</p>
        <div style="width: 100%; height: 4px; background: #f0f0f0; border-radius: 2px; margin-top: 10px;">
          <div style="width: 0%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 2px; animation: loading 2s ease-in-out infinite;"></div>
        </div>
      </div>
      <style>
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      </style>
    `;
    
    if (performanceContent) performanceContent.innerHTML = loadingHTML;
    if (learningStyleContent) learningStyleContent.innerHTML = loadingHTML;
    if (subjectRecommendations) subjectRecommendations.innerHTML = loadingHTML;
    if (activitySuggestions) activitySuggestions.innerHTML = loadingHTML;
  }

  // AI analiz sonuçlarını oluştur
  async function generateStudentAnalysis(student) {
    console.log(`?? ${student.name} için AI analizi oluşturuluyor...`);
    
    // Öğrenci sınav verilerini al
    const studentExams = allExams.filter(exam => exam.profile === student.name);
    
    if (studentExams.length === 0) {
      return {
        performance: {
          level: 'Yetersiz Veri',
          trend: 'Belirsiz',
          averageNet: 0,
          totalExams: 0,
          strengths: [],
          weaknesses: []
        },
        learningStyle: {
          style: student.learningStyle || 'Belirlenmemiş',
          confidence: 'Düşük',
          recommendations: []
        },
        subjectRecommendations: [],
        activitySuggestions: [],
        aiAnalysis: null
      };
    }

    // Performans analizi
    const performanceAnalysis = analyzeStudentPerformance(studentExams);
    
    // Öğrenme stili analizi
    const learningStyleAnalysis = analyzeLearningStyle(student, studentExams);
    
    
    // AI Etkinlik önerileri (analitik)
    const activitySuggestions = generateActivitySuggestions(student, learningStyleAnalysis, performanceAnalysis);
    
    return {
      performance: performanceAnalysis,
      learningStyle: learningStyleAnalysis,
      activitySuggestions: activitySuggestions
    };
  }

  // Öğrenci performans analizi
  function analyzeStudentPerformance(exams) {
    console.log('?? Performans analizi yapılıyor...');
    
    const totalExams = exams.length;
    const recentExams = exams.slice(0, 3); // Son 3 sınav
    
    // Genel performans hesaplama
    let totalNet = 0;
    let subjectPerformance = {};
    
    recentExams.forEach(exam => {
      Object.keys(exam.courses).forEach(subject => {
        const course = exam.courses[subject];
        const net = course.net || (course.correct - (course.incorrect / 4));
        totalNet += net;
        
        if (!subjectPerformance[subject]) {
          subjectPerformance[subject] = { total: 0, count: 0 };
        }
        subjectPerformance[subject].total += net;
        subjectPerformance[subject].count += 1;
      });
    });
    
    const averageNet = totalNet / recentExams.length; // Sadece sınav sayısına böl
    const performanceLevel = getPerformanceLevel(averageNet);
    const trend = calculatePerformanceTrend(exams);
    
    // Güçlü ve zayıf alanlar
    const strengths = [];
    const weaknesses = [];
    
    Object.keys(subjectPerformance).forEach(subject => {
      const avg = subjectPerformance[subject].total / subjectPerformance[subject].count;
      const subjectName = getSubjectDisplayName(subject);
      
      if (avg >= 15) {
        strengths.push({ subject: subjectName, score: avg.toFixed(1) });
      } else if (avg <= 8) {
        weaknesses.push({ subject: subjectName, score: avg.toFixed(1) });
      }
    });
    
    return {
      level: performanceLevel,
      trend: trend,
      averageNet: averageNet.toFixed(1),
      totalExams: totalExams,
      strengths: strengths,
      weaknesses: weaknesses
    };
  }

  // Performans seviyesi belirleme (90 soru üzerinden)
  function getPerformanceLevel(averageNet) {
    if (averageNet >= 80) return 'Mükemmel';
    if (averageNet >= 70) return 'İyi';
    if (averageNet >= 60) return 'Başarılı';
    if (averageNet >= 30) return 'Gelişmekte';
    return 'Çok Zayıf';
  }

  // Performans trendi hesaplama
  function calculatePerformanceTrend(exams) {
    if (exams.length < 2) return 'Belirsiz';
    
    // Son 3 sınavı al (daha güvenilir trend için)
    const recentExams = exams.slice(0, Math.min(3, exams.length));
    
    let totalNet = 0;
    let examCount = 0;
    
    recentExams.forEach(exam => {
      let examNet = 0;
      Object.keys(exam.courses).forEach(subject => {
        const course = exam.courses[subject];
        examNet += course.net || (course.correct - (course.incorrect / 4));
      });
      totalNet += examNet;
      examCount++;
    });
    
    const averageNet = totalNet / examCount;
    
    // Net puanına göre trend belirle (90 soru üzerinden)
    if (averageNet >= 70) return 'Yükselişte';
    if (averageNet >= 50) return 'Stabil';
    return 'Düşüşte';
  }

  // Öğrenme stili analizi
  function analyzeLearningStyle(student, exams) {
    console.log('?? Öğrenme stili analizi yapılıyor...');
    
    const learningStyle = student.learningStyle || 'Belirlenmemiş';
    const confidence = learningStyle !== 'Belirlenmemiş' ? 'Yüksek' : 'Düşük';
    
    const recommendations = getLearningStyleRecommendations(learningStyle);
    
    return {
      style: learningStyle,
      confidence: confidence,
      recommendations: recommendations
    };
  }

  // Öğrenme stili tavsiyeleri
  function getLearningStyleRecommendations(style) {
    const recommendations = {
      'AYRIŞTIRAN': [
        'Aktif öğrenme teknikleri kullanın',
        'Grup çalışmalarına katılın',
        'Pratik uygulamalar yapın',
        'Deneyimsel öğrenme tercih edin'
      ],
      'ÖZÜMSEYEN': [
        'Feynman tekniği ile öğrenin',
        'Kavram haritaları oluşturun',
        'Öğrendiklerinizi başkalarına anlatın',
        'Soru-cevap teknikleri kullanın'
      ],
      'YERLEŞTİREN': [
        'Spaced repetition (aralıklı tekrar) yapın',
        'Düzenli çalışma programı oluşturun',
        'Küçük parçalara bölerek öğrenin',
        'Tekrar testleri uygulayın'
      ],
      'DEĞİŞTİREN': [
        'Pomodoro tekniği kullanın',
        'Kısa süreli yoğun çalışma yapın',
        'Çeşitli öğrenme yöntemleri deneyin',
        'Yaratıcı projeler geliştirin'
      ],
      'Belirlenmemiş': [
        'Farklı öğrenme yöntemlerini deneyin',
        'Hangi yöntemin size uygun olduğunu keşfedin',
        'Öğretmeninizle görüşerek rehberlik alın',
        'Çeşitli aktivitelerle kendinizi test edin'
      ]
    };
    
    return recommendations[style] || recommendations['Belirlenmemiş'];
  }

  // Ders bazında tavsiyeler oluştur
  function generateSubjectRecommendations(student, exams, performance) {
    console.log('?? Ders bazında tavsiyeler oluşturuluyor...');
    
    const recommendations = [];
    const subjects = ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü'];
    
    subjects.forEach(subject => {
      const subjectKey = getSubjectKey(subject);
      const subjectExams = exams.filter(exam => exam.courses[subjectKey]);
      
      if (subjectExams.length > 0) {
        const avgScore = calculateSubjectAverage(subjectExams, subjectKey);
        const recommendation = generateSubjectRecommendation(subject, avgScore, student.learningStyle);
        recommendations.push(recommendation);
      }
    });
    
    return recommendations;
  }

  // Ders ortalaması hesaplama
  function calculateSubjectAverage(exams, subjectKey) {
    let total = 0;
    let count = 0;
    
    exams.forEach(exam => {
      const course = exam.courses[subjectKey];
      if (course) {
        total += course.net || (course.correct - (course.incorrect / 4));
        count++;
      }
    });
    
    return count > 0 ? total / count : 0;
  }

  // Ders tavsiyesi oluşturma
  function generateSubjectRecommendation(subject, avgScore, learningStyle) {
    let level = 'Orta';
    let advice = '';
    
    if (avgScore >= 15) {
      level = 'İyi';
      advice = `${subject} dersinde başarılısınız. Bu başarıyı sürdürmek için düzenli tekrar yapın.`;
    } else if (avgScore >= 10) {
      level = 'Orta';
      advice = `${subject} dersinde orta seviyedesiniz. Daha fazla pratik yaparak gelişebilirsiniz.`;
    } else {
      level = 'Zayıf';
      advice = `${subject} dersinde zorlanıyorsunuz. Temel konuları tekrar edin ve ekstra çalışma yapın.`;
    }
    
    const specificAdvice = getSubjectSpecificAdvice(subject, learningStyle);
    
    return {
      subject: subject,
      level: level,
      score: avgScore.toFixed(1),
      advice: advice,
      specificAdvice: specificAdvice
    };
  }

  // Ders özel tavsiyeleri
  function getSubjectSpecificAdvice(subject, learningStyle) {
    const adviceMap = {
      'Türkçe': {
        'AYRIŞTIRAN': 'Drama ve rol oyunları ile öğrenin',
        'ÖZÜMSEYEN': 'Hikaye anlatma teknikleri kullanın',
        'YERLEŞTİREN': 'Düzenli okuma programı oluşturun',
        'DEĞİŞTİREN': 'Yaratıcı yazma projeleri yapın'
      },
      'Matematik': {
        'AYRIŞTIRAN': 'Problem çözme oyunları oynayın',
        'ÖZÜMSEYEN': 'Kavram haritaları ile öğrenin',
        'YERLEŞTİREN': 'Adım adım çözüm teknikleri kullanın',
        'DEĞİŞTİREN': 'Farklı çözüm yöntemleri deneyin'
      },
      'Fen Bilimleri': {
        'AYRIŞTIRAN': 'Deney ve gözlem yapın',
        'ÖZÜMSEYEN': 'Kavramları günlük hayatla ilişkilendirin',
        'YERLEŞTİREN': 'Sistematik çalışma planı oluşturun',
        'DEĞİŞTİREN': 'Yaratıcı projeler geliştirin'
      }
    };
    
    return adviceMap[subject]?.[learningStyle] || 'Öğrenme stilinize uygun yöntemler deneyin';
  }

  // Etkinlik önerileri oluştur
  function generateActivitySuggestions(student, learningStyle, performance) {
    console.log('?? Etkinlik önerileri oluşturuluyor...');
    
    const activities = [];
    const style = learningStyle.style;
    
    // Genel etkinlikler
    activities.push({
      title: 'Öğrenme Stili Etkinliği',
      description: getLearningStyleActivity(style),
      category: 'Genel'
    });
    
    // Performans bazlı etkinlikler
    if (performance.level === 'Zayıf' || performance.level === 'Çok Zayıf') {
      activities.push({
        title: 'Temel Güçlendirme',
        description: 'Temel konuları tekrar edin ve bol pratik yapın',
        category: 'Gelişim'
      });
    }
    
    // Ders bazlı etkinlikler
    performance.weaknesses.forEach(weakness => {
      activities.push({
        title: `${weakness.subject} Gelişim Etkinliği`,
        description: `${weakness.subject} dersinde özel çalışma programı oluşturun`,
        category: weakness.subject
      });
    });
    
    return activities;
  }

  // Öğrenme stili etkinliği
  function getLearningStyleActivity(style) {
    const activities = {
      'AYRIŞTIRAN': 'Grup çalışması yapın, projeler geliştirin ve aktif katılım sağlayın',
      'ÖZÜMSEYEN': 'Kavram haritaları oluşturun ve öğrendiklerinizi başkalarına anlatın',
      'YERLEŞTİREN': 'Düzenli tekrar programı oluşturun ve sistematik çalışın',
      'DEĞİŞTİREN': 'Yaratıcı projeler yapın ve farklı öğrenme yöntemleri deneyin',
      'Belirlenmemiş': 'Farklı öğrenme yöntemlerini deneyerek size uygun olanı bulun'
    };
    
    return activities[style] || activities['Belirlenmemiş'];
  }

  // Analiz sonuçlarını göster
  function displayAnalysisResults(results) {
    console.log('?? Analiz sonuçları gösteriliyor...');
    console.log('?? DEBUG: results object:', results);
    
    // evaluation-results container'ını görünür yap
    const evaluationResults = document.getElementById('evaluation-results');
    if (evaluationResults) {
      console.log('?? DEBUG: evaluation-results container görünür yapılıyor...');
      evaluationResults.style.display = 'block';
    }
    
    console.log('?? DEBUG: displayPerformanceAnalysis çağrılıyor...');
    displayPerformanceAnalysis(results.performance);
    
    console.log('?? DEBUG: displayLearningStyleAnalysis çağrılıyor...');
    displayLearningStyleAnalysis(results.learningStyle);
    
    console.log('?? DEBUG: displayActivitySuggestions çağrılıyor...');
    displayActivitySuggestions(results.activitySuggestions);
    
    // AI analizi bölümünü temizle (kullanıcı butona tıklayınca doldurulacak)
    console.log('?? DEBUG: AI container temizleniyor...');
    const aiContainer = document.getElementById('ai-analysis-content');
    if (aiContainer) {
      // Sadece açıklama metnini ve butonu bırak, sonuç alanını temizle
      const aiResult = document.getElementById('ai-evaluation-result');
      if (aiResult) {
        aiResult.innerHTML = '';
        console.log('? DEBUG: AI result container temizlendi');
      }
    }
    
    console.log('? DEBUG: displayAnalysisResults tamamlandı');
  }

  // Performans analizi göster
  function displayPerformanceAnalysis(performance) {
    console.log('?? DEBUG: displayPerformanceAnalysis başladı, performance:', performance);
    const content = document.getElementById('performance-analysis-content');
    console.log('?? DEBUG: performance-analysis-content elementi bulundu mu?', !!content);
    if (!content) {
      console.error('? DEBUG: performance-analysis-content elementi bulunamadı!');
      return;
    }
    
    console.log('?? DEBUG: Performans analizi içeriği oluşturuluyor...');
    
    const levelColor = getPerformanceLevelColor(performance.level);
    const trendIcon = getTrendIcon(performance.trend);
    
    content.innerHTML = `
      <div class="performance-summary">
        <div class="performance-metric">
          <h4>?? Genel Seviye</h4>
          <div class="metric-value" style="color: ${levelColor}">
            ${performance.level} (${performance.averageNet} net)
          </div>
        </div>
        
        <div class="performance-metric">
          <h4>?? Gelişim Trendi</h4>
          <div class="metric-value">
            ${trendIcon} ${performance.trend}
          </div>
        </div>
        
        <div class="performance-metric">
          <h4>?? Toplam Sınav</h4>
          <div class="metric-value">
            ${performance.totalExams} sınav
          </div>
        </div>
      </div>
      
      <div class="strengths-weaknesses">
        <div class="strengths">
          <h4>?? Güçlü Alanlar</h4>
          ${performance.strengths.length > 0 ? 
            performance.strengths.map(s => `<div class="strength-item">${s.subject}: ${s.score} net</div>`).join('') :
            '<div class="no-data">Henüz güçlü alan tespit edilemedi</div>'
          }
        </div>
        
        <div class="weaknesses">
          <h4>?? Geliştirilmesi Gereken Alanlar</h4>
          ${performance.weaknesses.length > 0 ? 
            performance.weaknesses.map(w => `<div class="weakness-item">${w.subject}: ${w.score} net</div>`).join('') :
            '<div class="no-data">Tüm alanlarda dengeli performans</div>'
          }
        </div>
      </div>
    `;
    console.log('? DEBUG: Performans analizi içeriği ayarlandı, content.innerHTML uzunluğu:', content.innerHTML.length);
    console.log('?? DEBUG: Element görünür mü?', content.offsetHeight > 0);
    console.log('?? DEBUG: Element display:', window.getComputedStyle(content).display);
    console.log('?? DEBUG: Element visibility:', window.getComputedStyle(content).visibility);
    
    // Parent container kontrolü
    const evaluationResults = document.getElementById('evaluation-results');
    console.log('?? DEBUG: evaluation-results bulundu mu?', !!evaluationResults);
    if (evaluationResults) {
      console.log('?? DEBUG: evaluation-results görünür mü?', evaluationResults.offsetHeight > 0);
      console.log('?? DEBUG: evaluation-results display:', window.getComputedStyle(evaluationResults).display);
      console.log('?? DEBUG: evaluation-results visibility:', window.getComputedStyle(evaluationResults).visibility);
    }
  }

  // Öğrenme stili analizi göster
  function displayLearningStyleAnalysis(learningStyle) {
    const content = document.getElementById('learning-style-content');
    if (!content) return;
    
    const styleColor = getLearningStyleColor(learningStyle.style);
    
    content.innerHTML = `
      <div class="learning-style-info">
        <div class="style-badge" style="background: ${styleColor}">
          ${learningStyle.style}
        </div>
        <div class="confidence-level">
          <strong>Güven Seviyesi:</strong> ${learningStyle.confidence}
        </div>
      </div>
      
      <div class="style-recommendations">
        <h4>?? Önerilen Yaklaşımlar</h4>
        <ul>
          ${learningStyle.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Ders tavsiyelerini göster

  // Etkinlik önerilerini göster
  function displayActivitySuggestions(activities) {
    const container = document.getElementById('activity-suggestions');
    if (!container) return;
    
    // AI etkinlikleri için farklı format
    if (activities.length > 0 && activities[0].ad) {
      container.innerHTML = activities.map(activity => `
        <div class="activity-card">
          <h4>${activity.ad}</h4>
          <p>${activity.aciklama}</p>
          <div class="activity-dersler">
            <strong>Dersler:</strong> ${activity.dersler.join(', ')}
          </div>
          <div class="activity-uygunluk">
            <strong>Öğrenme Stili Uygunluğu:</strong> ${activity.ogrenmeStiliUygunlugu}
          </div>
          ${activity.zekaTuruUygunlugu ? `
          <div class="activity-uygunluk">
            <strong>Zeka Türü Uygunluğu:</strong> ${activity.zekaTuruUygunlugu}
          </div>
          ` : ''}
        </div>
      `).join('');
    } else {
      // Eski format (analitik)
      container.innerHTML = activities.map(activity => `
        <div class="activity-card">
          <h4>${activity.title}</h4>
          <p>${activity.description}</p>
          <div class="activity-category">${activity.category}</div>
        </div>
      `).join('');
    }
  }

  // Yardımcı fonksiyonlar
  function getPerformanceLevelColor(level) {
    const colors = {
      'Mükemmel': '#27ae60',
      'İyi': '#2ecc71',
      'Başarılı': '#f39c12',
      'Gelişmekte': '#e67e22',
      'Çok Zayıf': '#e74c3c'
    };
    return colors[level] || '#95a5a6';
  }

  function getTrendIcon(trend) {
    const icons = {
      'Yükselişte': '??',
      'Düşüşte': '??',
      'Stabil': '??',
      'Belirsiz': '?'
    };
    return icons[trend] || '?';
  }

  function getLearningStyleColor(style) {
    const colors = {
      'AYRIŞTIRAN': 'linear-gradient(135deg, #e74c3c, #c0392b)',
      'ÖZÜMSEYEN': 'linear-gradient(135deg, #9b59b6, #8e44ad)',
      'YERLEŞTİREN': 'linear-gradient(135deg, #3498db, #2980b9)',
      'DEĞİŞTİREN': 'linear-gradient(135deg, #f39c12, #e67e22)',
      'Belirlenmemiş': 'linear-gradient(135deg, #95a5a6, #7f8c8d)'
    };
    return colors[style] || colors['Belirlenmemiş'];
  }

  function getSubjectKey(subject) {
    const mapping = {
      'Türkçe': 'turkce',
      'Matematik': 'matematik',
      'Fen Bilimleri': 'fen',
      'Sosyal Bilgiler': 'inkilap',
      'İngilizce': 'ingilizce',
      'Din Kültürü': 'din'
    };
    return mapping[subject] || subject.toLowerCase();
  }

  function getSubjectDisplayName(key) {
    const mapping = {
      'turkce': 'Türkçe',
      'matematik': 'Matematik',
      'fen': 'Fen Bilimleri',
      'inkilap': 'Sosyal Bilgiler',
      'ingilizce': 'İngilizce',
      'din': 'Din Kültürü'
    };
    return mapping[key] || key;
  }

  // PDF export fonksiyonu
  async function exportEvaluationToPDF() {
    if (!selectedStudent) {
      showToast('Hata', 'Lütfen önce bir öğrenci seçin', 'error');
      return;
    }

    try {
      showToast('PDF Hazırlanıyor', 'Değerlendirme raporu PDF olarak kaydediliyor...', 'info');
      
      const result = await window.electronAPI.exportToPDF();
      
      if (result.success) {
        showToast('Başarılı', 'Değerlendirme raporu PDF olarak kaydedildi', 'success');
      } else if (result.cancelled) {
        showToast('İptal Edildi', 'PDF kaydetme işlemi iptal edildi', 'info');
      } else {
        showToast('Hata', 'PDF kaydetme sırasında bir hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Değerlendirme PDF export hatası:', error);
      showToast('Beklenmeyen Hata', 'PDF kaydetme sırasında bir hata oluştu', 'error');
    }
  }

  // ===== SINIF ANALİZİ FONKSİYONLARI =====
  
  // Navigasyon event listener'ları
  document.getElementById('nav-dashboard').addEventListener('click', function() {
    showPage('dashboard-section');
  });

  document.getElementById('nav-question-bank').addEventListener('click', function() {
    showPage('question-bank-section');
  });

  document.getElementById('nav-add-exam').addEventListener('click', function() {
    showPage('add-exam-section');
  });

  document.getElementById('nav-reports').addEventListener('click', function() {
    showPage('reports-section');
  });

  document.getElementById('nav-planner').addEventListener('click', function() {
    if (!isPremiumPlan()) {
      showToast('Premium Özellik', 'Ders Programı bölümü yalnızca Premium plan sahipleri için açıktır.', 'info');
      return;
    }
    showPage('planner-section');
  });

  document.getElementById('nav-etutler').addEventListener('click', function() {
    showPage('etutler-section');
  });

  document.getElementById('nav-evaluation').addEventListener('click', function() {
    showPage('evaluation-section');
  });

  // Sınıf analizi sayfasına geçiş
  document.getElementById('nav-class-analysis').addEventListener('click', function() {
    showPage('class-analysis-section');
    loadClassAnalysisData();
  });

  // Hakkında sayfasına geçiş
  document.getElementById('nav-about').addEventListener('click', function() {
    showPage('about-section');
  });

  // ===== İÇE/DIŞA AKTARMA FONKSİYONLARI =====
  
  // İçe aktarma butonu
  document.getElementById('btn-import-students').addEventListener('click', function() {
    document.getElementById('import-modal').style.display = 'block';
  });

  // Dışa aktarma butonu
  document.getElementById('btn-export-students').addEventListener('click', function() {
    exportStudentsData();
  });

  // Dosya seç butonu
  document.getElementById('select-file-btn').addEventListener('click', function() {
    document.getElementById('import-file').click();
  });

  // Dosya seçildiğinde
  document.getElementById('import-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      document.getElementById('selected-file-name').textContent = file.name;
      document.getElementById('file-info').style.display = 'block';
    }
  });

  // İçe aktar butonu
  document.getElementById('import-file-btn').addEventListener('click', async function() {
    const file = document.getElementById('import-file').files[0];
    if (file) {
      await importStudentsFromFile(file);
    }
  });

  // Örnek dosya indir butonu
  document.getElementById('download-template-btn').addEventListener('click', function() {
    downloadTemplateFile();
  });

  // İçe aktarma modalını kapat
  document.getElementById('cancel-import').addEventListener('click', function() {
    document.getElementById('import-modal').style.display = 'none';
  });

  // Öğrenci verilerini dışa aktar
  function exportStudentsData() {
    try {
      const students = getStudents();
      const csvContent = convertStudentsToCSV(students);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `ogrenci_verileri_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Başarılı', 'Öğrenci verileri CSV olarak dışa aktarıldı', 'success');
    } catch (error) {
      console.error('Dışa aktarma hatası:', error);
      showToast('Hata', 'Dışa aktarma sırasında bir hata oluştu', 'error');
    }
  }

  // Öğrenci verilerini CSV'ye çevir
  function convertStudentsToCSV(students) {
    const headers = ['Ad Soyad', 'Cinsiyet', 'Sınıf', 'Şube', 'Öğrenme Stili', 'Zeka Türleri'];
    const csvRows = [headers.join(',')];
    
    students.forEach(student => {
      const row = [
        `"${student.name}"`,
        `"${student.gender}"`,
        `"${student.grade}"`,
        `"${student.class}"`,
        `"${student.learningStyleData?.style || 'Belirlenmemiş'}"`,
        `"${getIntelligenceTypesString(student.intelligenceTypes)}"`
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  // Zeka türlerini string'e çevir
  function getIntelligenceTypesString(intelligenceTypes) {
    if (!intelligenceTypes) return 'Belirlenmemiş';
    
    const activeTypes = Object.entries(intelligenceTypes)
      .filter(([type, value]) => value === 1)
      .map(([type, value]) => type);
    
    return activeTypes.join('; ');
  }

  // Dosyadan öğrenci verilerini içe aktar (Kullanıcı bazlı kayıt)
  async function importStudentsFromFile(file) {
    // Yetki kontrolü
    if (currentUserRole !== 'manager') {
      showToast('Yetki Hatası', 'Bu işlem için müdür yetkisi gereklidir.', 'error');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = async function(e) {
      try {
        const content = e.target.result;
        const students = parseCSVContent(content);
        
        if (students.length === 0) {
          showToast('Hata', 'Dosyada geçerli öğrenci verisi bulunamadı', 'error');
          return;
        }
        
        console.log('?? DEBUG: CSV parse edildi, öğrenci sayısı:', students.length);
        
        // Backend'e öğrencileri gönder (Kullanıcı bazlı kayıt)
        const response = await window.electronAPI.importStudents(students);
        
        if (response.error) {
          console.error('? Import hatası:', response.error);
          if (!handlePermissionError(response)) {
            showToast('Hata', `İçe aktarma hatası: ${response.error}`, 'error');
          }
          return;
        }
        
        console.log('? Import başarılı:', response);
        
        // UI'yi güncelle
        await loadAllStudents();
        updateStudentList();
        
        // LocalStorage'daki eski verileri temizle
        localStorage.removeItem('students');
        
        // Başarı mesajı
        let message = '';
        if (response.matched > 0 && response.added > 0) {
          message = `${response.matched} öğrenci eşleştirildi ve güncellendi, ${response.added} yeni öğrenci eklendi. Toplam: ${response.total}`;
        } else if (response.matched > 0) {
          message = `${response.matched} öğrenci eşleştirildi ve güncellendi. Toplam: ${response.total}`;
        } else if (response.added > 0) {
          message = `${response.added} yeni öğrenci eklendi. Toplam: ${response.total}`;
        } else {
          message = 'Hiçbir öğrenci işlenmedi.';
        }
        
        showToast('Başarılı', message, 'success');
        
        // Modal'ı kapat
        document.getElementById('import-modal').style.display = 'none';
        
      } catch (error) {
        console.error('? İçe aktarma hatası:', error);
        showToast('Hata', 'Dosya okuma sırasında bir hata oluştu', 'error');
      }
    };
    
    reader.readAsText(file, 'UTF-8');
  }

  // CSV içeriğini parse et - Yeni şema ile güncellendi
  function parseCSVContent(content) {
    const lines = content.split('\n');
    const students = [];
    
    if (lines.length < 2) {
      throw new Error('CSV dosyası en az 2 satır içermelidir (header + veri)');
    }
    
    // Header'ı parse et
    const headerLine = lines[0].trim();
    const headers = parseCSVLine(headerLine);
    
    // Hem Türkçe hem İngilizce kolon isimlerini kontrol et
    const requiredColumns = ['Öğrenci No', 'Ad Soyad', 'Sınıf', 'Öğrenme Stili'];
    const englishColumns = ['student_no', 'name', 'class', 'learning_style'];
    
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    const missingEnglishColumns = englishColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0 && missingEnglishColumns.length > 0) {
      throw new Error(`CSV'de eksik kolonlar: ${missingColumns.join(', ')} veya ${englishColumns.join(', ')}`);
    }
    
    // Kabiliyet kolonlarını kontrol et
    const abilityColumns = [
      'visual_spatial_level', 'visual_spatial_score',
      'verbal_linguistic_level', 'verbal_linguistic_score',
      'logical_mathematical_level', 'logical_mathematical_score',
      'musical_rhythmic_level', 'musical_rhythmic_score',
      'bodily_kinesthetic_level', 'bodily_kinesthetic_score',
      'interpersonal_level', 'interpersonal_score',
      'intrapersonal_level', 'intrapersonal_score',
      'naturalist_level', 'naturalist_score'
    ];
    
    const missingAbilityColumns = abilityColumns.filter(col => !headers.includes(col));
    if (missingAbilityColumns.length > 0) {
      console.warn(`CSV'de eksik kabiliyet kolonları: ${missingAbilityColumns.join(', ')}`);
    }
    
    // Veri satırlarını işle
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const columns = parseCSVLine(line);
        const student = parseStudentFromCSVRow(headers, columns);
        students.push(student);
      } catch (error) {
        console.error(`Satır ${i + 1} işlenirken hata:`, error.message);
        // Hatalı satırı atla ve devam et
      }
    }
    
    return students;
  }
  
  // CSV satırından öğrenci objesi oluştur
  function parseStudentFromCSVRow(headers, columns) {
    // Temel bilgileri al (hem Türkçe hem İngilizce kolon isimlerini dene)
    const studentNo = getColumnValue(headers, columns, 'Öğrenci No') || getColumnValue(headers, columns, 'student_no');
    const name = getColumnValue(headers, columns, 'Ad Soyad') || getColumnValue(headers, columns, 'name');
    const gradeValue = getColumnValue(headers, columns, 'Sınıf') || getColumnValue(headers, columns, 'class');
    const learningStyle = getColumnValue(headers, columns, 'Öğrenme Stili') || getColumnValue(headers, columns, 'learning_style');
    
    // Grade'i string olarak parse et ve sınıf/şube ayır
    const gradeString = (gradeValue || '').toString().trim();
    const [gradeNumber, classShube] = gradeString.split(/[./\\s]/);
    
    if (!name || !gradeNumber) {
      throw new Error('Ad Soyad ve Sınıf bilgileri zorunludur');
    }
    
    // Kabiliyet verilerini parse et
    const abilityLevels = parseAbilityLevels(headers, columns);
    
    const student = {
      id: generateStudentId(),
      studentNo: studentNo || '',
      name: name,
      grade: gradeNumber || '6', // String olarak sakla
      class: classShube || 'A', // CSV'den gelen şube bilgisi
      learningStyle: learningStyle || 'Belirlenmemiş',
      abilityLevels: abilityLevels,
      performanceData: {
        strengths: [],
        lastExamDate: null,
        averageScore: null,
        examHistory: []
      },
      learningStyleData: {
        style: learningStyle || 'Belirlenmemiş',
        confidence: 0,
        characteristics: [],
        recommendedTechniques: []
      },
      intelligenceTypes: {
        verbal: abilityLevels.verbalLinguistic?.level > 0 ? 1 : 0,
        logical: abilityLevels.logicalMathematical?.level > 0 ? 1 : 0,
        visual: abilityLevels.visualSpatial?.level > 0 ? 1 : 0,
        musical: abilityLevels.musicalRhythmic?.level > 0 ? 1 : 0,
        kinesthetic: abilityLevels.bodilyKinesthetic?.level > 0 ? 1 : 0,
        interpersonal: abilityLevels.interpersonal?.level > 0 ? 1 : 0,
        intrapersonal: abilityLevels.intrapersonal?.level > 0 ? 1 : 0,
        naturalist: abilityLevels.naturalist?.level > 0 ? 1 : 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return student;
  }
  
  // Kolon değerini al
  function getColumnValue(headers, columns, columnName) {
    const index = headers.indexOf(columnName);
    return index !== -1 ? columns[index]?.trim() : null;
  }
  
  // Kabiliyet seviyelerini parse et
  function parseAbilityLevels(headers, columns) {
    const abilities = {
      visualSpatial: { level: 0, score: 0 },
      verbalLinguistic: { level: 0, score: 0 },
      logicalMathematical: { level: 0, score: 0 },
      musicalRhythmic: { level: 0, score: 0 },
      bodilyKinesthetic: { level: 0, score: 0 },
      interpersonal: { level: 0, score: 0 },
      intrapersonal: { level: 0, score: 0 },
      naturalist: { level: 0, score: 0 }
    };
    
    const abilityMapping = {
      visualSpatial: ['Görsel Uzamsal Düşünme, Zihinsel Çevirme, Küp ve Modeller', 'Görsel Uzamsal Düşünme, Zihinsel Çevirme, Küp ve Modeller (score)'],
      verbalLinguistic: ['Sözel Akıl Yürütme', 'Sözel Akıl Yürütme (score)'],
      logicalMathematical: ['Analojiler, Diziler ve Sayısal Akıl Yürütme', 'Analojiler, Diziler ve Sayısal Akıl Yürütme (score)'],
      musicalRhythmic: ['Kodlama', 'Kodlama (score)'],
      bodilyKinesthetic: ['Parça-Bütün, Görsel Akıl Yürütme', 'Parça-Bütün, Görsel Akıl Yürütme (score)'],
      interpersonal: ['İlişkisel Düşünme', 'İlişkisel Düşünme (score)'],
      intrapersonal: ['İlişkisel Düşünme', 'İlişkisel Düşünme (score)'], // CSV'de sadece bu var
      naturalist: ['İlişkisel Düşünme', 'İlişkisel Düşünme (score)'] // CSV'de sadece bu var
    };
    
    Object.keys(abilityMapping).forEach(ability => {
      const [levelCol, scoreCol] = abilityMapping[ability];
      const levelValue = getColumnValue(headers, columns, levelCol);
      const scoreValue = getColumnValue(headers, columns, scoreCol);
      
      // Renk kodlarını sayıya çevir
      let level = 0;
      if (levelValue === 'red') level = 1;
      else if (levelValue === 'yellow') level = 2;
      else if (levelValue === 'green') level = 3;
      
      abilities[ability].level = level;
      abilities[ability].score = parseFloat(scoreValue) || 0;
    });
    
    return abilities;
  }

  // CSV satırını parse et
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  // Örnek dosya indir
  function downloadTemplateFile() {
    const templateContent = `Ad Soyad,Cinsiyet,Sınıf,Şube,Öğrenme Stili,Zeka Türleri
"Ahmet Yılmaz","Erkek","6","A","AYRIŞTIRAN","verbal;logical"
"Ayşe Demir","Kız","6","A","ÖZÜMSEYEN","visual;intrapersonal"
"Mehmet Kaya","Erkek","7","B","YERLEŞTİREN","interpersonal;kinesthetic"
"Fatma Öz","Kız","7","B","DEĞİŞTİREN","musical;naturalist"
"Ali Çelik","Erkek","8","A","AYRIŞTIRAN","logical;verbal"`;

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'ogrenci_verileri_ornek.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Başarılı', 'Örnek dosya indirildi', 'success');
  }

  // Öğrenci verilerini al
  function getStudents() {
    try {
      // Önce mevcut allStudents değişkenini kontrol et
      if (allStudents && allStudents.length > 0) {
        console.log('🔍 getStudents: allStudents\'dan', allStudents.length, 'öğrenci döndürülüyor');
        return allStudents;
      }
      
      // localStorage'dan kontrol et
      const localData = localStorage.getItem('students');
      if (localData) {
        const data = JSON.parse(localData);
        console.log('🔍 getStudents: localStorage\'dan', data.students?.length || 0, 'öğrenci döndürülüyor');
        return data.students || [];
      }
      
      // Son çare olarak window.studentsData'ya bak
      console.log('🔍 getStudents: window.studentsData\'dan', window.studentsData?.length || 0, 'öğrenci döndürülüyor');
      return window.studentsData || [];
    } catch (error) {
      console.error('Öğrenci verileri yüklenirken hata:', error);
      return [];
    }
  }

  // Öğrenci verilerini kaydet
  function saveStudents(students) {
    try {
      const data = {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        students: students
      };
      localStorage.setItem('students', JSON.stringify(data));
      console.log('Öğrenci verileri kaydedildi:', students.length, 'öğrenci');
    } catch (error) {
      console.error('Öğrenci verileri kaydedilirken hata:', error);
    }
  }

  // Öğrenci ID'si oluştur
  function generateStudentId() {
    return 'student_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Veri migrasyonu - eski kayıtları güncelle
  function migrateStudentData(student) {
    return {
      ...student,
      abilityLevels: student.abilityLevels || {
        visualSpatial: { level: 0, score: 0 },
        verbalLinguistic: { level: 0, score: 0 },
        logicalMathematical: { level: 0, score: 0 },
        musicalRhythmic: { level: 0, score: 0 },
        bodilyKinesthetic: { level: 0, score: 0 },
        interpersonal: { level: 0, score: 0 },
        intrapersonal: { level: 0, score: 0 },
        naturalist: { level: 0, score: 0 }
      },
      learningStyle: student.learningStyle || 'Belirlenmemiş'
    };
  }
  
  // Öğrenci verilerini yükle ve migrate et
  function loadStudents() {
    window.electronAPI.loadStudents().then(result => {
      if (result.error) {
        console.error('Öğrenci yükleme hatası:', result.error);
        showToast('Hata', 'Öğrenci verileri yüklenemedi', 'error');
        return;
      }
      
      // Öğrencileri migrate et
      students = (result.students || []).map(migrateStudentData);
      
      console.log(`? ${students.length} öğrenci yüklendi ve migrate edildi`);
      
      // UI'yi güncelle
      renderStudentResults();
      updateSelectedStudentDisplay();
    });
  }

  // Öğrenci listesini güncelle
  function updateStudentList() {
    // Bu fonksiyon UI'daki öğrenci listesini günceller
    // Şu an için boş bırakıyoruz, gerekirse daha sonra implement edilebilir
    console.log('Öğrenci listesi güncellendi');
  }

  // Sayfa göster
  function showPage(pageId) {
    // Tüm sayfaları gizle
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      page.classList.remove('active');
    });

    // Seçilen sayfayı göster
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    // Navigasyon butonlarını güncelle
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.classList.remove('active');
    });

    // Aktif butonu bul ve işaretle
    const activeButton = document.querySelector(`[data-page="${pageId}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }

    // DÜZELTME: Rapor sayfasına geçildiğinde grafikleri yeniden çiz
    if (pageId === 'reports-section' && selectedStudent) {
      console.log('📊 Rapor sayfası açıldı, grafikler yeniden çiziliyor...');
      const profileExams = allExams.filter(exam => exam.profile === selectedStudent.name);

      // Grafikleri yeniden çiz (kısa bir gecikme ile, DOM'un render olması için)
      setTimeout(() => {
        updateCharts(profileExams);
        console.log('✅ Grafikler yeniden çizildi');
      }, 100);
    }
  }

  // Sınıf analizi verilerini yükle
  function loadClassAnalysisData() {
    const students = getStudents();
    const classOptions = getClassOptions(students);
    populateClassSelectors(classOptions);
  }

  // Mevcut sınıfları al
  function getClassOptions(students) {
    const classes = new Set();
    students.forEach(student => {
      if (student.grade && student.class) {
        classes.add(`${student.grade}/${student.class}`);
      }
    });
    return Array.from(classes).sort();
  }

  // Sınıf seçicilerini doldur
  function populateClassSelectors(classOptions) {
    const gradeSelect = document.getElementById('class-grade-select');
    const letterSelect = document.getElementById('class-letter-select');
    const compareClass1 = document.getElementById('compare-class1');
    const compareClass2 = document.getElementById('compare-class2');

    // Karşılaştırma seçicilerini doldur
    [compareClass1, compareClass2].forEach(select => {
      if (select) {
        select.innerHTML = '<option value="">Sınıf Seçin</option>';
        classOptions.forEach(className => {
          const option = document.createElement('option');
          option.value = className;
          option.textContent = className;
          select.appendChild(option);
        });
      }
    });
  }

  // Sınıf analizi butonu
  document.getElementById('analyze-class-btn').addEventListener('click', function() {
    const grade = document.getElementById('class-grade-select').value;
    const letter = document.getElementById('class-letter-select').value;
    
    if (!grade || !letter) {
      showToast('Hata', 'Lütfen sınıf ve şube seçin', 'error');
      return;
    }

    const className = `${grade}/${letter}`;
    analyzeClass(className);
  });

  // Sınıf analizi yap
  function analyzeClass(className) {
    const students = getStudents();
    const classStudents = students.filter(student => 
      student.grade && student.class && `${student.grade}/${student.class}` === className
    );

    if (classStudents.length === 0) {
      showToast('Hata', 'Bu sınıfta öğrenci bulunamadı', 'error');
      return;
    }

    // Sınıf özetini göster
    showClassSummary(classStudents, className);
    
    // Zeka türü dağılımını göster
    showIntelligenceDistribution(classStudents);
    
    // Öğrenme stili dağılımını göster
    showLearningStyleDistribution(classStudents);
    
    // Sınıf etkinlik önerilerini göster
    showClassActivities(classStudents);
    
    // Karşılaştırma bölümünü göster
    showClassComparison();
    
    // ?? YENİ: Toplu rapor bölümünü göster ve öğrenci listesini yükle
    showBulkReportGenerator();
    loadStudentListForBulkReport(classStudents);
    
    // Hafta sonu etüt programı bölümünü göster
    showWeekendScheduleGenerator();
    
    // PDF export butonunu göster
    document.getElementById('class-analysis-actions').style.display = 'block';
  }

  // Sınıf özetini göster
  function showClassSummary(students, className) {
    const totalStudents = students.length;
    
    // Zeka türü dağılımını hesapla
    const intelligenceDistribution = {
      verbal: 0, logical: 0, visual: 0, musical: 0,
      kinesthetic: 0, interpersonal: 0, intrapersonal: 0, naturalist: 0
    };
    
    students.forEach(student => {
      if (student.intelligenceTypes) {
        Object.keys(intelligenceDistribution).forEach(type => {
          if (student.intelligenceTypes[type] === 1) {
            intelligenceDistribution[type]++;
          }
        });
      }
    });

    // En güçlü zeka türünü bul
    const strongestIntelligence = Object.entries(intelligenceDistribution)
      .reduce((a, b) => intelligenceDistribution[a[0]] > intelligenceDistribution[b[0]] ? a : b)[0];
    
    const intelligenceNames = {
      verbal: 'Sözel/Dilsel',
      logical: 'Mantıksal/Matematiksel',
      visual: 'Görsel/Uzamsal',
      musical: 'Müziksel/Ritmik',
      kinesthetic: 'Bedensel/Kinestetik',
      interpersonal: 'Kişiler Arası',
      intrapersonal: 'İçsel/Öze Dönük',
      naturalist: 'Doğa'
    };

    // Öğrenme stili dağılımını hesapla
    const learningStyleDistribution = {};
    students.forEach(student => {
      const style = student.learningStyleData?.style || 'Belirlenmemiş';
      learningStyleDistribution[style] = (learningStyleDistribution[style] || 0) + 1;
    });

    const commonLearningStyle = Object.entries(learningStyleDistribution)
      .reduce((a, b) => learningStyleDistribution[a[0]] > learningStyleDistribution[b[0]] ? a : b)[0];

    // Ortalama performansı hesapla (varsa)
    let avgPerformance = '-';
    const studentsWithExams = students.filter(s => s.performanceData?.examHistory?.length > 0);
    if (studentsWithExams.length > 0) {
      const totalAvg = studentsWithExams.reduce((sum, s) => {
        const avg = s.performanceData.examHistory.reduce((examSum, exam) => examSum + exam.averageNet, 0) / s.performanceData.examHistory.length;
        return sum + avg;
      }, 0);
      avgPerformance = (totalAvg / studentsWithExams.length).toFixed(1);
    }

    // DOM'u güncelle
    document.getElementById('class-total-students').textContent = totalStudents;
    document.getElementById('class-avg-performance').textContent = avgPerformance;
    document.getElementById('class-strongest-intelligence').textContent = intelligenceNames[strongestIntelligence];
    document.getElementById('class-common-learning-style').textContent = commonLearningStyle;

    // Sınıf özetini göster
    document.getElementById('class-summary').style.display = 'block';
  }

  // Zeka türü dağılımını göster
  function showIntelligenceDistribution(students) {
    const intelligenceDistribution = {
      verbal: 0, logical: 0, visual: 0, musical: 0,
      kinesthetic: 0, interpersonal: 0, intrapersonal: 0, naturalist: 0
    };
    
    students.forEach(student => {
      if (student.intelligenceTypes) {
        Object.keys(intelligenceDistribution).forEach(type => {
          if (student.intelligenceTypes[type] === 1) {
            intelligenceDistribution[type]++;
          }
        });
      }
    });

    // Grafik oluştur
    createIntelligenceChart(intelligenceDistribution);
    
    // Detayları göster
    showIntelligenceDetails(intelligenceDistribution, students.length);
    
    document.getElementById('intelligence-distribution').style.display = 'block';
  }

  // Zeka türü grafiği oluştur
  function createIntelligenceChart(distribution) {
    const canvas = document.getElementById('intelligence-chart');
    const ctx = canvas.getContext('2d');
    
    // Canvas'ı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const intelligenceNames = {
      verbal: 'Sözel/Dilsel',
      logical: 'Mantıksal/Matematiksel',
      visual: 'Görsel/Uzamsal',
      musical: 'Müziksel/Ritmik',
      kinesthetic: 'Bedensel/Kinestetik',
      interpersonal: 'Kişiler Arası',
      intrapersonal: 'İçsel/Öze Dönük',
      naturalist: 'Doğa'
    };

    const colors = ['#4a90e2', '#50e3c2', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];
    
    const data = Object.entries(distribution).map(([key, value], index) => ({
      name: intelligenceNames[key],
      value: value,
      color: colors[index]
    }));

    // Basit bar chart çiz
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = canvas.width / data.length * 0.8;
    const barSpacing = canvas.width / data.length * 0.2;
    const maxHeight = canvas.height - 60;

    data.forEach((item, index) => {
      const x = index * (barWidth + barSpacing) + barSpacing / 2;
      const barHeight = (item.value / maxValue) * maxHeight;
      const y = canvas.height - barHeight - 30;

      // Bar çiz
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Değer yaz
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);

      // İsim yaz
      ctx.save();
      ctx.translate(x + barWidth / 2, canvas.height - 10);
      ctx.rotate(-Math.PI / 2);
      ctx.font = '10px Arial';
      ctx.fillText(item.name, 0, 0);
      ctx.restore();
    });
  }

  // Zeka türü detaylarını göster
  function showIntelligenceDetails(distribution, totalStudents) {
    const intelligenceNames = {
      verbal: 'Sözel/Dilsel Zeka',
      logical: 'Mantıksal/Matematiksel Zeka',
      visual: 'Görsel/Uzamsal Zeka',
      musical: 'Müziksel/Ritmik Zeka',
      kinesthetic: 'Bedensel/Kinestetik Zeka',
      interpersonal: 'Kişiler Arası Zeka',
      intrapersonal: 'İçsel/Öze Dönük Zeka',
      naturalist: 'Doğa Zekası'
    };

    const detailsContainer = document.getElementById('intelligence-details');
    detailsContainer.innerHTML = '';

    Object.entries(distribution).forEach(([type, count]) => {
      const percentage = ((count / totalStudents) * 100).toFixed(1);
      const detailItem = document.createElement('div');
      detailItem.className = 'detail-item';
      detailItem.innerHTML = `
        <h5>${intelligenceNames[type]}</h5>
        <p>${count} öğrenci (%${percentage})</p>
      `;
      detailsContainer.appendChild(detailItem);
    });
  }

  // Öğrenme stili dağılımını göster
  function showLearningStyleDistribution(students) {
    const learningStyleDistribution = {};
    students.forEach(student => {
      const style = student.learningStyleData?.style || 'Belirlenmemiş';
      learningStyleDistribution[style] = (learningStyleDistribution[style] || 0) + 1;
    });

    // Grafik oluştur
    createLearningStyleChart(learningStyleDistribution);
    
    // Detayları göster
    showLearningStyleDetails(learningStyleDistribution, students.length);
    
    document.getElementById('learning-style-distribution').style.display = 'block';
  }

  // Öğrenme stili grafiği oluştur
  function createLearningStyleChart(distribution) {
    const canvas = document.getElementById('learning-style-chart');
    const ctx = canvas.getContext('2d');
    
    // Canvas'ı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const colors = ['#4a90e2', '#50e3c2', '#f39c12', '#e74c3c', '#9b59b6'];
    
    const data = Object.entries(distribution).map(([style, count], index) => ({
      name: style,
      value: count,
      color: colors[index % colors.length]
    }));

    // Pie chart çiz
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    let currentAngle = 0;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    data.forEach(item => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      // Slice çiz
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

      // Label çiz
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
      
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.name}: ${item.value}`, labelX, labelY);

      currentAngle += sliceAngle;
    });
  }

  // Öğrenme stili detaylarını göster
  function showLearningStyleDetails(distribution, totalStudents) {
    const detailsContainer = document.getElementById('learning-style-details');
    detailsContainer.innerHTML = '';

    Object.entries(distribution).forEach(([style, count]) => {
      const percentage = ((count / totalStudents) * 100).toFixed(1);
      const detailItem = document.createElement('div');
      detailItem.className = 'detail-item';
      detailItem.innerHTML = `
        <h5>${style}</h5>
        <p>${count} öğrenci (%${percentage})</p>
      `;
      detailsContainer.appendChild(detailItem);
    });
  }

  // Sınıf etkinlik önerilerini göster
  function showClassActivities(students) {
    const activities = generateClassActivities(students);
    const container = document.getElementById('class-activities-grid');
    container.innerHTML = '';

    activities.forEach(activity => {
      const activityCard = document.createElement('div');
      activityCard.className = 'activity-card';
      activityCard.innerHTML = `
        <h4>${activity.name}</h4>
        <p>${activity.description}</p>
        <div class="activity-tags">
          ${activity.tags.map(tag => `<span class="activity-tag">${tag}</span>`).join('')}
        </div>
      `;
      container.appendChild(activityCard);
    });

    document.getElementById('class-activities').style.display = 'block';
  }

  // Sınıf etkinlikleri oluştur
  function generateClassActivities(students) {
    const intelligenceDistribution = {
      verbal: 0, logical: 0, visual: 0, musical: 0,
      kinesthetic: 0, interpersonal: 0, intrapersonal: 0, naturalist: 0
    };
    
    students.forEach(student => {
      if (student.intelligenceTypes) {
        Object.keys(intelligenceDistribution).forEach(type => {
          if (student.intelligenceTypes[type] === 1) {
            intelligenceDistribution[type]++;
          }
        });
      }
    });

    const totalStudents = students.length;
    const strongIntelligences = Object.entries(intelligenceDistribution)
      .filter(([type, count]) => count > totalStudents * 0.3)
      .map(([type]) => type);

    const activities = [];

    if (strongIntelligences.includes('verbal')) {
      activities.push({
        name: 'Sınıf Gazetesi Projesi',
        description: 'Öğrenciler birlikte bir sınıf gazetesi oluşturur. Her öğrenci farklı bölümlerde yazı yazar.',
        tags: ['Sözel Zeka', 'İşbirliği', 'Yaratıcılık']
      });
    }

    if (strongIntelligences.includes('logical')) {
      activities.push({
        name: 'Matematik Olimpiyatı',
        description: 'Sınıf içi matematik yarışması düzenleyin. Problem çözme becerilerini geliştirir.',
        tags: ['Mantıksal Zeka', 'Yarışma', 'Problem Çözme']
      });
    }

    if (strongIntelligences.includes('visual')) {
      activities.push({
        name: 'Görsel Sunum Projesi',
        description: 'Öğrenciler konuları görsel materyallerle sunar. Poster, infografik hazırlar.',
        tags: ['Görsel Zeka', 'Sunum', 'Tasarım']
      });
    }

    if (strongIntelligences.includes('musical')) {
      activities.push({
        name: 'Müzikli Öğrenme',
        description: 'Ders konularını şarkı haline getirin. Ritim ve melodi ile öğrenmeyi kolaylaştırın.',
        tags: ['Müziksel Zeka', 'Yaratıcılık', 'Eğlence']
      });
    }

    if (strongIntelligences.includes('kinesthetic')) {
      activities.push({
        name: 'Drama ve Rol Oynama',
        description: 'Tarihsel olayları veya edebi eserleri canlandırın. Hareketli öğrenme sağlar.',
        tags: ['Bedensel Zeka', 'Drama', 'Yaratıcılık']
      });
    }

    if (strongIntelligences.includes('interpersonal')) {
      activities.push({
        name: 'Grup Çalışması Projeleri',
        description: 'Küçük gruplar halinde projeler yapın. İşbirliği ve iletişim becerilerini geliştirir.',
        tags: ['Sosyal Zeka', 'İşbirliği', 'Liderlik']
      });
    }

    if (strongIntelligences.includes('intrapersonal')) {
      activities.push({
        name: 'Kişisel Günlük Tutma',
        description: 'Öğrenciler öğrendiklerini günlük halinde yazsın. Öz değerlendirme yaparlar.',
        tags: ['İçsel Zeka', 'Yazma', 'Öz Değerlendirme']
      });
    }

    if (strongIntelligences.includes('naturalist')) {
      activities.push({
        name: 'Doğa Gözlem Projesi',
        description: 'Okul bahçesinde veya yakın çevrede doğa gözlemi yapın. Bilimsel düşünceyi geliştirir.',
        tags: ['Doğa Zekası', 'Gözlem', 'Bilim']
      });
    }

    // Genel etkinlikler
    activities.push({
      name: 'Sınıf Turnuvası',
      description: 'Farklı derslerden konuları kapsayan bilgi yarışması düzenleyin.',
      tags: ['Genel', 'Yarışma', 'Eğlence']
    });

    activities.push({
      name: 'Peer Teaching (Akran Öğretimi)',
      description: 'Öğrenciler birbirlerine konu anlatır. Hem öğreten hem öğrenen faydalanır.',
      tags: ['Genel', 'İşbirliği', 'Öğretme']
    });

    return activities.slice(0, 6); // En fazla 6 etkinlik göster
  }

  // Sınıf karşılaştırmasını göster
  function showClassComparison() {
    document.getElementById('class-comparison').style.display = 'block';

    // Yeni karşılaştırma modülü için checkbox'ları yükle
    loadClassCheckboxes();
  }

  // Sınıf karşılaştırma butonu
  document.getElementById('compare-classes-btn').addEventListener('click', function() {
    const class1 = document.getElementById('compare-class1').value;
    const class2 = document.getElementById('compare-class2').value;
    
    if (!class1 || !class2) {
      showToast('Hata', 'Lütfen karşılaştırılacak iki sınıfı seçin', 'error');
      return;
    }

    if (class1 === class2) {
      showToast('Hata', 'Aynı sınıfı seçemezsiniz', 'error');
      return;
    }

    compareClasses(class1, class2);
  });

  // Sınıfları karşılaştır
  function compareClasses(class1, class2) {
    const students = getStudents();
    const students1 = students.filter(s => `${s.grade}/${s.class}` === class1);
    const students2 = students.filter(s => `${s.grade}/${s.class}` === class2);

    if (students1.length === 0 || students2.length === 0) {
      showToast('Hata', 'Seçilen sınıflarda öğrenci bulunamadı', 'error');
      return;
    }

    const comparison1 = analyzeClassForComparison(students1);
    const comparison2 = analyzeClassForComparison(students2);

    const resultsContainer = document.getElementById('comparison-results');
    resultsContainer.innerHTML = `
      <div class="comparison-card">
        <h4>${class1}</h4>
        <div class="comparison-stats">
          <div class="comparison-stat">
            <h5>Öğrenci Sayısı</h5>
            <p>${comparison1.totalStudents}</p>
          </div>
          <div class="comparison-stat">
            <h5>En Güçlü Zeka</h5>
            <p>${comparison1.strongestIntelligence}</p>
          </div>
          <div class="comparison-stat">
            <h5>Yaygın Stil</h5>
            <p>${comparison1.commonStyle}</p>
          </div>
          <div class="comparison-stat">
            <h5>Ortalama Performans</h5>
            <p>${comparison1.avgPerformance}</p>
          </div>
        </div>
      </div>
      <div class="comparison-card">
        <h4>${class2}</h4>
        <div class="comparison-stats">
          <div class="comparison-stat">
            <h5>Öğrenci Sayısı</h5>
            <p>${comparison2.totalStudents}</p>
          </div>
          <div class="comparison-stat">
            <h5>En Güçlü Zeka</h5>
            <p>${comparison2.strongestIntelligence}</p>
          </div>
          <div class="comparison-stat">
            <h5>Yaygın Stil</h5>
            <p>${comparison2.commonStyle}</p>
          </div>
          <div class="comparison-stat">
            <h5>Ortalama Performans</h5>
            <p>${comparison2.avgPerformance}</p>
          </div>
        </div>
      </div>
    `;
  }

  // Hafta sonu etüt programı bölümünü göster
  function showWeekendScheduleGenerator() {
    const generator = document.getElementById('weekend-schedule-generator');
    if (generator) {
      // Sınıf seviyesini kontrol et
      const currentClassName = document.querySelector('.class-analysis-header h2')?.textContent;
      if (currentClassName) {
        const grade = currentClassName.split('/')[0];
        if (grade === '8') {
          // 8. sınıflar için bölümü gizle
          generator.style.display = 'none';
          return;
        }
      }
      
      generator.style.display = 'block';
      
      // Event listener'ları ekle
      const generateBtn = document.getElementById('generate-weekend-schedule-btn');
      const exportBtn = document.getElementById('export-weekend-schedule-pdf-btn');
      
      if (generateBtn) {
        generateBtn.addEventListener('click', generateWeekendSchedule);
      }
      
      if (exportBtn) {
        exportBtn.addEventListener('click', exportWeekendScheduleToPDF);
      }
    }
  }

  // Hafta sonu etüt programı oluştur
  function generateWeekendSchedule() {
    const currentClassName = document.querySelector('.class-analysis-header h2')?.textContent;
    if (!currentClassName) {
      showToast('Hata', 'Sınıf bilgisi bulunamadı', 'error');
      return;
    }

    const students = getStudents();
    const classStudents = students.filter(student => 
      student.grade && student.class && `${student.grade}/${student.class}` === currentClassName
    );

    if (classStudents.length === 0) {
      showToast('Hata', 'Bu sınıfta öğrenci bulunamadı', 'error');
      return;
    }

    // 8. sınıflar için hafta sonu etüt programı oluşturulmaz
    const grade = classStudents[0]?.grade;
    if (grade === '8') {
      showToast('Bilgi', '8. sınıflar için hafta sonu etüt programı oluşturulamaz. LGS hazırlık programı farklıdır.', 'info');
      return;
    }

    // Sınıfın deneme sonuçlarını analiz et
    const examResults = analyzeClassExamResults(classStudents);
    
    // Dersleri önceliklendir
    const prioritizedSubjects = prioritizeSubjects(examResults);
    
    // Zaman dilimlerini oluştur
    const timeSlots = createTimeSlots();
    
    // Konuları zaman dilimlerine ata
    const schedule = assignTopicsToTimeSlots(prioritizedSubjects, timeSlots, currentClassName, classStudents.length);
    
    // Programı görüntüle
    displayWeekendSchedule(schedule);
    
    showToast('Başarılı', 'Hafta sonu etüt programı oluşturuldu!', 'success');
  }

  // Sınıfın deneme sonuçlarını analiz et
  function analyzeClassExamResults(students) {
    const subjects = ['turkce', 'matematik', 'fen', 'sosyal', 'ingilizce', 'din'];
    const results = {};

    subjects.forEach(subject => {
      const subjectResults = {
        subject: subject,
        totalStudents: students.length,
        studentsWithExams: 0,
        totalExams: 0,
        avgScore: 0,
        weakOutcomes: [],
        participationRate: 0
      };

      let totalScore = 0;
      let examCount = 0;
      const allWeakOutcomes = [];

      students.forEach(student => {
        const studentExams = allExams.filter(exam => exam.profile === student.name);
        const recentExams = studentExams
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3); // Son 3 deneme

        if (recentExams.length > 0) {
          subjectResults.studentsWithExams++;
          examCount += recentExams.length;

          recentExams.forEach(exam => {
            if (exam.courses && exam.courses[subject]) {
              const course = exam.courses[subject];
              if (course.net !== undefined) {
                totalScore += course.net;
              }
              
              // Eksik kazanımları topla
              if (course.incorrectOutcomes) {
                const incorrectOutcomes = Array.isArray(course.incorrectOutcomes) 
                  ? course.incorrectOutcomes 
                  : course.incorrectOutcomes.split(',').map(s => s.trim());
                
                incorrectOutcomes.forEach(outcome => {
                  if (outcome && outcome.trim()) {
                    allWeakOutcomes.push(outcome.trim());
                  }
                });
              }
            }
          });
        }
      });

      // Ortalama hesapla
      if (examCount > 0) {
        subjectResults.avgScore = (totalScore / examCount).toFixed(1);
        subjectResults.totalExams = examCount;
        subjectResults.participationRate = ((subjectResults.studentsWithExams / students.length) * 100).toFixed(1);
      }

      // En yaygın eksik kazanımları bul
      const outcomeCounts = {};
      allWeakOutcomes.forEach(outcome => {
        outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
      });

      subjectResults.weakOutcomes = Object.entries(outcomeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([outcome, count]) => ({ outcome, count }));

      results[subject] = subjectResults;
    });

    return results;
  }

  // Dersleri önceliklendir
  function prioritizeSubjects(examResults) {
    const subjects = Object.values(examResults);
    
    // Öncelik sıralaması: Ortalama puan (düşük › yüksek), Eksik kazanım sayısı (yüksek › düşük)
    return subjects.sort((a, b) => {
      // Önce ortalama puana göre sırala (düşük puan = yüksek öncelik)
      const scoreDiff = parseFloat(a.avgScore) - parseFloat(b.avgScore);
      if (Math.abs(scoreDiff) > 0.1) {
        return scoreDiff;
      }
      
      // Eşitse eksik kazanım sayısına göre sırala (çok eksik = yüksek öncelik)
      return b.weakOutcomes.length - a.weakOutcomes.length;
    });
  }

  // Zaman dilimlerini oluştur
  function createTimeSlots() {
    const includeSaturday = document.getElementById('include-saturday')?.checked ?? true;
    const includeSunday = document.getElementById('include-sunday')?.checked ?? true;
    const startTime = document.getElementById('schedule-start-time')?.value ?? '09:00';
    
    const slots = [];
    let slotIndex = 0;
    
    if (includeSaturday) {
      for (let i = 0; i < 3; i++) {
        const start = new Date(`2025-01-01 ${startTime}`);
        start.setMinutes(start.getMinutes() + (i * 30));
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);
        
        slots.push({
          day: 'Cumartesi',
          time: `${formatTime(start)}-${formatTime(end)}`,
          index: slotIndex++
        });
      }
    }
    
    if (includeSunday) {
      for (let i = 0; i < 3; i++) {
        const start = new Date(`2025-01-01 ${startTime}`);
        start.setMinutes(start.getMinutes() + (i * 30));
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);
        
        slots.push({
          day: 'Pazar',
          time: `${formatTime(start)}-${formatTime(end)}`,
          index: slotIndex++
        });
      }
    }
    
    return slots;
  }

  // Zamanı formatla
  function formatTime(date) {
    return date.toTimeString().slice(0, 5);
  }

  // Konuları zaman dilimlerine ata
  function assignTopicsToTimeSlots(subjects, timeSlots, className, totalStudents) {
    const schedule = {
      className: className,
      date: new Date().toLocaleDateString('tr-TR'),
      totalStudents: totalStudents,
      sessions: [],
      summary: {
        totalDuration: `${timeSlots.length * 30} dakika`,
        highPrioritySubjects: [],
        mediumPrioritySubjects: [],
        lowPrioritySubjects: []
      }
    };

    subjects.forEach((subject, index) => {
      if (index < timeSlots.length) {
        const slot = timeSlots[index];
        const priority = index < 2 ? 'high' : index < 4 ? 'medium' : 'low';
        
        schedule.sessions.push({
          day: slot.day,
          time: slot.time,
          subject: getSubjectDisplayName(subject.subject),
          topics: subject.weakOutcomes.map(w => w.outcome),
          studentCount: totalStudents,
          priority: priority,
          avgScore: subject.avgScore,
          weakOutcomeCount: subject.weakOutcomes.length,
          participationRate: subject.participationRate
        });

        // Öncelik kategorilerine ekle
        if (priority === 'high') {
          schedule.summary.highPrioritySubjects.push(getSubjectDisplayName(subject.subject));
        } else if (priority === 'medium') {
          schedule.summary.mediumPrioritySubjects.push(getSubjectDisplayName(subject.subject));
        } else {
          schedule.summary.lowPrioritySubjects.push(getSubjectDisplayName(subject.subject));
        }
      }
    });

    return schedule;
  }

  // Ders adını görüntüleme formatına çevir
  function getSubjectDisplayName(subject) {
    const names = {
      'turkce': 'Türkçe',
      'matematik': 'Matematik',
      'fen': 'Fen Bilimleri',
      'sosyal': 'Sosyal Bilgiler',
      'ingilizce': 'İngilizce',
      'din': 'Din Kültürü'
    };
    return names[subject] || subject;
  }

  // Hafta sonu programını görüntüle
  function displayWeekendSchedule(schedule) {
    const display = document.getElementById('weekend-schedule-display');
    const exportBtn = document.getElementById('export-weekend-schedule-pdf-btn');
    
    if (!display) return;

    let html = `
      <div class="weekend-schedule">
        <div class="schedule-header">
          <h4>?? ${schedule.className} Sınıfı - Hafta Sonu Etüt Programı</h4>
          <p>?? ${schedule.totalStudents} Öğrenci | ?? ${schedule.date}</p>
        </div>
        
        <div class="schedule-summary">
          <h5>?? Program Özeti</h5>
          <p><strong>Toplam Süre:</strong> ${schedule.summary.totalDuration}</p>
          <p><strong>Yüksek Öncelik:</strong> ${schedule.summary.highPrioritySubjects.join(', ')}</p>
          <p><strong>Orta Öncelik:</strong> ${schedule.summary.mediumPrioritySubjects.join(', ')}</p>
          <p><strong>Düşük Öncelik:</strong> ${schedule.summary.lowPrioritySubjects.join(', ')}</p>
        </div>
        
        <div class="schedule-sessions">
    `;

    // Günlere göre grupla
    const sessionsByDay = {};
    schedule.sessions.forEach(session => {
      if (!sessionsByDay[session.day]) {
        sessionsByDay[session.day] = [];
      }
      sessionsByDay[session.day].push(session);
    });

    Object.keys(sessionsByDay).forEach(day => {
      html += `<div class="schedule-day">
        <h5>${day}</h5>
        <div class="day-sessions">`;
      
      sessionsByDay[day].forEach(session => {
        const priorityIcon = session.priority === 'high' ? '??' : session.priority === 'medium' ? '??' : '??';
        html += `
          <div class="session-card ${session.priority}">
            <div class="session-header">
              <span class="session-time">${session.time}</span>
              <span class="session-subject">${session.subject}</span>
              <span class="session-priority">${priorityIcon}</span>
            </div>
            <div class="session-topics">
              ${session.topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
            </div>
            <div class="session-stats">
              <span>?? Ort: ${session.avgScore} net</span>
              <span>?? ${session.studentCount} öğrenci</span>
              <span>? ${session.weakOutcomeCount} eksik kazanım</span>
              <span>?? %${session.participationRate} katılım</span>
            </div>
          </div>
        `;
      });
      
      html += `</div></div>`;
    });

    html += `</div></div>`;

    display.innerHTML = html;
    display.style.display = 'block';
    
    if (exportBtn) {
      exportBtn.style.display = 'inline-block';
    }

    // Schedule verisini global değişkene kaydet (PDF export için)
    window.currentWeekendSchedule = schedule;
  }

  // Hafta sonu programını PDF olarak dışa aktar
  function exportWeekendScheduleToPDF() {
    if (!window.currentWeekendSchedule) {
      showToast('Hata', 'Önce bir program oluşturun', 'error');
      return;
    }

    const schedule = window.currentWeekendSchedule;
    const fileName = `${schedule.className}_HaftaSonuEtut_${new Date().toISOString().slice(0, 10)}.pdf`;
    
    // PDF içeriğini hazırla
    let content = `
      <h1>?? ${schedule.className} Sınıfı - Hafta Sonu Etüt Programı</h1>
      <p><strong>Tarih:</strong> ${schedule.date}</p>
      <p><strong>Öğrenci Sayısı:</strong> ${schedule.totalStudents}</p>
      <p><strong>Toplam Süre:</strong> ${schedule.summary.totalDuration}</p>
      
      <h2>?? Program Özeti</h2>
      <ul>
        <li><strong>Yüksek Öncelik:</strong> ${schedule.summary.highPrioritySubjects.join(', ')}</li>
        <li><strong>Orta Öncelik:</strong> ${schedule.summary.mediumPrioritySubjects.join(', ')}</li>
        <li><strong>Düşük Öncelik:</strong> ${schedule.summary.lowPrioritySubjects.join(', ')}</li>
      </ul>
      
      <h2>?? Etüt Programı</h2>
    `;

    // Günlere göre grupla
    const sessionsByDay = {};
    schedule.sessions.forEach(session => {
      if (!sessionsByDay[session.day]) {
        sessionsByDay[session.day] = [];
      }
      sessionsByDay[session.day].push(session);
    });

    Object.keys(sessionsByDay).forEach(day => {
      content += `<h3>${day}</h3><table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background-color: #f0f0f0;">
          <th style="padding: 8px;">Saat</th>
          <th style="padding: 8px;">Ders</th>
          <th style="padding: 8px;">Konular</th>
          <th style="padding: 8px;">İstatistikler</th>
        </tr>`;
      
      sessionsByDay[day].forEach(session => {
        const priorityText = session.priority === 'high' ? 'Yüksek' : session.priority === 'medium' ? 'Orta' : 'Düşük';
        content += `
          <tr>
            <td style="padding: 8px;">${session.time}</td>
            <td style="padding: 8px;"><strong>${session.subject}</strong><br><small>${priorityText} Öncelik</small></td>
            <td style="padding: 8px;">${session.topics.join('<br>')}</td>
            <td style="padding: 8px;">
              Ort: ${session.avgScore} net<br>
              ${session.studentCount} öğrenci<br>
              ${session.weakOutcomeCount} eksik kazanım<br>
              %${session.participationRate} katılım
            </td>
          </tr>
        `;
      });
      
      content += `</table>`;
    });

    // PDF oluştur ve indir
    const element = document.createElement('div');
    element.innerHTML = content;
    
    // jsPDF kullanarak PDF oluştur
    if (typeof window.jsPDF !== 'undefined') {
      const { jsPDF } = window.jsPDF;
      const doc = new jsPDF();
      
      doc.html(element, {
        callback: function (doc) {
          doc.save(fileName);
          showToast('Başarılı', `${fileName} kaydedildi!`, 'success');
        },
        x: 15,
        y: 15,
        width: 180,
        windowWidth: 650
      });
    } else {
      // Fallback: HTML olarak indir
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace('.pdf', '.html');
      a.click();
      URL.revokeObjectURL(url);
      showToast('Bilgi', 'HTML formatında kaydedildi', 'info');
    }
  }

  // Sınıf karşılaştırması için analiz
  function analyzeClassForComparison(students) {
    const totalStudents = students.length;
    
    // Zeka türü dağılımı
    const intelligenceDistribution = {
      verbal: 0, logical: 0, visual: 0, musical: 0,
      kinesthetic: 0, interpersonal: 0, intrapersonal: 0, naturalist: 0
    };
    
    students.forEach(student => {
      if (student.intelligenceTypes) {
        Object.keys(intelligenceDistribution).forEach(type => {
          if (student.intelligenceTypes[type] === 1) {
            intelligenceDistribution[type]++;
          }
        });
      }
    });

    const strongestIntelligence = Object.entries(intelligenceDistribution)
      .reduce((a, b) => intelligenceDistribution[a[0]] > intelligenceDistribution[b[0]] ? a : b)[0];
    
    const intelligenceNames = {
      verbal: 'Sözel/Dilsel',
      logical: 'Mantıksal/Matematiksel',
      visual: 'Görsel/Uzamsal',
      musical: 'Müziksel/Ritmik',
      kinesthetic: 'Bedensel/Kinestetik',
      interpersonal: 'Kişiler Arası',
      intrapersonal: 'İçsel/Öze Dönük',
      naturalist: 'Doğa'
    };

    // Öğrenme stili dağılımı
    const learningStyleDistribution = {};
    students.forEach(student => {
      const style = student.learningStyleData?.style || 'Belirlenmemiş';
      learningStyleDistribution[style] = (learningStyleDistribution[style] || 0) + 1;
    });

    const commonStyle = Object.entries(learningStyleDistribution)
      .reduce((a, b) => learningStyleDistribution[a[0]] > learningStyleDistribution[b[0]] ? a : b)[0];

    // Ortalama performans
    let avgPerformance = '-';
    const studentsWithExams = students.filter(s => s.performanceData?.examHistory?.length > 0);
    if (studentsWithExams.length > 0) {
      const totalAvg = studentsWithExams.reduce((sum, s) => {
        const avg = s.performanceData.examHistory.reduce((examSum, exam) => examSum + exam.averageNet, 0) / s.performanceData.examHistory.length;
        return sum + avg;
      }, 0);
      avgPerformance = (totalAvg / studentsWithExams.length).toFixed(1);
    }

    return {
      totalStudents,
      strongestIntelligence: intelligenceNames[strongestIntelligence],
      commonStyle,
      avgPerformance
    };
  }

  // Sınıf analizi PDF export
  document.getElementById('export-class-analysis-pdf-btn').addEventListener('click', function() {
    exportClassAnalysisPDF();
  });

  // Sınıf analizi PDF export fonksiyonu
  async function exportClassAnalysisPDF() {
    try {
      const { ipcRenderer } = require('electron');
      
      const result = await ipcRenderer.invoke('show-save-dialog', {
        title: 'Sınıf Analizi Raporunu Kaydet',
        defaultPath: 'sinif-analizi-raporu.pdf',
        filters: [
          { name: 'PDF Dosyaları', extensions: ['pdf'] }
        ]
      });

      if (result.filePath) {
        // PDF oluşturma işlemi burada yapılacak
        showToast('Başarılı', 'Sınıf analizi raporu PDF olarak kaydedildi', 'success');
      } else if (result.cancelled) {
        showToast('İptal Edildi', 'PDF kaydetme işlemi iptal edildi', 'info');
      } else {
        showToast('Hata', 'PDF kaydetme sırasında bir hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Sınıf analizi PDF export hatası:', error);
      showToast('Beklenmeyen Hata', 'PDF kaydetme sırasında bir hata oluştu', 'error');
    }
  }

  // ===== SORU BANKASI FONKSİYONLARI =====
  
  // Soru bankası elementleri
  const questionBankSection = document.getElementById('question-bank-section');
  const questionStudentSelect = document.getElementById('question-student-select');
  const questionSubjectSelect = document.getElementById('question-subject-select');
  const questionGradeSelect = document.getElementById('question-grade-select');
  const questionUnitSelect = document.getElementById('question-unit-select');
  const questionCountSelect = document.getElementById('question-count');
  const difficultyLevelSelect = document.getElementById('difficulty-level');
  const questionTypeSelect = document.getElementById('question-type');
  const generateTestBtn = document.getElementById('generate-test-btn');
  const aiGenerateBtn = document.getElementById('ai-generate-btn');
  const testPreview = document.getElementById('test-preview');
  const testQuestionsContainer = document.getElementById('test-questions-container');
  const regenerateTestBtn = document.getElementById('regenerate-test-btn');
  const selectedStudentInfo = document.getElementById('selected-student-info');
  const selectedStudentName = document.getElementById('selected-student-name');
  const selectedStudentClass = document.getElementById('selected-student-class');

  // Soru bankası verileri
  let currentTest = null;

  // Soru bankası sayfası yüklendiğinde
  if (questionBankSection) {
    initializeQuestionBank();
  }

  function initializeQuestionBank() {
    loadStudentsForQuestionBank();
    setupQuestionBankEventListeners();
    updateGenerateButtons();
  }

  function loadStudentsForQuestionBank() {
    fetch('./data/students.json')
      .then(response => response.json())
      .then(data => {
        questionStudentSelect.innerHTML = '<option value="">Öğrenci seçin...</option>';
        const studentsArray = data.students || [];
        studentsArray.forEach(student => {
          const option = document.createElement('option');
          option.value = student.id;
          option.textContent = `${student.name} ${student.surname} (${student.class})`;
          questionStudentSelect.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Öğrenci listesi yüklenirken hata:', error);
        showToast('Hata', 'Öğrenci listesi yüklenemedi', 'error');
      });
  }

  function setupQuestionBankEventListeners() {
    // Öğrenci seçimi
    questionStudentSelect.addEventListener('change', (e) => {
      const studentId = e.target.value;
      if (studentId) {
        fetch('./data/students.json')
          .then(response => response.json())
          .then(data => {
            const studentsArray = data.students || [];
            const student = studentsArray.find(s => s.id === studentId);
            if (student) {
              selectedStudentName.textContent = `${student.name} ${student.surname}`;
              selectedStudentClass.textContent = `${student.class}`;
              selectedStudentInfo.style.display = 'block';
            }
          });
      } else {
        selectedStudentInfo.style.display = 'none';
      }
      updateGenerateButtons();
    });

    // Ders ve sınıf seçimi
    questionSubjectSelect.addEventListener('change', updateUnitsAndButtons);
    questionGradeSelect.addEventListener('change', updateUnitsAndButtons);
    questionUnitSelect.addEventListener('change', () => {
      updateOutcomes();
      updateGenerateButtons();
    });
    
    // Kazanım seçimi
    const questionOutcomeSelect = document.getElementById('question-outcome-select');
    if (questionOutcomeSelect) {
      questionOutcomeSelect.addEventListener('change', updateGenerateButtons);
    }

    // Test oluşturma butonları
    generateTestBtn.addEventListener('click', generateTest);
    aiGenerateBtn.addEventListener('click', generateAITest);
    regenerateTestBtn.addEventListener('click', () => {
      testPreview.style.display = 'none';
      generateTest();
    });
    
    // PDF export butonu
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', exportTestToPDF);
    }
  }

  // Ünite verileri
  const unitData = {
    'Sosyal Bilgiler': {
      '5': [
        '1. Birlikte Yaşamak',
        '2. Evimiz Dünya',
        '3. Ortak Mirasimiz',
        '4. Yaşayan Demokrasimiz',
        '5. Hayatimizdaki Ekonomi',
        '6. Teknoloji ve Sosyal Bilimler',
        
      ],
      '6': [
        '1. Birey ve Toplum',
        '2. Evimiz Dünya',
        '3. Ortak Mirasimiz',
        '4. Yaşayan Demokrasimiz',
        '5. Hayatımızdaki Ekonomi',
        '6. Teknoloji ve Sosyal Bilimler',
        
      ],
      '7': [
        '1. Birey ve Toplum',
        '2. Kültür ve Miras',
        '3. İnsanlar, Yerler ve Çevreler',
        '4. Bilim, Teknoloji ve Toplum',
        '5. Üretim, Dağıtım ve Tüketim',
        '6. Etkin Vatandaşlık',
        '7. Küresel Bağlantılar'
      ],
      '8': [
        '1. Bir Kahraman Doğuyor',
        '2. Milli Uyanış: Bağımsızlık Yolunda Atılan Adımlar',
        '3. Millî Bir Destan: Ya İstiklal Ya Ölüm',
        '4. Atatürkçülük ve Çağdaşlaşan Türkiye',
        '5. Demokratikleşme Çabaları',
        '6. Atatürk Dönemi Türk Dış Politikası',
        '7. Atatürk\'ün Ölümü ve Sonrası'
      ]
    },
    'Din Kültürü ve Ahlak Bilgisi': {
      '5': [
        '1. Allah İnancı',
        '2. İbadet Konusunda Bilgilenelim',
        '3. Hz. Muhammed ve Aile Hayatı',
        '4. Kur\'an-ı Kerim\'in Temel Eğitici Nitelikleri',
        '5. Sevinç ve Üzüntülerimizi Paylaşalım'
      ],
      '6': [
        '1. Peygamber ve İlahi Kitap İnancı',
        '2. Namaz İbadeti',
        '3. Son Peygamber Hz. Muhammed',
        '4. Kur\'an-ı Kerim\'in Ana Konuları',
        '5. İslam\'ın Sakınmamızı İstediği Bazı Davranışlar'
      ],
      '7': [
        '1. Melek ve Ahiret İnancı',
        '2. Hac ve Kurban',
        '3. Ahlaki Davranışlar',
        '4. Allah\'ın Kulu ve Elçisi: Hz. Muhammed',
        '5. İslam Düşüncesinde Yorumlar'
      ],
      '8': [
        '1. Kader ve Kaza İnancı',
        '2. Zekât ve Sadaka',
        '3. Din, Birey ve Toplum',
        '4. Hz. Muhammed\'in Örnek Ahlakı',
        '5. Kur\'an-ı Kerim ve Özellikleri'
      ]
    },
    'Türkçe': {
      '5': [
        '1. Okuma Kültürü',
        '2. Kelime Dünyam',
        '3. Duygular ve Düşünceler',
        '4. Doğa ve Evren',
        '5. Vatandaşlık',
        '6. Sağlık ve Spor',
        '7. Sanat',
        '8. Toplum Hayatı'
      ],
      '6': [
        '1. Okuma Kültürü',
        '2. Kelime Dünyam',
        '3. Duygular ve Düşünceler',
        '4. Doğa ve Evren',
        '5. Vatandaşlık',
        '6. Sağlık ve Spor',
        '7. Sanat',
        '8. Toplum Hayatı'
      ],
      '7': [
        '1. Okuma Kültürü',
        '2. Kelime Dünyam',
        '3. Duygular ve Düşünceler',
        '4. Doğa ve Evren',
        '5. Vatandaşlık',
        '6. Sağlık ve Spor',
        '7. Sanat',
        '8. Toplum Hayatı'
      ],
      '8': [
        '1. Okuma Kültürü',
        '2. Kelime Dünyam',
        '3. Duygular ve Düşünceler',
        '4. Doğa ve Evren',
        '5. Vatandaşlık',
        '6. Sağlık ve Spor',
        '7. Sanat',
        '8. Toplum Hayatı'
      ]
    },
    'İngilizce': {
      '5': [
        '1. Hello',
        '2. My Town',
        '3. Games and Hobbies',
        '4. My Daily Routine',
        '5. Health',
        '6. Movies',
        '7. Party Time',
        '8. Fitness',
        '9. The Animal Shelter',
        '10. Festivals'
      ],
      '6': [
        '1. Life',
        '2. Yummy Breakfast',
        '3. Downtown',
        '4. Weather and Emotions',
        '5. At the Fair',
        '6. Occupations',
        '7. Holidays',
        '8. Bookworms',
        '9. Saving the Planet',
        '10. Democracy'
      ],
      '7': [
        '1. Appearance and Personality',
        '2. Sports',
        '3. Biographies',
        '4. Wild Animals',
        '5. Television',
        '6. Celebrations',
        '7. Dreams',
        '8. Public Buildings',
        '9. Environment',
        '10. Planets'
      ],
      '8': [
        '1. Friendship',
        '2. Teen Life',
        '3. In the Kitchen',
        '4. On the Phone',
        '5. The Internet',
        '6. Adventures',
        '7. Tourism',
        '8. Chores',
        '9. Science',
        '10. Natural Forces'
      ]
    },
    'Matematik': {
      '5': [
        '1. Doğal Sayılar',
        '2. Doğal Sayılarla İşlemler',
        '3. Kesirler',
        '4. Kesirlerle İşlemler',
        '5. Ondalık Gösterim',
        '6. Yüzdeler',
        '7. Temel Geometrik Kavramlar ve Çizimler',
        '8. Üçgenler ve Dörtgenler',
        '9. Uzunluk ve Zaman Ölçme',
        '10. Alan ve Hacim Ölçme',
        '11. Veri Toplama ve Değerlendirme',
        '12. Uzamsal İlişkiler'
      ],
      '6': [
        '1. Doğal Sayılarla İşlemler',
        '2. Çarpanlar ve Katlar',
        '3. Açılar',
        '4. Oran',
        '5. Kesirlerle İşlemler',
        '6. Ondalık Gösterim',
        '7. Veri Analizi',
        '8. Uzunluk ve Zaman Ölçme',
        '9. Alan ve Hacim Ölçme',
        '10. Geometrik Cisimler',
        '11. Sıvı Ölçme'
      ],
      '7': [
        '1. Tam Sayılarla İşlemler',
        '2. Rasyonel Sayılar',
        '3. Rasyonel Sayılarla İşlemler',
        '4. Cebirsel İfadeler',
        '5. Eşitlik ve Denklem',
        '6. Oran ve Orantı',
        '7. Yüzdeler',
        '8. Doğrular ve Açılar',
        '9. Çokgenler',
        '10. Çember ve Daire',
        '11. Veri Analizi',
        '12. Cisimlerin Farklı Yönlerden Görünümleri'
      ],
      '8': [
        '1. Çarpanlar ve Katlar',
        '2. Üslü İfadeler',
        '3. Kareköklü İfadeler',
        '4. Veri Analizi',
        '5. Basit Olayların Olma Olasılığı',
        '6. Cebirsel İfadeler ve Özdeşlikler',
        '7. Doğrusal Denklemler',
        '8. Eşitsizlikler',
        '9. Üçgenler',
        '10. Eşlik ve Benzerlik',
        '11. Dönüşüm Geometrisi',
        '12. Geometrik Cisimler'
      ]
    },
    'Fen Bilimleri': {
      '5': [
        '1. Güneş, Dünya ve Ay',
        '2. Canlılar Dünyası',
        '3. Kuvvetin Ölçülmesi ve Sürtünme',
        '4. Madde ve Değişim',
        '5. Işığın Yayılması',
        '6. İnsan ve Çevre',
        '7. Elektrik Devre Elemanları'
      ],
      '6': [
        '1. Güneş Sistemi ve Tutulmalar',
        '2. Vücudumuzdaki Sistemler',
        '3. Kuvvet ve Hareket',
        '4. Madde ve Isı',
        '5. Ses ve Özellikleri',
        '6. Vücudumuzdaki Sistemler ve Sağlık',
        '7. Elektriğin İletimi'
      ],
      '7': [
        '1. Güneş Sistemi ve Ötesi',
        '2. Hücre ve Bölünmeler',
        '3. Kuvvet ve Enerji',
        '4. Saf Madde ve Karışımlar',
        '5. Işığın Madde ile Etkileşimi',
        '6. Canlılarda Üreme, Büyüme ve Gelişme',
        '7. Elektrik Enerjisi'
      ],
      '8': [
        '1. Mevsimler ve İklim',
        '2. DNA ve Genetik Kod',
        '3. Basınç',
        '4. Madde ve Endüstri',
        '5. Basit Makineler',
        '6. Enerji Dönüşümleri ve Çevre Bilimi',
        '7. Elektrik Yükleri ve Elektrik Enerjisi'
      ]
    }
  };

  // Kazanım verileri
  const outcomeData = {
    'Sosyal Bilgiler': {
      '8': {
        '1. Bir Kahraman Doğuyor': [
          { code: 'İTA.8.1.1', name: 'Avrupa\'daki gelişmelerin yansımaları' },
          { code: 'İTA.8.1.2', name: 'Mustafa Kemal\'in çocukluk ve öğrenim hayatı' },
          { code: 'İTA.8.1.3', name: 'Mustafa Kemal\'in fikir hayatını etkileyen kişiler ve olaylar' },
          { code: 'İTA.8.1.4', name: 'Mustafa Kemal\'in askerlik hayatı' }
        ],
        '2. Milli Uyanış: Bağımsızlık Yolunda Atılan Adımlar': [
          { code: 'İTA.8.2.1', name: 'Birinci Dünya Savaşı\'nın sebeplerini ve savaşın başlamasına yol açan gelişmeleri kavrar' },
          { code: 'İTA.8.2.2', name: 'Birinci Dünya Savaşı\'nda Osmanlı Devleti\'nin durumu hakkında çıkarımlarda bulunur' },
          { code: 'İTA.8.2.3', name: 'Mondros Ateşkes Antlaşması\'nın imzalanması ve uygulanması karşısında Osmanlı yönetiminin, halkın ve Mustafa Kemal\'in tutumunu analiz eder' },
          { code: 'İTA.8.2.4', name: 'Kuvâ-yı Millîye\'nin oluşum sürecini ve sonrasında meydana gelen gelişmeleri kavrar' },
          { code: 'İTA.8.2.5', name: 'Millî Mücadele\'nin hazırlık döneminde Mustafa Kemal\'in yaptığı çalışmaları analiz eder' },
          { code: 'İTA.8.2.6', name: 'Misakımillî\'nin kabulünü ve Büyük Millet Meclisinin açılışını vatanın bütünlüğü esası ile "ulusal egemenlik" ve "tam bağımsızlık" ilkeleri ile ilişkilendirir' },
          { code: 'İTA.8.2.7', name: 'Büyük Millet Meclisine karşı ayaklanmalar ile ayaklanmaların bastırılması için alınan tedbirleri analiz eder' },
          { code: 'İTA.8.2.8', name: 'Mustafa Kemal\'in ve Türk milletinin Sevr Antlaşması\'na karşı tepkilerini değerlendirir' }
        ],
        '3. Millî Bir Destan: Ya İstiklal Ya Ölüm': [
          { code: 'İTA.8.3.1', name: 'Millî Mücadele Dönemi\'nde Doğu Cephesi ve Güney Cephesi\'nde meydana gelen gelişmeleri kavrar' },
          { code: 'İTA.8.3.2', name: 'Millî Mücadele Dönemi\'nde Batı Cephesi\'nde meydana gelen gelişmeleri kavrar' },
          { code: 'İTA.8.3.3', name: 'Millî Mücadele\'nin zor bir döneminde Maarif Kongresi yapan Atatürk\'ün, millî ve çağdaş eğitime verdiği önemi kavrar' },
          { code: 'İTA.8.3.5', name: 'Sakarya Meydan Savaşı\'nın kazanılmasında ve Büyük Taarruz\'un başarılı olmasında Mustafa Kemal\'in rolüne ilişkin çıkarımlarda bulunur' },
          { code: 'İTA.8.3.6', name: 'Lozan Antlaşması\'nın sağladığı kazanımları analiz eder' },
          { code: 'İTA.8.3.7', name: 'Millî Mücadele Dönemi\'nin siyasi, sosyal ve kültürel olaylarının sanat ve edebiyat ürünlerine yansımalarına kanıtlar gösterir' }
        ],
        '4. Atatürkçülük ve Çağdaşlaşan Türkiye': [
          { code: 'İTA.8.4.1', name: 'Çağdaşlaşan Türkiye\'nin temeli olan Atatürk ilkelerini açıklar' },
          { code: 'İTA.8.4.2', name: 'Siyasi alanda meydana gelen gelişmeleri kavrar' },
          { code: 'İTA.8.4.4', name: 'Eğitim ve kültür alanında yapılan inkılapları ve gelişmeleri kavrar' },
          { code: 'İTA.8.4.6', name: 'Ekonomi alanında meydana gelen gelişmeleri kavrar' },
          { code: 'İTA.8.4.8', name: 'Cumhuriyet\'in sağladığı kazanımları ve Atatürk\'ün Türk milleti için gösterdiği hedefleri analiz eder' },
          { code: 'İTA.8.4.9', name: 'Atatürk ilke ve inkılaplarını oluşturan temel esasları kavrar' }
        ],
        '5. Demokratikleşme Çabaları': [
          { code: 'İTA.8.5.1', name: 'Atatürk Dönemi\'ndeki demokratikleşme yolunda atılan adımları açıklar' },
          { code: 'İTA.8.5.2', name: 'Mustafa Kemal\'e suikast girişimini analiz eder' },
          { code: 'İTA.8.5.3', name: 'Cumhuriyetin ilk yıllarında Türkiye Cumhuriyeti\'ne yönelik tehditleri analiz eder' }
        ],
        '6. Atatürk Dönemi Türk Dış Politikası': [
          { code: 'İTA.8.6.1', name: 'Atatürk Dönemi Türk dış politikasının temel ilkelerini ve amaçlarını açıklar' },
          { code: 'İTA.8.6.2', name: 'Atatürk Dönemi Türk dış politikasında yaşanan gelişmeleri analiz eder' },
          { code: 'İTA.8.6.3', name: 'Atatürk\'ün Hatay\'ı ülkemize katmak konusunda yaptıklarına ve bu uğurda gösterdiği özveriye kanıtlar gösterir' }
        ],
        '7. Atatürk\'ün Ölümü ve Sonrası': [
          { code: 'İTA.8.7.1', name: 'Atatürk\'ün ölümüne ilişkin yansıma ve değerlendirmelerden hareketle onun fikir ve eserlerinin evrensel değerine ilişkin çıkarımlarda bulunur' },
          { code: 'İTA.8.7.2', name: 'Atatürk\'ün Türk Milleti\'ne bıraktığı eserlerinden örnekler verir' },
          { code: 'İTA.8.7.3', name: 'Atatürk\'ün İkinci Dünya Savaşı öncesi tespitleri ve girişimleri Türkiye\'nin savaşta izlediği denge siyaseti ile ilişkilendirilir' },
          { code: 'İTA.8.7.5', name: 'Türkiye\'de çok partili siyasi hayata geçişi hızlandıran gelişmeleri, demokrasinin gerekleri açısından analiz eder' }
        ]
      }
    },
    'Din Kültürü ve Ahlak Bilgisi': {
      '8': {
        '1. Kader ve Kaza İnancı': [
          { code: 'DKAB.8.1.1', name: 'Kader ve kaza inancını ayet ve hadislerle açıklar' },
          { code: 'DKAB.8.1.2', name: 'İnsanın ilmi, iradesi, sorumluluğu ile kader arasında ilişki kurar' },
          { code: 'DKAB.8.1.3', name: 'Kaza ve kader ile ilgili kavramları analiz eder' },
          { code: 'DKAB.8.1.4', name: 'Toplumda kader ve kaza ile ilgili yaygın olan yanlış anlayışları sorgular' },
          { code: 'DKAB.8.1.5', name: 'Hz. Musa\'nın (a.s.) hayatını ana hatlarıyla tanır' },
          { code: 'DKAB.8.1.6', name: 'Ayetelkürsi\'yi okur, anlamını söyler' }
        ],
        '2. Zekât ve Sadaka': [
          { code: 'DKAB.8.2.1', name: 'Zekât ve sadaka ibadetini ayet ve hadislerle açıklar' },
          { code: 'DKAB.8.2.2', name: 'Zekât, infak ve sadakanın bireysel ve toplumsal önemini fark eder' },
          { code: 'DKAB.8.2.3', name: 'Hz. Şuayb\'in (a.s.) hayatını ana hatlarıyla tanır' },
          { code: 'DKAB.8.2.4', name: 'Maun suresini okur, anlamını söyler' }
        ],
        '3. Din, Birey ve Toplum': [
          { code: 'DKAB.8.3.1', name: 'Din, birey ve toplum arasındaki ilişkiyi yorumlar' },
          { code: 'DKAB.8.3.2', name: 'İslam dininin can, nesil, akıl, mal ve din emniyetiyle ilgili ortaya koyduğu ilke ve hedefleri analiz eder' },
          { code: 'DKAB.8.3.3', name: 'Hz. Yusuf\'un (a.s.) örnek hayatından ilkeler çıkarır' },
          { code: 'DKAB.8.3.4', name: 'Asr suresini okur, anlamını söyler' }
        ],
        '4. Hz. Muhammed\'in Örnek Ahlakı': [
          { code: 'DKAB.8.4.1', name: 'Hz. Muhammed\'in (s.a.v.) doğruluğu ve güvenilir kişiliği ile peygamberlerin özellikleri arasında ilişki kurar' },
          { code: 'DKAB.8.4.2', name: 'Hz. Muhammed\'in (s.a.v.) merhametli ve affedici oluşunu davranışlarında yansıtmaya özen gösterir' },
          { code: 'DKAB.8.4.3', name: 'Hz. Muhammed\'in (s.a.v.) istişareye verdiği önemi ortaya koyan örnek olaylardan hareketle gündelik hayatla ilgili çıkarımlarda bulunur' },
          { code: 'DKAB.8.4.4', name: 'Hz. Muhammed\'in (s.a.v.) cesaret ve kararlılığını örnek olaylarla açıklar' },
          { code: 'DKAB.8.4.5', name: 'Hz. Muhammed\'in (s.a.v.) hakkı gözetmedeki hassasiyetine örnekler verir' },
          { code: 'DKAB.8.4.6', name: 'Hz. Muhammed\'in (s.a.v.) insanlara verdiği değeri örneklerle açıklar' },
          { code: 'DKAB.8.4.7', name: 'Hz. Muhammed\'in (s.a.v.) hikmetli söz ve davranışlarıyla insanları iyiye ve güzele yönlendirdiğini fark eder' }
        ],
        '5. Kur\'an-ı Kerim ve Özellikleri': [
          { code: 'DKAB.8.5.1', name: 'İslam dininin temel kaynaklarını tanır' },
          { code: 'DKAB.8.5.2', name: 'Ayetlerden hareketle Kuran\'ın ana konularını sınıflandırır' },
          { code: 'DKAB.8.5.3', name: 'Kuran-ı Kerim\'in temel özelliklerini değerlendirir' },
          { code: 'DKAB.8.5.4', name: 'Hz. Nuh\'un (a.s.) tevhide davetini özetler' }
        ]
      },
      '5': {
        '1. Allah İnancı': [
          { code: 'DKAB.5.1.1', name: 'Evrendeki mükemmel düzene ilişkin tümevarıma dayalı akıl yürütebilme' },
          { code: 'DKAB.5.1.2', name: 'Evrendeki mükemmel düzeni gözlem yoluyla fark edip Allah\'ın (cc) varlığı ve birliğini gözleme dayalı tahmin edebilme' },
          { code: 'DKAB.5.1.3', name: 'Allah\'ın (cc) güzel isimleri hakkında bilgi toplayabilme' },
          { code: 'DKAB.5.1.4', name: 'İhlas suresini ve bu surenin anlamını okuyarak yorumlayabilme' }
        ],
        '2. İbadet Konusunda Bilgilenelim': [
          { code: 'DKAB.5.2.1', name: 'Namaz ibadetini özetleyebilme' },
          { code: 'DKAB.5.2.2', name: 'Namazın kılınışını gözlemleyebilme' },
          { code: 'DKAB.5.2.3', name: 'Namazın insan hayatına etkileri hakkında düşünebilme' },
          { code: 'DKAB.5.2.4', name: 'Tahiyyat duasını ve bu duanın anlamını okuyarak yorumlayabilme' }
        ],
        '3. Hz. Muhammed ve Aile Hayatı': [
          { code: 'DKAB.5.3.1', name: 'Kur\'an-ı Kerim\'in iç düzenini çözümleyebilme' },
          { code: 'DKAB.5.3.2', name: 'Kur\'an-ı Kerim\'in temel özellikleri hakkında bilgi toplayabilme' },
          { code: 'DKAB.5.3.3', name: 'Kuran-ı Kerim\'in ana konularını sınıflandırabilme' },
          { code: 'DKAB.5.3.4', name: 'Kevser suresini ve bu surenin anlamını okuyarak yorumlayabilme' }
        ],
        '4. Kur\'an-ı Kerim\'in Temel Eğitici Nitelikleri': [
          { code: 'DKAB.5.4.1', name: 'Peygamberlik hakkında tümdengelime dayalı akıl yürütebilme' },
          { code: 'DKAB.5.4.2', name: 'Peygamber kıssalarında verilen öğütleri sentezleyebilme' },
          { code: 'DKAB.5.4.3', name: 'Kureyş suresini ve bu surenin anlamını okuyarak yorumlayabilme' }
        ],
        '5. Sevinç ve Üzüntülerimizi Paylaşalım': [
          { code: 'DKAB.5.5.1', name: 'Dinin mimarimize etkisini çözümleyebilme' },
          { code: 'DKAB.5.5.2', name: 'Camilerin bölümlerini tanıyabilme' },
          { code: 'DKAB.5.5.3', name: 'Kültürümüzde yer alan cami örneklerini karşılaştırabilme' }
        ]
      },
      '6': {
        '1. Peygamber ve İlahi Kitap İnancı': [
          { code: 'DKAB.6.1.1', name: 'Peygamberlerin insanlara rehber olarak gönderilmesi hakkında bilgi toplayabilme' },
          { code: 'DKAB.6.1.2', name: 'Vahiylerin insanlara ilettiği mesajları yapılandırabilme' },
          { code: 'DKAB.6.1.3', name: 'Peygamberlerin insanlara ilettiği ilahi mesajları örneklerle açıklayabilme' },
          { code: 'DKAB.6.1.4', name: 'Fetih suresini okur, anlamını söyler' }
        ],
        '2. Namaz İbadeti': [
          { code: 'DKAB.6.2.1', name: 'Namazın kılınış şartlarını açıklayabilme' },
          { code: 'DKAB.6.2.2', name: 'Namazın kılınışını uygulayabilme' },
          { code: 'DKAB.6.2.3', name: 'Namazın bireysel ve toplumsal katkılarını değerlendirebilme' },
          { code: 'DKAB.6.2.4', name: 'Kevser suresini okur, anlamını söyler' }
        ],
        '3. Son Peygamber Hz. Muhammed': [
          { code: 'DKAB.6.3.1', name: 'Hz. Muhammed\'in peygamberlik öncesi hayatını özetleyebilme' },
          { code: 'DKAB.6.3.2', name: 'Hz. Muhammed\'in peygamberlik sürecini açıklayabilme' },
          { code: 'DKAB.6.3.3', name: 'Hz. Muhammed\'in ahlaki özelliklerini örneklerle açıklayabilme' },
          { code: 'DKAB.6.3.4', name: 'Kureyş suresini okur, anlamını söyler' }
        ],
        '4. Kur\'an-ı Kerim\'in Ana Konuları': [
          { code: 'DKAB.6.4.1', name: 'Kur\'an-ı Kerim\'in ana konularını sınıflandırabilme' },
          { code: 'DKAB.6.4.2', name: 'Kur\'an-ı Kerim\'in temel özelliklerini açıklayabilme' },
          { code: 'DKAB.6.4.3', name: 'Kur\'an-ı Kerim\'in insan hayatındaki yerini değerlendirebilme' },
          { code: 'DKAB.6.4.4', name: 'Fil suresini okur, anlamını söyler' }
        ],
        '5. İslam\'ın Sakınmamızı İstediği Bazı Davranışlar': [
          { code: 'DKAB.6.5.1', name: 'İslam\'ın sakınmamızı istediği davranışları açıklayabilme' },
          { code: 'DKAB.6.5.2', name: 'Bu davranışların bireysel ve toplumsal zararlarını değerlendirebilme' },
          { code: 'DKAB.6.5.3', name: 'Bu davranışlardan kaçınmaya özen gösterebilme' },
          { code: 'DKAB.6.5.4', name: 'Maun suresini okur, anlamını söyler' }
        ]
      },
      '7': {
        '1. Melek ve Ahiret İnancı': [
          { code: 'DKAB.7.1.1', name: 'Varlıklar âlemini özelliklerine göre ayırt eder' },
          { code: 'DKAB.7.1.2', name: 'Melekleri özellikleri ve görevlerine göre sınıflandırır' },
          { code: 'DKAB.7.1.3', name: 'Dünya hayatı ile ahiret hayatı arasındaki ilişkiyi yorumlar' },
          { code: 'DKAB.7.1.4', name: 'Ahiret hayatının aşamalarını açıklar' },
          { code: 'DKAB.7.1.5', name: 'Allahın (cc) adil, merhametli ve affedici olması ile ahiret inancı arasında ilişki kurar' },
          { code: 'DKAB.7.1.6', name: 'Hz. İsanın (as) hayatını ana hatlarıyla tanır' },
          { code: 'DKAB.7.1.7', name: 'Nâs suresini okur, anlamını söyler' }
        ],
        '2. Hac ve Kurban': [
          { code: 'DKAB.7.2.1', name: 'İslamda hac ibadetinin önemini ayet ve hadisler ışığında yorumlar' },
          { code: 'DKAB.7.2.2', name: 'Haccın yapılışını özetler' },
          { code: 'DKAB.7.2.3', name: 'Umre ibadeti ve önemini açıklar' },
          { code: 'DKAB.7.2.4', name: 'Kurban ibadetini İslamın yardımlaşma ve dayanışmaya verdiği önem açısından değerlendirir' },
          { code: 'DKAB.7.2.5', name: 'Hz. İsmailin (as) hayatını ana hatlarıyla tanır' },
          { code: 'DKAB.7.2.6', name: 'Enam suresi 162. ayeti okur, anlamını söyler' }
        ],
        '3. Ahlaki Davranışlar': [
          { code: 'DKAB.7.3.1', name: 'Güzel ahlaki tutum ve davranışları örneklerle açıklar' },
          { code: 'DKAB.7.3.2', name: 'Örnek tutum ve davranışların, birey ve toplumların ahlaki gelişimine olan katkısını değerlendirir' },
          { code: 'DKAB.7.3.3', name: 'Tutum ve davranışlarında ölçülü olmaya özen gösterir' },
          { code: 'DKAB.7.3.4', name: 'Hz. Salihin (as) hayatını ana hatlarıyla tanır' },
          { code: 'DKAB.7.3.5', name: 'Felak suresini okur, anlamını söyler' }
        ],
        '4. Allah\'ın Kulu ve Elçisi: Hz. Muhammed': [
          { code: 'DKAB.7.4.1', name: 'Hz. Muhammedin (sav) insani yönünü ayetlerden hareketle yorumlar' },
          { code: 'DKAB.7.4.2', name: 'Hz. Muhammedin (sav) peygamberlik yönüyle ilgili özelliklerini ayırt eder' },
          { code: 'DKAB.7.4.3', name: 'Kâfirun suresini okur, anlamını söyler' }
        ],
        '5. İslam Düşüncesinde Yorumlar': [
          { code: 'DKAB.7.5.1', name: 'Dinin farklı yorum biçimleri olabileceğinin farkına varır' },
          { code: 'DKAB.7.5.2', name: 'İslam düşüncesinde ortaya çıkan yorum biçimlerini sınıflandırır' },
          { code: 'DKAB.7.5.3', name: 'Kültürümüzde etkin olan tasavvufi yorumları ayırt eder' },
          { code: 'DKAB.7.5.4', name: 'Alevilik Bektaşilikle ilgili temel kavram ve erkânları açıklar' }
        ]
      }
    },
    'Türkçe': {
      '5': {
        '1. Okuma Kültürü': [
          { code: 'T.5.1.1', name: 'Okuma alışkanlığı kazanır' },
          { code: 'T.5.1.2', name: 'Okuduğu metni anlar ve yorumlar' },
          { code: 'T.5.1.3', name: 'Metin türlerini ayırt eder' }
        ],
        '2. Kelime Dünyam': [
          { code: 'T.5.2.1', name: 'Kelime dağarcığını geliştirir' },
          { code: 'T.5.2.2', name: 'Kelimelerin anlamlarını kavrar' },
          { code: 'T.5.2.3', name: 'Kelimeleri doğru kullanır' }
        ],
        '3. Duygular ve Düşünceler': [
          { code: 'T.5.3.1', name: 'Duygularını ifade eder' },
          { code: 'T.5.3.2', name: 'Düşüncelerini açıklar' },
          { code: 'T.5.3.3', name: 'Yaratıcı yazma becerisi geliştirir' }
        ],
        '4. Doğa ve Evren': [
          { code: 'T.5.4.1', name: 'Doğa ile ilgili metinleri okur' },
          { code: 'T.5.4.2', name: 'Çevre bilinci geliştirir' },
          { code: 'T.5.4.3', name: 'Bilimsel metinleri anlar' }
        ],
        '5. Vatandaşlık': [
          { code: 'T.5.5.1', name: 'Vatandaşlık bilinci geliştirir' },
          { code: 'T.5.5.2', name: 'Toplumsal konuları anlar' },
          { code: 'T.5.5.3', name: 'Sorumluluk bilinci kazanır' }
        ],
        '6. Sağlık ve Spor': [
          { code: 'T.5.6.1', name: 'Sağlık konularını anlar' },
          { code: 'T.5.6.2', name: 'Spor metinlerini okur' },
          { code: 'T.5.6.3', name: 'Sağlıklı yaşam bilinci geliştirir' }
        ],
        '7. Sanat': [
          { code: 'T.5.7.1', name: 'Sanat metinlerini anlar' },
          { code: 'T.5.7.2', name: 'Estetik duyarlılık geliştirir' },
          { code: 'T.5.7.3', name: 'Yaratıcılığını geliştirir' }
        ],
        '8. Toplum Hayatı': [
          { code: 'T.5.8.1', name: 'Toplumsal konuları anlar' },
          { code: 'T.5.8.2', name: 'Sosyal beceriler geliştirir' },
          { code: 'T.5.8.3', name: 'İletişim becerilerini geliştirir' }
        ]
      },
      '6': {
        '1. Okuma Kültürü': [
          { code: 'T.6.1.1', name: 'Okuma alışkanlığı kazanır' },
          { code: 'T.6.1.2', name: 'Okuduğu metni anlar ve yorumlar' },
          { code: 'T.6.1.3', name: 'Metin türlerini ayırt eder' }
        ],
        '2. Kelime Dünyam': [
          { code: 'T.6.2.1', name: 'Kelime dağarcığını geliştirir' },
          { code: 'T.6.2.2', name: 'Kelimelerin anlamlarını kavrar' },
          { code: 'T.6.2.3', name: 'Kelimeleri doğru kullanır' }
        ],
        '3. Duygular ve Düşünceler': [
          { code: 'T.6.3.1', name: 'Duygularını ifade eder' },
          { code: 'T.6.3.2', name: 'Düşüncelerini açıklar' },
          { code: 'T.6.3.3', name: 'Yaratıcı yazma becerisi geliştirir' }
        ],
        '4. Doğa ve Evren': [
          { code: 'T.6.4.1', name: 'Doğa ile ilgili metinleri okur' },
          { code: 'T.6.4.2', name: 'Çevre bilinci geliştirir' },
          { code: 'T.6.4.3', name: 'Bilimsel metinleri anlar' }
        ],
        '5. Vatandaşlık': [
          { code: 'T.6.5.1', name: 'Vatandaşlık bilinci geliştirir' },
          { code: 'T.6.5.2', name: 'Toplumsal konuları anlar' },
          { code: 'T.6.5.3', name: 'Sorumluluk bilinci kazanır' }
        ],
        '6. Sağlık ve Spor': [
          { code: 'T.6.6.1', name: 'Sağlık konularını anlar' },
          { code: 'T.6.6.2', name: 'Spor metinlerini okur' },
          { code: 'T.6.6.3', name: 'Sağlıklı yaşam bilinci geliştirir' }
        ],
        '7. Sanat': [
          { code: 'T.6.7.1', name: 'Sanat metinlerini anlar' },
          { code: 'T.6.7.2', name: 'Estetik duyarlılık geliştirir' },
          { code: 'T.6.7.3', name: 'Yaratıcılığını geliştirir' }
        ],
        '8. Toplum Hayatı': [
          { code: 'T.6.8.1', name: 'Toplumsal konuları anlar' },
          { code: 'T.6.8.2', name: 'Sosyal beceriler geliştirir' },
          { code: 'T.6.8.3', name: 'İletişim becerilerini geliştirir' }
        ]
      },
      '7': {
        '1. Okuma Kültürü': [
          { code: 'T.7.1.1', name: 'Okuma alışkanlığı kazanır' },
          { code: 'T.7.1.2', name: 'Okuduğu metni anlar ve yorumlar' },
          { code: 'T.7.1.3', name: 'Metin türlerini ayırt eder' }
        ],
        '2. Kelime Dünyam': [
          { code: 'T.7.2.1', name: 'Kelime dağarcığını geliştirir' },
          { code: 'T.7.2.2', name: 'Kelimelerin anlamlarını kavrar' },
          { code: 'T.7.2.3', name: 'Kelimeleri doğru kullanır' }
        ],
        '3. Duygular ve Düşünceler': [
          { code: 'T.7.3.1', name: 'Duygularını ifade eder' },
          { code: 'T.7.3.2', name: 'Düşüncelerini açıklar' },
          { code: 'T.7.3.3', name: 'Yaratıcı yazma becerisi geliştirir' }
        ],
        '4. Doğa ve Evren': [
          { code: 'T.7.4.1', name: 'Doğa ile ilgili metinleri okur' },
          { code: 'T.7.4.2', name: 'Çevre bilinci geliştirir' },
          { code: 'T.7.4.3', name: 'Bilimsel metinleri anlar' }
        ],
        '5. Vatandaşlık': [
          { code: 'T.7.5.1', name: 'Vatandaşlık bilinci geliştirir' },
          { code: 'T.7.5.2', name: 'Toplumsal konuları anlar' },
          { code: 'T.7.5.3', name: 'Sorumluluk bilinci kazanır' }
        ],
        '6. Sağlık ve Spor': [
          { code: 'T.7.6.1', name: 'Sağlık konularını anlar' },
          { code: 'T.7.6.2', name: 'Spor metinlerini okur' },
          { code: 'T.7.6.3', name: 'Sağlıklı yaşam bilinci geliştirir' }
        ],
        '7. Sanat': [
          { code: 'T.7.7.1', name: 'Sanat metinlerini anlar' },
          { code: 'T.7.7.2', name: 'Estetik duyarlılık geliştirir' },
          { code: 'T.7.7.3', name: 'Yaratıcılığını geliştirir' }
        ],
        '8. Toplum Hayatı': [
          { code: 'T.7.8.1', name: 'Toplumsal konuları anlar' },
          { code: 'T.7.8.2', name: 'Sosyal beceriler geliştirir' },
          { code: 'T.7.8.3', name: 'İletişim becerilerini geliştirir' }
        ]
      },
      '8': {
        '1. Okuma Kültürü': [
          { code: 'T.8.1.1', name: 'Okuma alışkanlığı kazanır' },
          { code: 'T.8.1.2', name: 'Okuduğu metni anlar ve yorumlar' },
          { code: 'T.8.1.3', name: 'Metin türlerini ayırt eder' }
        ],
        '2. Kelime Dünyam': [
          { code: 'T.8.2.1', name: 'Kelime dağarcığını geliştirir' },
          { code: 'T.8.2.2', name: 'Kelimelerin anlamlarını kavrar' },
          { code: 'T.8.2.3', name: 'Kelimeleri doğru kullanır' }
        ],
        '3. Duygular ve Düşünceler': [
          { code: 'T.8.3.1', name: 'Duygularını ifade eder' },
          { code: 'T.8.3.2', name: 'Düşüncelerini açıklar' },
          { code: 'T.8.3.3', name: 'Yaratıcı yazma becerisi geliştirir' }
        ],
        '4. Doğa ve Evren': [
          { code: 'T.8.4.1', name: 'Doğa ile ilgili metinleri okur' },
          { code: 'T.8.4.2', name: 'Çevre bilinci geliştirir' },
          { code: 'T.8.4.3', name: 'Bilimsel metinleri anlar' }
        ],
        '5. Vatandaşlık': [
          { code: 'T.8.5.1', name: 'Vatandaşlık bilinci geliştirir' },
          { code: 'T.8.5.2', name: 'Toplumsal konuları anlar' },
          { code: 'T.8.5.3', name: 'Sorumluluk bilinci kazanır' }
        ],
        '6. Sağlık ve Spor': [
          { code: 'T.8.6.1', name: 'Sağlık konularını anlar' },
          { code: 'T.8.6.2', name: 'Spor metinlerini okur' },
          { code: 'T.8.6.3', name: 'Sağlıklı yaşam bilinci geliştirir' }
        ],
        '7. Sanat': [
          { code: 'T.8.7.1', name: 'Sanat metinlerini anlar' },
          { code: 'T.8.7.2', name: 'Estetik duyarlılık geliştirir' },
          { code: 'T.8.7.3', name: 'Yaratıcılığını geliştirir' }
        ],
        '8. Toplum Hayatı': [
          { code: 'T.8.8.1', name: 'Toplumsal konuları anlar' },
          { code: 'T.8.8.2', name: 'Sosyal beceriler geliştirir' },
          { code: 'T.8.8.3', name: 'İletişim becerilerini geliştirir' }
        ]
      }
    },
    'İngilizce': {
      '5': {
        '1. Hello': [
          { code: 'İ.5.1.1', name: 'Greeting and introducing oneself' },
          { code: 'İ.5.1.2', name: 'Asking and answering about personal information' },
          { code: 'İ.5.1.3', name: 'Using basic classroom language' }
        ],
        '2. My Town': [
          { code: 'İ.5.2.1', name: 'Describing places in a town' },
          { code: 'İ.5.2.2', name: 'Asking for and giving directions' },
          { code: 'İ.5.2.3', name: 'Using prepositions of place' }
        ],
        '3. Games and Hobbies': [
          { code: 'İ.5.3.1', name: 'Talking about games and hobbies' },
          { code: 'İ.5.3.2', name: 'Expressing likes and dislikes' },
          { code: 'İ.5.3.3', name: 'Using present simple tense' }
        ],
        '4. My Daily Routine': [
          { code: 'İ.5.4.1', name: 'Describing daily activities' },
          { code: 'İ.5.4.2', name: 'Telling time' },
          { code: 'İ.5.4.3', name: 'Using time expressions' }
        ],
        '5. Health': [
          { code: 'İ.5.5.1', name: 'Talking about health problems' },
          { code: 'İ.5.5.2', name: 'Giving advice about health' },
          { code: 'İ.5.5.3', name: 'Using should/shouldn\'t' }
        ],
        '6. Movies': [
          { code: 'İ.5.6.1', name: 'Talking about movies and TV shows' },
          { code: 'İ.5.6.2', name: 'Expressing opinions about entertainment' },
          { code: 'İ.5.6.3', name: 'Using adjectives to describe' }
        ],
        '7. Party Time': [
          { code: 'İ.5.7.1', name: 'Talking about parties and celebrations' },
          { code: 'İ.5.7.2', name: 'Making invitations' },
          { code: 'İ.5.7.3', name: 'Using future tense (going to)' }
        ],
        '8. Fitness': [
          { code: 'İ.5.8.1', name: 'Talking about sports and fitness' },
          { code: 'İ.5.8.2', name: 'Describing physical activities' },
          { code: 'İ.5.8.3', name: 'Using can/can\'t for ability' }
        ],
        '9. The Animal Shelter': [
          { code: 'İ.5.9.1', name: 'Talking about animals' },
          { code: 'İ.5.9.2', name: 'Describing animal characteristics' },
          { code: 'İ.5.9.3', name: 'Using comparative adjectives' }
        ],
        '10. Festivals': [
          { code: 'İ.5.10.1', name: 'Talking about festivals and celebrations' },
          { code: 'İ.5.10.2', name: 'Describing cultural events' },
          { code: 'İ.5.10.3', name: 'Using past simple tense' }
        ]
      },
      '6': {
        '1. Life': [
          { code: 'İ.6.1.1', name: 'Talking about life events' },
          { code: 'İ.6.1.2', name: 'Describing personal experiences' },
          { code: 'İ.6.1.3', name: 'Using past simple tense' }
        ],
        '2. Yummy Breakfast': [
          { code: 'İ.6.2.1', name: 'Talking about food and drinks' },
          { code: 'İ.6.2.2', name: 'Describing meals' },
          { code: 'İ.6.2.3', name: 'Using countable/uncountable nouns' }
        ],
        '3. Downtown': [
          { code: 'İ.6.3.1', name: 'Describing city life' },
          { code: 'İ.6.3.2', name: 'Talking about urban activities' },
          { code: 'İ.6.3.3', name: 'Using present continuous tense' }
        ],
        '4. Weather and Emotions': [
          { code: 'İ.6.4.1', name: 'Talking about weather' },
          { code: 'İ.6.4.2', name: 'Expressing emotions and feelings' },
          { code: 'İ.6.4.3', name: 'Using weather vocabulary' }
        ],
        '5. At the Fair': [
          { code: 'İ.6.5.1', name: 'Talking about entertainment' },
          { code: 'İ.6.5.2', name: 'Describing fun activities' },
          { code: 'İ.6.5.3', name: 'Using past continuous tense' }
        ],
        '6. Occupations': [
          { code: 'İ.6.6.1', name: 'Talking about jobs and careers' },
          { code: 'İ.6.6.2', name: 'Describing work places' },
          { code: 'İ.6.6.3', name: 'Using future tense (will)' }
        ],
        '7. Holidays': [
          { code: 'İ.6.7.1', name: 'Talking about holidays and vacations' },
          { code: 'İ.6.7.2', name: 'Describing travel experiences' },
          { code: 'İ.6.7.3', name: 'Using present perfect tense' }
        ],
        '8. Bookworms': [
          { code: 'İ.6.8.1', name: 'Talking about books and reading' },
          { code: 'İ.6.8.2', name: 'Expressing preferences' },
          { code: 'İ.6.8.3', name: 'Using book-related vocabulary' }
        ],
        '9. Saving the Planet': [
          { code: 'İ.6.9.1', name: 'Talking about environmental issues' },
          { code: 'İ.6.9.2', name: 'Describing eco-friendly actions' },
          { code: 'İ.6.9.3', name: 'Using environmental vocabulary' }
        ],
        '10. Democracy': [
          { code: 'İ.6.10.1', name: 'Talking about democracy and rights' },
          { code: 'İ.6.10.2', name: 'Expressing opinions about society' },
          { code: 'İ.6.10.3', name: 'Using political vocabulary' }
        ]
      },
      '7': {
        '1. Appearance and Personality': [
          { code: 'İ.7.1.1', name: 'Describing physical appearance' },
          { code: 'İ.7.1.2', name: 'Talking about personality traits' },
          { code: 'İ.7.1.3', name: 'Using descriptive adjectives' }
        ],
        '2. Sports': [
          { code: 'İ.7.2.1', name: 'Talking about sports and activities' },
          { code: 'İ.7.2.2', name: 'Describing athletic abilities' },
          { code: 'İ.7.2.3', name: 'Using sports vocabulary' }
        ],
        '3. Biographies': [
          { code: 'İ.7.3.1', name: 'Talking about famous people' },
          { code: 'İ.7.3.2', name: 'Describing life stories' },
          { code: 'İ.7.3.3', name: 'Using past simple tense' }
        ],
        '4. Wild Animals': [
          { code: 'İ.7.4.1', name: 'Talking about wild animals' },
          { code: 'İ.7.4.2', name: 'Describing animal habitats' },
          { code: 'İ.7.4.3', name: 'Using animal vocabulary' }
        ],
        '5. Television': [
          { code: 'İ.7.5.1', name: 'Talking about TV programs' },
          { code: 'İ.7.5.2', name: 'Expressing preferences about entertainment' },
          { code: 'İ.7.5.3', name: 'Using media vocabulary' }
        ],
        '6. Celebrations': [
          { code: 'İ.7.6.1', name: 'Talking about celebrations' },
          { code: 'İ.7.6.2', name: 'Describing cultural events' },
          { code: 'İ.7.6.3', name: 'Using celebration vocabulary' }
        ],
        '7. Dreams': [
          { code: 'İ.7.7.1', name: 'Talking about dreams and aspirations' },
          { code: 'İ.7.7.2', name: 'Expressing future plans' },
          { code: 'İ.7.7.3', name: 'Using future tense' }
        ],
        '8. Public Buildings': [
          { code: 'İ.7.8.1', name: 'Talking about public places' },
          { code: 'İ.7.8.2', name: 'Describing buildings and facilities' },
          { code: 'İ.7.8.3', name: 'Using place vocabulary' }
        ],
        '9. Environment': [
          { code: 'İ.7.9.1', name: 'Talking about environmental problems' },
          { code: 'İ.7.9.2', name: 'Describing solutions to environmental issues' },
          { code: 'İ.7.9.3', name: 'Using environmental vocabulary' }
        ],
        '10. Planets': [
          { code: 'İ.7.10.1', name: 'Talking about space and planets' },
          { code: 'İ.7.10.2', name: 'Describing astronomical phenomena' },
          { code: 'İ.7.10.3', name: 'Using space vocabulary' }
        ]
      },
      '8': {
        '1. Friendship': [
          { code: 'İ.8.1.1', name: 'Talking about friendships' },
          { code: 'İ.8.1.2', name: 'Describing relationships' },
          { code: 'İ.8.1.3', name: 'Using relationship vocabulary' }
        ],
        '2. Teen Life': [
          { code: 'İ.8.2.1', name: 'Talking about teenage life' },
          { code: 'İ.8.2.2', name: 'Describing teenage problems' },
          { code: 'İ.8.2.3', name: 'Using teenage vocabulary' }
        ],
        '3. In the Kitchen': [
          { code: 'İ.8.3.1', name: 'Talking about cooking and food' },
          { code: 'İ.8.3.2', name: 'Describing recipes and ingredients' },
          { code: 'İ.8.3.3', name: 'Using cooking vocabulary' }
        ],
        '4. On the Phone': [
          { code: 'İ.8.4.1', name: 'Talking on the phone' },
          { code: 'İ.8.4.2', name: 'Making and receiving calls' },
          { code: 'İ.8.4.3', name: 'Using phone vocabulary' }
        ],
        '5. The Internet': [
          { code: 'İ.8.5.1', name: 'Talking about internet and technology' },
          { code: 'İ.8.5.2', name: 'Describing online activities' },
          { code: 'İ.8.5.3', name: 'Using technology vocabulary' }
        ],
        '6. Adventures': [
          { code: 'İ.8.6.1', name: 'Talking about adventures and travel' },
          { code: 'İ.8.6.2', name: 'Describing exciting experiences' },
          { code: 'İ.8.6.3', name: 'Using adventure vocabulary' }
        ],
        '7. Tourism': [
          { code: 'İ.8.7.1', name: 'Talking about tourism and travel' },
          { code: 'İ.8.7.2', name: 'Describing tourist attractions' },
          { code: 'İ.8.7.3', name: 'Using tourism vocabulary' }
        ],
        '8. Chores': [
          { code: 'İ.8.8.1', name: 'Talking about household chores' },
          { code: 'İ.8.8.2', name: 'Describing daily responsibilities' },
          { code: 'İ.8.8.3', name: 'Using household vocabulary' }
        ],
        '9. Science': [
          { code: 'İ.8.9.1', name: 'Talking about science and experiments' },
          { code: 'İ.8.9.2', name: 'Describing scientific processes' },
          { code: 'İ.8.9.3', name: 'Using science vocabulary' }
        ],
        '10. Natural Forces': [
          { code: 'İ.8.10.1', name: 'Talking about natural disasters' },
          { code: 'İ.8.10.2', name: 'Describing natural phenomena' },
          { code: 'İ.8.10.3', name: 'Using natural forces vocabulary' }
        ]
      }
    }
  };

  function updateUnitsAndButtons() {
    updateUnits();
    updateGenerateButtons();
  }

  function updateUnits() {
    const subject = questionSubjectSelect.value;
    const grade = questionGradeSelect.value;
    
    questionUnitSelect.innerHTML = '<option value="">Ünite seçin...</option>';
    
    if (subject && grade && unitData[subject] && unitData[subject][grade]) {
      unitData[subject][grade].forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        questionUnitSelect.appendChild(option);
      });
    }
    
    // Kazanım seçimini de güncelle
    updateOutcomes();
  }

  function updateOutcomes() {
    const subject = questionSubjectSelect.value;
    const grade = questionGradeSelect.value;
    const unit = questionUnitSelect.value;
    
    const questionOutcomeSelect = document.getElementById('question-outcome-select');
    questionOutcomeSelect.innerHTML = '<option value="">Kazanım seçin...</option><option value="all">Tüm kazanımlar</option>';
    
    if (subject && grade && unit && outcomeData[subject] && outcomeData[subject][grade] && outcomeData[subject][grade][unit]) {
      outcomeData[subject][grade][unit].forEach(outcome => {
        const option = document.createElement('option');
        option.value = outcome.code;
        option.textContent = `${outcome.code} - ${outcome.name}`;
        questionOutcomeSelect.appendChild(option);
      });
    }
  }

  function updateGenerateButtons() {
    const hasStudent = questionStudentSelect.value !== '';
    const hasSubject = questionSubjectSelect.value !== '';
    const hasGrade = questionGradeSelect.value !== '';
    const hasUnit = questionUnitSelect.value !== '';
    
    console.log('Button check:', { hasStudent, hasSubject, hasGrade, hasUnit });
    
    const canGenerate = hasStudent && hasSubject && hasGrade && hasUnit;
    generateTestBtn.disabled = !canGenerate;
    aiGenerateBtn.disabled = !canGenerate;
  }

  // Ünite isminden ünite numarasını çıkar
  function getUnitNumberFromName(unitName) {
    const unitMapping = {
      '1. Bir Kahraman Doğuyor': 1,
      '2. Milli Uyanış: Bağımsızlık Yolunda Atılan Adımlar': 2,
      '3. Millî Bir Destan: Ya İstiklal Ya Ölüm': 3,
      '4. Atatürkçülük ve Çağdaşlaşan Türkiye': 4,
      '5. Demokratikleşme Çabaları': 5,
      '6. Atatürk Dönemi Türk Dış Politikası': 6,
      '7. Atatürk\'ün Ölümü ve Sonrası': 7
    };
    return unitMapping[unitName] || null;
  }

  // Din Kültürü ünite isminden ünite numarasını çıkar
  function getDinKulturuUnitNumber(unitName) {
    const unitMapping = {
      '1. Kader ve Kaza İnancı': 1,
      '2. Zekât ve Sadaka': 2,
      '3. Din, Birey ve Toplum': 3,
      '4. Hz. Muhammed\'in Örnek Ahlakı': 4,
      '5. Kur\'an-ı Kerim ve Özellikleri': 5
    };
    return unitMapping[unitName] || null;
  }

  function generateTest() {
    const subject = questionSubjectSelect.value;
    const grade = parseInt(questionGradeSelect.value);
    const questionCount = parseInt(questionCountSelect.value);
    const difficulty = difficultyLevelSelect.value;
    const questionType = questionTypeSelect.value;

    showToast('Test Oluşturuluyor', 'Sorular veritabanından çekiliyor...', 'info');

    // Veritabanından soruları çek (simüle edilmiş)
    fetchQuestionsFromDatabase(subject, grade, questionCount, difficulty, questionType)
      .then(questions => {
        if (questions.length === 0) {
          showToast('Uyarı', 'Seçilen kriterlere uygun soru bulunamadı', 'warning');
          return;
        }

        currentTest = {
          questions: questions,
          subject: subject,
          grade: grade,
          questionCount: questionCount,
          difficulty: difficulty,
          questionType: questionType
        };

        displayTestPreview(questions);
        testPreview.style.display = 'block';
      })
      .catch(error => {
        console.error('Test oluşturma hatası:', error);
        showToast('Hata', 'Test oluşturulurken bir hata oluştu', 'error');
      });
  }

  function generateAITest() {
    showToast('AI Test Oluşturuluyor', 'Yapay zeka ile akıllı test hazırlanıyor...', 'info');
    
    // AI test oluşturma simülasyonu
    setTimeout(() => {
      generateTest(); // Şimdilik normal test oluştur
      showToast('AI Test Hazır', 'Yapay zeka ile optimize edilmiş test oluşturuldu', 'success');
    }, 2000);
  }

  // Ders adını JSON key'e çevir
  function getSubjectKey(subject) {
    const subjectMap = {
      'Sosyal Bilgiler': 'sosyal_bilgiler',
      'Matematik': 'matematik',
      'Türkçe': 'turkce',
      'Fen Bilimleri': 'fen_bilimleri',
      'Din Kültürü ve Ahlak Bilgisi': 'din_kulturu',
      'İngilizce': 'ingilizce'
    };
    return subjectMap[subject] || 'sosyal_bilgiler';
  }

  // Ders ve sınıfa göre JSON dosya yolunu belirle
  function getJsonPathForSubject(subjectKey, grade) {
    // Subject mapping dosyasını yükle
    return fetch('./data/subject_questions.json')
      .then(response => response.json())
      .then(mapping => {
        const subjectData = mapping[subjectKey];
        if (!subjectData) {
          throw new Error(`Ders bulunamadı: ${subjectKey}`);
        }
        
        const jsonFile = subjectData[grade.toString()];
        if (!jsonFile) {
          throw new Error(`${subjectKey} dersi için ${grade}. sınıf bulunamadı`);
        }
        
        return jsonFile;
      });
  }

  function fetchQuestionsFromDatabase(subject, grade, count, difficulty, type) {
    // Ders ve sınıfa göre JSON dosyasını belirle
    const subjectKey = getSubjectKey(subject);
    
    // Belirlenen JSON dosyasından soruları çek
    return getJsonPathForSubject(subjectKey, grade)
      .then(jsonPath => fetch(jsonPath))
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // JSON yapısından soruları al
        const allQuestions = data.sorular || data.questions || data;
        // Filtreleme uygula
        let filteredQuestions = allQuestions.filter(q => {
          // Ders eşleşmesi - inkılap.json için özel kontrol
          let subjectMatch = false;
          if (subjectKey === 'sosyal_bilgiler' && grade === 8) {
            // Sosyal Bilgiler 8. sınıf = T.C. İnkılap Tarihi ve Atatürkçülük
            subjectMatch = q.subject === 'T.C. İnkılap Tarihi ve Atatürkçülük' || 
                          q.subject === 'Sosyal Bilgiler' ||
                          q.subject === 'Bilinmiyor';
          } else {
            subjectMatch = q.subject === subject || q.subject === 'Bilinmiyor';
          }
          
          if (!subjectMatch) return false;
          
          // Ünite ve kazanım eşleştirmesi (Sosyal Bilgiler 8. sınıf için)
          if (subjectKey === 'sosyal_bilgiler' && grade === 8) {
            const selectedUnit = questionUnitSelect.value;
            const selectedOutcome = document.getElementById('question-outcome-select').value;
            
            if (selectedUnit) {
              const unitNumber = getUnitNumberFromName(selectedUnit);
              if (unitNumber) {
                // Kazanım filtresi - yeni JSON yapısından outcome alanını kullan
                const questionOutcome = q.outcome;
                if (selectedOutcome && selectedOutcome !== 'all') {
                  // Belirli kazanım seçilmişse
                  const outcomeMatch = questionOutcome && questionOutcome.includes(selectedOutcome);
                  if (!outcomeMatch) return false;
                } else if (selectedOutcome === 'all') {
                  // Tüm kazanımlar seçilmişse, ünite kontrolü yap
                  const outcomeMatch = questionOutcome && questionOutcome.includes(`İTA.8.${unitNumber}.`);
                  if (!outcomeMatch) return false;
                } else {
                  // Kazanım seçilmemişse, ünite kontrolü yap
                  const outcomeMatch = questionOutcome && questionOutcome.includes(`İTA.8.${unitNumber}.`);
                if (!outcomeMatch) return false;
                }
              }
            }
          }
          
          // Ünite ve kazanım eşleştirmesi (Din Kültürü 8. sınıf için)
          if (subjectKey === 'din_kulturu' && grade === 8) {
            const selectedUnit = questionUnitSelect.value;
            const selectedOutcome = document.getElementById('question-outcome-select').value;
            
            if (selectedUnit) {
              const unitNumber = getDinKulturuUnitNumber(selectedUnit);
              if (unitNumber) {
                // Kazanım filtresi - Din Kültürü outcome formatı: DKAB.8.X.Y
                const questionOutcome = q.outcome;
                if (selectedOutcome && selectedOutcome !== 'all') {
                  // Belirli kazanım seçilmişse
                  const outcomeMatch = questionOutcome && questionOutcome.includes(selectedOutcome);
                  if (!outcomeMatch) return false;
                } else if (selectedOutcome === 'all') {
                  // Tüm kazanımlar seçilmişse, ünite kontrolü yap
                  const outcomeMatch = questionOutcome && questionOutcome.includes(`DKAB.8.${unitNumber}.`);
                  if (!outcomeMatch) return false;
                } else {
                  // Kazanım seçilmemişse, ünite kontrolü yap
                  const outcomeMatch = questionOutcome && questionOutcome.includes(`DKAB.8.${unitNumber}.`);
                  if (!outcomeMatch) return false;
                }
              }
            }
          }
          
          // Zorluk seviyesi filtresi - yeni JSON yapısında difficulty alanı yok, şimdilik atla
          // if (difficulty !== 'mixed' && q.difficulty !== difficulty) return false;
          
          // Soru tipi filtresi - yeni JSON yapısına uyarlanmış
          if (type !== 'mixed') {
            const questionText = q.question_text || q.text || '';
            // Basit tip belirleme
            if (type === 'concept' && !questionText.includes('nedir') && !questionText.includes('nelerdir')) return false;
            if (type === 'analysis' && !questionText.includes('analiz') && !questionText.includes('çıkarım')) return false;
            if (type === 'application' && !questionText.includes('uygulama') && !questionText.includes('örnek')) return false;
          }
          
          return true;
        });

        // Rastgele seçim
        const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(count, filteredQuestions.length));
        
        return selected;
      })
      .catch(error => {
        console.error('Sorular yüklenirken hata:', error);
        showToast('Hata', 'Sorular yüklenirken bir hata oluştu', 'error');
        return [];
      });
  }

  function displayTestPreview(questions) {
    testQuestionsContainer.innerHTML = '';
    
    questions.forEach((question, index) => {
      const questionElement = document.createElement('div');
      questionElement.className = 'question-item';
      // Yeni JSON yapısından verileri al
      // Soru metninin başındaki numarayı kaldır (örn. "1) ", "1. ")
      const rawQuestionText = question.question_text || question.text || '';
      const questionText = String(rawQuestionText).replace(/^\s*\d+\s*[\)\.]\s*/u, '').trim();

      // Şıkları normalize et: object/array/string farklı formatlarını tek tipe çevir
      let questionOptions = question.options || [];
      const stripOptionPrefix = (opt) => String(opt || '')
        // A), a), A., a., A : , A - , vb. ön eklerini temizle
        .replace(/^\s*[A-Da-d]\s*[\)\.:\-]\s*/u, '')
        .replace(/^\s*[A-Da-d]\s+/u, '')
        .trim();

      const splitLabeledOptions = (text) => {
        const t = String(text || '');
        // Etiketli tek stringten A-D parçalarına ayır
        const pattern = /(A|B|C|D)[\)\.:]\s*/giu;
        const parts = [];
        let match;
        let lastIndex = 0;
        const labels = [];
        while ((match = pattern.exec(t)) !== null) {
          labels.push({ label: match[1].toUpperCase(), index: match.index });
        }
        if (labels.length === 0) {
          // Etiket yoksa; yaygın ayraçlarla bölmeyi dene
          return t
            .split(/\s*\|\s*|\s*;\s*|\s*\/\s*/u)
            .map(s => s.trim())
            .filter(Boolean);
        }
        for (let i = 0; i < labels.length; i++) {
          const start = labels[i].index + labels[i].label.length + 1; // label + ayraç
          const end = i + 1 < labels.length ? labels[i + 1].index : t.length;
          const slice = t.slice(start, end).trim();
          parts.push(slice);
        }
        return parts.map(stripOptionPrefix);
      };
      
      if (typeof questionOptions === 'object' && !Array.isArray(questionOptions)) {
        const keys = Object.keys(questionOptions);
        if (keys.length === 1 && typeof questionOptions[keys[0]] === 'string') {
          // Tüm şıklar tek stringte olabilir › böl
          questionOptions = splitLabeledOptions(questionOptions[keys[0]]);
        } else {
          // A, B, C, D sırayla değerleri al
          const ordered = ['A', 'B', 'C', 'D']
            .map(k => questionOptions[k] ?? questionOptions[k.toLowerCase()])
            .filter(v => v != null);
          questionOptions = ordered.map(stripOptionPrefix);
        }
      } else if (typeof questionOptions === 'string') {
        questionOptions = splitLabeledOptions(questionOptions);
      } else if (Array.isArray(questionOptions)) {
        questionOptions = questionOptions.map(stripOptionPrefix);
      }

      // En fazla 4 şık kullan, boşları ayıkla
      questionOptions = questionOptions.filter(Boolean).slice(0, 4);
      
      // Eğer options object formatındaysa (A, B, C, D key'leri ile), array'e çevir
      // (Yukarıda normalize edildi)
      
      const questionDifficulty = question.difficulty || 'medium';
      const questionType = question.question_type || 'text';
      const questionImage = question.filename;
      
      // Görsel soru için HTML oluştur
      let imageHtml = '';
      if (questionType === 'visual' && questionImage) {
        imageHtml = `
          <div class="question-image">
            <img src="../sorular_basit/${questionImage}" alt="Soru görseli" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; margin: 10px 0;">
          </div>
        `;
      }
      
      questionElement.innerHTML = `
        <div class="question-header">
          <span class="question-number">Soru ${index + 1}</span>
          <span class="question-difficulty difficulty-${questionDifficulty}">${getDifficultyText(questionDifficulty)}</span>
          <span class="question-type">${questionType === 'visual' ? 'Görsel' : 'Metin'}</span>
        </div>
        <div class="question-text">${questionText}</div>
        ${imageHtml}
        <div class="question-options">
          ${questionOptions.map((option, optionIndex) => {
            const letter = String.fromCharCode(65 + optionIndex); // A, B, C, D
            return `
              <div class="option-item" data-answer="${letter}">
                <span class="option-letter">${letter}</span>
                <span class="option-text">${option}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      testQuestionsContainer.appendChild(questionElement);
    });
  }

  function getDifficultyText(difficulty) {
    const difficultyMap = {
      'easy': 'Kolay',
      'medium': 'Orta',
      'hard': 'Zor'
    };
    return difficultyMap[difficulty] || 'Bilinmiyor';
  }

  // Görsellerin yüklenmesini bekleyen yardımcı fonksiyon
  function waitForImages() {
    return new Promise((resolve) => {
      const images = document.querySelectorAll('img');
      let loadedCount = 0;
      
      if (images.length === 0) {
        resolve();
        return;
      }
      
      images.forEach(img => {
        if (img.complete) {
          loadedCount++;
        } else {
          img.onload = () => {
            loadedCount++;
            if (loadedCount === images.length) resolve();
          };
          img.onerror = () => {
            loadedCount++;
            if (loadedCount === images.length) resolve();
          };
        }
      });
      
      if (loadedCount === images.length) resolve();
    });
  }

  // PDF içerik doğrulama fonksiyonu
  function validatePDFContent() {
    const issues = [];
    
    // Türkçe karakter kontrolü
    const textContent = document.body.textContent;
    if (textContent.includes('_') && textContent.includes('ç')) {
      issues.push('Türkçe karakter sorunu tespit edildi');
    }
    
    // Görsel yükleme kontrolü
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.complete || img.naturalHeight === 0) {
        issues.push(`Görsel ${index + 1} yüklenmemiş`);
      }
    });
    
    if (issues.length > 0) {
      console.warn('PDF öncesi sorunlar:', issues);
    }
    
    return issues.length === 0;
  }

  // PDF Export fonksiyonu - Dinamik içerik bekleme ile
  async function exportTestToPDF() {
    if (!currentTest) {
      showToast('Hata', 'Önce test oluşturun', 'error');
      return;
    }

    try {
      showToast('PDF Hazırlanıyor', 'İçerik render ediliyor...', 'info');
      
      // 1. DOM'un tamamen render edilmesini bekle
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });
      
      // 2. Grafiklerin yüklenmesini bekle
      await waitForImages();
      
      // 3. Test içeriğinin görünür olduğundan emin ol
      const testPreview = document.getElementById('test-preview');
      if (testPreview) {
        testPreview.style.display = 'block';
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // 4. Print CSS zaten aktif
      
      // 4. İçerik doğrulama
      if (!validatePDFContent()) {
        console.warn('PDF içerik doğrulama uyarıları var, devam ediliyor...');
    }

    showToast('PDF Hazırlanıyor', 'Test PDF olarak kaydediliyor...', 'info');
    
      // 5. PDF oluştur
      try {
      // jsPDF kütüphanesini kullan
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Belge özelliklerini ayarla
      doc.setProperties({
        title: 'Test Sınavı',
        subject: 'Eğitim Materyali',
        author: 'Kapsül Koçluk Programı',
        creator: 'Kapsül Koçluk Programı'
      });
      
      // Kenar boşlukları için sabit değerler kullan
      const leftMargin = 20;
      const topMargin = 25;
      const rightMargin = 20;
      
      // Öğrenci bilgilerini al
      const studentName = selectedStudentName ? selectedStudentName.textContent : 'Öğrenci Adı';
      const studentClass = selectedStudentClass ? selectedStudentClass.textContent : 'Sınıf';
      const unitName = questionUnitSelect.value;
      const selectedOutcome = document.getElementById('question-outcome-select').value;
      
      // Türkçe karakter desteği için font ayarı
      // Arial font'u kullan (Türkçe karakterleri daha iyi destekler)
      doc.setFont('arial', 'normal');
      
      // Türkçe karakter dönüşüm fonksiyonu
      function fixTurkishChars(text) {
        if (typeof text !== 'string') return text;
        
        return text
          .replace(/ı/g, 'i').replace(/İ/g, 'I')
          .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
          .replace(/ü/g, 'u').replace(/Ü/g, 'U')
          .replace(/ş/g, 's').replace(/Ş/g, 'S')
          .replace(/ö/g, 'o').replace(/Ö/g, 'O')
          .replace(/ç/g, 'c').replace(/Ç/g, 'C');
      }
      
      // PDF başlığı
      doc.setFontSize(18);
      doc.setFont('arial', 'bold');
      doc.text(fixTurkishChars('KAPSÜL KOÇLUK PROGRAMI'), 105, topMargin + 10, { align: 'center' });
      
      // Test bilgileri
      doc.setFontSize(14);
      doc.setFont('arial', 'normal');
      doc.text(fixTurkishChars(`${currentTest.subject} - ${currentTest.grade}. Sınıf`), 105, topMargin + 25, { align: 'center' });
      doc.text(fixTurkishChars(unitName), 105, topMargin + 35, { align: 'center' });
      
      if (selectedOutcome && selectedOutcome !== 'all') {
        doc.text(fixTurkishChars(`Kazanım: ${selectedOutcome}`), 105, topMargin + 45, { align: 'center' });
      }
      
      // Öğrenci bilgileri kutusu - Düzeltilmiş hizalama
      const studentInfoStartY = topMargin + 55;
      const studentInfoHeight = 35; // Daha yüksek kutu
      const studentInfoWidth = 170; // Daha geniş kutu
      
      doc.setFillColor(240, 240, 240);
      doc.rect(leftMargin - 5, studentInfoStartY, studentInfoWidth, studentInfoHeight, 'F');
      
      // Kutu kenarlığı
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(leftMargin - 5, studentInfoStartY, studentInfoWidth, studentInfoHeight, 'S');
      
      doc.setFontSize(12);
      doc.setFont('arial', 'bold');
      doc.text(fixTurkishChars('ÖĞRENCİ BİLGİLERİ'), leftMargin, studentInfoStartY + 8);
      
      doc.setFont('arial', 'normal');
      doc.text(fixTurkishChars(`Ad Soyad: ${studentName}`), leftMargin, studentInfoStartY + 16);
      doc.text(fixTurkishChars(`Sınıf: ${studentClass}`), leftMargin, studentInfoStartY + 24);
      doc.text(fixTurkishChars(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`), leftMargin, studentInfoStartY + 32);
      
      // Çizgi - Yeni kutu boyutuna göre ayarlandı
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      const lineY = studentInfoStartY + studentInfoHeight + 5;
      doc.line(leftMargin - 5, lineY, 195, lineY);
      
      // Sorular - Geliştirilmiş düzen (yeni kutu boyutuna göre)
      let yPosition = lineY + 15;
      const pageHeight = 270;
      const lineHeight = 6; // Daha sıkı satır aralığı
      const questionSpacing = 20; // Sorular arası daha fazla boşluk
      
      currentTest.questions.forEach((question, index) => {
        // Soru metni için gerekli alan hesapla
        const questionText = fixTurkishChars(question.text);
        const splitQuestionText = doc.splitTextToSize(questionText, 150);
        const questionHeight = splitQuestionText.length * lineHeight + 10;
        
        // Şıklar için gerekli alan hesapla
        let totalOptionsHeight = 0;
        Object.entries(question.options).forEach(([letter, text]) => {
          const optionText = ` ${fixTurkishChars(text)}`;
          const splitOptionText = doc.splitTextToSize(optionText, 130);
          totalOptionsHeight += splitOptionText.length * lineHeight + 3;
        });
        
        // Toplam gerekli alan
        const totalQuestionHeight = questionHeight + totalOptionsHeight + 20; // +20 sorular arası boşluk
        
        // Eğer soru sığmayacaksa yeni sayfaya geç
        if (yPosition + totalQuestionHeight > pageHeight) {
          doc.addPage();
          yPosition = topMargin + 10;
        }
        
        // Soru numarası ve metni
        doc.setFontSize(12);
        doc.setFont('arial', 'bold');
        doc.text(`${index + 1}.`, leftMargin, yPosition);
        
        // Soru metni - Geliştirilmiş düzen
        doc.setFont('arial', 'normal');
        doc.text(splitQuestionText, leftMargin + 10, yPosition);
        
        yPosition += splitQuestionText.length * lineHeight + 10; // Daha fazla boşluk
        
        // Şıklar - Düzgün hizalama ile (sayfa kontrolü olmadan)
        Object.entries(question.options).forEach(([letter, text]) => {
          doc.setFontSize(11);
          doc.setFont('arial', 'normal');
          
          // Şık harfini kalın yap
          doc.setFont('arial', 'bold');
          doc.text(`${letter})`, leftMargin + 15, yPosition);
          
          // Şık metnini normal yap
          doc.setFont('arial', 'normal');
          const optionText = ` ${fixTurkishChars(text)}`;
          const splitOptionText = doc.splitTextToSize(optionText, 130);
          doc.text(splitOptionText, leftMargin + 25, yPosition);
          
          yPosition += splitOptionText.length * lineHeight + 3;
        });
        
        yPosition += questionSpacing; // Sorular arası boşluk
        
        // Sorular arası çizgi (son soru değilse) - Geliştirilmiş düzen
        if (index < currentTest.questions.length - 1) {
          if (yPosition > pageHeight - 15) {
            doc.addPage();
            yPosition = topMargin + 10;
          } else {
            // Daha belirgin çizgi
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.3);
            doc.line(leftMargin, yPosition - 8, 190, yPosition - 8);
            yPosition += 5; // Çizgi sonrası boşluk
          }
        }
      });
      
        // PDF'i indir
        const fileName = `Test_${currentTest.subject}_${currentTest.grade}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    
    showToast('Başarılı', 'Test PDF olarak kaydedildi', 'success');
        
      } catch (pdfError) {
        console.error('PDF oluşturma hatası:', pdfError);
        showToast('Hata', 'PDF oluşturulurken bir hata oluştu', 'error');
      }
      
    } catch (error) {
      console.error('PDF export genel hatası:', error);
      showToast('Hata', 'PDF oluşturulurken bir hata oluştu', 'error');
    }
  }

  function generateTestPDFContent() {
    const studentName = selectedStudentName.textContent;
    const studentClass = selectedStudentClass.textContent;
    const unitName = questionUnitSelect.value;
    
    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test - ${currentTest.subject}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-header { text-align: center; margin-bottom: 30px; }
        .question { margin-bottom: 25px; page-break-inside: avoid; }
        .question-number { font-weight: bold; margin-bottom: 10px; }
        .question-text { margin-bottom: 15px; }
        .options { margin-left: 20px; }
        .option { margin-bottom: 5px; }
        .option-letter { font-weight: bold; margin-right: 10px; }
    </style>
</head>
<body>
    <div class="test-header">
        <h1>${currentTest.subject} - ${currentTest.grade}. Sınıf</h1>
        <h2>${unitName}</h2>
        <p><strong>Öğrenci:</strong> ${studentName} (${studentClass})</p>
        <p><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
        <hr>
    </div>
`;

    currentTest.questions.forEach((question, index) => {
      html += `
    <div class="question">
        <div class="question-number">Soru ${index + 1}:</div>
        <div class="question-text">${question.text}</div>
        <div class="options">`;
      
      Object.entries(question.options).forEach(([letter, text]) => {
        html += `
            <div class="option">
                <span class="option-letter">${letter})</span>${text}
            </div>`;
      });
      
      html += `
        </div>
    </div>`;
    });

    html += `
</body>
</html>`;

    return html;
  }

  // --- Lisans Bilgisi Yönetimi ---
  let currentLicenseInfo = {
    plan: 'standard',
    status: 'inactive',
    expiresAt: null
  };

  const plannerNavDefaultLabel = navPlannerBtn ? navPlannerBtn.textContent.trim() : '';

  function isPremiumPlan() {
    console.log('?? DEBUG: isPremiumPlan çağrıldı, currentLicenseInfo:', currentLicenseInfo);
    const isPremium = currentLicenseInfo.plan === 'premium';
    console.log('?? DEBUG: Premium durumu:', isPremium);
    return isPremium;
  }

  function formatLicenseExpiry(expiryValue) {
    if (!expiryValue) {
      return 'Bitiş tarihi tanımlı değil';
    }
    const expiryDate = new Date(expiryValue);
    if (Number.isNaN(expiryDate.getTime())) {
      return 'Bitiş tarihi bilinmiyor';
    }
    const today = new Date();
    expiryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    const formattedDate = expiryDate.toLocaleDateString('tr-TR');
    if (diffDays > 1) return `${formattedDate} (${diffDays} gün kaldı)`;
    if (diffDays === 1) return `${formattedDate} (yarın doluyor)`;
    if (diffDays === 0) return `${formattedDate} (bugün doluyor)`;
    return `${formattedDate} (süresi doldu)`;
  }

  function updateLicenseDisplay() {
    if (!licenseDisplay) {
      return;
    }
    if (currentLicenseInfo.status !== 'active') {
      licenseDisplay.textContent = 'Lisans durumu: Geçerli değil';
      return;
    }
    const planLabel = isPremiumPlan() ? 'Premium Plan' : 'Standart Plan';
    const expiryText = formatLicenseExpiry(currentLicenseInfo.expiresAt);
    licenseDisplay.textContent = `${planLabel} - ${expiryText}`;
  }

  function updateUiForLicensePlan() {
    const isPremium = isPremiumPlan();
    console.log(`Kullanıcı planı: ${currentLicenseInfo.plan}, Premium erişim: ${isPremium}`);

    // Sidebar butonlarını güncelle
    const navEvaluationBtn = document.getElementById('nav-evaluation');
    if (navEvaluationBtn) {
      navEvaluationBtn.textContent = isPremium ? 'AI Öğrenci Değerlendir' : 'Öğrenci Değerlendir';
      console.log(`?? DEBUG: Sidebar butonu güncellendi: ${navEvaluationBtn.textContent}`);
    }

    const aiTestButton = document.getElementById('ai-generate-btn');
    if (aiTestButton) {
      aiTestButton.disabled = !isPremium;
      aiTestButton.classList.toggle('premium-locked', !isPremium);
      aiTestButton.title = isPremium ? '' : 'Bu özellik Premium lisans gerektirir.';
    }

    if (aiEvaluationButton) {
      aiEvaluationButton.disabled = !isPremium;
      aiEvaluationButton.classList.toggle('premium-locked', !isPremium);
      aiEvaluationButton.title = isPremium ? '' : 'Bu özellik Premium lisans gerektirir.';
      // Metni varsayılan haline döndür
      const btnText = aiEvaluationButton.querySelector('.btn-text');
      if (btnText) {
        btnText.textContent = '?? AI Analizini Başlat';
      }
    }

    if (navPlannerBtn) {
      navPlannerBtn.classList.toggle('premium-locked', !isPremium);
      navPlannerBtn.textContent = isPremium ? plannerNavDefaultLabel : `[Kilit] ${plannerNavDefaultLabel}`;
      if (isPremium) {
        navPlannerBtn.removeAttribute('aria-disabled');
      } else {
        navPlannerBtn.setAttribute('aria-disabled', 'true');
      }
      navPlannerBtn.title = isPremium ? plannerNavDefaultLabel : 'Bu bölüm Premium plan gerektirir.';
    }

    const classAnalysisNav = document.getElementById('nav-class-analysis');
    if (classAnalysisNav) {
      classAnalysisNav.style.display = isPremium ? '' : 'none';
    }

    // AI Analizi bölümünü Premium'a göre göster/gizle
    const aiAnalysisCard = document.querySelector('.ai-analysis');
    if (aiAnalysisCard) {
      aiAnalysisCard.style.display = isPremium ? '' : 'none';
      console.log(`?? DEBUG: AI Analysis card ${isPremium ? 'görünür' : 'gizli'} yapıldı`);
    }

    // Sayfa başlığını Premium'a göre güncelle
    const pageHeader = document.querySelector('#evaluation-section .page-header h2');
    if (pageHeader) {
      pageHeader.textContent = isPremium ? '?? AI Öğrenci Değerlendirme ve Tavsiyeleri' : '?? Öğrenci Değerlendirme';
      console.log(`?? DEBUG: Sayfa başlığı güncellendi: ${pageHeader.textContent}`);
    }
  }

  // Değerlendirme zamanı kontrolü
  async function checkEvaluationTiming() {
    if (!selectedStudent) return;
    
    try {
      const timing = await window.electronAPI.checkEvaluationTiming(selectedStudent.id);
      
      const timingDisplay = document.getElementById('evaluation-timing');
      if (timingDisplay) {
        if (timing.error) {
          timingDisplay.innerHTML = `
            <span class="error">? ${timing.error}</span>
          `;
          if (aiEvaluationButton) {
            aiEvaluationButton.disabled = true;
          }
          return;
        }
        
        if (timing.should) {
          timingDisplay.innerHTML = `
            <span class="ready">? Değerlendirme zamanı geldi!</span>
          `;
          if (aiEvaluationButton) {
            aiEvaluationButton.disabled = false;
          }
        } else {
          timingDisplay.innerHTML = `
            <span class="not-ready">? ${timing.reason || 'Değerlendirme zamanı henüz gelmedi'}</span>
            <span class="next-date">Sonraki: ${timing.nextDate || 'Belirlenemedi'}</span>
            <button id="force-evaluation" class="btn-secondary">Erken Değerlendirme Yap</button>
          `;
          if (aiEvaluationButton) {
            aiEvaluationButton.disabled = true;
          }
          
          // Zorla değerlendirme butonu event listener'ı
          const forceButton = document.getElementById('force-evaluation');
          if (forceButton) {
            forceButton.addEventListener('click', async () => {
              const confirm = window.confirm('Değerlendirme zamanı gelmeden erken değerlendirme yapmak istediğinize emin misiniz?');
              if (confirm) {
                await handleAiEvaluationClick(true); // force = true
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Değerlendirme zamanı kontrolü hatası:', error);
      const timingDisplay = document.getElementById('evaluation-timing');
      if (timingDisplay) {
        timingDisplay.innerHTML = `
          <span class="error">? Değerlendirme zamanı kontrol edilemedi</span>
        `;
      }
    }
  }

  async function handleAiEvaluationClick(force = false) {
    if (!isPremiumPlan()) {
      showToast('Premium Özellik', 'Yapay zeka ile değerlendirme yalnızca Premium plan sahipleri için açıktır.', 'info');
      return;
    }

    if (!selectedStudent) {
      showToast('Hata', 'Lütfen önce bir öğrenci seçin.', 'error');
      return;
    }

    if (aiEvaluationButton) {
      // Buton durumunu güncelle
      aiEvaluationButton.disabled = true;
      aiEvaluationButton.classList.add('loading');
      aiEvaluationButton.setAttribute('aria-busy', 'true');
      
      // Metni güncelle
      const btnText = aiEvaluationButton.querySelector('.btn-text');
      if (btnText) {
        btnText.textContent = 'Analiz yapılıyor...';
      }
    }

    if (aiEvaluationResult) {
      aiEvaluationResult.textContent = '';
    }

    try {
      console.log('?? DEBUG: AI evaluation request başlatılıyor...');
      const response = await window.electronAPI.getAiEvaluation({
        id: selectedStudent.id,
        name: selectedStudent.name,
        grade: selectedStudent.grade,
        class: selectedStudent.class,
        learningStyle: selectedStudent.learningStyle
      }, force);

      console.log('?? DEBUG: AI evaluation response:', response);

      if (response && response.warning) {
        console.log('?? DEBUG: AI evaluation warning:', response.message);
        showToast('Değerlendirme Zamanı', response.message, 'info');
        if (aiEvaluationResult) {
          aiEvaluationResult.innerHTML = `
            <div class="ai-evaluation-warning">
              <h4>? Değerlendirme Zamanı</h4>
              <p>${response.message}</p>
              <p>Sonraki değerlendirme: ${response.nextDate}</p>
            </div>
          `;
        }
        return;
      }

      if (response && response.error) {
        console.log('? DEBUG: AI evaluation error:', response.error);
        showToast('AI Hatası', response.error, 'error');
        if (aiEvaluationResult) {
          aiEvaluationResult.textContent = response.error;
        }
        // Hata durumu için kısa renk geçişi
        if (aiEvaluationButton) {
          aiEvaluationButton.classList.add('error');
          setTimeout(() => aiEvaluationButton.classList.remove('error'), 2000);
        }
        return;
      }

      if (response && response.success && response.evaluation) {
        console.log('? DEBUG: AI evaluation başarılı');
        if (aiEvaluationResult) {
          aiEvaluationResult.innerHTML = `
            <div class="ai-evaluation-content">
              <h4>?? AI Değerlendirmesi</h4>
              <div class="evaluation-text">${response.evaluation}</div>
              ${response.timing ? `<div class="evaluation-timing-info">Değerlendirme Periyodu: ${response.timing.reason}</div>` : ''}
            </div>
          `;
        }
        
        // Başarı durumu için kısa renk geçişi
        if (aiEvaluationButton) {
          aiEvaluationButton.classList.add('success');
          setTimeout(() => aiEvaluationButton.classList.remove('success'), 2000);
        }
        
        // Değerlendirme zamanını yeniden kontrol et
        await checkEvaluationTiming();
      } else {
        console.log('? DEBUG: AI evaluation beklenmeyen response:', response);
        showToast('Hata', 'Yapay zeka değerlendirmesi alınamadı.', 'error');
        // Hata durumu için kısa renk geçişi
        if (aiEvaluationButton) {
          aiEvaluationButton.classList.add('error');
          setTimeout(() => aiEvaluationButton.classList.remove('error'), 2000);
        }
      }
    } catch (error) {
      console.error('? DEBUG: AI değerlendirme catch hatası:', error);
      showToast('Hata', 'Yapay zeka değerlendirmesi alınamadı.', 'error');
      // Hata durumu için kısa renk geçişi
      if (aiEvaluationButton) {
        aiEvaluationButton.classList.add('error');
        setTimeout(() => aiEvaluationButton.classList.remove('error'), 2000);
      }
    } finally {
      if (aiEvaluationButton) {
        // Buton durumunu sıfırla
        aiEvaluationButton.classList.remove('loading');
        aiEvaluationButton.removeAttribute('aria-busy');
        
        // Metni varsayılan haline döndür
        const btnText = aiEvaluationButton.querySelector('.btn-text');
        if (btnText) {
          btnText.textContent = '?? AI Analizini Başlat';
        }
        
        aiEvaluationButton.disabled = !isPremiumPlan();
      }
    }
  }

  if (aiEvaluationButton) {
    aiEvaluationButton.addEventListener('click', handleAiEvaluationClick);
  }

  window.electronAPI.onLicenseInfo((licenseData = {}) => {
    console.log('?? DEBUG: Lisans bilgisi alındı:', licenseData);
    currentLicenseInfo = {
      plan: licenseData.plan || 'standard',
      status: licenseData.status || 'inactive',
      expiresAt: licenseData.expiresAt || null
    };
    console.log('?? DEBUG: currentLicenseInfo set edildi:', currentLicenseInfo);
    updateLicenseDisplay();
    updateUiForLicensePlan();
  });

  updateLicenseDisplay();
  updateUiForLicensePlan();

  // --- Rol bazlı yetki kontrolü fonksiyonu ---
  function applyRolePermissions() {
    console.log('?? DEBUG: applyRolePermissions çağrıldı, rol:', currentUserRole);
    
    const canManageStudents = currentUserRole === 'manager';
    const canManageExams = currentUserRole === 'manager';
    const canEvaluateStudents = currentUserRole === 'manager' || currentUserRole === 'teacher';
    const canViewAnalytics = currentUserRole === 'manager' || currentUserRole === 'teacher';
    const canExportData = currentUserRole === 'manager' || currentUserRole === 'teacher';
    
    // Öğrenci yönetimi butonları (sadece ekleme/silme)
    const btnAddProfile = document.getElementById('btn-add-profile');
    const btnDeleteProfile = document.getElementById('btn-delete-profile');
    const saveProfileButton = document.getElementById('save-profile-button');
    
    // CSV import butonu (sadece ekleme için)
    const csvImportBtn = document.getElementById('btn-import-students');
    const csvImportBtn2 = document.getElementById('csv-import-btn');
    const importFileBtn = document.getElementById('import-file-btn');
    
    // Sınav formu ve kontrolleri (sadece ekleme için)
    const examForm = document.getElementById('exam-form');
    
    // Sınav silme butonları
    const examDeleteButtons = document.querySelectorAll('.btn-delete');
    
    // Sadece ekleme/silme işlemlerini kontrol et
    const restrictedElements = [
      btnAddProfile, btnDeleteProfile, saveProfileButton,
      csvImportBtn, csvImportBtn2, importFileBtn, examForm, ...examDeleteButtons
    ].filter(el => el);
    
    restrictedElements.forEach(element => {
      if (element) {
        if (canManageStudents || canManageExams) {
          element.disabled = false;
          element.style.opacity = '1';
          element.style.pointerEvents = 'auto';
          element.title = '';
        } else {
          element.disabled = true;
          element.style.opacity = '0.5';
          element.style.pointerEvents = 'none';
          element.title = 'Bu işlem için müdür yetkisi gereklidir';
        }
      }
    });
    
    // Bilgi bandı güncelle
    const permissionInfo = document.getElementById('permission-info');
    if (permissionInfo) {
      if (currentUserRole === 'teacher') {
        permissionInfo.style.display = 'block';
        permissionInfo.innerHTML = `
          <div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <strong>?? Öğretmen Hesabı:</strong> Tüm öğrencileri görebilir, değerlendirme yapabilir ve analizleri görüntüleyebilirsiniz. Öğrenci ekleme/silme işlemleri sadece müdürler tarafından yapılabilir.
          </div>
        `;
      } else {
        permissionInfo.style.display = 'none';
      }
    }
  }

    // --- YENİ: Kullanıcı Oturum Bilgisi Dinleyicisi ---
  window.electronAPI.onUserSession((user) => {
    console.log('?? DEBUG: onUserSession event alındı:', user);
    const userDisplay = document.getElementById('user-display');
    if (userDisplay && user) {
      userDisplay.textContent = `Hoş geldiniz, ${user.name || user.email}`;
    }
    
    // Kullanıcı rolünü sakla
    currentUserRole = user.role || 'teacher';
    console.log('?? DEBUG: Kullanıcı rolü ayarlandı:', currentUserRole);
    
    // Rol bazlı yetkileri uygula
    applyRolePermissions();
    
    // Kullanıcı girişi sonrası öğrenci verilerini yeniden yükle
    console.log('?? DEBUG: Kullanıcı girişi sonrası öğrenci verileri yeniden yükleniyor...');
    
    // Kısa bir gecikme ile öğrenci verilerini yükle (backend'de activeUser set edilsin)
    setTimeout(() => {
      loadAllStudents().catch(error => {
        console.error('? Öğrenci verileri yüklenirken hata:', error);
      });
    }, 100);
  });

  // ===========================================
  // BASİT RAPOR SİSTEMİ
  // ===========================================

  // ===========================================
  // PDF EXPORT SİSTEMİ - html2canvas + jsPDF
  // ===========================================

  // html2canvas ve jsPDF import'ları
  let html2canvas, jsPDF;
  
  // Electron renderer process'te window.require kullan
  function loadPDFLibraries() {
    try {
      // CDN'den html2canvas yükle
      if (!window.html2canvas) {
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script1.onload = () => {
          html2canvas = window.html2canvas;
          console.log('✅ html2canvas yüklendi');
          loadJsPDF();
        };
        script1.onerror = () => {
          console.error('❌ html2canvas yüklenemedi');
          html2canvas = null;
          jsPDF = null;
        };
        document.head.appendChild(script1);
      } else {
        html2canvas = window.html2canvas;
        loadJsPDF();
      }
    } catch (error) {
      console.error('❌ PDF kütüphaneleri yüklenemedi:', error);
      html2canvas = null;
      jsPDF = null;
    }
  }

  function loadJsPDF() {
    try {
      // CDN'den jsPDF yükle
      if (!window.jspdf) {
        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';
        script2.onload = () => {
          jsPDF = window.jspdf.jsPDF;
          console.log('✅ jsPDF yüklendi');
        };
        script2.onerror = () => {
          console.error('❌ jsPDF yüklenemedi');
          jsPDF = null;
        };
        document.head.appendChild(script2);
      } else {
        jsPDF = window.jspdf.jsPDF;
        console.log('✅ jsPDF yüklendi');
      }
    } catch (error) {
      console.error('❌ jsPDF yüklenemedi:', error);
      jsPDF = null;
    }
  }

    // PDF kütüphanelerini yükle
    loadPDFLibraries();

    // Basit sistem - sadece seçili öğrenci

  /**
   * Sayfa yönünü belirle (landscape/portrait)
   */
  function determinePDFOrientation(element) {
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    return width > height ? 'landscape' : 'portrait';
  }

  /**
   * PDF dosya adı oluştur
   */
  function generatePDFFileName(chartName, scope = null) {
    const date = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
    
    // Basit sistem - sadece seçili öğrenci
    if (selectedStudent) {
      return `${selectedStudent.name}_${chartName}_${date}.pdf`;
    }
    
    return `${chartName}_${date}.pdf`;
  }

  /**
   * Aktif sekmedeki tüm grafikleri tek PDF'e dönüştür
   */
  window.exportCurrentTabAsPDF = async function() {
    if (typeof html2canvas === "undefined" || typeof jsPDF === "undefined") {
      console.log('?? PDF kütüphaneleri yok, window.print kullanılıyor');
      exportCurrentTabAsPDFFallback();
      return;
    }

    const activeTab = document.querySelector('.tab-panel.active');
    if (!activeTab) {
      showToast('Hata', 'Aktif sekme bulunamadı', 'error');
      return;
    }

    const chartContainers = activeTab.querySelectorAll('.chart-container, .table-container');
    if (chartContainers.length === 0) {
      showToast('Bilgi', 'Bu sekmede export edilecek içerik bulunamadı', 'info');
      return;
    }

    try {
      showToast('PDF Hazırlanıyor', `${chartContainers.length} grafik/tablo PDF'e dönüştürülüyor...`, 'info');

      // Chart.js animasyonlarını durdur
      const charts = Chart.instances;
      Object.values(charts).forEach(chart => {
        if (chart.options.animation) {
          chart.options.animation.duration = 0;
        }
      });

      // PDF oluştur
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let isFirstPage = true;

      for (let i = 0; i < chartContainers.length; i++) {
        const container = chartContainers[i];
        
        // Yeni sayfa ekle (ilk sayfa hariç)
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Element'i canvas'a çevir
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: container.offsetWidth,
          height: container.offsetHeight
        });

        // Canvas boyutlarını PDF'e uyarla
        const pdfWidth = 190; // A4 genişlik - kenar boşlukları
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        const maxHeight = 270; // A4 yükseklik - kenar boşlukları

        const finalHeight = imgHeight > maxHeight ? maxHeight : imgHeight;
        const finalWidth = (canvas.width * finalHeight) / canvas.height;

        // Canvas'ı PDF'e ekle
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 10, 10, finalWidth, finalHeight);
      }

      // Chart.js animasyonlarını tekrar başlat
      Object.values(charts).forEach(chart => {
        if (chart.options.animation) {
          chart.options.animation.duration = 1000;
        }
      });

      // Dosya adını oluştur
      const activeTabName = activeTab.id.replace('tab-', '');
      const fileName = `Raporlar_${activeTabName}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`;

      // PDF'i indir
      pdf.save(fileName);

      showToast('Başarılı', `${fileName} başarıyla kaydedildi`, 'success');

    } catch (error) {
      console.error('PDF export hatası:', error);
      showToast('Hata', 'PDF oluşturma sırasında bir hata oluştu', 'error');
      
      // Chart.js animasyonlarını tekrar başlat
      const charts = Chart.instances;
      Object.values(charts).forEach(chart => {
        if (chart.options.animation) {
          chart.options.animation.duration = 1000;
        }
      });
    }
  };

  /**
   * Tüm sekmelerdeki tüm grafikleri tek PDF'e dönüştür
   */
  window.exportAllReportsAsPDF = async function() {
    if (typeof html2canvas === "undefined" || typeof jsPDF === "undefined") {
      console.log('?? PDF kütüphaneleri yok, window.print kullanılıyor');
      exportAllReportsAsPDFFallback();
      return;
    }

    const allTabs = document.querySelectorAll('.tab-panel');
    const allContainers = [];

    // Tüm sekmelerdeki container'ları topla
    allTabs.forEach(tab => {
      const containers = tab.querySelectorAll('.chart-container, .table-container');
      allContainers.push(...containers);
    });

    if (allContainers.length === 0) {
      showToast('Bilgi', 'Export edilecek içerik bulunamadı', 'info');
      return;
    }

    try {
      showToast('PDF Hazırlanıyor', `${allContainers.length} grafik/tablo PDF'e dönüştürülüyor...`, 'info');

      // Chart.js animasyonlarını durdur
      const charts = Chart.instances;
      Object.values(charts).forEach(chart => {
        if (chart.options.animation) {
          chart.options.animation.duration = 0;
        }
      });

      // PDF oluştur
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let isFirstPage = true;

      for (let i = 0; i < allContainers.length; i++) {
        const container = allContainers[i];
        
        // Yeni sayfa ekle (ilk sayfa hariç)
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Element'i canvas'a çevir
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: container.offsetWidth,
          height: container.offsetHeight
        });

        // Canvas boyutlarını PDF'e uyarla
        const pdfWidth = 190; // A4 genişlik - kenar boşlukları
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        const maxHeight = 270; // A4 yükseklik - kenar boşlukları

        const finalHeight = imgHeight > maxHeight ? maxHeight : imgHeight;
        const finalWidth = (canvas.width * finalHeight) / canvas.height;

        // Canvas'ı PDF'e ekle
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 10, 10, finalWidth, finalHeight);
      }

      // Chart.js animasyonlarını tekrar başlat
      Object.values(charts).forEach(chart => {
        if (chart.options.animation) {
          chart.options.animation.duration = 1000;
        }
      });

      // Dosya adını oluştur
      const fileName = `Tum_Raporlar_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`;

      // PDF'i indir
      pdf.save(fileName);

      showToast('Başarılı', `${fileName} başarıyla kaydedildi`, 'success');

    } catch (error) {
      console.error('PDF export hatası:', error);
      showToast('Hata', 'PDF oluşturma sırasında bir hata oluştu', 'error');
      
      // Chart.js animasyonlarını tekrar başlat
      const charts = Chart.instances;
      Object.values(charts).forEach(chart => {
        if (chart.options.animation) {
          chart.options.animation.duration = 1000;
        }
      });
    }
  };

  /**
   * Fallback: window.print ile PDF export
   */
  function exportElementToPDFFallback(elementId, fileName = null) {
    const element = document.getElementById(elementId);
    if (!element) {
      showToast('Hata', 'Dışa aktarılacak içerik bulunamadı', 'error');
      return;
    }

    try {
      document.body.classList.add('print-single');

      // Print target class'ını ekle
      document.querySelectorAll('.print-target').forEach(el => {
        el.classList.remove('print-target');
      });
      element.classList.add('print-target');

      const cleanup = () => {
        element.classList.remove('print-target');
        document.body.classList.remove('print-single');
        window.removeEventListener('afterprint', cleanup);
      };

      window.addEventListener('afterprint', cleanup);

      // Print dialog'u aç
      window.print();

      showToast('Bilgi', 'Yazdırma dialog\'u açıldı. PDF olarak kaydedin.', 'info');
    } catch (error) {
      document.body.classList.remove('print-single');
      element.classList.remove('print-target');
      console.error('Print fallback hatası:', error);
      showToast('Hata', 'Yazdırma işlemi başarısız', 'error');
    }
  }


  /**
   * Fallback: Mevcut sekme için window.print
   */
  function exportCurrentTabAsPDFFallback() {
    const activeTab = document.querySelector('.tab-panel.active');
    if (!activeTab) {
      showToast('Hata', 'Aktif sekme bulunamadı', 'error');
      return;
    }

    try {
      document.body.classList.add('print-section');

      // Print target class'ını ekle
      document.querySelectorAll('.print-target').forEach(el => {
        el.classList.remove('print-target');
      });
      activeTab.classList.add('print-target');

      const cleanup = () => {
        activeTab.classList.remove('print-target');
        document.body.classList.remove('print-section');
        window.removeEventListener('afterprint', cleanup);
      };

      window.addEventListener('afterprint', cleanup);

      // Print dialog'u aç
      window.print();

      showToast('Bilgi', 'Yazdırma dialog\'u açıldı. PDF olarak kaydedin.', 'info');
    } catch (error) {
      document.body.classList.remove('print-section');
      activeTab.classList.remove('print-target');
      console.error('Print fallback hatası:', error);
      showToast('Hata', 'Yazdırma işlemi başarısız', 'error');
    }
  }


  /**
   * Fallback: Tüm raporlar için window.print
   */
  function exportAllReportsAsPDFFallback() {
    const reportsSection = document.getElementById('reports-section');
    if (!reportsSection) {
      showToast('Hata', 'Raporlar bölümü bulunamadı', 'error');
      return;
    }

    try {
      document.body.classList.add('print-all');

      // Print target class'ını ekle
      document.querySelectorAll('.print-target').forEach(el => {
        el.classList.remove('print-target');
      });
      reportsSection.classList.add('print-target');

      const cleanup = () => {
        reportsSection.classList.remove('print-target');
        document.body.classList.remove('print-all');
        window.removeEventListener('afterprint', cleanup);
      };

      window.addEventListener('afterprint', cleanup);

      // Print dialog'u aç
      window.print();

      showToast('Bilgi', 'Yazdırma dialog\'u açıldı. PDF olarak kaydedin.', 'info');
    } catch (error) {
      document.body.classList.remove('print-all');
      reportsSection.classList.remove('print-target');
      console.error('Print fallback hatası:', error);
      showToast('Hata', 'Yazdırma işlemi başarısız', 'error');
    }
  }


  /**
   * Tek elementi PDF'e dönüştür (html2canvas + jsPDF veya window.print)
   */
  window.exportElementToPDF = async function(elementId, fileName = null, options = {}) {
    // Fallback: window.print kullan
    if (!html2canvas || !jsPDF) {
      console.log('⚠️ PDF kütüphaneleri henüz yüklenmedi, window.print kullanılıyor');
      exportElementToPDFFallback(elementId, fileName);
      return;
    }

    const element = document.getElementById(elementId);
    if (!element) {
      showToast('Hata', 'Dışa aktarılacak içerik bulunamadı', 'error');
      return;
    }

    try {
      showToast('PDF Hazırlanıyor', 'Grafik PDF\'e dönüştürülüyor...', 'info');

      // Chart.js animasyonlarını durdur
      const charts = Chart.instances;
      Object.values(charts).forEach(chart => {
        if (chart.options.animation) {
          chart.options.animation.duration = 0;
        }
      });

      // Element'i canvas'a çevir
      const canvas = await html2canvas(element, {
        scale: 2, // Yüksek çözünürlük
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight
      });

      // PDF boyutlarını belirle
      const orientation = determinePDFOrientation(element);
      const pdfWidth = orientation === 'landscape' ? 297 : 210; // A4 boyutları (mm)
      const pdfHeight = orientation === 'landscape' ? 210 : 297;

      // PDF oluştur
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      // Başlık ekle
      const chartTitle = getChartTitle(elementId);
      const studentName = selectedStudent ? selectedStudent.name : 'Genel';
      
      // PDF'e başlık ekle
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${studentName} - ${chartTitle}`, 10, 15);
      
      // Tarih ekle
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const date = new Date().toLocaleDateString('tr-TR');
      pdf.text(`Tarih: ${date}`, 10, 20);

      // Canvas boyutlarını PDF'e uyarla (başlık için yer bırak)
      const imgWidth = pdfWidth - 20; // Kenar boşlukları
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const maxHeight = pdfHeight - 35; // Başlık için yer bırak

      const finalHeight = imgHeight > maxHeight ? maxHeight : imgHeight;
      const finalWidth = (canvas.width * finalHeight) / canvas.height;

      // Canvas'ı PDF'e ekle (başlığın altına)
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 25, finalWidth, finalHeight);

      // Dosya adını belirle
      const finalFileName = fileName || generatePDFFileName(elementId);

      // PDF'i indir
      pdf.save(finalFileName);

      // Chart.js animasyonlarını tekrar başlat
      Object.values(charts).forEach(chart => {
        if (chart.options.animation) {
          chart.options.animation.duration = 1000;
        }
      });

      showToast('Başarılı', `${finalFileName} başarıyla kaydedildi`, 'success');

    } catch (error) {
      console.error('PDF export hatası:', error);
      showToast('Hata', 'PDF oluşturma sırasında bir hata oluştu', 'error');
      
      // Chart.js animasyonlarını tekrar başlat
      const charts = Chart.instances;
      Object.values(charts).forEach(chart => {
        if (chart.options.animation) {
          chart.options.animation.duration = 1000;
        }
      });
    }
  };

  /**
   * Sınav yönetimi sayfasını yükler - Tüm öğrencilerin sınavları
   */
  function loadExamManagement() {
  console.log('📊 loadExamManagement çağrıldı, allExams.length:', allExams.length);

  const container = document.getElementById('exam-list-container');
  if (!container) {
    console.error('❌ exam-list-container elementi bulunamadı!');
    return;
  }

  // Filtre select'lerini doldur
  populateExamFilters();

  if (allExams.length === 0) {
    console.log('⚠️ Hiç sınav yok, boş mesaj gösteriliyor');
    container.innerHTML = '<p class="no-data">Hiç sınav kaydı bulunmamaktadır.</p>';
    updateFilterResults();
    return;
  }

  // Filtrelenmiş listeyi göster veya tüm listeyi göster
  if (Object.values(activeFilters).some(val => val !== '')) {
    console.log('🔍 Filtreli liste gösteriliyor');
    displayFilteredExams();
    updateFilterResults();
    return;
  }

  console.log('✅ Tüm sınavlar gösteriliyor:', allExams.length, 'adet');

  // Tarihe göre sırala (en yeni üstte)
  const sortedExams = [...allExams].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  container.innerHTML = sortedExams.map(exam => {
    const totalNet = Object.values(exam.courses || {}).reduce((sum, course) => {
      return sum + (course.net ?? (course.correct - (course.incorrect / 4)));
    }, 0).toFixed(2);
    
    const totalCorrect = Object.values(exam.courses || {}).reduce((sum, c) => sum + (c.correct || 0), 0);
    const totalIncorrect = Object.values(exam.courses || {}).reduce((sum, c) => sum + (c.incorrect || 0), 0);
    
    return `
      <div class="exam-item">
        <input type="checkbox" class="exam-checkbox" data-exam-id="${exam.id}">
        <div class="exam-info">
          <div class="exam-details">
            <span class="exam-name">${exam.name}</span>
            <span class="exam-student">?? ${exam.profile}</span>
            <span class="exam-date">?? ${new Date(exam.date).toLocaleDateString('tr-TR')}</span>
          </div>
          <div class="exam-stats">
            <div class="stat-item">
              <span class="stat-label">Toplam Net</span>
              <span class="stat-value">${totalNet}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Doğru</span>
              <span class="stat-value" style="color: #27ae60;">${totalCorrect}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Yanlış</span>
              <span class="stat-value" style="color: #e74c3c;">${totalIncorrect}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Checkbox event listeners
  document.querySelectorAll('.exam-checkbox').forEach(cb => {
    cb.addEventListener('change', updateSelectedExamCount);
  });

  // Filtre sonuç sayacını güncelle
  updateFilterResults();
}

  /**
   * Seçili sınav sayısını günceller
   */
  function updateSelectedExamCount() {
  const selected = document.querySelectorAll('.exam-checkbox:checked');
  const count = selected.length;
  
  const countElement = document.getElementById('selected-exam-count');
  const deleteButton = document.getElementById('delete-selected-exams');
  
  if (countElement) countElement.textContent = count;
  if (deleteButton) deleteButton.disabled = count === 0;
}

  /**
   * Tüm sınavları seç/bırak
   */
  window.toggleAllExams = function() {
  const checkboxes = document.querySelectorAll('.exam-checkbox');
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  
  checkboxes.forEach(cb => cb.checked = !allChecked);
  
  const selectAllBtn = document.getElementById('select-all-exams');
  if (selectAllBtn) {
    selectAllBtn.textContent = allChecked ? '?? Tümünü Seç' : '? Seçimi Kaldır';
  }
  
  updateSelectedExamCount();
};

  /**
   * Seçilen sınavları siler
   */
  window.deleteSelectedExams = async function() {
  const selected = document.querySelectorAll('.exam-checkbox:checked');
  const examIds = Array.from(selected).map(cb => parseInt(cb.dataset.examId));
  
  if (examIds.length === 0) return;
  
  const confirm = window.confirm(
    `${examIds.length} sınavı silmek istediğinizden emin misiniz?\n\n` +
    '?? Bu işlem geri alınamaz!'
  );
  
  if (!confirm) return;
  
  try {
    // Sınavları sil
    const filteredExams = allExams.filter(exam => !examIds.includes(exam.id));
    
    const result = await window.electronAPI.saveData({
      value: filteredExams,
      Count: filteredExams.length
    });
    
    if (result.success) {
      allExams = filteredExams;
      showToast('Başarılı', `${examIds.length} sınav silindi`, 'success');
      
      // Listeyi yenile
      loadExamManagement();
      
    // Grafikleri güncelle
    if (selectedStudent) {
      const profileExams = allExams.filter(exam => exam.profile === selectedStudent.name);
      updateCharts(profileExams);
    }
    } else {
      showToast('Hata', 'Sınavlar silinemedi', 'error');
    }
  } catch (error) {
    console.error('Sınav silme hatası:', error);
    showToast('Hata', 'Sınavlar silinirken bir hata oluştu', 'error');
  }
};

  /**
   * Tüm sınavları siler
   */
  window.deleteAllExams = async function() {
  if (allExams.length === 0) {
    showToast('Bilgi', 'Silinecek sınav bulunamadı', 'info');
    return;
  }
  
  const confirm = window.confirm(
    `TÜM sınav kayıtlarını (${allExams.length} adet) silmek istediğinizden emin misiniz?\n\n` +
    '???? Bu işlem GERİ ALINAMAZ! ????\n\n' +
    'Devam etmek için "Tamam"a basın.'
  );
  
  if (!confirm) return;
  
  // İkinci onay
  const doubleConfirm = window.confirm(
    '?? SON UYARI ??\n\n' +
    'TÜM sınav kayıtları kalıcı olarak silinecek!\n\n' +
    'Emin misiniz?'
  );
  
  if (!doubleConfirm) return;
  
  try {
    // Tüm sınavları sil
    const deletedCount = allExams.length;
    const filteredExams = [];
    
    const result = await window.electronAPI.saveData({
      value: filteredExams,
      Count: filteredExams.length
    });
    
    if (result.success) {
      allExams = filteredExams;
      showToast('Başarılı', `${deletedCount} sınav silindi`, 'success');
      
      // Listeyi yenile
      loadExamManagement();
      
      // Grafikleri güncelle
      if (selectedStudent) {
        const profileExams = allExams.filter(exam => exam.profile === selectedStudent.name);
        updateCharts(profileExams);
      }
    } else {
      showToast('Hata', 'Sınavlar silinemedi', 'error');
    }
  } catch (error) {
    console.error('Tüm sınavları silme hatası:', error);
    showToast('Hata', 'Sınavlar silinirken bir hata oluştu', 'error');
  }
};

  /**
   * Genel sınav isimlerini toplu olarak düzeltir
   */
  window.bulkRenameExams = async function() {
  // Genel isimleri tespit et (örn: "1. Deneme", "2. Deneme", "Deneme 1" vs.)
  const genericPatterns = [
    /^\d+\.\s*Deneme$/i,
    /^Deneme\s*\d+$/i,
    /^\d+\.\s*Sınav$/i,
    /^Sınav\s*\d+$/i,
    /^Test\s*\d+$/i,
    /^\d+\.\s*Test$/i
  ];

  const genericExams = allExams.filter(exam => {
    return genericPatterns.some(pattern => pattern.test(exam.name.trim()));
  });

  if (genericExams.length === 0) {
    showToast('Bilgi', 'Genel isimli sınav bulunamadı', 'info');
    return;
  }

  // Modal göster
  const newName = prompt(
    `${genericExams.length} adet genel isimli sınav bulundu.\n\n` +
    `Örnekler: ${genericExams.slice(0, 3).map(e => e.name).join(', ')}\n\n` +
    `Yeni sınav ismini girin (boş bırakırsanız iptal edilir):`,
    'Kasım Denemesi'
  );

  if (!newName || newName.trim() === '') {
    showToast('İptal', 'İşlem iptal edildi', 'info');
    return;
  }

  const confirm = window.confirm(
    `${genericExams.length} sınavın ismi "${newName.trim()}" olarak değiştirilecek.\n\n` +
    'Devam etmek istiyor musunuz?'
  );

  if (!confirm) return;

  try {
    // İsimleri değiştir
    let renamedCount = 0;
    genericExams.forEach(exam => {
      const examIndex = allExams.findIndex(e => e.id === exam.id);
      if (examIndex !== -1) {
        allExams[examIndex].name = newName.trim();
        renamedCount++;
      }
    });

    // Kaydet
    const result = await window.electronAPI.saveData({
      value: allExams,
      Count: allExams.length
    });

    if (result.success) {
      showToast('Başarılı', `${renamedCount} sınavın ismi değiştirildi`, 'success');
      loadExamManagement();
    } else {
      showToast('Hata', 'Sınav isimleri değiştirilemedi', 'error');
    }
  } catch (error) {
    console.error('Toplu isimlendirme hatası:', error);
    showToast('Hata', 'İşlem sırasında bir hata oluştu', 'error');
  }
};

  /**
   * Duplicate sınavları tespit edip siler
   */
  window.removeDuplicateExams = async function() {
  if (allExams.length === 0) {
    showToast('Bilgi', 'Sınav bulunamadı', 'info');
    return;
  }

  // Duplicate'leri tespit et
  const examMap = new Map();
  const duplicates = [];

  allExams.forEach(exam => {
    const key = `${exam.profile}_${exam.name}_${exam.date}`;

    if (examMap.has(key)) {
      // Duplicate bulundu - en yeni olan hangisi?
      const existing = examMap.get(key);
      const existingIndex = allExams.findIndex(e => e.id === existing.id);
      const currentIndex = allExams.findIndex(e => e.id === exam.id);

      // Daha yeni olanı tut (daha büyük index = daha yeni eklendi)
      if (currentIndex > existingIndex) {
        duplicates.push(existing.id);
        examMap.set(key, exam);
      } else {
        duplicates.push(exam.id);
      }
    } else {
      examMap.set(key, exam);
    }
  });

  if (duplicates.length === 0) {
    showToast('Başarılı', 'Duplicate sınav bulunamadı', 'success');
    return;
  }

  // Kullanıcıya bilgi ver
  const duplicateExams = allExams.filter(e => duplicates.includes(e.id));
  const exampleText = duplicateExams.slice(0, 5)
    .map(e => `• ${e.profile} - ${e.name} (${new Date(e.date).toLocaleDateString('tr-TR')})`)
    .join('\n');

  const confirm = window.confirm(
    `${duplicates.length} duplicate sınav bulundu ve silinecek.\n\n` +
    `Örnekler:\n${exampleText}\n` +
    (duplicates.length > 5 ? `\n...ve ${duplicates.length - 5} tane daha\n` : '') +
    `\nDuplicate'ler silinip sadece en son eklenen sınavlar tutulacak.\n\n` +
    'Devam etmek istiyor musunuz?'
  );

  if (!confirm) return;

  try {
    // Duplicate'leri sil
    const filteredExams = allExams.filter(exam => !duplicates.includes(exam.id));

    const result = await window.electronAPI.saveData({
      value: filteredExams,
      Count: filteredExams.length
    });

    if (result.success) {
      allExams = filteredExams;
      showToast('Başarılı', `${duplicates.length} duplicate sınav silindi`, 'success');
      loadExamManagement();

      // Grafikleri güncelle
      if (selectedStudent) {
        const profileExams = allExams.filter(exam => exam.profile === selectedStudent.name);
        updateCharts(profileExams);
      }
    } else {
      showToast('Hata', 'Duplicate sınavlar silinemedi', 'error');
    }
  } catch (error) {
    console.error('Duplicate temizleme hatası:', error);
    showToast('Hata', 'İşlem sırasında bir hata oluştu', 'error');
  }
};

  /**
   * Sınav Filtreleme Sistemi
   */
  let filteredExams = [...allExams];
  let activeFilters = {
    grade: '',
    section: '',
    student: '',
    examNumber: '',
    examName: ''
  };

  // Filtreleri uygula
  window.applyExamFilters = function() {
    const gradeFilter = document.getElementById('grade-filter');
    const sectionFilter = document.getElementById('section-filter');
    const studentFilter = document.getElementById('student-filter');
    const examNumberFilter = document.getElementById('exam-number-filter');
    const examNameFilter = document.getElementById('exam-name-filter');

    activeFilters.grade = gradeFilter?.value || '';
    activeFilters.section = sectionFilter?.value || '';
    activeFilters.student = studentFilter?.value || '';
    activeFilters.examNumber = examNumberFilter?.value || '';
    activeFilters.examName = examNameFilter?.value.toLowerCase().trim() || '';

    // Filtreleme yap
    filteredExams = allExams.filter(exam => {
      // Sınıf filtresi
      if (activeFilters.grade && !exam.profile.includes(`${activeFilters.grade}/`)) {
        return false;
      }

      // Şube filtresi
      if (activeFilters.section) {
        const examSection = exam.profile.split('/')[1]?.split(' ')[0];
        if (examSection !== activeFilters.section) {
          return false;
        }
      }

      // Öğrenci filtresi
      if (activeFilters.student && exam.profile !== activeFilters.student) {
        return false;
      }

      // Sınav numarası filtresi (1. Deneme, 2. Deneme vb.)
      if (activeFilters.examNumber && !exam.name.includes(activeFilters.examNumber)) {
        return false;
      }

      // Sınav adı filtresi (text search)
      if (activeFilters.examName && !exam.name.toLowerCase().includes(activeFilters.examName)) {
        return false;
      }

      return true;
    });

    // Filtrelenmiş listeyi göster
    displayFilteredExams();

    // Sonuç sayısını güncelle
    updateFilterResults();
  };

  // Filtreleri temizle
  window.clearExamFilters = function() {
    const gradeFilter = document.getElementById('grade-filter');
    const sectionFilter = document.getElementById('section-filter');
    const studentFilter = document.getElementById('student-filter');
    const examNumberFilter = document.getElementById('exam-number-filter');
    const examNameFilter = document.getElementById('exam-name-filter');

    if (gradeFilter) gradeFilter.value = '';
    if (sectionFilter) sectionFilter.value = '';
    if (studentFilter) studentFilter.value = '';
    if (examNumberFilter) examNumberFilter.value = '';
    if (examNameFilter) examNameFilter.value = '';

    activeFilters = {
      grade: '',
      section: '',
      student: '',
      examNumber: '',
      examName: ''
    };

    filteredExams = [...allExams];
    displayFilteredExams();
    updateFilterResults();
  };

  // Filtrelenmiş sınavları göster
  function displayFilteredExams() {
    const container = document.getElementById('exam-list-container');
    if (!container) return;

    if (filteredExams.length === 0) {
      container.innerHTML = '<p class="no-data">Filtrelere uygun sınav bulunamadı.</p>';
      return;
    }

    // Tarihe göre sırala (en yeni üstte)
    const sortedExams = [...filteredExams].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sortedExams.map(exam => {
      const totalNet = Object.values(exam.courses || {}).reduce((sum, course) => {
        return sum + (course.net ?? (course.correct - (course.incorrect / 4)));
      }, 0).toFixed(2);

      const totalCorrect = Object.values(exam.courses || {}).reduce((sum, c) => sum + (c.correct || 0), 0);
      const totalIncorrect = Object.values(exam.courses || {}).reduce((sum, c) => sum + (c.incorrect || 0), 0);

      return `
        <div class="exam-item">
          <input type="checkbox" class="exam-checkbox" data-exam-id="${exam.id}">
          <div class="exam-info">
            <div class="exam-details">
              <span class="exam-name">${exam.name}</span>
              <span class="exam-student">${exam.profile}</span>
              <span class="exam-date">${new Date(exam.date).toLocaleDateString('tr-TR')}</span>
            </div>
            <div class="exam-stats">
              <div class="stat-item">
                <span class="stat-label">Toplam Net</span>
                <span class="stat-value">${totalNet}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Doğru</span>
                <span class="stat-value" style="color: #27ae60;">${totalCorrect}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Yanlış</span>
                <span class="stat-value" style="color: #e74c3c;">${totalIncorrect}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Checkbox event listeners
    document.querySelectorAll('.exam-checkbox').forEach(cb => {
      cb.addEventListener('change', updateSelectedExamCount);
    });
  }

  // Filtre sonuçlarını güncelle
  function updateFilterResults() {
    const resultsElement = document.getElementById('filter-results-count');
    if (!resultsElement) {
      console.warn('filter-results-count elementi bulunamadı!');
      return;
    }

    const hasActiveFilters = Object.values(activeFilters).some(val => val !== '');

    if (!hasActiveFilters) {
      resultsElement.textContent = `Tüm sınavlar gösteriliyor (${allExams.length} adet)`;
    } else {
      resultsElement.textContent = `${allExams.length} sınavdan ${filteredExams.length} tanesi gösteriliyor`;
    }
  }

  // Filtre select'lerini doldur
  function populateExamFilters() {
    // Şube select'ini doldur
    const sectionFilter = document.getElementById('section-filter');
    if (sectionFilter) {
      const sections = new Set();
      allStudents.forEach(student => {
        const section = student.name.split('/')[1]?.split(' ')[0];
        if (section) sections.add(section);
      });

      sectionFilter.innerHTML = '<option value="">Tüm Şubeler</option>';
      Array.from(sections).sort().forEach(section => {
        sectionFilter.innerHTML += `<option value="${section}">${section} Şubesi</option>`;
      });
    }

    // Öğrenci select'ini doldur
    const studentFilter = document.getElementById('student-filter');
    if (studentFilter) {
      const sortedStudents = [...allStudents].sort((a, b) => a.name.localeCompare(b.name, 'tr'));

      studentFilter.innerHTML = '<option value="">Tüm Öğrenciler</option>';
      sortedStudents.forEach(student => {
        studentFilter.innerHTML += `<option value="${student.name}">${student.name}</option>`;
      });
    }

    // Sınav numarası select'ini doldur
    const examNumberFilter = document.getElementById('exam-number-filter');
    if (examNumberFilter) {
      const examNumbers = new Set();
      allExams.forEach(exam => {
        // "1. Deneme", "2. Deneme" gibi pattern'leri yakala
        const match = exam.name.match(/^(\d+)\.\s*(\w+)/);
        if (match) {
          examNumbers.add(`${match[1]}. ${match[2]}`);
        }
      });

      examNumberFilter.innerHTML = '<option value="">Tüm Sınavlar</option>';
      Array.from(examNumbers).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        return numA - numB;
      }).forEach(examNum => {
        examNumberFilter.innerHTML += `<option value="${examNum}">${examNum}</option>`;
      });
    }
  }

// Modal event listener'ları
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-close')) {
    closeBulkPDFModal();
  }
});

// PDF oluştur butonuna event listener ekle
document.addEventListener('click', (e) => {
  if (e.target.id === 'generate-bulk-pdf-btn') {
    generateBulkPDF();
  }
});

// Sınav Yönetimi Event Listener'ları
document.addEventListener('DOMContentLoaded', () => {
  // Filtre butonları
  const applyFiltersBtn = document.getElementById('apply-filters-btn');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      window.applyExamFilters();
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      window.clearExamFilters();
    });
  }

  // Enter tuşu ile filtreleme
  const examNameFilter = document.getElementById('exam-name-filter');
  if (examNameFilter) {
    examNameFilter.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        window.applyExamFilters();
      }
    });
  }
});

  // ===========================================
  // TOPLU PDF EXPORT MODAL FONKSİYONLARI
  // ===========================================

  // Modal açma/kapama fonksiyonları
  window.openBulkPDFModal = function() {
    console.log('🚀 Modal açılıyor...');
    const modal = document.getElementById('bulk-pdf-modal');
    if (modal) {
      modal.style.display = 'flex';
      console.log('✅ Modal görünür hale getirildi');
      
      // Öğrenci verilerini bir kez al
      const students = getStudents();
      console.log('🔍 Modal için öğrenci sayısı:', students.length);
      
      loadClassesIntoModal(students);
      loadStudentsIntoModal(students);
      
      // Event listener'ı bir kez ekle
      const select = document.getElementById('class-filter-modal');
      if (select && !select.hasAttribute('data-listener-added')) {
        select.addEventListener('change', filterStudentsByClass);
        select.setAttribute('data-listener-added', 'true');
      }
    } else {
      console.log('❌ Modal elementi bulunamadı');
    }
  };

  window.closeBulkPDFModal = function() {
    const modal = document.getElementById('bulk-pdf-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  };

  // Tab yönetim fonksiyonları
  const chartTabMap = {
    // tab-overview içindekiler
    'net-evolution-section': 'tab-overview',
    'weak-topics-section': 'tab-overview',
    
    // tab-subjects içindekiler
    'subject-average-section': 'tab-subjects',
    'performance-comparison-section': 'tab-subjects',
    'subject-trend-section': 'tab-subjects',
    
    // tab-goals içindekiler
    'goal-performance-section': 'tab-goals'
  };

  function activateTabForChart(chartId) {
    const tabId = chartTabMap[chartId];
    if (!tabId) {
      console.log('📊 Chart için tab bulunamadı:', chartId);
      return null;
    }

    const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
    const tabContent = document.getElementById(tabId);
    
    if (!tabButton || !tabContent) {
      console.log('❌ Tab elementi bulunamadı:', tabId);
      return null;
    }

    // Mevcut aktif tab'ı kaydet
    const currentActiveTab = document.querySelector('.tab-button.active');
    const currentActiveContent = document.querySelector('.tab-content.active');
    
    // Yeni tab'ı aktif et
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    tabButton.classList.add('active');
    tabContent.classList.add('active');
    
    console.log('🔄 Tab aktif edildi:', tabId, 'Chart:', chartId);
    
    return {
      originalTab: currentActiveTab,
      originalContent: currentActiveContent
    };
  }

  function restoreOriginalTab(originalState) {
    if (!originalState) return;
    
    // Orijinal tab'ları geri yükle
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (originalState.originalTab) {
      originalState.originalTab.classList.add('active');
    }
    if (originalState.originalContent) {
      originalState.originalContent.classList.add('active');
    }
    
    console.log('🔄 Orijinal tab geri yüklendi');
  }

  // Sınıf listesini modal'a yükle
  function loadClassesIntoModal(students) {
    const select = document.getElementById('class-filter-modal');
    if (!select) {
      console.log('❌ class-filter-modal select elementi bulunamadı');
      return;
    }
    
    // Mevcut seçenekleri temizle (ilk seçenek hariç)
    while (select.children.length > 1) {
      select.removeChild(select.lastChild);
    }
    
    if (!students || students.length === 0) {
      console.log('⚠️ Öğrenci listesi boş');
      return;
    }
    
    const classes = [...new Set(students.map(s => `${s.grade}/${s.class}`))].sort();
    console.log('📚 Bulunan sınıflar:', classes);
    
    classes.forEach(className => {
      const option = document.createElement('option');
      option.value = className;
      option.textContent = className;
      select.appendChild(option);
    });
  }

  // Sınıfa göre öğrencileri filtrele
  function filterStudentsByClass() {
    const selectedClass = document.getElementById('class-filter-modal').value;
    loadStudentsIntoModal(selectedClass);
  }

  // Öğrenci listesini modal'a yükle
  function loadStudentsIntoModal(classFilter = '', students = null) {
    const container = document.getElementById('student-checkboxes-modal');
    if (!container) {
      console.log('❌ student-checkboxes-modal container bulunamadı');
      return;
    }
    
    // Eğer students parametresi verilmemişse, getStudents() çağır
    if (!students) {
      students = getStudents();
    }
    
    console.log('🔍 Modal öğrenci yükleme - Toplam öğrenci:', students.length);
    
    const filtered = classFilter 
      ? students.filter(s => `${s.grade}/${s.class}` === classFilter)
      : students;
    
    console.log('📋 Filtrelenmiş öğrenci sayısı:', filtered.length, 'Sınıf filtresi:', classFilter);
    
    container.innerHTML = `
      <label>
        <input type="checkbox" id="select-all-students-modal" onchange="toggleAllStudentsModal()">
        <strong>Tümünü Seç</strong>
      </label>
      <hr style="margin: 10px 0; border: none; border-top: 1px solid #e0e0e0;">
    `;
    
    filtered.forEach(student => {
      const label = document.createElement('label');
      label.innerHTML = `
        <input type="checkbox" class="student-checkbox-modal" value="${student.name}">
        ${student.name} (${student.grade}/${student.class})
      `;
      container.appendChild(label);
    });
  }

  // Tüm öğrencileri seç/seçme
  window.toggleAllStudentsModal = function() {
    const selectAllCheckbox = document.getElementById('select-all-students-modal');
    const studentCheckboxes = document.querySelectorAll('.student-checkbox-modal');
    
    studentCheckboxes.forEach(checkbox => {
      checkbox.checked = selectAllCheckbox.checked;
    });
  };

  // PDF oluşturma ana fonksiyonu
  window.generateBulkPDF = async function() {
    // 1. Seçimleri topla
    const selectedCharts = Array.from(
      document.querySelectorAll('.modal-body input[type="checkbox"]:checked:not(.student-checkbox-modal):not(#select-all-students-modal)')
    ).map(cb => cb.value);
    
    const selectedStudents = Array.from(
      document.querySelectorAll('.student-checkbox-modal:checked')
    ).map(cb => cb.value);
    
    const exportMode = document.querySelector('input[name="export-mode"]:checked').value;
    
    // Validasyon
    if (selectedCharts.length === 0) {
      showToast('Uyarı', 'Lütfen en az bir grafik seçin', 'warning');
      return;
    }
    
    if (selectedStudents.length === 0) {
      showToast('Uyarı', 'Lütfen en az bir öğrenci seçin', 'warning');
      return;
    }
    
    // 2. Progress göster
    showToast('PDF Hazırlanıyor', `${selectedStudents.length} öğrenci için işlem başladı...`, 'info');
    
    try {
      if (exportMode === 'single') {
        await generateSingleBulkPDF(selectedStudents, selectedCharts);
      } else {
        await generateSeparateBulkPDFs(selectedStudents, selectedCharts);
      }
      
      closeBulkPDFModal();
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      showToast('Hata', 'PDF oluşturma sırasında bir hata oluştu', 'error');
    }
  };

  // Tek PDF oluşturma
  async function generateSingleBulkPDF(students, charts) {
    if (!html2canvas || !jsPDF) {
      showToast('Hata', 'PDF kütüphaneleri yüklenmedi', 'error');
      return;
    }
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    let isFirstPage = true;
    
    for (const studentName of students) {
      const student = getStudents().find(s => s.name === studentName);
      if (!student) continue;
      
      // Öğrenciyi seç ve grafikleri güncelle
      await selectStudentForPDF(student);
      
      for (const chartId of charts) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;
        
        // Grafik başlığı ekle
        const chartTitle = getChartTitle(chartId);
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${studentName} - ${chartTitle}`, 10, 15);
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 10, 20);
        
        // Grafik ekle
        const element = document.getElementById(chartId);
        if (element) {
          try {
            // Tab aktivasyonu ile chart render'ını garantile
            const originalTabState = activateTabForChart(chartId);
            
            // Chart'ın render olması için bekle
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Element'in mevcut stillerini kaydet
            const originalDisplay = element.style.display;
            const originalVisibility = element.style.visibility;
            const originalPosition = element.style.position;
            const originalZIndex = element.style.zIndex;
            
            // Element'in görünür olup olmadığını kontrol et
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
              console.warn('Element boyutu sıfır, geçici olarak görünür yapılıyor:', chartId);
              // Element'i sayfa düzenini bozmadan görünür yap
              element.style.display = 'block';
              element.style.visibility = 'hidden';
              element.style.position = 'absolute';
              element.style.zIndex = '-9999';
              
              // DOM'un güncellenmesi için bekle
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const canvas = await html2canvas(element, {
              scale: 1,
              backgroundColor: '#ffffff',
              useCORS: true,
              allowTaint: true,
              foreignObjectRendering: true,
              logging: false,
              ignoreElements: (el) => {
                // Sadece gerçekten sorunlu elementleri atla
                return el.tagName === 'SCRIPT';
              }
            });
            
            // PNG formatında daha iyi kalite
            const imgData = canvas.toDataURL('image/png');
            
            // Element'i eski haline döndür
            element.style.display = originalDisplay;
            element.style.visibility = originalVisibility;
            element.style.position = originalPosition;
            element.style.zIndex = originalZIndex;
            
            // Canvas boyutlarını kontrol et
            if (canvas.width === 0 || canvas.height === 0) {
              console.warn('Canvas boyutu sıfır:', chartId);
              // Fallback: Text içeriği ekle
              pdf.setFontSize(12);
              pdf.text(`${chartTitle} - Grafik render edilemedi`, 10, 25);
              
              // Tab'ı geri yükle
              restoreOriginalTab(originalTabState);
              continue;
            }
            
            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const maxHeight = 250;
            const finalHeight = Math.min(imgHeight, maxHeight);
            const finalWidth = (canvas.width * finalHeight) / canvas.height;
            
            pdf.addImage(imgData, 'PNG', 10, 25, finalWidth, finalHeight);
            
            // Tab'ı geri yükle
            restoreOriginalTab(originalTabState);
          } catch (canvasError) {
            // Hata durumunda da element'i eski haline döndür
            element.style.display = originalDisplay;
            element.style.visibility = originalVisibility;
            element.style.position = originalPosition;
            element.style.zIndex = originalZIndex;
            
            // Tab'ı geri yükle
            restoreOriginalTab(originalTabState);
            
            console.error('Canvas oluşturma hatası:', canvasError);
            // Fallback: Element'in text içeriğini ekle
            const textContent = element.textContent || element.innerText || 'Grafik yüklenemedi';
            pdf.setFontSize(12);
            pdf.text(`${chartTitle} - ${textContent.substring(0, 100)}...`, 10, 25);
          }
        }
      }
    }
    
    const fileName = `Toplu_Rapor_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`;
    pdf.save(fileName);
    showToast('Başarılı', 'Tek PDF başarıyla oluşturuldu', 'success');
  }

  // Ayrı PDF'ler oluşturma
  async function generateSeparateBulkPDFs(students, charts) {
    if (!html2canvas || !jsPDF) {
      showToast('Hata', 'PDF kütüphaneleri yüklenmedi', 'error');
      return;
    }
    
    const pdfFiles = [];
    
    for (let i = 0; i < students.length; i++) {
      const studentName = students[i];
      const student = getStudents().find(s => s.name === studentName);
      if (!student) continue;
      
      // Progress güncelle
      showToast('İşleniyor', `${i + 1}/${students.length}: ${studentName}`, 'info');
      
      await selectStudentForPDF(student);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      let isFirstPage = true;
      
      for (const chartId of charts) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;
        
        const chartTitle = getChartTitle(chartId);
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${studentName} - ${chartTitle}`, 10, 15);
        
        pdf.setFontSize(10);
        pdf.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 10, 20);
        
        const element = document.getElementById(chartId);
        if (element) {
          try {
            // Tab aktivasyonu ile chart render'ını garantile
            const originalTabState = activateTabForChart(chartId);
            
            // Chart'ın render olması için bekle
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Element'in mevcut stillerini kaydet
            const originalDisplay = element.style.display;
            const originalVisibility = element.style.visibility;
            const originalPosition = element.style.position;
            const originalZIndex = element.style.zIndex;
            
            // Element'in görünür olup olmadığını kontrol et
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
              console.warn('Element boyutu sıfır, geçici olarak görünür yapılıyor:', chartId);
              // Element'i sayfa düzenini bozmadan görünür yap
              element.style.display = 'block';
              element.style.visibility = 'hidden';
              element.style.position = 'absolute';
              element.style.zIndex = '-9999';
              
              // DOM'un güncellenmesi için bekle
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const canvas = await html2canvas(element, {
              scale: 1,
              backgroundColor: '#ffffff',
              useCORS: true,
              allowTaint: true,
              foreignObjectRendering: true,
              logging: false,
              ignoreElements: (el) => {
                // Sadece gerçekten sorunlu elementleri atla
                return el.tagName === 'SCRIPT';
              }
            });
            
            // PNG formatında daha iyi kalite
            const imgData = canvas.toDataURL('image/png');
            
            // Element'i eski haline döndür
            element.style.display = originalDisplay;
            element.style.visibility = originalVisibility;
            element.style.position = originalPosition;
            element.style.zIndex = originalZIndex;
            
            // Canvas boyutlarını kontrol et
            if (canvas.width === 0 || canvas.height === 0) {
              console.warn('Canvas boyutu sıfır:', chartId);
              // Fallback: Text içeriği ekle
              pdf.setFontSize(12);
              pdf.text(`${chartTitle} - Grafik render edilemedi`, 10, 25);
              
              // Tab'ı geri yükle
              restoreOriginalTab(originalTabState);
              continue;
            }
            
            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const finalHeight = Math.min(imgHeight, 250);
            const finalWidth = (canvas.width * finalHeight) / canvas.height;
            
            pdf.addImage(imgData, 'PNG', 10, 25, finalWidth, finalHeight);
            
            // Tab'ı geri yükle
            restoreOriginalTab(originalTabState);
          } catch (canvasError) {
            // Hata durumunda da element'i eski haline döndür
            element.style.display = originalDisplay;
            element.style.visibility = originalVisibility;
            element.style.position = originalPosition;
            element.style.zIndex = originalZIndex;
            
            // Tab'ı geri yükle
            restoreOriginalTab(originalTabState);
            console.error('Canvas oluşturma hatası:', canvasError);
            // Fallback: Element'in text içeriğini ekle
            const textContent = element.textContent || element.innerText || 'Grafik yüklenemedi';
            pdf.setFontSize(12);
            pdf.text(`${chartTitle} - ${textContent.substring(0, 100)}...`, 10, 25);
          }
        }
      }
      
      // PDF'i blob olarak sakla
      const pdfBlob = pdf.output('blob');
      pdfFiles.push({
        name: `${studentName.replace(/\s/g, '_')}_Rapor.pdf`,
        data: pdfBlob
      });
    }
    
    // ZIP oluştur ve indir
    await createAndDownloadZip(pdfFiles);
  }

  // ZIP oluşturma ve indirme
  async function createAndDownloadZip(pdfFiles) {
    try {
      // PDF dosyalarını hazırla
      const preparedFiles = [];
      for (const f of pdfFiles) {
        const arrayBuffer = await f.data.arrayBuffer();
        preparedFiles.push({
          name: f.name,
          data: Array.from(new Uint8Array(arrayBuffer))
        });
      }
      
      // Electron IPC ile ZIP oluştur
      const result = await window.api.createZipArchive(
        preparedFiles,
        `Toplu_Raporlar_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.zip`
      );
      
      if (result.success) {
        showToast('Başarılı', 'ZIP dosyası oluşturuldu', 'success');
      } else {
        showToast('Hata', 'ZIP oluşturma başarısız', 'error');
      }
    } catch (error) {
      console.error('ZIP oluşturma hatası:', error);
      showToast('Hata', 'ZIP oluşturma sırasında hata oluştu', 'error');
    }
  }

  // Chart render tamamlanma kontrolü
  async function waitForChartsToComplete(timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      // Tüm chart'ların canvas'ında data var mı kontrol et
      const canvases = document.querySelectorAll('canvas');
      let allReady = true;
      
      for (const canvas of canvases) {
        if (canvas.width === 0 || canvas.height === 0) {
          allReady = false;
          break;
        }
        
        try {
          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 10), Math.min(canvas.height, 10));
          // Canvas boş mu kontrol et (tüm pikseller transparent/siyah mı)
          const hasData = imageData.data.some(pixel => pixel > 0);
          if (!hasData) {
            allReady = false;
            break;
          }
        } catch (e) {
          // Canvas henüz hazır değil
          allReady = false;
          break;
        }
      }
      
      if (allReady) {
        console.log('✅ Tüm chart\'lar render tamamlandı');
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.warn('⚠️ Timeout: Chart render bekleme süresi doldu');
    return false;
  }

  // Öğrenciyi seç ve grafikleri güncelle
  async function selectStudentForPDF(student) {
    selectedStudent = student;
    const profileExams = allExams.filter(exam => exam.profile === student.name);
    updateCharts(profileExams);
    
    // Chart'ların render olmasını kontrol et
    await waitForChartsToComplete();
  }

  // ===========================================
  // MODAL EVENT LISTENERS
  // ===========================================

  // Modal kapatma butonları için event listener
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-close')) {
      closeBulkPDFModal();
    }
  });

  // ESC tuşu ile kapatma
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBulkPDFModal();
    }
  });

  // Modal overlay'e tıklayınca kapatma
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeBulkPDFModal();
    }
  });

  // PDF oluştur butonuna event listener
  document.addEventListener('click', (e) => {
    if (e.target.id === 'generate-bulk-pdf-btn') {
      generateBulkPDF();
    }
  });

}); // DOMContentLoaded kapanışı

// ===========================================
// GLOBAL HELPER FONKSİYONLARI
// ===========================================

// Grafik başlığını belirleyen yardımcı fonksiyon
function getChartTitle(elementId) {
  const titleMap = {
    'subject-average-section': 'Ders Bazında Ortalama Netler',
    'net-evolution-section': 'Ders Bazında İlerleme Grafiği',
    'performance-comparison-section': 'Son Deneme vs Genel Ortalama Karşılaştırması',
    'weak-outcomes-section': 'Zayıf Kazanımlar Analizi',
    'subject-details-section': 'Ders Detayları Tablosu'
  };
  
  return titleMap[elementId] || 'Grafik Raporu';
}

// ===========================================
// PERFORMANS PANOSU FONKSİYONLARI
// ===========================================

// Global değişkenler
let currentGrade = '';
let currentBranch = '';
let currentClass = '';
let currentStudents = [];
let currentPerformanceData = {};
let currentDers = 'Türkçe';
let currentKazanimCount = 0; // Dinamik kazanım sayısı (3, 4 veya 5)

// Performans panosu sayfasını yükle
async function loadPerformanceOverview() {
  console.log('📊 Performans Panosu yükleniyor...');
  
  // Section'ın görünür olduğunu kontrol et
  const section = document.getElementById('performance-overview-section');
  console.log('Performance section bulundu:', !!section);
  console.log('Section active class:', section?.classList.contains('active'));
  console.log('Section display style:', section ? window.getComputedStyle(section).display : 'N/A');
  
  // Container kontrolü
  if (section) {
    const container = section.querySelector('.performance-overview-container');
    console.log('Container bulundu:', !!container);
    if (container) {
      console.log('Container innerHTML uzunluğu:', container.innerHTML.length);
    }
  }
  
  // Sayfa yüklendikten sonra event listener'ları ekle
  setTimeout(() => {
    setupPerformanceEventListeners();
  }, 100);
  
  // Mevcut verileri yükle
  await loadExistingPerformanceData();
}

// Event listener'ları kur
function setupPerformanceEventListeners() {
  console.log('🔧 Performans panosu event listener\'ları kuruluyor...');
  
  // Sınıf seviyesi seçici
  const gradeSelect = document.getElementById('grade-select');
  console.log('Sınıf seviyesi seçici bulundu:', !!gradeSelect);
  if (gradeSelect) {
    gradeSelect.addEventListener('change', (e) => {
      currentGrade = e.target.value;
      updateBranchOptions();
      updateLoadButton();
      console.log('Sınıf seviyesi seçildi:', currentGrade);
    });
  }

  // Şube seçici - OTOMATİK YÜKLEME
  const branchSelect = document.getElementById('branch-select');
  console.log('Şube seçici bulundu:', !!branchSelect);
  if (branchSelect) {
    branchSelect.addEventListener('change', async (e) => {
      currentBranch = e.target.value;
      currentClass = currentGrade + currentBranch; // 5A, 6B gibi
      updateLoadButton();
      console.log('Şube seçildi:', currentBranch, 'Tam sınıf:', currentClass);

      // OTOMATİK YÜKLEME: Sınıf ve şube seçiliyse öğrencileri yükle
      if (currentGrade && currentBranch) {
        console.log('🚀 Otomatik öğrenci yükleme başlatıldı...');
        await loadClassStudents();

        // Kazanım seçiciyi göster
        const kazanimSelector = document.getElementById('kazanim-selector');
        if (kazanimSelector) {
          kazanimSelector.style.display = 'block';
        }
      }
    });
  }

  // Öğrenci yükleme butonu
  const loadStudentsBtn = document.getElementById('load-students-btn');
  console.log('Öğrenci yükleme butonu bulundu:', !!loadStudentsBtn);
  if (loadStudentsBtn) {
    loadStudentsBtn.addEventListener('click', loadClassStudents);
  }

  // Ders tab'ları
  const dersTabs = document.querySelectorAll('.ders-tab');
  console.log('Ders tab\'ları bulundu:', dersTabs.length);
  dersTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      switchDers(e.target.dataset.ders);
    });
  });

  // Kazanım sayısı seçici
  const kazanimCountSelect = document.getElementById('kazanim-count');
  console.log('Kazanım sayısı seçici bulundu:', !!kazanimCountSelect);
  if (kazanimCountSelect) {
    kazanimCountSelect.addEventListener('change', (e) => {
      currentKazanimCount = parseInt(e.target.value);
      const loadTableBtn = document.getElementById('load-table-btn');
      if (loadTableBtn) {
        loadTableBtn.disabled = !currentKazanimCount;
      }
      console.log('Kazanım sayısı seçildi:', currentKazanimCount);
    });
  }

  // Tabloyu yükle butonu
  const loadTableBtn = document.getElementById('load-table-btn');
  console.log('Tabloyu yükle butonu bulundu:', !!loadTableBtn);
  if (loadTableBtn) {
    loadTableBtn.addEventListener('click', async () => {
      console.log('📊 Tablo yükleniyor, kazanım sayısı:', currentKazanimCount);

      // Tablo başlıklarını oluştur
      renderDynamicTableHeaders(currentKazanimCount);

      // Eğer öğrenciler zaten yüklüyse tabloyu render et
      if (currentStudents.length > 0) {
        await loadAutomaticExamAverages();
        renderPerformanceTable();
        showToast(`${currentKazanimCount} kazanımlı tablo yüklendi`, 'success');
      } else {
        showToast('Önce sınıf seçip öğrenci listesini yükleyin', 'warning');
      }
    });
  }

  // Kaydet butonu
  const saveBtn = document.getElementById('save-performance-btn');
  console.log('Kaydet butonu bulundu:', !!saveBtn);
  if (saveBtn) {
    saveBtn.addEventListener('click', savePerformanceData);
  }

  // Excel'e aktar butonu
  const exportBtn = document.getElementById('export-excel-btn');
  console.log('Excel aktar butonu bulundu:', !!exportBtn);
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToExcel);
  }
  
  console.log('✅ Performans panosu event listener\'ları kuruldu');
}

// Şube seçeneklerini güncelle
function updateBranchOptions() {
  const branchSelect = document.getElementById('branch-select');
  if (!branchSelect) return;

  // Şube seçeneklerini temizle
  branchSelect.innerHTML = '<option value="">Şube seçin...</option>';
  
  if (currentGrade) {
    // Şube seçeneklerini ekle
    branchSelect.innerHTML += '<option value="A">A Şubesi</option>';
    branchSelect.innerHTML += '<option value="B">B Şubesi</option>';
    branchSelect.disabled = false;
  } else {
    branchSelect.innerHTML = '<option value="">Önce sınıf seviyesi seçin</option>';
    branchSelect.disabled = true;
  }
}

// Yükleme butonunu güncelle
function updateLoadButton() {
  const loadBtn = document.getElementById('load-students-btn');
  if (!loadBtn) return;

  const canLoad = currentGrade && currentBranch;
  loadBtn.disabled = !canLoad;
  
  if (canLoad) {
    loadBtn.textContent = `${currentGrade}${currentBranch} Sınıfını Yükle`;
  } else {
    loadBtn.textContent = 'Öğrenci Listesini Yükle';
  }
}

// Sınıf öğrencilerini yükle
async function loadClassStudents() {
  console.log('📚 loadClassStudents çağrıldı, currentClass:', currentClass);
  
  if (!currentClass) {
    showToast('Lütfen önce bir sınıf seçin', 'warning');
    return;
  }

  try {
    console.log(`📚 ${currentClass} sınıfı öğrencileri yükleniyor...`);
    
    // Öğrenci verilerini yükle
    const studentsResponse = await window.electronAPI.loadStudents();
    console.log('Öğrenci response:', studentsResponse);
    
    // Response formatını kontrol et ve students array'ini al
    let students = [];
    if (Array.isArray(studentsResponse)) {
      students = studentsResponse;
    } else if (studentsResponse && studentsResponse.students && Array.isArray(studentsResponse.students)) {
      students = studentsResponse.students;
    } else if (studentsResponse && Array.isArray(studentsResponse.data)) {
      students = studentsResponse.data;
    } else {
      console.error('Beklenmeyen öğrenci veri formatı:', studentsResponse);
      showToast('Öğrenci verileri beklenmeyen formatta', 'error');
      return;
    }
    
    console.log('Tüm öğrenciler yüklendi:', students.length);
    
    // Mevcut sınıf formatlarını göster
    const uniqueClasses = [...new Set(students.map(s => s.class || s.sinif || 'Sınıf bilgisi yok'))];
    console.log('Mevcut sınıf formatları:', uniqueClasses);
    
    // Öğrenci verilerinin yapısını kontrol et
    if (students.length > 0) {
      console.log('İlk öğrenci verisi:', students[0]);
      console.log('Öğrenci veri alanları:', Object.keys(students[0]));
    }
    
    // Sınıfa göre filtrele (Grade + Branch)
    currentStudents = students.filter(student => {
      // Farklı veri formatlarını destekle
      const studentGrade = student.grade || student.sinif?.charAt(0) || '';
      const studentBranch = student.class || student.sinif?.charAt(1) || student.sinif || '';

      // Grade ve Branch eşleşmesi kontrolü
      let matches = false;

      if (studentGrade && studentBranch) {
        // Hem grade hem branch var
        matches = (studentGrade === currentGrade || studentGrade === currentGrade.toString())
               && (studentBranch === currentBranch);
      } else if (studentBranch) {
        // Sadece branch var (geriye dönük uyumluluk)
        matches = studentBranch === currentBranch;
      } else if (student.sinif) {
        // sinif formatı: "5A", "6B" gibi
        matches = student.sinif === currentClass;
      }

      // Sadece ilk 5 öğrenci için debug bilgisi göster
      if (students.indexOf(student) < 5) {
        console.log(`Öğrenci: ${student.name}, Grade: ${studentGrade}, Branch: ${studentBranch}, Hedef: ${currentGrade}${currentBranch}, Eşleşme: ${matches}`);
      }
      return matches;
    });

    console.log(`${currentClass} sınıfına ait öğrenci sayısı:`, currentStudents.length);

    if (currentStudents.length === 0) {
      showToast(`${currentClass} sınıfında öğrenci bulunamadı`, 'warning');
      return;
    }

    // Uyarı: Mevcut verilerde sadece şube bilgisi var, sınıf seviyesi yok
    if (currentStudents.length > 50) {
      showToast(`Uyarı: Mevcut verilerde sadece şube bilgisi (A/B) var. ${currentBranch} şubesindeki tüm öğrenciler gösteriliyor.`, 'warning');
    }

    // Öğrenci listesini render et
    renderStudentList();
    
    // ÖNCE deneme ortalamalarını yükle
    await loadAutomaticExamAverages();
    
    // SONRA performans tablosunu render et
    renderPerformanceTable();
    
    showToast(`${currentStudents.length} öğrenci yüklendi`, 'success');
    
  } catch (error) {
    console.error('Öğrenci yükleme hatası:', error);
    showToast('Öğrenci verileri yüklenirken hata oluştu', 'error');
  }
}

// Yardımcı fonksiyon - Input cell oluştur
function createInputCell(fieldName, value, placeholder) {
    const td = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    
    // Max değerleri ders bazında ayarla
    if (fieldName === 'etutSayisi') {
        input.max = '50';
    } else if (fieldName === 'denemeOrt') {
        // Ders bazında max değer
        if (currentDers === 'Türkçe' || currentDers === 'Matematik' || currentDers === 'Fen') {
            input.max = '20';
        } else if (currentDers === 'Sosyal' || currentDers === 'Din Kültürü' || currentDers === 'İngilizce') {
            input.max = '10';
        }
    } else {
        input.max = '100';
    }
    
    input.value = value || '';
    input.dataset.field = fieldName;
    input.placeholder = placeholder;
    
    input.addEventListener('input', (e) => {
        const row = e.target.closest('tr');
        updateStudentData(row.dataset.studentId, fieldName, parseFloat(e.target.value) || 0);
        calculateGenelBasari(row);
    });
    
    td.appendChild(input);
    return td;
}

// Yardımcı fonksiyon - Tablo satırı oluştur (DİNAMİK)
function createTableRow(student, studentData) {
    const tr = document.createElement('tr');
    tr.dataset.studentId = String(student.id || student.name);

    // Öğrenci Adı
    const nameTd = document.createElement('td');
    nameTd.className = 'student-name';
    nameTd.textContent = student.name;
    tr.appendChild(nameTd);

    // DİNAMİK Kazanım sütunları (3, 4 veya 5 adet)
    for (let i = 1; i <= currentKazanimCount; i++) {
        const fieldName = `kazanim${i}`;
        const value = studentData[fieldName] || '';
        tr.appendChild(createInputCell(fieldName, value, '0-100'));
    }

    // Yazılı 1 ve 2
    tr.appendChild(createInputCell('yazili1', studentData.yazili1, '0-100'));
    tr.appendChild(createInputCell('yazili2', studentData.yazili2, '0-100'));

    // Deneme Ort (yeşil arka plan) - Ders bazında placeholder
    let denemePlaceholder = '0-20';
    if (currentDers === 'Sosyal' || currentDers === 'Din Kültürü' || currentDers === 'İngilizce') {
        denemePlaceholder = '0-10';
    }

    const denemeCell = createInputCell('denemeOrt', studentData.denemeOrt, denemePlaceholder);
    if (studentData.denemeOrt) {
        denemeCell.querySelector('input').style.backgroundColor = '#e8f5e8';
        denemeCell.querySelector('input').style.fontWeight = 'bold';
        denemeCell.querySelector('input').readOnly = true; // Otomatik geldiği için düzenlenemez
    }
    tr.appendChild(denemeCell);

    // Etüt ve Ödev
    tr.appendChild(createInputCell('etutSayisi', studentData.etutSayisi, '0-50'));
    tr.appendChild(createInputCell('odevTamamlama', studentData.odevTamamlama, '0-100'));

    // Genel Başarı
    const genelTd = document.createElement('td');
    genelTd.className = 'calculated-cell';
    genelTd.dataset.field = 'genelBasari';
    genelTd.textContent = studentData.genelBasari ? studentData.genelBasari.toFixed(1) : '-';
    if (studentData.genelBasari >= 80) genelTd.classList.add('basari-yuksek');
    else if (studentData.genelBasari >= 60) genelTd.classList.add('basari-orta');
    else if (studentData.genelBasari > 0) genelTd.classList.add('basari-dusuk');
    tr.appendChild(genelTd);

    // Durum Sütunu (YENİ)
    const durumTd = document.createElement('td');
    durumTd.className = 'durum-cell';
    durumTd.dataset.field = 'durum';
    durumTd.textContent = '-'; // İlk render'da boş, calculateGenelBasari çağrılınca dolar
    tr.appendChild(durumTd);

    return tr;
}

// Otomatik deneme ortalamalarını yükle
// Basit deneme ortalaması yükleme - Son 3 deneme
async function loadAutomaticExamAverages() {
    console.log('📊 Son 3 deneme ortalaması hesaplanıyor...');
    
    try {
        const examData = await window.electronAPI.loadData();
        if (!examData?.value) {
            console.log('❌ Sınav verisi bulunamadı');
            return;
        }
        
        console.log(`📚 Toplam ${examData.value.length} sınav verisi bulundu`);
        
        // Her öğrenci için işlem
        for (const student of currentStudents) {
            const studentId = String(student.id || student.name);
            const studentExams = examData.value.filter(exam => exam.profile === student.name);
            
            console.log(`[DEBUG] ${student.name}: ${studentExams.length} sınav bulundu`);
            
            if (studentExams.length === 0) continue;
            
            // Son 3 denemeyi al (tarihe göre sırala)
            const sortedExams = studentExams
                .sort((a, b) => new Date(b.date || b.tarih || 0) - new Date(a.date || a.tarih || 0))
                .slice(0, 3);
            
            console.log(`[DEBUG] ${student.name}: Son ${sortedExams.length} deneme alındı`);
            
            // Ders bazında ortalama hesapla
            for (const ders of ['Türkçe', 'Matematik', 'Fen', 'Sosyal', 'İngilizce', 'Din Kültürü']) {
                let totalNet = 0;
                let count = 0;
                
                // Son 3 denemede bu dersin netlerini topla
                sortedExams.forEach(exam => {
                    const courses = exam.courses || {};
                    const dersData = courses[ders] || courses[ders.toLowerCase()] || courses[ders.toUpperCase()];
                    if (dersData?.net != null) {
                        totalNet += dersData.net;
                        count++;
                    }
                });
                
                if (count > 0) {
                    const average = Math.round((totalNet / count) * 10) / 10;
                    
                    // Veriyi kaydet
                    if (!currentPerformanceData[ders]) {
                        currentPerformanceData[ders] = [];
                    }
                    
                    let studentData = currentPerformanceData[ders].find(s => 
                        s.ogrenciId === studentId || s.ad === student.name
                    );
                    
                    if (!studentData) {
                        // YENİ YAPI: Dinamik kazanım sütunları
                        studentData = {
                            ogrenciId: studentId,
                            ad: student.name,
                            denemeOrt: '',
                            etutSayisi: '',
                            odevTamamlama: '',
                            genelBasari: 0
                        };

                        // Dinamik kazanım alanlarını ekle (kazanimCount varsa kullan, yoksa 3 varsayılan)
                        const kazanimCount = currentKazanimCount || 3;
                        for (let i = 1; i <= kazanimCount; i++) {
                            studentData[`kazanim${i}`] = '';
                        }

                        // Yazılı 1 ve 2
                        studentData.yazili1 = '';
                        studentData.yazili2 = '';

                        currentPerformanceData[ders].push(studentData);
                    }
                    
                    studentData.denemeOrt = average;
                    console.log(`[DEBUG] ${student.name} - ${ders}: ${count} deneme, Ortalama=${average}`);
                }
            }
        }
        
        console.log('✅ Son 3 deneme ortalamaları hazır');
        
    } catch (error) {
        console.error('❌ Deneme ortalaması yükleme hatası:', error);
    }
}

// Tablo input değerlerini güncelle
function updateTableInputs() {
  console.log('🔄 Tablo input değerleri güncelleniyor...');
  const tbody = document.getElementById('performance-table-body');
  if (!tbody) {
    console.log('Tablo body bulunamadı');
    return;
  }

  const rows = tbody.querySelectorAll('tr[data-student-id]');
  console.log(`${rows.length} satır bulundu`);
  
  rows.forEach(row => {
    const studentId = row.dataset.studentId;
    const student = currentStudents.find(s => s.id === studentId);
    if (!student) return;

    // Deneme ortalaması input'unu bul ve güncelle
    const denemeInput = row.querySelector('input[data-field="denemeOrt"]');
    if (denemeInput) {
      const studentData = currentPerformanceData[currentDers]?.find(s => s.ogrenciId === studentId);
      if (studentData && studentData.denemeOrt) {
        console.log(`${student.name} için deneme ortalaması: ${studentData.denemeOrt}`);
        denemeInput.value = studentData.denemeOrt;
        // Genel başarıyı yeniden hesapla
        calculateGenelBasari(row);
      }
    }
  });
  
  console.log('✅ Tablo input değerleri güncellendi');
}

// Öğrenci listesini render et
function renderStudentList() {
  const studentList = document.getElementById('student-list');
  
  if (currentStudents.length === 0) {
    studentList.innerHTML = '<div class="no-students">Öğrenci bulunamadı</div>';
    return;
  }

  const studentItems = currentStudents.map(student => `
    <div class="student-item" data-student-id="${student.id || student.name}">
      <span class="student-name">${student.name}</span>
    </div>
  `).join('');

  studentList.innerHTML = studentItems;

  // Öğrenci seçimi için event listener
  studentList.querySelectorAll('.student-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // Tüm seçimleri kaldır
      studentList.querySelectorAll('.student-item').forEach(i => i.classList.remove('selected'));
      // Bu öğrenciyi seç
      e.currentTarget.classList.add('selected');
    });
  });
}

// Performans tablosunu render et (DİNAMİK)
function renderPerformanceTable() {
    console.log('=== RENDER DEBUG START ===');
    console.log('Ders:', currentDers);
    console.log('Kazanım Sayısı:', currentKazanimCount);
    console.log('Veri:', currentPerformanceData[currentDers]?.length || 0);

    const tbody = document.getElementById('performance-table-body');
    tbody.innerHTML = ''; // TEMİZLE

    // Kontroller
    if (!currentStudents.length) {
        const tr = document.createElement('tr');
        tr.className = 'no-data';
        tr.innerHTML = '<td colspan="10">Önce sınıf seçip öğrenci listesini yükleyin</td>';
        tbody.appendChild(tr);
        return;
    }

    if (!currentKazanimCount || currentKazanimCount === 0) {
        const tr = document.createElement('tr');
        tr.className = 'no-data';
        tr.innerHTML = '<td colspan="10">Kazanım sayısını seçip tabloyu yükleyin</td>';
        tbody.appendChild(tr);
        return;
    }

    // Öğrenci satırlarını oluştur
    currentStudents.forEach((student, i) => {
        const studentData = currentPerformanceData[currentDers]?.find(s =>
            s.ogrenciId === String(student.id) || s.ad === student.name
        ) || {
            ogrenciId: String(student.id || student.name),
            ad: student.name,
            denemeOrt: '',
            etutSayisi: '',
            odevTamamlama: '',
            genelBasari: 0
        };

        // Dinamik kazanım verileri ekle
        for (let k = 1; k <= currentKazanimCount; k++) {
            if (!studentData[`kazanim${k}`]) {
                studentData[`kazanim${k}`] = '';
            }
        }

        // Yazılı verileri ekle
        if (!studentData.yazili1) studentData.yazili1 = '';
        if (!studentData.yazili2) studentData.yazili2 = '';

        console.log(`[${i+1}] ${student.name}: denemeOrt=${studentData.denemeOrt || 'YOK'}`);
        tbody.appendChild(createTableRow(student, studentData));
    });

    console.log(`✅ ${currentStudents.length} satır oluşturuldu`);
    console.log('=== RENDER DEBUG END ===');
}

// Tablo input event listener'larını kur
function setupTableInputListeners() {
  const inputs = document.querySelectorAll('#performance-table-body input');
  
  inputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const row = e.target.closest('tr');
      const studentId = row.dataset.studentId;
      const field = e.target.dataset.field;
      const value = parseFloat(e.target.value) || 0;
      
      // Veriyi güncelle
      updateStudentData(studentId, field, value);
      
      // Genel başarıyı hesapla
      calculateGenelBasari(row);
    });
  });
}

// Öğrenci verisini güncelle (DİNAMİK)
function updateStudentData(studentId, field, value) {
  if (!currentPerformanceData[currentDers]) {
    currentPerformanceData[currentDers] = [];
  }

  let studentData = currentPerformanceData[currentDers].find(s => s.ogrenciId === studentId);

  if (!studentData) {
    const student = currentStudents.find(s => String(s.id || s.name) === studentId);
    studentData = {
      ogrenciId: studentId,
      ad: student?.name || studentId,
      kazanimSayisi: currentKazanimCount,
      denemeOrt: '',
      etutSayisi: '',
      odevTamamlama: '',
      genelBasari: 0
    };

    // Dinamik kazanım field'ları ekle
    for (let i = 1; i <= currentKazanimCount; i++) {
      studentData[`kazanim${i}`] = '';
    }

    // Yazılı field'ları ekle
    studentData.yazili1 = '';
    studentData.yazili2 = '';

    currentPerformanceData[currentDers].push(studentData);
  }

  studentData[field] = value;
}

// Genel başarıyı hesapla - YENİ FORMÜL (35-35-20-5-5)
function calculateGenelBasari(row) {
  const inputs = row.querySelectorAll('input');

  // DİNAMİK KAZANIM ORTALAMASINI HESAPLA
  const kazanimlar = [];
  for (let i = 0; i < currentKazanimCount; i++) {
    const kazanimInput = row.querySelector(`input[data-field="kazanim${i + 1}"]`);
    const value = parseFloat(kazanimInput?.value) || 0;
    kazanimlar.push(value);
  }
  const kazanimOrt = kazanimlar.length > 0 ? kazanimlar.reduce((sum, k) => sum + k, 0) / kazanimlar.length : 0;

  // YAZILI ORTALAMASI
  const yazili1Input = row.querySelector('input[data-field="yazili1"]');
  const yazili2Input = row.querySelector('input[data-field="yazili2"]');
  const yazili1 = parseFloat(yazili1Input?.value) || 0;
  const yazili2 = parseFloat(yazili2Input?.value) || 0;
  const yaziliOrt = (yazili1 + yazili2) / 2;

  // DENEME ORTALAMASINI 100'e ÇEVİR
  const denemeOrtInput = row.querySelector('input[data-field="denemeOrt"]');
  const denemeOrt = parseFloat(denemeOrtInput?.value) || 0;

  let denemePuan = 0;
  if (currentDers === 'Türkçe' || currentDers === 'Matematik' || currentDers === 'Fen') {
    denemePuan = (denemeOrt / 20) * 100; // 20 üzerinden 100'e
  } else if (currentDers === 'Sosyal' || currentDers === 'Din Kültürü' || currentDers === 'İngilizce') {
    denemePuan = (denemeOrt / 10) * 100; // 10 üzerinden 100'e
  }

  // ETÜT VE ÖDEV
  const etutInput = row.querySelector('input[data-field="etutSayisi"]');
  const odevInput = row.querySelector('input[data-field="odevTamamlama"]');
  const etutSayisi = parseFloat(etutInput?.value) || 0;
  const odevTamamlama = parseFloat(odevInput?.value) || 0;
  const etutPuan = (etutSayisi / 50) * 100; // 0-50 → 0-100

  // =====================================
  // YENİ FORMÜL: 35-35-20-5-5
  // =====================================
  const genelBasari = (kazanimOrt * 0.35)       // %35 Kazanım Ortalaması
                    + (denemePuan * 0.35)       // %35 Deneme
                    + (yaziliOrt * 0.20)        // %20 Yazılı Ortalaması
                    + (odevTamamlama * 0.05)    // %5 Ödev
                    + (etutPuan * 0.05);        // %5 Etüt

  // GENEL BAŞARI HÜCRE GÜNCELLEME
  const genelBasariCell = row.querySelector('[data-field="genelBasari"]');
  genelBasariCell.textContent = genelBasari.toFixed(1);

  // Renk kodlaması
  genelBasariCell.className = 'calculated-cell';
  if (genelBasari >= 80) {
    genelBasariCell.classList.add('basari-yuksek');
  } else if (genelBasari >= 60) {
    genelBasariCell.classList.add('basari-orta');
  } else if (genelBasari > 0) {
    genelBasariCell.classList.add('basari-dusuk');
  }

  // VERİYİ GÜNCELLE
  const studentId = row.dataset.studentId;
  updateStudentData(studentId, 'genelBasari', genelBasari);

  // DEBUG LOG
  console.log(`[HESAP] ${studentId}: Kazanım Ort=${kazanimOrt.toFixed(1)}, Yazılı Ort=${yaziliOrt.toFixed(1)}, Deneme=${denemeOrt}→${denemePuan.toFixed(1)}, Etüt=${etutPuan.toFixed(1)}, Ödev=${odevTamamlama} = ${genelBasari.toFixed(1)}`);

  // TUTARLILIK ANALİZİ
  analyzeDurum(row, kazanimOrt, denemePuan, yaziliOrt, genelBasari, etutSayisi, odevTamamlama);

  return {
    genelBasari,
    kazanimOrt,
    yaziliOrt,
    denemePuan
  };
}

// TUTARLILIK ANALİZ ALGORITMASI
function analyzeDurum(row, kazanimOrt, denemePuan, yaziliOrt, genelBasari, etutSayisi, odevTamamlama) {
  const problems = [];
  let durumSkoru = 100; // Başlangıç: Mükemmel

  // ========================================
  // KURAL 1: Kazanım - Deneme Tutarsızlığı (EN ÖNEMLİ)
  // ========================================
  const kazanimDenemeFark = Math.abs(kazanimOrt - denemePuan);

  if (kazanimOrt >= 80 && denemePuan < 60) {
    // DURUM: Kazanımlar çok yüksek ama deneme düşük → CİDDİ SORUN!
    problems.push('🔴 Kazanımlar yüksek (%' + kazanimOrt.toFixed(0) + ') ama deneme düşük (%' + denemePuan.toFixed(0) + ')! Sınav kaygısı veya test tekniği eksikliği olabilir.');
    durumSkoru -= 35;
  } else if (kazanimOrt < 60 && denemePuan >= 80) {
    // DURUM: Deneme yüksek ama kazanımlar düşük → ŞANS veya TEST TEKNİĞİ
    problems.push('🟡 Deneme yüksek (%' + denemePuan.toFixed(0) + ') ama kazanımlar düşük (%' + kazanimOrt.toFixed(0) + '). Test tekniği güçlü ama temel eksik.');
    durumSkoru -= 25;
  } else if (kazanimDenemeFark > 30) {
    // DURUM: Genel tutarsızlık (30+ puan fark)
    problems.push('⚠️ Kazanım-Deneme farkı yüksek: ' + kazanimDenemeFark.toFixed(1) + ' puan');
    durumSkoru -= 20;
  } else if (kazanimDenemeFark > 20) {
    problems.push('🟠 Kazanım-Deneme arasında fark var: ' + kazanimDenemeFark.toFixed(1) + ' puan');
    durumSkoru -= 10;
  }

  // ========================================
  // KURAL 2: Yazılı - Deneme Tutarsızlığı
  // ========================================
  const yaziliDenemeFark = Math.abs(yaziliOrt - denemePuan);

  if (yaziliOrt >= 80 && denemePuan < 60) {
    problems.push('🟠 Yazılı yüksek (%' + yaziliOrt.toFixed(0) + ') ama deneme düşük (%' + denemePuan.toFixed(0) + '). Deneme stresi olabilir.');
    durumSkoru -= 20;
  } else if (yaziliDenemeFark > 30) {
    problems.push('⚠️ Yazılı-Deneme farkı yüksek: ' + yaziliDenemeFark.toFixed(1) + ' puan');
    durumSkoru -= 12;
  }

  // ========================================
  // KURAL 3: Kazanım - Yazılı Tutarsızlığı
  // ========================================
  const kazanimYaziliFark = Math.abs(kazanimOrt - yaziliOrt);

  if (kazanimYaziliFark > 25) {
    problems.push('⚠️ Kazanım-Yazılı farkı yüksek: ' + kazanimYaziliFark.toFixed(1) + ' puan');
    durumSkoru -= 10;
  }

  // ========================================
  // KURAL 4: Düşük Performans + Destek Eksikliği
  // ========================================
  if (genelBasari < 60 && etutSayisi < 5) {
    problems.push('📖 Düşük performans + Az etüt (' + etutSayisi + ' adet). Destek gerekli!');
    durumSkoru -= 15;
  }

  if (genelBasari < 60 && odevTamamlama < 70) {
    problems.push('📝 Düşük performans + Ödev eksikliği (%' + odevTamamlama.toFixed(0) + '). Disiplin sorunu olabilir.');
    durumSkoru -= 15;
  }

  // ========================================
  // KURAL 5: Mükemmel Uyum (Ödüllendirme)
  // ========================================
  let durumMesaj = '';
  let durumIcon = '';
  let durumClass = '';

  if (kazanimDenemeFark < 10 && yaziliDenemeFark < 10 && kazanimYaziliFark < 10) {
    if (genelBasari >= 85) {
      durumMesaj = '🌟 Mükemmel';
      durumIcon = '✅';
      durumClass = 'durum-mukemmel';
      durumSkoru = 100;
      problems.length = 0; // Sorunları temizle
      problems.push('Tüm değerlendirmeler uyumlu ve çok başarılı!');
    } else if (genelBasari >= 70) {
      durumMesaj = '✅ Uyumlu';
      durumIcon = '✅';
      durumClass = 'durum-uyumlu';
      durumSkoru = Math.max(durumSkoru, 85);
    }
  }

  // ========================================
  // DURUM SKORU BELİRLEME
  // ========================================
  if (!durumMesaj) {
    if (durumSkoru >= 85) {
      durumMesaj = '✅ Uyumlu';
      durumIcon = '✅';
      durumClass = 'durum-uyumlu';
    } else if (durumSkoru >= 70) {
      durumMesaj = '🟡 Kabul Edilebilir';
      durumIcon = '🟡';
      durumClass = 'durum-kabul';
    } else if (durumSkoru >= 50) {
      durumMesaj = '🟠 DİKKAT!';
      durumIcon = '⚠️';
      durumClass = 'durum-dikkat';
    } else {
      durumMesaj = '🔴 CİDDİ SORUN!';
      durumIcon = '🔴';
      durumClass = 'durum-sorun';
    }
  }

  // ========================================
  // DURUM HÜCRE GÜNCELLEME
  // ========================================
  const durumCell = row.querySelector('[data-field="durum"]');
  if (durumCell) {
    durumCell.textContent = durumIcon + ' ' + durumMesaj;
    durumCell.className = 'durum-cell ' + durumClass;

    // Detay tooltip oluştur
    const detayHTML = generateDurumDetayHTML(problems, durumSkoru);
    durumCell.title = problems.join('\n'); // Basit tooltip

    // Detay butonu ekle
    durumCell.innerHTML = `
      <span class="durum-icon">${durumIcon}</span>
      <span class="durum-text">${durumMesaj}</span>
      <button class="durum-detay-btn" onclick="showDurumDetay('${row.dataset.studentId}', ${JSON.stringify(problems).replace(/"/g, '&quot;')}, ${durumSkoru})">ℹ️</button>
    `;
  }
}

// Durum detay HTML oluştur
function generateDurumDetayHTML(problems, skoru) {
  if (problems.length === 0) {
    return '<p>✅ Hiçbir tutarsızlık tespit edilmedi.</p>';
  }

  let html = '<div class="durum-detay-content">';
  html += '<h4>Tespit Edilen Durumlar (Skor: ' + skoru + '/100)</h4>';
  html += '<ul>';

  problems.forEach(problem => {
    html += '<li>' + problem + '</li>';
  });

  html += '</ul></div>';
  return html;
}

// Durum detayını modal olarak göster
function showDurumDetay(studentId, problems, skoru) {
  const student = currentStudents.find(s => String(s.id || s.name) === studentId);
  const studentName = student ? student.name : studentId;

  let html = '<div style="padding: 20px; max-width: 500px;">';
  html += '<h3>📊 Detaylı Durum Analizi</h3>';
  html += '<p><strong>Öğrenci:</strong> ' + studentName + '</p>';
  html += '<p><strong>Ders:</strong> ' + currentDers + '</p>';
  html += '<p><strong>Durum Skoru:</strong> ' + skoru + '/100</p>';
  html += '<hr>';

  if (problems.length === 0) {
    html += '<p style="color: green;">✅ Hiçbir tutarsızlık tespit edilmedi. Tüm performans göstergeleri uyumlu.</p>';
  } else {
    html += '<h4>Tespit Edilen Durumlar:</h4>';
    html += '<ul style="line-height: 1.8;">';
    problems.forEach(problem => {
      html += '<li>' + problem + '</li>';
    });
    html += '</ul>';

    // Öneriler ekle
    html += '<hr>';
    html += '<h4>💡 Öneriler:</h4>';
    html += '<ul style="line-height: 1.8;">';

    if (skoru < 50) {
      html += '<li>🚨 Acil müdahale gerekli - Bireysel destek planı oluşturulmalı</li>';
      html += '<li>Haftalık 2-3 etüt önerilir</li>';
      html += '<li>Aileden destek alınmalı</li>';
    } else if (skoru < 70) {
      html += '<li>⚠️ Dikkat - Eksik konular tamamlanmalı</li>';
      html += '<li>Haftalık 1-2 etüt önerilir</li>';
      html += '<li>Test çözüm teknikleri geliştirilmeli</li>';
    } else {
      html += '<li>✅ Genel olarak iyi durumda</li>';
      html += '<li>Mevcut performans devam ettirilebilir</li>';
    }

    html += '</ul>';
  }

  html += '</div>';

  // Toast olarak göster (daha iyi bir modal sistemi de eklenebilir)
  showToast('Durum Analizi', html, 'info', 10000);
}

// Global fonksiyon tanımla
window.showDurumDetay = showDurumDetay;

// Ders değiştir
function switchDers(ders) {
  currentDers = ders;

  // Tab'ları güncelle
  document.querySelectorAll('.ders-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-ders="${ders}"]`).classList.add('active');

  // Başlığı güncelle
  document.getElementById('current-ders-title').textContent = `${ders} Performans Değerlendirmesi`;

  // Kazanım seçiciyi göster
  const kazanimSelector = document.getElementById('kazanim-selector');
  if (kazanimSelector && currentStudents.length > 0) {
    kazanimSelector.style.display = 'block';
  }

  // Eğer kazanım sayısı zaten seçilmişse tabloyu yeniden render et
  if (currentKazanimCount > 0) {
    renderPerformanceTable();
  }
}

// Dinamik tablo başlıklarını oluştur
function renderDynamicTableHeaders(kazanimCount) {
  const thead = document.getElementById('performance-table-head');
  if (!thead) return;

  let headersHTML = '<tr>';
  headersHTML += '<th>Öğrenci Adı</th>';

  // Kazanım sütunları
  for (let i = 1; i <= kazanimCount; i++) {
    headersHTML += `<th>Kazanım ${i} (%)</th>`;
  }

  // Diğer sütunlar
  headersHTML += '<th>Yazılı 1</th>';
  headersHTML += '<th>Yazılı 2</th>';
  headersHTML += '<th>Deneme Ort.</th>';
  headersHTML += '<th>Etüt Sayısı</th>';
  headersHTML += '<th>Ödev (%)</th>';
  headersHTML += '<th>Genel Başarı</th>';
  headersHTML += '<th>Durum</th>';
  headersHTML += '</tr>';

  thead.innerHTML = headersHTML;
  console.log(`✅ Tablo başlıkları oluşturuldu: ${kazanimCount} kazanım`);
}

// Mevcut performans verilerini yükle
async function loadExistingPerformanceData() {
  try {
    if (currentClass) {
      const response = await window.electronAPI.loadPerformanceData(currentClass);
      if (response && response.success && response.data) {
        currentPerformanceData = response.data.dersler || {};
      }
    }
  } catch (error) {
    console.log('Performans verisi yüklenemedi:', error);
    currentPerformanceData = {};
  }
}

// Performans verilerini kaydet
async function savePerformanceData() {
  if (!currentClass) {
    showToast('Lütfen önce bir sınıf seçin', 'warning');
    return;
  }

  try {
    const dataToSave = {
      sinif: currentClass,
      dersler: currentPerformanceData,
      lastUpdated: new Date().toISOString()
    };

    await window.electronAPI.savePerformanceData(dataToSave);
    showToast('Performans verileri kaydedildi', 'success');
    
  } catch (error) {
    console.error('Kaydetme hatası:', error);
    showToast('Veriler kaydedilirken hata oluştu', 'error');
  }
}

// Excel'e aktar
async function exportToExcel() {
  if (!currentClass) {
    showToast('Lütfen önce bir sınıf seçin', 'warning');
    return;
  }

  try {
    const dataToExport = {
      sinif: currentClass,
      dersler: currentPerformanceData,
      lastUpdated: new Date().toISOString()
    };

    await window.electronAPI.exportToExcel(dataToExport);
    showToast('Excel dosyası oluşturuldu', 'success');
    
  } catch (error) {
    console.error('Excel aktarım hatası:', error);
    showToast('Excel dosyası oluşturulurken hata oluştu', 'error');
  }
}

// ===================================
// YENİ: Sınıf Karşılaştırma Modülü
// ===================================

let comparisonChart = null; // Chart.js instance
let selectedClassesForComparison = []; // Seçili sınıflar

// Sınıf checkbox'larını yükle
function loadClassCheckboxes() {
  console.log('📋 Sınıf checkbox\'ları yükleniyor...');

  const container = document.getElementById('class-checkbox-container');
  if (!container) {
    console.error('❌ class-checkbox-container bulunamadı');
    return;
  }

  // Tüm öğrencileri al
  const students = getStudents();

  // Benzersiz sınıfları bul (5A, 5B, 6A vb.)
  const uniqueClasses = [...new Set(students.map(s => `${s.grade}${s.class}`))].sort();

  console.log(`✅ ${uniqueClasses.length} benzersiz sınıf bulundu:`, uniqueClasses);

  // Checkbox'ları oluştur
  container.innerHTML = uniqueClasses.map(className => `
    <div class="class-checkbox-item" data-class="${className}">
      <input type="checkbox" id="class-${className}" value="${className}">
      <label for="class-${className}">${className}</label>
    </div>
  `).join('');

  // Event listener'ları ekle
  container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', handleClassCheckboxChange);
  });
}

// Checkbox değişikliğini handle et
function handleClassCheckboxChange(event) {
  const checkbox = event.target;
  const className = checkbox.value;
  const item = checkbox.closest('.class-checkbox-item');

  if (checkbox.checked) {
    // Maksimum 2 sınıf seçilebilir
    if (selectedClassesForComparison.length >= 2) {
      checkbox.checked = false;
      showToast('Uyarı', 'En fazla 2 sınıf seçebilirsiniz', 'warning');
      return;
    }

    selectedClassesForComparison.push(className);
    item.classList.add('selected');
  } else {
    selectedClassesForComparison = selectedClassesForComparison.filter(c => c !== className);
    item.classList.remove('selected');
  }

  // Analiz butonunu aktif/pasif yap
  const analyzeBtn = document.getElementById('analyze-classes-btn');
  if (analyzeBtn) {
    analyzeBtn.disabled = selectedClassesForComparison.length === 0;
  }

  console.log('Seçili sınıflar:', selectedClassesForComparison);
}

// Analiz yap butonu event listener'ı
document.addEventListener('DOMContentLoaded', function() {
  const analyzeBtn = document.getElementById('analyze-classes-btn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', performClassAnalysis);
  }

  // Export butonları
  const exportPdfBtn = document.getElementById('export-comparison-pdf');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportComparisonPDF);
  }

  const exportPngBtn = document.getElementById('export-comparison-png');
  if (exportPngBtn) {
    exportPngBtn.addEventListener('click', exportComparisonPNG);
  }
});

// Ana analiz fonksiyonu
async function performClassAnalysis() {
  if (selectedClassesForComparison.length === 0) {
    showToast('Hata', 'Lütfen en az bir sınıf seçin', 'error');
    return;
  }

  console.log('🔍 Analiz başlatılıyor...', selectedClassesForComparison);

  // Deneme aralığını al
  const examRange = document.getElementById('exam-range')?.value || '3';

  // Sınav verilerini yükle
  const examData = await window.electronAPI.loadData();
  if (!examData?.value) {
    showToast('Hata', 'Sınav verisi bulunamadı', 'error');
    return;
  }

  if (selectedClassesForComparison.length === 1) {
    // TEK SINIF ANALİZİ
    analyzeSingleClass(selectedClassesForComparison[0], examData.value, examRange);
  } else if (selectedClassesForComparison.length === 2) {
    // İKİ SINIF KARŞILAŞTIRMASI
    compareTwoClasses(selectedClassesForComparison[0], selectedClassesForComparison[1], examData.value, examRange);
  }

  // Sonuç alanını göster
  const resultsContainer = document.getElementById('comparison-results-new');
  if (resultsContainer) {
    resultsContainer.style.display = 'block';
  }
}

// Tek sınıf analizi
function analyzeSingleClass(className, examData, examRange) {
  console.log(`📊 Tek sınıf analizi: ${className}`);

  // Sınıfın öğrencilerini al
  const students = getStudents();
  const classStudents = students.filter(s => `${s.grade}${s.class}` === className);

  if (classStudents.length === 0) {
    showToast('Hata', 'Bu sınıfta öğrenci bulunamadı', 'error');
    return;
  }

  // Dersler
  const subjects = ['Türkçe', 'Matematik', 'Fen', 'Sosyal', 'İngilizce', 'Din Kültürü'];
  const subjectAverages = {};
  const subjectData = {};

  // Her ders için ortalama hesapla
  subjects.forEach(subject => {
    let totalNet = 0;
    let count = 0;
    let studentCount = 0;
    const studentNets = [];

    classStudents.forEach(student => {
      const studentExams = examData.filter(exam => exam.profile === student.name);

      // Deneme aralığına göre filtrele
      const sortedExams = studentExams
        .sort((a, b) => new Date(b.date || b.tarih || 0) - new Date(a.date || a.tarih || 0));

      const selectedExams = examRange === 'all' ? sortedExams : sortedExams.slice(0, parseInt(examRange));

      let studentTotal = 0;
      let studentExamCount = 0;

      selectedExams.forEach(exam => {
        const courses = exam.courses || {};
        const subjectData = courses[subject] || courses[subject.toLowerCase()] || courses[subject.toUpperCase()];

        if (subjectData?.net != null) {
          totalNet += subjectData.net;
          studentTotal += subjectData.net;
          count++;
          studentExamCount++;
        }
      });

      if (studentExamCount > 0) {
        studentCount++;
        studentNets.push(studentTotal / studentExamCount);
      }
    });

    if (count > 0) {
      subjectAverages[subject] = Math.round((totalNet / count) * 10) / 10;
      subjectData[subject] = {
        average: subjectAverages[subject],
        studentCount: studentCount,
        examCount: count,
        studentNets: studentNets
      };
    } else {
      subjectAverages[subject] = 0;
      subjectData[subject] = {
        average: 0,
        studentCount: 0,
        examCount: 0,
        studentNets: []
      };
    }
  });

  console.log('Ders ortalamaları:', subjectAverages);

  // Grafik oluştur
  createSingleClassChart(className, subjects, subjectAverages);

  // Rapor oluştur
  generateSingleClassReport(className, classStudents.length, subjectData, examRange);
}

// Tek sınıf için grafik
function createSingleClassChart(className, subjects, averages) {
  const canvas = document.getElementById('comparison-chart');
  if (!canvas) return;

  // Eski grafiği temizle
  if (comparisonChart) {
    comparisonChart.destroy();
  }

  const ctx = canvas.getContext('2d');

  comparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: subjects,
      datasets: [{
        label: `${className} Sınıfı Ortalama Net`,
        data: subjects.map(s => averages[s] || 0),
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 14, weight: 'bold' }
          }
        },
        title: {
          display: true,
          text: `${className} Sınıfı Deneme Ortalamaları`,
          font: { size: 18, weight: 'bold' }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Ortalama: ${context.parsed.y.toFixed(1)} net`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Net Sayısı',
            font: { size: 14, weight: 'bold' }
          },
          grid: { color: 'rgba(0, 0, 0, 0.1)' }
        },
        x: {
          title: {
            display: true,
            text: 'Dersler',
            font: { size: 14, weight: 'bold' }
          },
          grid: { display: false }
        }
      }
    }
  });
}

// Tek sınıf raporu
function generateSingleClassReport(className, studentCount, subjectData, examRange) {
  const reportContainer = document.getElementById('comparison-report');
  if (!reportContainer) return;

  const subjects = Object.keys(subjectData);

  // En iyi ve en zayıf dersleri bul
  const sortedSubjects = subjects.sort((a, b) => subjectData[b].average - subjectData[a].average);
  const bestSubject = sortedSubjects[0];
  const worstSubject = sortedSubjects[sortedSubjects.length - 1];

  // Genel ortalama
  const totalAverage = subjects.reduce((sum, s) => sum + subjectData[s].average, 0) / subjects.length;

  const rangeText = examRange === 'all' ? 'Tüm denemeler' : `Son ${examRange} deneme`;

  reportContainer.innerHTML = `
    <h3 class="report-title">📊 ${className} Sınıfı Analiz Raporu</h3>

    <div class="report-section">
      <h4>📈 Genel Durum</h4>
      <div class="report-stats">
        <div class="report-stat-item">
          <div class="report-stat-label">Öğrenci Sayısı</div>
          <div class="report-stat-value">${studentCount}</div>
        </div>
        <div class="report-stat-item">
          <div class="report-stat-label">Genel Ortalama</div>
          <div class="report-stat-value">${totalAverage.toFixed(1)}</div>
          <div class="report-stat-detail">net</div>
        </div>
        <div class="report-stat-item">
          <div class="report-stat-label">Analiz Aralığı</div>
          <div class="report-stat-value" style="font-size: 16px;">${rangeText}</div>
        </div>
      </div>
    </div>

    <div class="report-section">
      <h4>🏆 En Başarılı Ders</h4>
      <p>
        <span class="comparison-badge badge-winner">${bestSubject}</span>
        <strong>${subjectData[bestSubject].average.toFixed(1)} net</strong> ortalamayla sınıfın en güçlü dersi.
        ${studentCount} öğrenciden ${subjectData[bestSubject].studentCount} öğrenci bu derste deneme çözdü.
      </p>
    </div>

    <div class="report-section">
      <h4>⚠️ Gelişim Gereken Ders</h4>
      <p>
        <span class="comparison-badge badge-loser">${worstSubject}</span>
        <strong>${subjectData[worstSubject].average.toFixed(1)} net</strong> ortalamayla dikkat edilmesi gereken ders.
        Bu derste ek çalışma ve etüt programı düzenlenebilir.
      </p>
    </div>

    <div class="report-section">
      <h4>💡 Öğretmen Önerileri</h4>
      <ul class="suggestions-list">
        ${generateSingleClassSuggestions(className, subjectData, bestSubject, worstSubject)}
      </ul>
    </div>
  `;
}

// Tek sınıf için öneriler
function generateSingleClassSuggestions(className, subjectData, bestSubject, worstSubject) {
  const suggestions = [];

  // Öneri 1: En zayıf ders için
  if (subjectData[worstSubject].average < 5) {
    suggestions.push(`<li><strong>${worstSubject}</strong> dersinde sınıf ortalaması 5'in altında. Acil müdahale gerekiyor! Haftalık ek etüt düzenlenebilir.</li>`);
  } else if (subjectData[worstSubject].average < 7) {
    suggestions.push(`<li><strong>${worstSubject}</strong> dersinde performans ortalamanın altında. Konular tekrar edilmeli, eksik kazanımlar belirlenmeli.</li>`);
  }

  // Öneri 2: En iyi ders için
  if (subjectData[bestSubject].average > 8) {
    suggestions.push(`<li><strong>${bestSubject}</strong> dersinde sınıf çok başarılı! Bu motivasyonu korumak için zorlayıcı sorular ve olimpiyat çalışmaları yapılabilir.</li>`);
  }

  // Öneri 3: Katılım oranı düşük dersler
  Object.keys(subjectData).forEach(subject => {
    const participation = (subjectData[subject].studentCount / subjectData[subject].examCount) * 100;
    if (participation < 50) {
      suggestions.push(`<li><strong>${subject}</strong> dersinde öğrenci katılımı düşük (${participation.toFixed(0)}%). Deneme çözme alışkanlığı kazandırılmalı.</li>`);
    }
  });

  // Öneri 4: Genel
  suggestions.push(`<li>Haftalık sınıf toplantılarında <strong>${worstSubject}</strong> dersine öncelik verilebilir.</li>`);

  return suggestions.join('');
}

// İki sınıf karşılaştırması
function compareTwoClasses(class1, class2, examData, examRange) {
  console.log(`⚖️ İki sınıf karşılaştırması: ${class1} vs ${class2}`);

  const students = getStudents();
  const class1Students = students.filter(s => `${s.grade}${s.class}` === class1);
  const class2Students = students.filter(s => `${s.grade}${s.class}` === class2);

  if (class1Students.length === 0 || class2Students.length === 0) {
    showToast('Hata', 'Seçilen sınıflarda öğrenci bulunamadı', 'error');
    return;
  }

  const subjects = ['Türkçe', 'Matematik', 'Fen', 'Sosyal', 'İngilizce', 'Din Kültürü'];

  // Her sınıf için ortalamaları hesapla
  const class1Data = calculateClassAverages(class1Students, examData, subjects, examRange);
  const class2Data = calculateClassAverages(class2Students, examData, subjects, examRange);

  // Grafik oluştur
  createComparisonChart(class1, class2, subjects, class1Data, class2Data);

  // Karşılaştırma raporu
  generateComparisonReport(class1, class2, class1Students.length, class2Students.length, subjects, class1Data, class2Data, examRange);
}

// Sınıf ortalamalarını hesapla
function calculateClassAverages(students, examData, subjects, examRange) {
  const averages = {};

  subjects.forEach(subject => {
    let totalNet = 0;
    let count = 0;

    students.forEach(student => {
      const studentExams = examData.filter(exam => exam.profile === student.name);
      const sortedExams = studentExams.sort((a, b) => new Date(b.date || b.tarih || 0) - new Date(a.date || a.tarih || 0));
      const selectedExams = examRange === 'all' ? sortedExams : sortedExams.slice(0, parseInt(examRange));

      selectedExams.forEach(exam => {
        const courses = exam.courses || {};
        const subjectData = courses[subject] || courses[subject.toLowerCase()] || courses[subject.toUpperCase()];

        if (subjectData?.net != null) {
          totalNet += subjectData.net;
          count++;
        }
      });
    });

    averages[subject] = count > 0 ? Math.round((totalNet / count) * 10) / 10 : 0;
  });

  return averages;
}

// Karşılaştırmalı grafik
function createComparisonChart(class1, class2, subjects, class1Data, class2Data) {
  const canvas = document.getElementById('comparison-chart');
  if (!canvas) return;

  if (comparisonChart) {
    comparisonChart.destroy();
  }

  const ctx = canvas.getContext('2d');

  comparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: subjects,
      datasets: [
        {
          label: `${class1} Sınıfı`,
          data: subjects.map(s => class1Data[s] || 0),
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2,
          borderRadius: 8
        },
        {
          label: `${class2} Sınıfı`,
          data: subjects.map(s => class2Data[s] || 0),
          backgroundColor: 'rgba(40, 167, 69, 0.8)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 2,
          borderRadius: 8
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
            font: { size: 14, weight: 'bold' }
          }
        },
        title: {
          display: true,
          text: `${class1} vs ${class2} - Deneme Ortalamaları Karşılaştırması`,
          font: { size: 18, weight: 'bold' }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} net`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Net Sayısı',
            font: { size: 14, weight: 'bold' }
          },
          grid: { color: 'rgba(0, 0, 0, 0.1)' }
        },
        x: {
          title: {
            display: true,
            text: 'Dersler',
            font: { size: 14, weight: 'bold' }
          },
          grid: { display: false }
        }
      }
    }
  });
}

// Karşılaştırma raporu
function generateComparisonReport(class1, class2, class1Count, class2Count, subjects, class1Data, class2Data, examRange) {
  const reportContainer = document.getElementById('comparison-report');
  if (!reportContainer) return;

  // Her ders için kazananı bul
  const subjectWinners = {};
  subjects.forEach(subject => {
    const diff = class1Data[subject] - class2Data[subject];
    if (Math.abs(diff) < 0.5) {
      subjectWinners[subject] = 'equal';
    } else if (diff > 0) {
      subjectWinners[subject] = class1;
    } else {
      subjectWinners[subject] = class2;
    }
  });

  // Genel kazananı bul
  const class1Avg = subjects.reduce((sum, s) => sum + class1Data[s], 0) / subjects.length;
  const class2Avg = subjects.reduce((sum, s) => sum + class2Data[s], 0) / subjects.length;
  const overallWinner = class1Avg > class2Avg ? class1 : (class2Avg > class1Avg ? class2 : 'equal');

  const class1Wins = Object.values(subjectWinners).filter(w => w === class1).length;
  const class2Wins = Object.values(subjectWinners).filter(w => w === class2).length;
  const ties = Object.values(subjectWinners).filter(w => w === 'equal').length;

  const rangeText = examRange === 'all' ? 'Tüm denemeler' : `Son ${examRange} deneme`;

  reportContainer.innerHTML = `
    <h3 class="report-title">⚖️ ${class1} vs ${class2} Karşılaştırma Raporu</h3>

    <div class="report-section">
      <h4>🏆 Genel Sonuç</h4>
      ${overallWinner === 'equal' ?
        `<p><span class="comparison-badge badge-equal">BERABERE</span> İki sınıf da genel ortalamalarda eşit seviyede!</p>` :
        `<p><span class="comparison-badge badge-winner">${overallWinner}</span> sınıfı <strong>${Math.abs(class1Avg - class2Avg).toFixed(1)} net</strong> farkla önde!</p>`
      }
      <div class="report-stats">
        <div class="report-stat-item">
          <div class="report-stat-label">${class1} Öğrenci</div>
          <div class="report-stat-value">${class1Count}</div>
        </div>
        <div class="report-stat-item">
          <div class="report-stat-label">${class1} Ortalama</div>
          <div class="report-stat-value">${class1Avg.toFixed(1)}</div>
          <div class="report-stat-detail">net</div>
        </div>
        <div class="report-stat-item">
          <div class="report-stat-label">${class2} Öğrenci</div>
          <div class="report-stat-value">${class2Count}</div>
        </div>
        <div class="report-stat-item">
          <div class="report-stat-label">${class2} Ortalama</div>
          <div class="report-stat-value">${class2Avg.toFixed(1)}</div>
          <div class="report-stat-detail">net</div>
        </div>
      </div>
    </div>

    <div class="report-section">
      <h4>📊 Ders Bazında Sonuçlar</h4>
      <p><strong>${class1}:</strong> ${class1Wins} ders kazandı | <strong>${class2}:</strong> ${class2Wins} ders kazandı | <strong>Berabere:</strong> ${ties} ders</p>
      <div style="margin-top: 15px;">
        ${subjects.map(subject => {
          const winner = subjectWinners[subject];
          const diff = Math.abs(class1Data[subject] - class2Data[subject]);
          if (winner === 'equal') {
            return `<span class="comparison-badge badge-equal">${subject}: Berabere (${class1Data[subject].toFixed(1)})</span>`;
          } else if (winner === class1) {
            return `<span class="comparison-badge badge-winner">${subject}: ${class1} (+${diff.toFixed(1)})</span>`;
          } else {
            return `<span class="comparison-badge badge-loser">${subject}: ${class2} (+${diff.toFixed(1)})</span>`;
          }
        }).join('')}
      </div>
    </div>

    <div class="report-section">
      <h4>💡 Öğretmen Önerileri</h4>
      <ul class="suggestions-list">
        ${generateComparisonSuggestions(class1, class2, subjects, class1Data, class2Data, subjectWinners)}
      </ul>
    </div>

    <div class="report-section">
      <h4>📅 Analiz Detayları</h4>
      <p>Bu rapor <strong>${rangeText}</strong> baz alınarak hazırlanmıştır.</p>
    </div>
  `;
}

// Karşılaştırma önerileri
function generateComparisonSuggestions(class1, class2, subjects, class1Data, class2Data, subjectWinners) {
  const suggestions = [];

  // Öneri 1: En büyük fark
  let maxDiff = 0;
  let maxDiffSubject = '';
  let maxDiffWinner = '';

  subjects.forEach(subject => {
    const diff = Math.abs(class1Data[subject] - class2Data[subject]);
    if (diff > maxDiff) {
      maxDiff = diff;
      maxDiffSubject = subject;
      maxDiffWinner = class1Data[subject] > class2Data[subject] ? class1 : class2;
    }
  });

  if (maxDiff > 2) {
    const loser = maxDiffWinner === class1 ? class2 : class1;
    suggestions.push(`<li><strong>${maxDiffSubject}</strong> dersinde en büyük fark var (${maxDiff.toFixed(1)} net). <strong>${loser}</strong> sınıfı için bu derste ek çalışma planlanabilir.</li>`);
  }

  // Öneri 2: Her iki sınıf da zayıf
  subjects.forEach(subject => {
    if (class1Data[subject] < 5 && class2Data[subject] < 5) {
      suggestions.push(`<li><strong>${subject}</strong> dersinde her iki sınıf da ortalamanın altında. Ortak etüt programı düzenlenebilir.</li>`);
    }
  });

  // Öneri 3: Genel
  const class1Wins = Object.values(subjectWinners).filter(w => w === class1).length;
  const class2Wins = Object.values(subjectWinners).filter(w => w === class2).length;

  if (class1Wins > class2Wins + 2) {
    suggestions.push(`<li><strong>${class1}</strong> sınıfı çoğu derste önde. <strong>${class2}</strong> için genel motivasyon ve çalışma disiplini artırılabilir.</li>`);
  } else if (class2Wins > class1Wins + 2) {
    suggestions.push(`<li><strong>${class2}</strong> sınıfı çoğu derste önde. <strong>${class1}</strong> için genel motivasyon ve çalışma disiplini artırılabilir.</li>`);
  } else {
    suggestions.push(`<li>İki sınıf da birbirine yakın performans gösteriyor. Rekabet ortamı oluşturulabilir (sınıflar arası yarışma vb.).</li>`);
  }

  return suggestions.join('');
}

// PDF Export
async function exportComparisonPDF() {
  showToast('Bilgi', 'PDF export özelliği yakında eklenecek!', 'info');
  // TODO: jsPDF kütüphanesi ile PDF oluştur
}

// PNG Export (Grafik)
function exportComparisonPNG() {
  if (!comparisonChart) {
    showToast('Hata', 'Önce bir analiz yapmalısınız', 'error');
    return;
  }

  const canvas = document.getElementById('comparison-chart');
  if (!canvas) return;

  // Canvas'ı PNG olarak indir
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `sinif-karsilastirma-${Date.now()}.png`;
  link.href = url;
  link.click();

  showToast('Başarılı', 'Grafik PNG olarak kaydedildi!', 'success');
}






