// Öğrenci Detay Sayfası JavaScript

// Global değişkenler
let currentStudent = null;
let currentUserRole = 'teacher';

// DOM elementleri
const backButton = document.getElementById('back-to-dashboard');
const exportButton = document.getElementById('export-student-report');
const editButton = document.getElementById('edit-student');
const deleteButton = document.getElementById('delete-student');

const studentAvatar = document.getElementById('student-avatar');
const studentName = document.getElementById('student-name');
const studentGrade = document.getElementById('student-grade');
const studentClass = document.getElementById('student-class');
const learningStyleValue = document.getElementById('learning-style-value');

const abilityBadges = document.getElementById('ability-badges');
const strongestAbilities = document.getElementById('strongest-abilities');
const weakestAbilities = document.getElementById('weakest-abilities');

const lastExamDate = document.getElementById('last-exam-date');
const lastExamScore = document.getElementById('last-exam-score');
const averageScore = document.getElementById('average-score');
const scoreTrend = document.getElementById('score-trend');
const examCount = document.getElementById('exam-count');
const totalExams = document.getElementById('total-exams');

const examHistoryList = document.getElementById('exam-history-list');

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
});

// Sayfa başlatma
function initializePage() {
    // URL'den öğrenci ID'sini al
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('id');
    
    if (studentId) {
        loadStudentData(studentId);
    } else {
        showToast('Hata', 'Öğrenci ID bulunamadı', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

// Event listener'ları ayarla
function setupEventListeners() {
    backButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    exportButton.addEventListener('click', () => {
        exportStudentReport();
    });
    
    editButton.addEventListener('click', () => {
        editStudent();
    });
    
    deleteButton.addEventListener('click', () => {
        deleteStudent();
    });
}

// Öğrenci verilerini yükle
function loadStudentData(studentId) {
    // Electron API'den öğrenci verilerini al
    if (window.electronAPI && window.electronAPI.loadStudents) {
        window.electronAPI.loadStudents().then(result => {
            if (result.error) {
                showToast('Hata', 'Öğrenci verileri yüklenemedi', 'error');
                return;
            }
            
            const student = result.students.find(s => s.id === studentId);
            if (student) {
                currentStudent = student;
                displayStudentData();
                applyRolePermissions();
            } else {
                showToast('Hata', 'Öğrenci bulunamadı', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        });
    } else {
        // Fallback: localStorage'dan veri al
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const student = students.find(s => s.id === studentId);
        if (student) {
            currentStudent = student;
            displayStudentData();
        }
    }
}

// Öğrenci verilerini görüntüle
function displayStudentData() {
    if (!currentStudent) return;
    
    // Temel bilgiler
    studentName.textContent = currentStudent.name;
    studentGrade.textContent = `${currentStudent.grade}. Sınıf`;
    studentClass.textContent = currentStudent.class || 'A';
    
    // Avatar
    studentAvatar.textContent = getStudentInitials(currentStudent.name);
    
    // Öğrenme stili
    learningStyleValue.textContent = currentStudent.learningStyle || 'Belirlenmemiş';
    
    // Kabiliyet rozetleri
    displayAbilityBadges();
    
    // Kabiliyet analizi
    displayAbilityAnalysis();
    
    // Performans verileri
    displayPerformanceData();
    
    // Sınav geçmişi
    displayExamHistory();
}

// Öğrenci baş harflerini al
function getStudentInitials(name) {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase();
}

// Kabiliyet rozetlerini görüntüle
function displayAbilityBadges() {
    if (!currentStudent.abilityLevels) {
        abilityBadges.innerHTML = '<div class="no-data">Kabiliyet verisi bulunamadı</div>';
        return;
    }
    
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
    
    abilityBadges.innerHTML = Object.keys(abilityNames).map(ability => {
        const data = currentStudent.abilityLevels[ability] || { level: 0, score: 0 };
        const level = data.level || 0;
        const score = data.score || 0;
        
        if (level === 0) return '';
        
        const color = abilityColors[ability];
        
        return `
            <div class="ability-badge" style="border-left-color: ${color};">
                <span class="ability-name">${abilityNames[ability]}</span>
                <span class="ability-level">Seviye ${level}</span>
                <span class="ability-score">${score} puan</span>
            </div>
        `;
    }).filter(badge => badge !== '').join('');
}

// Kabiliyet analizini görüntüle
function displayAbilityAnalysis() {
    if (!currentStudent.abilityLevels) {
        strongestAbilities.innerHTML = '<div class="no-data">Veri bulunamadı</div>';
        weakestAbilities.innerHTML = '<div class="no-data">Veri bulunamadı</div>';
        return;
    }
    
    const analysis = analyzeAbilities(currentStudent.abilityLevels);
    
    strongestAbilities.innerHTML = analysis.strongest.length > 0 
        ? analysis.strongest.join(', ')
        : '<div class="no-data">Veri bulunamadı</div>';
    
    weakestAbilities.innerHTML = analysis.weakest.length > 0 
        ? analysis.weakest.join(', ')
        : '<div class="no-data">Veri bulunamadı</div>';
}

// Kabiliyet analizi yap
function analyzeAbilities(abilityLevels) {
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
    
    const abilitiesWithScores = Object.keys(abilityNames).map(ability => {
        const data = abilityLevels[ability] || { level: 0, score: 0 };
        return {
            name: abilityNames[ability],
            level: data.level || 0,
            score: data.score || 0,
            combined: (data.level || 0) * 20 + (data.score || 0)
        };
    }).filter(ability => ability.level > 0);
    
    abilitiesWithScores.sort((a, b) => b.combined - a.combined);
    
    const strongest = abilitiesWithScores.slice(0, 3).map(a => a.name);
    const weakest = abilitiesWithScores.slice(-2).map(a => a.name);
    
    return { strongest, weakest };
}

// Performans verilerini görüntüle
function displayPerformanceData() {
    const performanceData = currentStudent.performanceData || {};
    const examHistory = performanceData.examHistory || [];
    
    if (examHistory.length > 0) {
        const lastExam = examHistory[examHistory.length - 1];
        lastExamDate.textContent = formatDate(lastExam.date);
        lastExamScore.textContent = lastExam.score || '-';
        
        const totalScore = examHistory.reduce((sum, exam) => sum + (exam.score || 0), 0);
        const avgScore = Math.round(totalScore / examHistory.length);
        averageScore.textContent = avgScore;
        
        // Trend hesapla
        if (examHistory.length >= 2) {
            const recent = examHistory.slice(-3).reduce((sum, exam) => sum + exam.score, 0) / 3;
            const older = examHistory.slice(0, -3).reduce((sum, exam) => sum + exam.score, 0) / Math.max(1, examHistory.length - 3);
            const trend = recent > older ? '↗️' : recent < older ? '↘️' : '→';
            scoreTrend.textContent = trend;
        }
    } else {
        lastExamDate.textContent = '-';
        lastExamScore.textContent = '-';
        averageScore.textContent = '-';
        scoreTrend.textContent = '-';
    }
    
    examCount.textContent = examHistory.length;
    totalExams.textContent = examHistory.length;
}

// Sınav geçmişini görüntüle
function displayExamHistory() {
    const examHistory = currentStudent.performanceData?.examHistory || [];
    
    if (examHistory.length === 0) {
        examHistoryList.innerHTML = '<div class="no-data">Henüz sınav geçmişi bulunmuyor</div>';
        return;
    }
    
    examHistoryList.innerHTML = examHistory.map(exam => `
        <div class="exam-history-item">
            <div class="exam-header">
                <h4>${exam.examName || 'Sınav'}</h4>
                <span class="exam-date">${formatDate(exam.date)}</span>
            </div>
            <div class="exam-content">
                <div class="exam-score">
                    <span class="score">${exam.score || 0}</span>
                    <span class="score-label">Puan</span>
                </div>
                <div class="exam-details">
                    <span class="exam-subject">${exam.subject || 'Genel'}</span>
                    <span class="exam-type">${exam.type || 'Yazılı'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Tarih formatla
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
}

// Rol bazlı izinleri uygula
function applyRolePermissions() {
    if (currentUserRole !== 'manager') {
        editButton.style.display = 'none';
        deleteButton.style.display = 'none';
        exportButton.style.display = 'none';
    }
}

// Öğrenci raporu oluştur
function exportStudentReport() {
    if (currentUserRole !== 'manager') {
        showToast('Yetki Hatası', 'Bu işlem için müdür yetkisi gereklidir', 'error');
        return;
    }
    
    showToast('Bilgi', 'Rapor oluşturma özelliği yakında eklenecek', 'info');
}

// Öğrenci düzenle
function editStudent() {
    if (currentUserRole !== 'manager') {
        showToast('Yetki Hatası', 'Bu işlem için müdür yetkisi gereklidir', 'error');
        return;
    }
    
    showToast('Bilgi', 'Öğrenci düzenleme özelliği yakında eklenecek', 'info');
}

// Öğrenci sil
function deleteStudent() {
    if (currentUserRole !== 'manager') {
        showToast('Yetki Hatası', 'Bu işlem için müdür yetkisi gereklidir', 'error');
        return;
    }
    
    if (confirm(`${currentStudent.name} adlı öğrenciyi silmek istediğinizden emin misiniz?`)) {
        // Electron API'den öğrenci sil
        if (window.electronAPI && window.electronAPI.deleteStudent) {
            window.electronAPI.deleteStudent(currentStudent.id).then(result => {
                if (result.error) {
                    showToast('Hata', 'Öğrenci silinemedi', 'error');
                } else {
                    showToast('Başarılı', 'Öğrenci başarıyla silindi', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                }
            });
        }
    }
}

// Toast mesajı göster
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Kullanıcı oturum bilgilerini al
if (window.electronAPI && window.electronAPI.onUserSession) {
    window.electronAPI.onUserSession((user) => {
        currentUserRole = user.role;
        applyRolePermissions();
    });
}
