// DersPlanlayici.js - Advanced Study Planning System
// Gelişmiş Ders Planlama Sistemi

// ============================================
// PLAN ŞABLONLARI (Hazır Çalışma Planları)
// ============================================
const PLAN_TEMPLATES = {
  intensive: {
    id: 'intensive',
    name: '🔥 Yoğun Çalışma',
    description: 'LGS öncesi son 3 ay için ideal',
    icon: '🔥',
    dailyHours: 4,
    weekendHours: 6,
    breakFrequency: 30,
    questionTarget: 2500,
    studyTechnique: 'pomodoro',
    focusOnWeakTopics: true,
    settings: {
      okuldanCikis: '16:00',
      calismaBaslangic: '09:00',
      uyumaSaati: '23:00'
    }
  },

  balanced: {
    id: 'balanced',
    name: '⚖️ Dengeli Çalışma',
    description: 'Okul dönemi için ideal, dengeli tempo',
    icon: '⚖️',
    dailyHours: 2,
    weekendHours: 4,
    breakFrequency: 40,
    questionTarget: 1400,
    studyTechnique: 'spaced',
    focusOnWeakTopics: true,
    settings: {
      okuldanCikis: '16:30',
      calismaBaslangic: '09:30',
      uyumaSaati: '22:30'
    }
  },

  light: {
    id: 'light',
    name: '🌱 Hafif Tempo',
    description: 'Yeni başlayanlar veya 5-6. sınıflar için',
    icon: '🌱',
    dailyHours: 1.5,
    weekendHours: 3,
    breakFrequency: 25,
    questionTarget: 700,
    studyTechnique: 'pomodoro',
    focusOnWeakTopics: false,
    settings: {
      okuldanCikis: '17:00',
      calismaBaslangic: '10:00',
      uyumaSaati: '22:00'
    }
  },

  exam_week: {
    id: 'exam_week',
    name: '📝 Sınav Haftası',
    description: 'Deneme öncesi son hafta sprint',
    icon: '📝',
    dailyHours: 5,
    weekendHours: 7,
    breakFrequency: 45,
    questionTarget: 3500,
    studyTechnique: 'feynman',
    focusOnWeakTopics: true,
    settings: {
      okuldanCikis: '15:00',
      calismaBaslangic: '08:00',
      uyumaSaati: '23:30'
    }
  }
};

// --- StudyPlanAlgorithms Sınıfı ---
class StudyPlanAlgorithms {
  constructor() {
    this.studyTechniques = {
      pomodoro: {
        name: 'Pomodoro Tekniği',
        description: '25 dakika çalışma, 5 dakika mola',
        studyTime: 25,
        breakTime: 5
      },
      feynman: {
        name: 'Feynman Tekniği',
        description: '45 dakika çalışma, 15 dakika mola',
        studyTime: 45,
        breakTime: 15
      },
      spaced: {
        name: 'Aralıklı Tekrar',
        description: '30 dakika çalışma, 10 dakika mola',
        studyTime: 30,
        breakTime: 10
      },
      active: {
        name: 'Aktif Öğrenme',
        description: '40 dakika çalışma, 10 dakika mola',
        studyTime: 40,
        breakTime: 10
      }
    };
  }

  /**
   * Plan önizlemesi oluşturur
   */
  generatePlanPreview(options) {
    const { weeklyHours, questionTarget, technique, grade } = options;

    // Günlük dağılım hesapla
    const dailyHours = weeklyHours / 7;
    const dailyQuestions = Math.round(questionTarget / 7);

    // Ders dağılımı hesapla
    const subjectDistribution = {
      'Paragraf': Math.round(dailyQuestions * 0.125), // 12.5%
      'Matematik': Math.round(dailyQuestions * 0.25), // 25%
      'Fen Bilimleri': Math.round(dailyQuestions * 0.25), // 25%
      'Türkçe': Math.round(dailyQuestions * 0.25), // 25%
      'Diğer': Math.round(dailyQuestions * 0.125) // 12.5%
    };

    return {
      weeklyHours,
      dailyHours: parseFloat(dailyHours.toFixed(1)),
      questionTarget,
      dailyQuestions,
      subjectDistribution,
      technique: this.studyTechniques[technique]?.name || 'Bilinmiyor',
      estimatedDays: Math.ceil(questionTarget / dailyQuestions)
    };
  }

  // Eksik kazanımları analiz et - SON İKİ DENEME İLE SINIRLI
  analyzeWeakAchievements(examsData, profileId) {
    // Data formatını kontrol et
    let actualExamsData = examsData;
    if (examsData && typeof examsData === 'object' && examsData.value && Array.isArray(examsData.value)) {
      actualExamsData = examsData.value;
    } else if (!Array.isArray(examsData)) {
      console.error('analyzeWeakAchievements: examsData array değil:', typeof examsData, examsData);
      return { totalWeakCount: 0, priorityList: [] };
    }
    
    // Öğrencinin tüm sınavlarını al ve tarihe göre sırala (en yeni önce)
    const studentExams = actualExamsData
      .filter(exam => exam.profile === profileId)
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // En yeni önce
    
    if (studentExams.length === 0) {
      return { totalWeakCount: 0, priorityList: [] };
    }

    // SADECE SON İKİ DENEMEYİ AL
    const lastTwoExams = studentExams.slice(0, 2);
    console.log(`DersPlanlayici: Analiz edilen son ${lastTwoExams.length} deneme:`, lastTwoExams.map(e => e.name));

    const weakOutcomes = {};
    const outcomeFrequency = {};

    // Ders key mapping (data.json → UI ders adı)
    const courseKeyToSubject = {
      'turkce': 'Türkçe',
      'matematik': 'Matematik',
      'fen': 'Fen Bilimleri',
      'inkilap': 'Sosyal Bilgiler',
      'sosyal': 'Sosyal Bilgiler',
      'ingilizce': 'İngilizce',
      'din': 'Din Kültürü'
    };

    // Kazanım → ders mapping (aynı kazanım farklı derslerde görülebilir, en çok görüleni al)
    const outcomeToSubject = {};

    // Sadece son iki sınavdan eksik kazanımları topla - DERS BİLGİSİYLE BİRLİKTE
    lastTwoExams.forEach(exam => {
      Object.entries(exam.courses).forEach(([courseKey, course]) => {
        if (course.incorrectOutcomes) {
          const subjectName = courseKeyToSubject[courseKey] || this.extractSubjectFromOutcome(courseKey);
          
          course.incorrectOutcomes.forEach(outcome => {
            if (!weakOutcomes[outcome]) {
              weakOutcomes[outcome] = 0;
              outcomeFrequency[outcome] = 0;
            }
            weakOutcomes[outcome]++;
            outcomeFrequency[outcome]++;
            
            // Ders bilgisini kaydet (en çok görülen dersi tut)
            if (!outcomeToSubject[outcome]) {
              outcomeToSubject[outcome] = {};
            }
            if (!outcomeToSubject[outcome][subjectName]) {
              outcomeToSubject[outcome][subjectName] = 0;
            }
            outcomeToSubject[outcome][subjectName]++;
          });
        }
      });
    });

    // Öncelik sırasına göre sırala (daha sık tekrarlanan eksiklikler önce)
    const priorityList = Object.entries(weakOutcomes)
      .map(([outcome, count]) => {
        // En çok görülen dersi bul
        let detectedSubject = 'Bilinmeyen';
        if (outcomeToSubject[outcome]) {
          const subjectCounts = outcomeToSubject[outcome];
          const mostFrequentSubject = Object.entries(subjectCounts)
            .sort((a, b) => b[1] - a[1])[0];
          if (mostFrequentSubject) {
            detectedSubject = mostFrequentSubject[0];
          }
        }
        
        // Eğer ders tespit edilemediyse fallback olarak extractSubjectFromOutcome kullan
        if (detectedSubject === 'Bilinmeyen') {
          detectedSubject = this.extractSubjectFromOutcome(outcome);
        }
        
        return {
        outcome,
        count,
          subject: detectedSubject,
        frequency: count / lastTwoExams.length // Kaç denemede kaç kez yanlış yapıldığı oranı
        };
      })
      .sort((a, b) => {
        // Önce frekansa göre, sonra sayıya göre sırala
        if (a.frequency !== b.frequency) {
          return b.frequency - a.frequency;
        }
        return b.count - a.count;
      });

    console.log(`DersPlanlayici: Son 2 denemeden ${Object.keys(weakOutcomes).length} eksik kazanım tespit edildi`);

    return {
      totalWeakCount: Object.keys(weakOutcomes).length,
      priorityList,
      weakOutcomes,
      analyzedExamsCount: lastTwoExams.length
    };
  }

  /**
   * Türkçe/İngilizce gibi hafta bilgisi olmayan dersler için konu önerisi
   * @param {string} subject - Ders adı (turkce, ingilizce)
   * @param {Array} weakAchievements - Öğrencinin eksik kazanımları
   * @param {number} grade - Sınıf seviyesi
   * @returns {Object} { topic, description, focusAreas }
   */
  generateTopicForNonWeeklySubject(subject, weakAchievements, grade) {
    // Türkçe ve İngilizce için ders adı mapping
    const subjectNames = {
      'turkce': 'Türkçe',
      'ingilizce': 'İngilizce'
    };
    
    const subjectName = subjectNames[subject] || subject;
    
    // Bu derse ait eksik kazanımları filtrele
    const subjectWeaknesses = weakAchievements.filter(w => 
      w.subject === subject || w.outcome.toLowerCase().includes(subjectName.toLowerCase())
    );
    
    // DURUM A: Eksik kazanım var
    if (subjectWeaknesses.length > 0) {
      const topWeakness = subjectWeaknesses[0]; // En öncelikli eksiklik
      
      // Kazanım metnini kısalt (ilk 50 karakter)
      const shortOutcome = topWeakness.outcome.length > 50 
        ? topWeakness.outcome.substring(0, 50) + '...' 
        : topWeakness.outcome;
      
      if (subjectWeaknesses.length === 1) {
        // Tek eksik kazanım
        return {
          topic: `${subjectName} - ${this.extractTopicKeyword(topWeakness.outcome)}`,
          description: `Eksik kazanım: ${shortOutcome}`,
          focusAreas: [topWeakness.outcome],
          priority: 'high'
        };
      } else {
        // Çoklu eksik kazanım
        const topThree = subjectWeaknesses.slice(0, 3);
        return {
          topic: `${subjectName} - Çoklu Kazanım Çalışması`,
          description: `${subjectWeaknesses.length} eksik kazanım: ${topThree.map((w, i) => `${i+1}) ${this.extractTopicKeyword(w.outcome)}`).join(', ')}`,
          focusAreas: topThree.map(w => w.outcome),
          priority: 'high'
        };
      }
    }
    
    // DURUM B: Eksik kazanım yok
    return {
      topic: `${subjectName} - Genel Tekrar`,
      description: 'Tüm kazanımlar başarılı, genel tekrar ve pekiştirme',
      focusAreas: ['Deneme soruları', 'Hız çalışması', 'Kavram pekiştirme'],
      priority: 'medium'
    };
  }

  /**
   * Kazanım metninden anahtar kelime çıkar
   */
  extractTopicKeyword(outcomeText) {
    // Örnek: "Metinde geçen anlamını bilmediği söz varlığı..." → "Söz Varlığı"
    const keywords = {
      'söz varlığı': 'Söz Varlığı',
      'yazım kuralları': 'Yazım Kuralları',
      'noktalama': 'Noktalama',
      'metin analiz': 'Metin Analizi',
      'paragraf': 'Paragraf',
      'fiilimsiler': 'Fiilimsiler',
      'söz sanatları': 'Söz Sanatları',
      'listening': 'Listening',
      'reading': 'Reading',
      'speaking': 'Speaking',
      'writing': 'Writing',
      'vocabulary': 'Vocabulary',
      'grammar': 'Grammar'
    };
    
    const lowerText = outcomeText.toLowerCase();
    for (const [key, value] of Object.entries(keywords)) {
      if (lowerText.includes(key)) {
        return value;
      }
    }
    
    // Anahtar kelime bulunamazsa ilk 3 kelimeyi al
    const words = outcomeText.split(' ').slice(0, 3).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  }

  // Öğrenci performansını analiz et
  analyzeStudentPerformance(examsData, profileId, grade) {
    // Data formatını kontrol et
    let actualExamsData = examsData;
    if (examsData && typeof examsData === 'object' && examsData.value && Array.isArray(examsData.value)) {
      actualExamsData = examsData.value;
    } else if (!Array.isArray(examsData)) {
      console.error('analyzeStudentPerformance: examsData array değil:', typeof examsData, examsData);
      return { level: 'beginner', averageNet: 0, trend: 'stable' };
    }
    
    console.log('analyzeStudentPerformance: profileId =', profileId);
    console.log('analyzeStudentPerformance: totalExams =', actualExamsData.length);
    
    const studentExams = actualExamsData.filter(exam => exam.profile === profileId);
    console.log('analyzeStudentPerformance: studentExams =', studentExams.length);
    
    if (studentExams.length === 0) {
      console.log('analyzeStudentPerformance: Öğrenci sınavı bulunamadı:', profileId);
      return { level: 'beginner', averageNet: 0, trend: 'stable' };
    }

    // Ortalama net hesapla - Net değeri yoksa hesapla
    const totalNet = studentExams.reduce((acc, exam) => {
      return acc + Object.values(exam.courses).reduce((sum, course) => {
        // Net değeri varsa kullan, yoksa hesapla
        const courseNet = course.net !== undefined ? course.net : 
                         Math.max(0, course.correct - (course.incorrect / 4));
        return sum + courseNet;
      }, 0);
    }, 0);
    const averageNet = totalNet / studentExams.length;
    
    console.log('analyzeStudentPerformance: averageNet =', averageNet);

    // Seviye belirle
    let level = 'beginner';
    if (averageNet >= 60) level = 'advanced';
    else if (averageNet >= 40) level = 'intermediate';

    // Geliştirilmiş trend analizi
    let trend = 'stable';
    
    if (studentExams.length >= 2) {
      // En az 2 sınav varsa trend hesapla
      const netScores = studentExams.map(exam => {
        // Her sınavın toplam net skorunu hesapla
        return Object.values(exam.courses).reduce((sum, course) => {
          const net = course.net || (course.correct - (course.incorrect / 4));
          return sum + Math.max(0, net);
        }, 0);
      });
      
      console.log(`📊 ${profileId} net skorları:`, netScores);
      
      if (netScores.length >= 3) {
        // 3+ sınav varsa: son sınav vs önceki ortalama
        const lastScore = netScores[netScores.length - 1];
        const previousAvg = netScores.slice(0, -1).reduce((sum, score) => sum + score, 0) / (netScores.length - 1);
        
        if (lastScore > previousAvg + 3) trend = 'improving';     // 3+ puan artış
        else if (lastScore < previousAvg - 3) trend = 'declining'; // 3+ puan düşüş
      } else {
        // 2 sınav varsa: basit karşılaştırma
        const firstScore = netScores[0];
        const lastScore = netScores[netScores.length - 1];
        
        if (lastScore > firstScore + 2) trend = 'improving';      // 2+ puan artış
        else if (lastScore < firstScore - 2) trend = 'declining'; // 2+ puan düşüş
      }
      
      console.log(`📈 ${profileId} trend: ${trend}`);
    } else {
      console.log(`⚠️ ${profileId}: Trend hesaplamak için yetersiz sınav (${studentExams.length})`);
    }

    return { level, averageNet, trend };
  }

  // Önerilen çalışma tekniğini belirle (Öğrenme stili ve performansa göre)
  recommendStudyTechnique(performance, learningStyle = null) {
    // Öğrenme stiline göre teknik öner
    if (learningStyle) {
      const styleBasedTechniques = {
        'AYRIŞTIRAN': 'active',      // Analitik öğrenen → Aktif öğrenme
        'ÖZÜMSEYEN': 'feynman',      // Teorik öğrenen → Feynman tekniği
        'YERLEŞTİREN': 'spaced',     // Pratik öğrenen → Aralıklı tekrar
        'DEĞİŞTİREN': 'pomodoro'     // Deneyimsel öğrenen → Pomodoro
      };
      
      if (styleBasedTechniques[learningStyle]) {
        console.log(`Öğrenme stiline göre teknik önerildi: ${learningStyle} → ${styleBasedTechniques[learningStyle]}`);
        return styleBasedTechniques[learningStyle];
      }
    }
    
    // Öğrenme stili yoksa performansa göre
    if (performance.level === 'beginner') return 'pomodoro';
    if (performance.level === 'intermediate') return 'spaced';
    if (performance.level === 'advanced') return 'feynman';
    return 'pomodoro';
  }

  // Kazanımdan ders adını çıkar
  extractSubjectFromOutcome(outcome) {
    const outcomeLower = outcome.toLowerCase();
    
    // KOD bazlı eşleştirme (öncelikli)
    if (outcome.includes('SB.')) return 'Sosyal Bilgiler';
    if (outcome.includes('M.')) return 'Matematik';
    if (outcome.includes('F.') || outcome.includes('FB.')) return 'Fen Bilimleri';
    if (outcome.includes('DK.')) return 'Din Kültürü';
    if (outcome.includes('T.') && outcome.includes('.')) return 'Türkçe'; // T.5.1.1 gibi kodlar
    if (outcome.includes('İTA.') || outcome.includes('İnkılap')) return 'Sosyal Bilgiler';
    
    // TAM METİN bazlı eşleştirme (Türkçe ve İngilizce için)
    
    // İngilizce belirgin anahtar kelimeler
    if (outcomeLower.includes('students will') || 
        outcomeLower.includes('can identify') ||
        outcomeLower.includes('can understand') ||
        outcomeLower.includes('can use') ||
        /\b(listening|speaking|reading|writing|grammar|vocabulary)\b/i.test(outcome)) {
      return 'İngilizce';
    }
    
    // Din Kültürü anahtar kelimeler
    if (outcomeLower.includes('peygamber') ||
        outcomeLower.includes('allah') ||
        outcomeLower.includes('kuran') ||
        outcomeLower.includes('hadis') ||
        outcomeLower.includes('ibadet') ||
        outcomeLower.includes('namaz') ||
        outcomeLower.includes('oruç') ||
        outcomeLower.includes('zekat') ||
        outcomeLower.includes('hac')) {
      return 'Din Kültürü';
    }
    
    // Türkçe anahtar kelimeler (daha spesifik)
    if (outcomeLower.includes('metin') ||
        outcomeLower.includes('yazım') ||
        outcomeLower.includes('noktalama') ||
        outcomeLower.includes('sözcük') ||
        outcomeLower.includes('cümle') ||
        outcomeLower.includes('paragraf') ||
        outcomeLower.includes('ana fikir') ||
        outcomeLower.includes('okuma') ||
        outcomeLower.includes('yazma') ||
        outcomeLower.includes('dinleme') ||
        outcomeLower.includes('konuşma') ||
        outcomeLower.includes('fiil') ||
        outcomeLower.includes('isim') ||
        outcomeLower.includes('sıfat') ||
        outcomeLower.includes('edat')) {
      return 'Türkçe';
    }
    
    // Genel kontroller (fallback)
    if (outcomeLower.includes('türkçe')) return 'Türkçe';
    if (outcomeLower.includes('ingilizce') || outcomeLower.includes('İngilizce')) return 'İngilizce';
    if (outcomeLower.includes('din')) return 'Din Kültürü';
    
    return 'Bilinmeyen';
  }

  // Öğrenci seviyesine göre günlük soru sayısını hesapla
  calculateQuestionsByLevel(weekNumber, selectedGrade, performance) {
    const grade = parseInt(selectedGrade);
    const level = performance.level; // 'beginner', 'intermediate', 'advanced'
    
    console.log(`Seviye hesaplaması: Sınıf=${grade}, Hafta=${weekNumber}, Seviye=${level}`);
    
    const isFirst16Weeks = weekNumber <= 16;
    
    if (grade === 5 || grade === 6) {
      // 5. ve 6. Sınıflar
      if (isFirst16Weeks) {
        // İlk 16 hafta
        switch(level) {
          case 'advanced': return 90; // İyi
          case 'intermediate': return 70; // Orta
          case 'beginner': return 50; // Kötü
          default: return 70; // Varsayılan orta
        }
      } else {
        // 16. haftadan sonra
        switch(level) {
          case 'advanced': return 100; // İyi
          case 'intermediate': return 80; // Orta
          case 'beginner': return 60; // Kötü
          default: return 80; // Varsayılan orta
        }
      }
    } else if (grade === 7) {
      // 7. sınıf
      if (isFirst16Weeks) {
        // İlk 16 hafta
        switch(level) {
          case 'advanced': return 100; // İyi
          case 'intermediate': return 80; // Orta
          case 'beginner': return 50; // Kötü
          default: return 80; // Varsayılan orta
        }
      } else {
        // 16. haftadan sonra
        switch(level) {
          case 'advanced': return 120; // İyi
          case 'intermediate': return 100; // Orta
          case 'beginner': return 70; // Kötü
          default: return 100; // Varsayılan orta
        }
      }
    } else if (grade === 8) {
      // 8. sınıf
      if (isFirst16Weeks) {
        // İlk 16 hafta
        switch(level) {
          case 'advanced': return 150; // İyi
          case 'intermediate': return 120; // Orta
          case 'beginner': return 80; // Kötü
          default: return 120; // Varsayılan orta
        }
      } else {
        // 16. haftadan sonra
        switch(level) {
          case 'advanced': return 200; // İyi
          case 'intermediate': return 150; // Orta
          case 'beginner': return 100; // Kötü
          default: return 150; // Varsayılan orta
        }
      }
    } else {
      // Diğer sınıflar için varsayılan (4. sınıf vb.)
      return 50;
    }
  }

  /**
   * Öğrencinin o dersteki eksik kazanımlarından birini seç
   * @param {string} subject - Ders adı
   * @param {Object} weakAchievements - Eksik kazanımlar objesi
   * @returns {string|null} - Eksik kazanım metni veya null
   */
  selectWeakAchievement(subject, weakAchievements) {
    if (!weakAchievements || !weakAchievements.priorityList) {
      return null;
    }
    
    // Ders adı mapping (UI → data key)
    const subjectKeyMap = {
      'Türkçe': 'turkce',
      'İngilizce': 'ingilizce',
      'Matematik': 'matematik',
      'Fen Bilimleri': 'fen',
      'Sosyal Bilgiler': 'inkilap',
      'Din Kültürü': 'din'
    };
    
    const subjectKey = subjectKeyMap[subject] || subject.toLowerCase();
    
    // Priority list'ten bu derse ait eksikleri filtrele
    const subjectWeaknesses = weakAchievements.priorityList.filter(w => {
      // Eğer subject field'ı varsa direkt kontrol et
      if (w.subject) {
        return w.subject === subjectKey || w.subject === subject;
      }
      // Yoksa outcome metninden çıkar
      const extractedSubject = this.extractSubjectFromOutcome(w.outcome);
      return extractedSubject === subject;
    });
    
    // En çok yanlış yapılan kazanımı seç (ilk eleman)
    if (subjectWeaknesses.length > 0) {
      return subjectWeaknesses[0].outcome;
    }
    
    return null;
  }

  /**
   * Kazanımlar.json'dan seçilen hafta ve dersin kazanımını getir
   * @param {string} subject - Ders adı
   * @param {number} grade - Sınıf seviyesi
   * @param {string|number} week - Hafta numarası
   * @param {Object} kazanimlarData - Kazanımlar.json verisi
   * @returns {string} - Kazanım metni
   */
  selectWeeklyTopic(subject, grade, week, kazanimlarData) {
    // Subject mapping - UI'dan JSON'a çeviri
    const subjectMapping = {
      'Din Kültürü': 'Din Kültürü ve Ahlak Bilgisi',
      'Sosyal Bilgiler': 'Sosyal Bilgiler',
      'Matematik': 'Matematik',
      'Fen Bilimleri': 'Fen Bilimleri',
      'Türkçe': 'Türkçe',
      'İngilizce': 'İngilizce'
    };
    
    const mappedSubject = subjectMapping[subject] || subject;
    
    // Hafta numarasını çıkar
    const weekNumber = parseInt(String(week).replace(/\D/g, '')) || 1;
    
    // Kazanımlar.json'dan ilgili hafta kazanımını getir
    if (kazanimlarData && kazanimlarData[mappedSubject]) {
      const subjectData = kazanimlarData[mappedSubject];
      
      if (subjectData[grade]) {
        const gradeData = subjectData[grade];
        
        // Hafta verisini ara
        const weekData = gradeData.find(item => 
          item.hafta && (
            item.hafta === `${weekNumber}. Hafta` || 
            item.hafta.includes(`${weekNumber}. Hafta`)
          )
        );
        
        if (weekData && (weekData.kazanim || weekData.ogrenme_cikti)) {
          let kazanim = weekData.kazanim || weekData.ogrenme_cikti;
          // "*Okul Temelli Planlama" metnini temizle
          kazanim = kazanim.replace(/\s*\*Okul\s+Temelli\s+Planlama\s*/gi, '').trim();
          return kazanim;
        }
      }
    }
    
    // Bulunamazsa genel tekrar
    return `${weekNumber}. Hafta - Genel tekrar`;
  }

  // Ders içeriğini belirle (eksik kazanım varsa eksik, yoksa haftalık)
  getSubjectContent(subject, weakAchievements, kazanimlarData, selectedGrade, selectedWeek, dayIndex, questionCount) {
    // PARAGRAF: Özel işlem
    if (subject === 'Paragraf') {
      return '25 Paragraf Sorusu';
    }
    
    // TÜRKÇE ve İNGİLİZCE: Sadece eksik kazanım bazlı
    if (subject === 'Türkçe' || subject === 'İngilizce') {
      const weakAchievement = this.selectWeakAchievement(subject, weakAchievements);
      
      if (weakAchievement) {
        // Eksik kazanım var, kazanımı tam olarak döndür (karakter sınırı yok)
        return weakAchievement;
    } else {
        // Eksik kazanım yok, sadece soru sayısı
        return `${questionCount} soru çözümü`;
      }
    }
    
    // DİĞER DERSLER (Matematik, Fen, Sosyal, Din): Dönüşümlü sistem
    // dayIndex % 2 === 0 → Eksik kazanım
    // dayIndex % 2 === 1 → Haftalık konu
    
    const isWeakDay = (dayIndex % 2 === 0);
    
    if (isWeakDay) {
      // Önce eksik kazanım ara
      const weakAchievement = this.selectWeakAchievement(subject, weakAchievements);
      
      if (weakAchievement) {
        // Eksik kazanım var, tam metni döndür (karakter sınırı yok)
        return weakAchievement;
      }
    }
    
    // Haftalık konu (eksik kazanım günü ama eksik yok VEYA haftalık konu günü)
    const weeklyTopic = this.selectWeeklyTopic(subject, selectedGrade, selectedWeek, kazanimlarData);
    // Haftalık konuyu tam olarak döndür (karakter sınırı yok)
    return weeklyTopic;
  }

  // Haftalık içerik getir
  getWeeklyContent(subject, kazanimlarData, selectedGrade, selectedWeek) {
    // Subject mapping - UI'dan JSON'a çeviri
    const subjectMapping = {
      'Din Kültürü': 'Din Kültürü ve Ahlak Bilgisi',
      'Sosyal Bilgiler': 'Sosyal Bilgiler',  // İnkılap da buraya mapping olabilir
      'Matematik': 'Matematik',
      'Fen Bilimleri': 'Fen Bilimleri',
      'Türkçe': 'Türkçe',
      'İngilizce': 'İngilizce'
    };
    
    const mappedSubject = subjectMapping[subject] || subject;
    
    // DEBUG 1: Parametreleri ve mapping'i kontrol et
    console.log("Fonksiyon çağrıldı. Parametreler:", { subject, mappedSubject, selectedGrade, selectedWeek });
    console.log("Tüm kazanimlarData anahtarları:", Object.keys(kazanimlarData));
    
    // Türkçe ve İngilizce için kazanım yoksa sadece soru sayısı
    if (subject === 'Türkçe' || subject === 'İngilizce') {
      return {
        type: 'weekly',
        content: `${subject} soru çözümü`,
        description: `${subject} haftalık soru çalışması`
      };
    }
    
    // Hafta numarasını çıkar (örn: "5. Hafta" -> 5 veya 5 -> 5)
    const weekNumber = parseInt(String(selectedWeek).replace(/\D/g, '')) || 1;
    
    // data/Kazanımlar.json'dan ilgili hafta kazanımlarını getir
    if (kazanimlarData && kazanimlarData[mappedSubject]) {
      // DEBUG 2: Derse göre filtreleme
      const subjectData = kazanimlarData[mappedSubject];
      console.log(`'${mappedSubject}' dersi için bulunan veri:`, subjectData);
      
      if (subjectData[selectedGrade]) {
        // DEBUG 3: Sınıfa göre filtreleme
        const gradeData = subjectData[selectedGrade];
        console.log(`'${selectedGrade}. Sınıf' için bulunan veri:`, gradeData);
        
        // DEBUG 4: Hafta araması
        console.log("Hafta verisi aranıyor. Sınıf verisi:", gradeData, "Aranan Hafta:", weekNumber);
        const weekData = gradeData.find(item => 
          item.hafta && (
            item.hafta === `${weekNumber}. Hafta` || 
            item.hafta.includes(`${weekNumber}. Hafta`)
          )
        );
        console.log("Bulunan hafta verisi:", weekData);
      
        if (weekData && (weekData.kazanim || weekData.ogrenme_cikti)) {
          const kazanim = weekData.kazanim || weekData.ogrenme_cikti;
          console.log("✅ Kazanım bulundu:", kazanim);
          return {
            type: 'weekly',
            content: kazanim,
            description: `${subject} haftalık kazanım çalışması`
          };
        } else {
          console.log("❌ Kazanım bulunamadı - weekData:", weekData);
        }
      } else {
        console.log("❌ Grade verisi bulunamadı:", selectedGrade);
      }
    } else {
      console.log("❌ Subject verisi bulunamadı:", subject, "-> Mapped:", mappedSubject);
    }
    
    // Kazanım bulunamazsa genel açıklama
    return {
      type: 'weekly',
      content: `${subject} - ${selectedWeek} hafta kazanımları`,
      description: `${subject} haftalık kazanım çalışması`
    };
  }

  // Günlük ders ekle
  addDailySubject(daySchedule, subject, questionCount, currentTime, remainingTime, content) {
    if (questionCount <= 0) return { currentTime, remainingTime };
    
    const studyTime = Math.min(remainingTime, Math.max(20, questionCount * 1.5)); // Minimum 20 dk, soru başına 1.5 dk
    
    // Eksiklik bazlı planlama için özel özellikler
    const isWeaknessBased = typeof content === 'object' && content.type === 'weakness-based';
    const isWeakness = typeof content === 'object' && content.type === 'weakness';
    
    daySchedule.blocks.push({
      type: 'study',
      subject: subject,
      topic: typeof content === 'string' ? content : content.content,
      startTime: this.formatTime(currentTime),
      duration: studyTime,
      priority: isWeaknessBased || isWeakness ? 'high' : 'normal',
      activity: typeof content === 'object' ? content.description : content,
      description: `${subject} - ${questionCount} soru`,
      questionCount: questionCount,
      // Eksiklik bazlı planlama için ek özellikler
      planningType: isWeaknessBased ? 'weakness-based' : (isWeakness ? 'weakness' : 'weekly'),
      focusAreas: isWeaknessBased ? content.focusAreas : undefined,
      priorityLevel: isWeaknessBased ? content.priority : undefined
    });
    
    return {
      currentTime: this.addMinutes(currentTime, studyTime),
      remainingTime: remainingTime - studyTime
    };
  }

  // Pazar konu tekrarı - Geliştirilmiş versiyon
  addSundayReview(daySchedule, weakAchievements, questionCount, currentTime, remainingTime) {
    if (weakAchievements.priorityList.length === 0) return;
    
    const studyTime = Math.min(remainingTime, 60); // 1 saat konu tekrarı
    
    // En çok yanlış yapılan 3 konuyu seç
    const topRepeatedTopics = this.getTopRepeatedTopics(weakAchievements, 3);
    
    // Tekrar edilecek konuları liste olarak hazırla
    const repeatTopicsText = topRepeatedTopics.length > 0 
      ? topRepeatedTopics.map(topic => `• ${topic.subject}: ${topic.outcome}`).join('\n')
      : '• Tüm eksik kazanımların genel tekrarı';
    
    daySchedule.blocks.push({
      type: 'study',
      subject: '🔄 Konu Tekrarı',
      topic: 'Eksik Kazanım Tekrarı',
      startTime: this.formatTime(currentTime),
      duration: studyTime,
      priority: 'high',
      activity: 'Konu Tekrarı ve Pekiştirme',
      description: `Eksik kazanımların konu tekrarı - ${questionCount} soru`,
      questionCount: questionCount,
      isRepeat: true,
      repeatTopics: topRepeatedTopics,
      note: `TEKRAR: ${topRepeatedTopics.map(t => t.outcome).join(', ')}`
    });
  }

  // En çok yanlış yapılan konuları getir
  getTopRepeatedTopics(weakAchievements, limit = 3) {
    if (!weakAchievements.priorityList || weakAchievements.priorityList.length === 0) {
      return [];
    }
    
    // Öncelik sırasına göre en çok yanlış yapılan konuları al
    return weakAchievements.priorityList
      .slice(0, limit)
      .map(item => ({
        subject: item.subject,
        outcome: item.outcome,
        priority: item.priority || 'medium'
      }));
  }




  // Gelişmiş haftalık plan oluştur
  generateAdvancedWeeklyPlan(options) {
    const { studentProfile, selectedWeek, selectedGrade, weakAchievements, performance, kazanimlarData, timeSettings, studyTechnique } = options;
    
    const technique = this.studyTechniques[studyTechnique];
    const dailySchedule = {};

    // Hafta kontrolü ve günlük soru sayısı
    console.log('selectedWeek:', selectedWeek, 'typeof:', typeof selectedWeek);
    const weekNumber = parseInt(String(selectedWeek).replace(/\D/g, '')) || 1;
    console.log('weekNumber:', weekNumber);
    
    // Öğrenci seviyesine göre soru sayısı
    const dailyQuestionLimit = this.calculateQuestionsByLevel(weekNumber, selectedGrade, performance);
    
    // Paragraf sabit 25 soru
    const paragrafQuestions = 25;
    const remainingQuestions = dailyQuestionLimit - paragrafQuestions; // 175 veya 275

    // Haftanın günlerini planla
    HAFTA_GUNLERI.forEach(day => {
      const isWeekend = day === 'Cumartesi' || day === 'Pazar';
      const startTime = isWeekend ? timeSettings.calismaBaslangic : timeSettings.okuldanCikis;
      
      dailySchedule[day] = {
        blocks: [],
        totalStudyTime: 0,
        totalBreakTime: 0,
        totalQuestions: 0
      };

      // Hafta içi: 2 saat, hafta sonu: 4 saat çalışma
      const totalStudyMinutes = isWeekend ? 240 : 120;
      let currentTime = this.parseTime(startTime);
      let remainingTime = totalStudyMinutes;

      // Günlük algoritma
      const dayIndex = HAFTA_GUNLERI.indexOf(day);
      const isWeaknessDay = (day === 'Salı' || day === 'Perşembe' || day === 'Cumartesi'); // Eksik kazanım günleri
      const isWeeklyDay = (day === 'Pazartesi' || day === 'Çarşamba' || day === 'Cuma'); // Haftalık konu günleri
      const isPazar = day === 'Pazar';
      
      let usedQuestions = 0;
      
      // HER GÜN SABİT DERSLER (5 ders)
      // Akıllı soru dağılımı
      const remainingForOthers = dailyQuestionLimit - 25; // 175 veya 275
      
      // Dönüşümlü derslere maksimum 30 soru
      const maxRotatingQuestions = 30;
      const rotatingQuestions = Math.min(maxRotatingQuestions, Math.floor(remainingForOthers * 0.15)); // %15'i dönüşümlü, max 30
      
      // Kalan soruları 3 ana derse böl (Matematik, Fen, Türkçe)
      const remainingForCore = remainingForOthers - rotatingQuestions;
      const questionsPerCoreSubject = Math.floor(remainingForCore / 3); // Ana derslere eşit
      
      console.log(`${day}: Toplam=${dailyQuestionLimit}, Ana=${questionsPerCoreSubject}, Dönüşümlü=${rotatingQuestions}, Seviye=${performance.level}`);
      
      // 1. Paragraf (25 soru sabit)
      const paragrafContent = this.getSubjectContent('Paragraf', weakAchievements, kazanimlarData, selectedGrade, selectedWeek, dayIndex, 25);
      const paragrafResult = this.addDailySubject(dailySchedule[day], 'Paragraf', 25, currentTime, remainingTime, paragrafContent);
      currentTime = paragrafResult.currentTime;
      remainingTime = paragrafResult.remainingTime;
      usedQuestions += 25;
      
      // 2. Matematik (her gün)
      const mathContent = this.getSubjectContent('Matematik', weakAchievements, kazanimlarData, selectedGrade, selectedWeek, dayIndex, questionsPerCoreSubject);
      const mathResult = this.addDailySubject(dailySchedule[day], 'Matematik', questionsPerCoreSubject, currentTime, remainingTime, mathContent);
      currentTime = mathResult.currentTime;
      remainingTime = mathResult.remainingTime;
      usedQuestions += questionsPerCoreSubject;
      
      // 3. Fen Bilimleri (her gün)
      const fenContent = this.getSubjectContent('Fen Bilimleri', weakAchievements, kazanimlarData, selectedGrade, selectedWeek, dayIndex, questionsPerCoreSubject);
      const fenResult = this.addDailySubject(dailySchedule[day], 'Fen Bilimleri', questionsPerCoreSubject, currentTime, remainingTime, fenContent);
      currentTime = fenResult.currentTime;
      remainingTime = fenResult.remainingTime;
      usedQuestions += questionsPerCoreSubject;
      
      // 4. Türkçe (her gün)
      const turkceContent = this.getSubjectContent('Türkçe', weakAchievements, kazanimlarData, selectedGrade, selectedWeek, dayIndex, questionsPerCoreSubject);
      const turkceResult = this.addDailySubject(dailySchedule[day], 'Türkçe', questionsPerCoreSubject, currentTime, remainingTime, turkceContent);
      currentTime = turkceResult.currentTime;
      remainingTime = turkceResult.remainingTime;
      usedQuestions += questionsPerCoreSubject;
      
      // 5. Dönüşümlü Ders (İngilizce/Sosyal/Din)
      if (!isPazar) {
        const rotatingSubjects = ['İngilizce', 'Sosyal Bilgiler', 'Din Kültürü'];
        const rotatingSubject = rotatingSubjects[dayIndex % rotatingSubjects.length];
        const rotatingContent = this.getSubjectContent(rotatingSubject, weakAchievements, kazanimlarData, selectedGrade, selectedWeek, dayIndex, rotatingQuestions);
        const rotatingResult = this.addDailySubject(dailySchedule[day], rotatingSubject, rotatingQuestions, currentTime, remainingTime, rotatingContent);
        currentTime = rotatingResult.currentTime;
        remainingTime = rotatingResult.remainingTime;
        usedQuestions += rotatingQuestions;
      } else {
        // Pazar: Eksik kazanım konu tekrarı
        this.addSundayReview(dailySchedule[day], weakAchievements, rotatingQuestions, currentTime, remainingTime);
        usedQuestions += rotatingQuestions;
      }
      
      dailySchedule[day].totalQuestions = usedQuestions;

      // Toplam süreleri hesapla
      dailySchedule[day].totalStudyTime = totalStudyMinutes - remainingTime;
      dailySchedule[day].totalBreakTime = Math.floor(dailySchedule[day].totalStudyTime / technique.studyTime) * technique.breakTime;
    });

    return {
      metadata: {
        studentProfile,
        week: selectedWeek,
        grade: selectedGrade,
        technique: studyTechnique,
        dailyQuestionLimit: dailyQuestionLimit,
        usedQuestions: dailyQuestionLimit - 25, // Paragraf hariç
        freedomAreaQuestions: 25, // Paragraf sabit
        weekNumber: weekNumber,
        isFirst16Weeks: weekNumber <= 16
      },
      dailySchedule
    };
  }

  // Zaman işlemleri
  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  formatTime(time) {
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`;
  }

  addMinutes(time, minutes) {
    const totalMinutes = time.hours * 60 + time.minutes + minutes;
    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60
    };
  }
}

// --- Sabitler ve Tipler ---
const TUM_DERSLER = ["Türkçe", "Paragraf", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din Kültürü"];
const HAFTA_GUNLERI = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

// Ders key mapping for consistency
const DERS_KEY_MAP = {
  "Türkçe": "turkce",
  "Matematik": "matematik", 
  "Fen Bilimleri": "fen",
  "Sosyal Bilgiler": "inkilap",
  "İngilizce": "ingilizce",
  "Din Kültürü": "din",
  "Paragraf": "paragraf"
};

// --- Yardımcı Fonksiyonlar ---
const saatiDakikayaCevir = (saatStr) => {
  if (!saatStr || typeof saatStr !== 'string') return 0;
  const [saat, dakika] = saatStr.split(':').map(Number);
  return (saat || 0) * 60 + (dakika || 0);
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const preventConsecutiveSubjects = (blocks) => {
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].ders === blocks[i - 1].ders && blocks[i].tip !== "Mola") { // Mola bloklarını etkilemesin
      // Find a suitable block to swap with
      let swapIndex = -1;
      for (let j = i + 1; j < blocks.length; j++) {
        if (blocks[j].ders !== blocks[i].ders && blocks[j].ders !== blocks[i-1].ders && blocks[j].tip !== "Mola") {
          swapIndex = j;
          break;
        }
      }
      if (swapIndex !== -1) {
        [blocks[i], blocks[swapIndex]] = [blocks[swapIndex], blocks[i]]; // Swap
      } else {
        // If no suitable block found, try to swap with the next different subject
        for (let j = i + 1; j < blocks.length; j++) {
          if (blocks[j].ders !== blocks[i].ders && blocks[j].tip !== "Mola") {
            [blocks[i], blocks[j]] = [blocks[j], blocks[i]]; // Swap
            break;
          }
        }
      }
    }
  }
  return blocks;
};

// --- Ders Planlayıcı Ana Mantığı ---
// Eylül'ün 2. haftasını (pazartesi) hesapla
const getSeptemberSecondWeek = (year) => {
  // Eylül'ün ilk günü
  const septemberFirst = new Date(year, 8, 1); // Ay 0-indexed, 8 = Eylül
  const firstDayOfWeek = septemberFirst.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
  
  // İlk pazartesi gününü bul (pazar=0, pazartesi=1)
  let daysToAdd = 0;
  if (firstDayOfWeek === 0) {
    daysToAdd = 1; // Eylül 1 Pazar ise, 2. gün Pazartesi
  } else if (firstDayOfWeek === 1) {
    daysToAdd = 0; // Eylül 1 Pazartesi ise, zaten pazartesi
  } else {
    daysToAdd = 8 - firstDayOfWeek; // İlk pazartesiye kadar gün sayısı
  }
  
  // İlk pazartesi günü
  const firstMonday = new Date(year, 8, 1 + daysToAdd);
  
  // 2. haftanın pazartesi (ilk pazartesi + 7 gün)
  const secondWeekMonday = new Date(firstMonday);
  secondWeekMonday.setDate(firstMonday.getDate() + 7);
  
  // Tarihi formatla (YYYY-MM-DD)
  const yearStr = secondWeekMonday.getFullYear();
  const monthStr = String(secondWeekMonday.getMonth() + 1).padStart(2, '0');
  const dayStr = String(secondWeekMonday.getDate()).padStart(2, '0');
  
  return `${yearStr}-${monthStr}-${dayStr}`;
};

// Otomatik hafta hesaplama fonksiyonu
const calculateCurrentWeek = () => {
  // localStorage'dan okul başlangıç tarihini al
  let schoolStartDate = localStorage.getItem('schoolStartDate');
  
  // Eğer kayıtlı tarih yoksa, Eylül'ün 2. haftasını otomatik hesapla
  if (!schoolStartDate) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 0-11'den 1-12'ye
    
    // Eğer şu an Eylül'den önceyse, geçen yılın Eylül'ün 2. haftası
    // Eğer Eylül veya sonrasındaysa, bu yılın Eylül'ün 2. haftası
    const schoolYear = (currentMonth >= 9) ? currentYear : currentYear - 1;
    schoolStartDate = getSeptemberSecondWeek(schoolYear);
    
    // localStorage'a kaydet
    localStorage.setItem('schoolStartDate', schoolStartDate);
    console.log(`✅ Okul başlangıç tarihi otomatik hesaplandı: ${schoolStartDate} (${schoolYear} Eylül'ün 2. haftası)`);
  }
  
  // Okul başlangıç tarihini parse et
  const startDate = new Date(schoolStartDate + 'T00:00:00');
  const today = new Date();
  
  // Bugünden başlangıca kadar geçen milisaniye
  const diffTime = today - startDate;
  
  // Hafta sayısını hesapla (7 gün = 1 hafta)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1; // +1 çünkü ilk hafta 1
  
  // Negatif veya çok büyük değerleri kontrol et
  if (weekNumber < 1) return 1;
  if (weekNumber > 38) return 38; // Max 38 hafta
  
  return weekNumber;
};

// Okul başlangıç tarihini ayarlama fonksiyonu (isteğe bağlı)
const setSchoolStartDate = (dateString) => {
  // Format: YYYY-MM-DD
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) {
    console.error('Geçersiz tarih formatı:', dateString);
    return false;
  }
  localStorage.setItem('schoolStartDate', dateString);
  console.log(`✅ Okul başlangıç tarihi güncellendi: ${dateString}`);
  return true;
};

// Console'dan erişilebilir yap (test için)
window.setSchoolStartDate = setSchoolStartDate;
window.getSchoolStartDate = () => {
  return localStorage.getItem('schoolStartDate') || 'Kayıtlı tarih yok (Varsayılan: Eylül 1 kullanılıyor)';
};

window.initializeDersPlanlayici = async (containerElement) => {
  let okuldanCikis = "16:00";
  let uyumaSaati = "22:00";
  let calismaBaslangic = "17:00";
  let currentWeek = calculateCurrentWeek(); // Otomatik hesapla
  let selectedGrade = '';
  let selectedSubject = '';
  let selectedStudyTechnique = 'pomodoro';
  let profiles = [];
  let selectedProfileId = '';
  let allExamsData = [];
  let studentWeaknesses = {};
  let kazanimlarData = {};
  let haftalikPlanData = {};
  let schedule = {};
  
  // Initialize advanced algorithms
  const algorithms = new StudyPlanAlgorithms();

  // UI Elemanlarını Oluştur
  containerElement.innerHTML = `
    <div class="ders-planlayici-container">
      <aside class="ayarlar-paneli">
        <h3>Ders Programı Ayarları</h3>
        <div class="form-grup">
          <label htmlFor="ogrenci-sec">Öğrenci Seç</label>
          <select id="ogrenci-sec"></select>
        </div>
        <div class="form-grup">
          <label htmlFor="sinif-secimi">Sınıf Seçimi</label>
          <select id="sinif-secimi">
            <option value="">Sınıf Seçin</option>
            <option value="5">5. Sınıf</option>
            <option value="6">6. Sınıf</option>
            <option value="7">7. Sınıf</option>
            <option value="8">8. Sınıf</option>
          </select>
        </div>
        <div class="form-grup">
          <label htmlFor="calisma-teknigi">Çalışma Tekniği</label>
          <select id="calisma-teknigi">
            <option value="pomodoro">Pomodoro Tekniği (25dk çalışma, 5dk mola)</option>
            <option value="feynman">Feynman Tekniği (45dk çalışma, 15dk mola)</option>
            <option value="spaced">Aralıklı Tekrar (30dk çalışma, 10dk mola)</option>
            <option value="active">Aktif Öğrenme (40dk çalışma, 10dk mola)</option>
          </select>
        </div>
        <div class="form-grup">
          <label htmlFor="okuldan-cikis">Hafta İçi Derse Başlama</label>
          <input type="time" id="okuldan-cikis" value="${okuldanCikis}" />
        </div>
        <div class="form-grup">
          <label htmlFor="uyuma-saati">Akşam Uyuma Saati</label>
          <input type="time" id="uyuma-saati" value="${uyumaSaati}" />
        </div>
        <div class="form-grup">
          <label htmlFor="calisma-baslangic">Hafta Sonu Derse Başlama</label>
          <input type="time" id="calisma-baslangic" value="${calismaBaslangic}" />
        </div>
        <div class="form-grup">
          <label htmlFor="hafta-secimi">Hafta Seçimi</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="number" id="hafta-secimi" value="${currentWeek}" min="1" max="38" style="flex: 1;" />
            <button id="hafta-otomatik-guncelle" type="button" style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;" title="Haftayı bugünün tarihine göre otomatik güncelle">🔄</button>
          </div>
          <small style="color: #666; font-size: 11px; display: block; margin-top: 4px;">
            📅 Otomatik hesaplanan hafta: ${currentWeek}. Hafta
          </small>
        </div>
        <div class="form-grup">
          <label htmlFor="analiz-ozeti">Öğrenci Analizi</label>
          <div id="analiz-ozeti" class="analiz-ozeti">
            <p>Öğrenci seçildikten sonra analiz görüntülenecek.</p>
          </div>
        </div>
        <button id="plan-olustur-btn" class="plan-olustur-btn">Akıllı Haftalık Plan Oluştur</button>
      </aside>
      <section class="takvim-alani">
        <div class="takvim-header">
          <h2>Haftalık Ders Programı</h2>
          <div class="export-buttons">
            <button id="pdf-export-btn" class="export-button">📄 PDF Olarak Kaydet</button>
          </div>
        </div>
        <div id="takvim-grid-container" class="takvim-grid-container">
          <!-- Takvim buraya yüklenecek -->
        </div>
      </section>
    </div>
  `;

  // Eleman referanslarını al
  const ogrenciSec = containerElement.querySelector('#ogrenci-sec');
  const sinifSecimi = containerElement.querySelector('#sinif-secimi');
  const calismaTeknigi = containerElement.querySelector('#calisma-teknigi');
  const okuldanCikisInput = containerElement.querySelector('#okuldan-cikis');
  const uyumaSaatiInput = containerElement.querySelector('#uyuma-saati');
  const calismaBaslangicInput = containerElement.querySelector('#calisma-baslangic');
  const haftaSecimiInput = containerElement.querySelector('#hafta-secimi');
  const analizOzeti = containerElement.querySelector('#analiz-ozeti');
  const planOlusturBtn = containerElement.querySelector('#plan-olustur-btn');
  const pdfExportBtn = containerElement.querySelector('#pdf-export-btn');
  const takvimGridContainer = containerElement.querySelector('#takvim-grid-container');

  // --- Dropdown Doldurma Fonksiyonları ---
  const populateSinifSecimi = () => {
    sinifSecimi.innerHTML = '<option value="">-- Sınıf Seçin --</option>';
    const grades = Object.keys(haftalikPlanData).sort((a, b) => parseInt(a) - parseInt(b));
    grades.forEach(grade => {
      const option = document.createElement('option');
      option.value = grade;
      option.textContent = `${grade}. Sınıf`;
      sinifSecimi.appendChild(option);
    });
    // Otomatik seçimi dene
    if (grades.length > 0) {
      selectedGrade = localStorage.getItem('selectedPlannerGrade') || grades[0];
      if (!grades.includes(selectedGrade)) { // Eğer kaydedilen sınıf artık yoksa
        selectedGrade = grades[0];
      }
      sinifSecimi.value = selectedGrade;
      // Ders seçimi kaldırıldı - tüm dersler otomatik dahil
    }
  };

  // Ders seçimi artık gerekli değil - tüm dersler otomatik dahil edilecek

  // --- Veri Yükleme ve Durum Güncelleme ---
  const fetchInitialData = async () => {
    try {
      console.log('DersPlanlayici: loadStudents çağrılıyor...');
      const studentsData = await window.electronAPI.loadStudents() || { students: [] };
      const loadedStudents = studentsData.students || [];
      console.log('DersPlanlayici: Yüklenen öğrenciler (raw):', loadedStudents);
      
      // Öğrencileri profile formatına çevir (geriye uyumluluk için)
      profiles = loadedStudents.map(student => ({
        name: student.name,
        grade: student.grade,
        learningStyle: student.learningStyle,
        class: student.class,
        id: student.id
      }));
      console.log('DersPlanlayici: Öğrenciler profile formatına çevrildi:', profiles.slice(0, 3));
      const data = await window.electronAPI.loadData();
      // Eğer data bir object ise ve 'value' property'si varsa, onu kullan
      if (data && typeof data === 'object' && data.value && Array.isArray(data.value)) {
        allExamsData = data.value;
      } else if (Array.isArray(data)) {
        allExamsData = data;
      } else {
        allExamsData = [];
      }
      kazanimlarData = await window.electronAPI.loadKazanimlar() || {}; // Yeni eklenecek
      haftalikPlanData = await window.electronAPI.loadHaftalikPlan() || {}; // Yeni eklenecek
      console.log('DersPlanlayici: haftalikPlanData yüklendi:', Object.keys(haftalikPlanData)); // NEW DEBUG PRINT
      
      // Profilleri selectbox'a doldur
      console.log('DersPlanlayici: ogrenciSec.innerHTML (önce):', ogrenciSec.innerHTML);
      ogrenciSec.innerHTML = '<option value="">-- Bir Öğrenci Seçin --</option>';
      profiles.forEach(profile => {
        const option = document.createElement('option');
        // Profil string ise direkt kullan, object ise name property'sini al
        const profileName = typeof profile === 'string' ? profile : profile.name;
        option.value = profileName;
        option.textContent = profileName;
        
        // Öğrenci bilgilerini data attributelerine ekle
        if (typeof profile === 'object') {
          option.dataset.grade = profile.grade || '';
          option.dataset.learningStyle = profile.learningStyle || '';
          option.dataset.class = profile.class || '';
          option.dataset.id = profile.id || '';
        }
        
        ogrenciSec.appendChild(option);
      });
      console.log('DersPlanlayici: ogrenciSec.innerHTML (sonra):', ogrenciSec.innerHTML);

      // Eğer daha önce seçili bir profil varsa onu seç
      const lastSelectedProfileName = localStorage.getItem('selectedPlannerProfileName');
      const profileNames = profiles.map(p => typeof p === 'string' ? p : p.name);
      if (lastSelectedProfileName && profileNames.includes(lastSelectedProfileName)) {
        selectedProfileId = lastSelectedProfileName;
        ogrenciSec.value = lastSelectedProfileName;
        // Profilin sınıf düzeyini otomatik seç
        const selectedOption = ogrenciSec.querySelector(`option[value="${lastSelectedProfileName}"]`);
        if (selectedOption && selectedOption.dataset.grade) {
          sinifSecimi.value = selectedOption.dataset.grade;
          selectedGrade = selectedOption.dataset.grade;
        }
      } else if (profiles.length > 0) {
        selectedProfileId = profiles[0];
        ogrenciSec.value = profiles[0];
        // Profilin sınıf düzeyini otomatik seç
        const selectedOption = ogrenciSec.querySelector(`option[value="${profiles[0]}"]`);
        if (selectedOption && selectedOption.dataset.grade) {
          sinifSecimi.value = selectedOption.dataset.grade;
          selectedGrade = selectedOption.dataset.grade;
        }
      }
      console.log('DersPlanlayici: selectedProfileId:', selectedProfileId);
      console.log('DersPlanlayici: ogrenciSec.value:', ogrenciSec.value);
      console.log('DersPlanlayici: selectedGrade:', selectedGrade);
      updateStudentWeaknesses();
    } catch (error) {
      console.error("DersPlanlayici: Veri yüklenirken hata:", error);
    }
  };

  const updateStudentWeaknesses = () => {
    console.log('DersPlanlayici: updateStudentWeaknesses çağrıldı.');
    console.log('DersPlanlayici: allExamsData:', allExamsData);
    console.log('DersPlanlayici: typeof allExamsData:', typeof allExamsData);
    console.log('DersPlanlayici: selectedProfileId:', selectedProfileId);

    if (!selectedProfileId || !Array.isArray(allExamsData) || allExamsData.length === 0) {
      studentWeaknesses = {};
      console.log('DersPlanlayici: Zayıflıklar güncellenemedi: selectedProfileId yok, allExamsData dizi değil veya boş.');
      return;
    }

    // SON İKİ DENEMEYİ KULLAN (analyzeWeakAchievements ile tutarlı)
    const studentExams = allExamsData
      .filter(exam => exam?.profile == selectedProfileId)
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // En yeni önce

    if (studentExams.length === 0) {
      studentWeaknesses = {};
      return;
    }

    // Son iki denemeyi al
    const lastTwoExams = studentExams.slice(0, 2);
    console.log(`DersPlanlayici: Son ${lastTwoExams.length} deneme analiz ediliyor:`, lastTwoExams.map(e => e.name));

    const weaknesses = {};

    // Her ders için boş dizi ile başla
    TUM_DERSLER.forEach(ders => {
      weaknesses[ders] = []; 
    });

    // Son iki denemeden eksik kazanımları topla
    lastTwoExams.forEach(exam => {
      console.log('DersPlanlayici: Analiz edilen deneme:', exam.name);
      
      TUM_DERSLER.forEach(ders => {
        const courseKey = Object.keys(exam.courses).find(k => 
          k.toLowerCase() === ders.toLowerCase().replace(/ /g, '')
        );
        
        if (courseKey) {
          const courseData = exam.courses[courseKey];
          console.log(`DersPlanlayici: ${ders} - courseData:`, courseData);
          
      if (courseData && courseData.incorrectOutcomes && courseData.incorrectOutcomes.length > 0) {
            // Eksik kazanımları ekle (duplikasyonları engelle)
            const newOutcomes = courseData.incorrectOutcomes.map(o => (o.split(':')[1] || o).trim());
            newOutcomes.forEach(outcome => {
              if (!weaknesses[ders].includes(outcome)) {
                weaknesses[ders].push(outcome);
              }
            });
          }
        }
      });
    });

    studentWeaknesses = weaknesses;
    console.log('DersPlanlayici: studentWeaknesses (son 2 deneme):', studentWeaknesses);
  };

  // --- Olay Dinleyicileri ---
  // --- Olay Dinleyicileri ---
  ogrenciSec.addEventListener('change', (e) => {
    selectedProfileId = e.target.value;
    console.log('DersPlanlayici: Profil seçildi:', selectedProfileId);
    localStorage.setItem('selectedPlannerProfileId', selectedProfileId);
    updateStudentWeaknesses();
  });

  sinifSecimi.addEventListener('change', (e) => {
    selectedGrade = e.target.value;
    localStorage.setItem('selectedPlannerGrade', selectedGrade);
    // Ders seçimi kaldırıldı - tüm dersler otomatik dahil
  });

  okuldanCikisInput.addEventListener('change', (e) => okuldanCikis = e.target.value);
  uyumaSaatiInput.addEventListener('change', (e) => uyumaSaati = e.target.value);
  calismaBaslangicInput.addEventListener('change', (e) => calismaBaslangic = e.target.value);
  haftaSecimiInput.addEventListener('change', (e) => currentWeek = parseInt(e.target.value));
  
  // Otomatik hafta güncelleme butonu
  const haftaOtomatikGuncelleBtn = containerElement.querySelector('#hafta-otomatik-guncelle');
  if (haftaOtomatikGuncelleBtn) {
    haftaOtomatikGuncelleBtn.addEventListener('click', () => {
      const newWeek = calculateCurrentWeek();
      currentWeek = newWeek;
      haftaSecimiInput.value = newWeek;
      
      // Bilgilendirme mesajı göster
      const infoText = haftaSecimiInput.parentElement.nextElementSibling;
      if (infoText) {
        infoText.textContent = `📅 Otomatik hesaplanan hafta: ${newWeek}. Hafta (Güncellendi: ${new Date().toLocaleDateString('tr-TR')})`;
      }
    });
  }

  planOlusturBtn.addEventListener('click', async () => {
    if (!selectedProfileId) {
      alert("Lütfen bir öğrenci seçin.");
      return;
    }

    if (!selectedGrade) {
      alert("Lütfen bir sınıf seçin.");
      return;
    }

    let remotePlan = null;
    try {
      const remoteResponse = await window.electronAPI.generatePlan({
        studentId: selectedProfileId,
        grade: selectedGrade,
        week: currentWeek,
        technique: calismaTeknigi.value
      });

      if (remoteResponse && remoteResponse.error) {
        if (window.showToast) {
          window.showToast('Premium Özellik', remoteResponse.error, 'info');
        } else {
          alert(remoteResponse.error);
        }
        return;
      }

      remotePlan = remoteResponse && remoteResponse.plan ? remoteResponse.plan : null;
    } catch (error) {
      console.error('plan:generate çağrısı sırasında hata:', error);
      if (window.showToast) {
        window.showToast('Hata', 'Plan oluşturma servisine erişilemedi.', 'error');
      } else {
        alert('Plan oluşturma servisine erişilemedi.');
      }
      return;
    }

    try {
      const weakAchievements = algorithms.analyzeWeakAchievements(allExamsData, selectedProfileId);
      const performance = algorithms.analyzeStudentPerformance(allExamsData, selectedProfileId, selectedGrade);
      const timeSettings = {
        okuldanCikis: okuldanCikisInput.value,
        uyumaSaati: uyumaSaatiInput.value,
        calismaBaslangic: calismaBaslangicInput.value
      };
      const selectedTechnique = calismaTeknigi.value;

      const advancedPlan = algorithms.generateAdvancedWeeklyPlan({
        studentProfile: selectedProfileId,
        selectedWeek: currentWeek,
        selectedGrade: selectedGrade,
        weakAchievements: weakAchievements,
        performance: performance,
        kazanimlarData: kazanimlarData,
        timeSettings: timeSettings,
        studyTechnique: selectedTechnique
      });

      displayAdvancedSchedule(advancedPlan, weakAchievements, kazanimlarData, selectedGrade);

      const remoteSummaryLines = Array.isArray(remotePlan?.summary)
        ? remotePlan.summary.map(item => `- ${item}`).join('\n')
        : '';
      const remoteFocusLines = Array.isArray(remotePlan?.days)
        ? remotePlan.days.map(day => `  - ${day.day}: ${day.focus || ''}`).join('\n')
        : '';
      const remoteSummaryText = remotePlan
        ? `

AI Plan Özeti:
${remoteSummaryLines}${remoteFocusLines ? `

AI Günlük Odaklar:
${remoteFocusLines}` : ''}`
        : '';

      alert(`Akıllı haftalık plan oluşturuldu!

` +
            `Analiz: ${weakAchievements.totalWeakCount} eksik kazanım tespit edildi
` +
            `Teknik: ${algorithms.studyTechniques[selectedTechnique].name}
` +
            `Seviye: ${performance.level === 'beginner' ? 'Başlangıç' : performance.level === 'intermediate' ? 'Orta' : 'İleri'}

` +
            `Günlük Soru Dağılımı:
` +
            `  - Toplam Limit: ${advancedPlan.metadata.dailyQuestionLimit} soru
` +
            `  - Planlanan: ${advancedPlan.metadata.usedQuestions} soru
` +
            `  - Özgürlük Alanı: ${advancedPlan.metadata.freedomAreaQuestions} soru
` +
            `(Özgürlük alanında istediğin konudan çalışabilirsin!)${remoteSummaryText}`);

    } catch (error) {
      console.error('Plan oluşturma hatası:', error);
      alert('Plan oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  });

  // --- Takvim Render Fonksiyonu ---
  const renderTakvim = () => {
    const baslangicSaati = 10; // Sabit başlangıç saati
    const bitisSaati = 22;     // Sabit bitiş saati

    const saatleriOlustur = () => {
      const saatler = [];
      for (let i = baslangicSaati; i < bitisSaati; i++) {
        saatler.push(`${i.toString().padStart(2, '0')}:00`);
        saatler.push(`${i.toString().padStart(2, '0')}:30`);
      }
      return saatler;
    };
    const saatler = saatleriOlustur();

    let takvimHTML = `
      <div class="takvim-grid">
        <div class="gun-basligi"></div>
        ${HAFTA_GUNLERI.map(gun => `<div class="gun-basligi">${gun}</div>`).join('')}
    `;

    saatler.forEach(saat => {
      takvimHTML += `<div class="saat-basligi">${saat}</div>`;
      HAFTA_GUNLERI.forEach(gun => {
        const slotKey = `${gun}-${saat}`;
        const dersBlogu = schedule[slotKey];
        const dersClass = dersBlogu ? `ders-${dersBlogu.ders.toLowerCase().replace(/ /g, '-')} tip-${dersBlogu.tip.toLowerCase().replace(/ /g, '-')}` : '';
        const konuHTML = dersBlogu && dersBlogu.konu ? `<div style="font-size: 0.7em; font-weight: normal;">${dersBlogu.konu}</div>` : '';
        
        takvimHTML += `
          <div class="zaman-dilimi" data-slot-key="${slotKey}">
            ${dersBlogu ? `<div class="ders-blogu ${dersClass}" draggable="true" data-ders-blogu='${JSON.stringify(dersBlogu)}' data-original-slot-key="${slotKey}">${dersBlogu.ders}${konuHTML}</div>` : ''}
          </div>
        `;
      });
    });

    takvimHTML += `</div>`;
    takvimGridContainer.innerHTML = takvimHTML;

    // Sürükle-Bırak Olay Dinleyicileri
    let draggedItem = null;

    takvimGridContainer.querySelectorAll('.ders-blogu').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ''); // Firefox için gerekli
        e.target.classList.add('dragging');
      });

      item.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
        draggedItem = null;
      });
    });

    takvimGridContainer.querySelectorAll('.zaman-dilimi').forEach(slot => {
      slot.addEventListener('dragover', (e) => {
        e.preventDefault(); // Bırakmaya izin ver
        if (draggedItem && slot !== draggedItem.parentNode) {
          slot.classList.add('drag-over');
        }
      });

      slot.addEventListener('dragleave', (e) => {
        slot.classList.remove('drag-over');
      });

      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');

        if (draggedItem) {
          const fromSlotKey = draggedItem.dataset.originalSlotKey;
          const toSlotKey = slot.dataset.slotKey;

          if (fromSlotKey !== toSlotKey) {
            // Programı güncelle
            const newSchedule = { ...schedule };
            const dersBloguData = JSON.parse(draggedItem.dataset.dersBlogu);

            // Hedef slotta zaten bir ders varsa, yer değiştir
            if (newSchedule[toSlotKey]) {
              const existingDersBlogu = newSchedule[toSlotKey];
              newSchedule[fromSlotKey] = existingDersBlogu;
              // Mevcut ders bloğunun orijinal slot anahtarını güncelle
              const existingDersElement = slot.querySelector('.ders-blogu');
              if (existingDersElement) { // Eğer hedef slotta bir element varsa
                existingDersElement.dataset.originalSlotKey = fromSlotKey;
              }
            } else {
              delete newSchedule[fromSlotKey];
            }
            newSchedule[toSlotKey] = dersBloguData;
            schedule = newSchedule;
            renderTakvim(); // Takvimi yeniden çiz
          }
        }
      });
    });
  };

  // Öğrenci analizi fonksiyonu
  const updateStudentAnalysis = () => {
    if (!selectedProfileId) {
      analizOzeti.innerHTML = '<p>Öğrenci seçildikten sonra analiz görüntülenecek.</p>';
      return;
    }

    try {
      // Seçilen öğrencinin bilgilerini al
      const selectedProfile = profiles.find(p => p.name === selectedProfileId);
      const learningStyle = selectedProfile?.learningStyle || null;
      
      // Eğer öğrenme stili profile'da yoksa, dropdown'dan al
      const selectedOption = ogrenciSec.querySelector(`option[value="${selectedProfileId}"]`);
      const dropdownLearningStyle = selectedOption?.dataset.learningStyle || null;
      
      const actualLearningStyle = learningStyle || dropdownLearningStyle;
      
      console.log('updateStudentAnalysis: selectedProfile =', selectedProfile);
      console.log('updateStudentAnalysis: learningStyle from profile =', learningStyle);
      console.log('updateStudentAnalysis: learningStyle from dropdown =', dropdownLearningStyle);
      console.log('updateStudentAnalysis: final learningStyle =', actualLearningStyle);
      
      // Eksik kazanımları analiz et
      const weakAnalysis = algorithms.analyzeWeakAchievements(allExamsData, selectedProfileId);
      
      // Başarı durumunu analiz et
      const performance = algorithms.analyzeStudentPerformance(allExamsData, selectedProfileId, selectedGrade);
      
      // Önerilen çalışma tekniğini belirle (öğrenme stili ile)
      const recommendedTechnique = algorithms.recommendStudyTechnique(performance, actualLearningStyle);
      
      // UI'ı güncelle
      analizOzeti.innerHTML = `
        <div class="analysis-summary">
          <h4>👤 Öğrenci Bilgileri</h4>
          <p><strong>Ad:</strong> ${selectedProfile?.name || 'Bilinmiyor'}</p>
          <p><strong>Sınıf:</strong> ${selectedProfile?.grade || 'Bilinmiyor'}. Sınıf</p>
          <p><strong>Öğrenme Stili:</strong> ${actualLearningStyle || 'Belirlenmemiş'}</p>
          
          <h4>📊 Başarı Analizi</h4>
          <p><strong>Seviye:</strong> ${performance.level === 'beginner' ? 'Başlangıç' : 
                                         performance.level === 'intermediate' ? 'Orta' : 'İleri'}</p>
          <p><strong>Ortalama Net:</strong> ${performance.averageNet.toFixed(1)}/${(parseInt(selectedProfile?.grade) || 5) <= 6 ? 75 : 90}</p>
          <p><strong>Trend:</strong> ${performance.trend === 'improving' ? '📈 Gelişiyor' : 
                                       performance.trend === 'declining' ? '📉 Düşüyor' : '➡️ Stabil'}</p>
          
          <h4>⚠️ Eksik Kazanımlar</h4>
          <p><strong>Toplam:</strong> ${weakAnalysis.totalWeakCount} kazanım</p>
          ${weakAnalysis.priorityList.slice(0, 3).map(item => 
            `<div class="weak-item">• ${item.subject}: ${item.outcome}</div>`
          ).join('')}
          
          <h4>💡 Önerilen Teknik ${actualLearningStyle ? '(Öğrenme Stiline Göre)' : '(Performansa Göre)'}</h4>
          <p><strong>${algorithms.studyTechniques[recommendedTechnique].name}</strong></p>
          <p>${algorithms.studyTechniques[recommendedTechnique].description}</p>
          ${actualLearningStyle ? `<p><em>💎 ${actualLearningStyle} öğrenme stili için optimize edilmiştir.</em></p>` : ''}
        </div>
      `;
      
      // Önerilen tekniği otomatik seç
      calismaTeknigi.value = recommendedTechnique;
    } catch (error) {
      console.error('Analiz hatası:', error);
      analizOzeti.innerHTML = '<p>Analiz yapılırken hata oluştu.</p>';
    }
  };

  // Ders listesi sabit sırada
  const DERS_SIRASI = ["Paragraf", "Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "Din Kültürü", "İngilizce"];
  
  // Gün renkleri
  const GUN_RENKLERI = {
    'Pazartesi': '#FFE5E5',
    'Salı': '#E5F5FF',
    'Çarşamba': '#E5FFE5',
    'Perşembe': '#FFF5E5',
    'Cuma': '#F5E5FF',
    'Cumartesi': '#FFE5F5'
  };

  // Plan verisini 6 sütun x 7 satır tablo yapısına normalize et
  const normalizePlanToTable = (advancedPlan) => {
    const tableData = {};
    
    // Her ders için boş object oluştur
    DERS_SIRASI.forEach(ders => {
      tableData[ders] = {};
      // Pazar hariç her gün için boş hücre
      HAFTA_GUNLERI.slice(0, 6).forEach(gun => {
        tableData[ders][gun] = {
          content: '',
          topic: '',
          questionCount: 0,
          duration: 0
        };
      });
    });
    
    // Plan verisini tabloya dağıt
    HAFTA_GUNLERI.slice(0, 6).forEach(day => {
      const daySchedule = advancedPlan.dailySchedule[day];
      if (!daySchedule || !daySchedule.blocks) return;
      
      daySchedule.blocks.forEach(block => {
        if (block.type !== 'study') return;
        
        const subject = block.subject;
        if (!subject || !tableData[subject]) return;
        
        // Konu metnini tam olarak al (karakter sınırı yok)
        let topicText = block.topic || '';
        
        tableData[subject][day] = {
          content: topicText,
          topic: topicText,
          topicFull: block.topic || topicText, // Tam metin (referans için)
          questionCount: block.questionCount || 0,
          duration: block.duration || 0,
          priority: block.priority || 'normal',
          planningType: block.planningType || 'weekly'
        };
      });
    });
    
    return tableData;
  };

  // Kazanım referans haritası oluştur (hücre içinde kısa gösterim için)
  const buildKazanimReferenceMap = (advancedPlan, weakAchievements, kazanimlarData, grade, week, tableData) => {
    const refMap = new Map(); // topicFull -> { type: 'eksik'|'haftalik', refId: number }
    const subjectRefs = {}; // ders -> { eksik: [], haftalik: string }
    
    DERS_SIRASI.forEach(ders => {
      if (ders === 'Paragraf') return;
      
      subjectRefs[ders] = {
        eksik: [],
        haftalik: null
      };
      
      // Bu dersteki eksik kazanımları bul
      const eksikKazanimlar = weakAchievements?.priorityList?.filter(w => {
        const subject = w.subject || algorithms.extractSubjectFromOutcome(w.outcome);
        return subject === ders;
      }) || [];
      
      // Hangi günlerde hangi kazanımlar kullanıldı?
      HAFTA_GUNLERI.slice(0, 6).forEach(gun => {
        const cellData = tableData[ders]?.[gun];
        if (cellData?.topicFull) {
          const matchingEksik = eksikKazanimlar.find(ek => {
            const ekFull = ek.outcome || '';
            const cellFull = cellData.topicFull || '';
            return ekFull === cellFull || 
                   cellFull.includes(ekFull.substring(0, 30)) || 
                   ekFull.includes(cellFull.substring(0, 30));
          });
          
          if (matchingEksik) {
            if (!subjectRefs[ders].eksik.includes(matchingEksik.outcome)) {
              const refId = subjectRefs[ders].eksik.length + 1;
              subjectRefs[ders].eksik.push(matchingEksik.outcome);
              refMap.set(cellData.topicFull, { type: 'eksik', refId, subject: ders });
            }
          } else if (ders !== 'Türkçe' && ders !== 'İngilizce' && !subjectRefs[ders].haftalik) {
            subjectRefs[ders].haftalik = cellData.topicFull;
            refMap.set(cellData.topicFull, { type: 'haftalik', week, subject: ders });
          }
        }
      });
    });
    
    return { refMap, subjectRefs };
  };

  // Kazanım referansları bölümü oluştur
  const buildKazanimReferences = (advancedPlan, weakAchievements, kazanimlarData, grade, week, tableData) => {
    const { subjectRefs } = buildKazanimReferenceMap(advancedPlan, weakAchievements, kazanimlarData, grade, week, tableData);
    let refsHTML = '<div class="kazanim-references">';
    refsHTML += '<h4>📋 Kazanım Referansları</h4>';
    refsHTML += '<div class="kazanim-grid">';
    
    // Her ders için kontrol et
    DERS_SIRASI.forEach(ders => {
      if (ders === 'Paragraf') return; // Paragraf için kazanım yok
      
      const dersData = subjectRefs[ders];
      if (!dersData) return;
      
      // Eğer bu ders için referans varsa ekle
      if (dersData.eksik.length > 0 || dersData.haftalik) {
        refsHTML += '<div class="kazanim-subject">';
        refsHTML += `<strong>${ders}</strong>`;
        
        // Eksik kazanımlar
        if (dersData.eksik.length > 0) {
          refsHTML += '<div class="kazanim-type">Eksik Kazanımlar:</div>';
          refsHTML += '<ol class="kazanim-list">';
          dersData.eksik.forEach((kazanim, idx) => {
            refsHTML += `<li><span class="kazanim-ref-id">#${idx + 1}</span> ${kazanim}</li>`;
          });
          refsHTML += '</ol>';
        }
        
        // Haftalık kazanım (Matematik, Fen, Sosyal, Din için)
        if (dersData.haftalik && ders !== 'Türkçe' && ders !== 'İngilizce') {
          refsHTML += `<div class="kazanim-type">Haftalık Kazanım (${week}. Hafta):</div>`;
          refsHTML += `<ul class="kazanim-list"><li>${dersData.haftalik}</li></ul>`;
        }
        
        refsHTML += '</div>';
      }
    });
    
    refsHTML += '</div>'; // kazanim-grid
    refsHTML += '</div>'; // kazanim-references
    
    return refsHTML;
  };

  // Gelişmiş plan görüntüleme fonksiyonu - Tablo düzeni
  const displayAdvancedSchedule = (advancedPlan, weakAchievements, kazanimlarData, selectedGrade) => {
    if (!advancedPlan || !advancedPlan.dailySchedule) {
      takvimGridContainer.innerHTML = '<p>Plan oluşturulamadı.</p>';
      return;
    }

    // Plan verisini tabloya normalize et
    const tableData = normalizePlanToTable(advancedPlan);
    
    // Kazanım referans haritası oluştur (kısa referans için)
    const kazanimRefMap = buildKazanimReferenceMap(advancedPlan, weakAchievements, kazanimlarData, selectedGrade, advancedPlan.metadata.week, tableData);
    
    let tableHTML = '<div class="advanced-schedule print-target">';
    
    // Plan başlığı
        tableHTML += `
      <div class="schedule-header">
        <h3>📅 ${advancedPlan.metadata.week}. Hafta Ders Planı - ${advancedPlan.metadata.studentProfile}</h3>
          </div>
        `;

    // Tablo başlangıcı
    tableHTML += '<table class="weekly-plan-table">';
    
    // Başlık satırı - Günler
    tableHTML += '<thead><tr><th class="subject-header">Dersler</th>';
    HAFTA_GUNLERI.slice(0, 6).forEach(gun => {
      tableHTML += `<th class="day-header" style="background-color: ${GUN_RENKLERI[gun]}; color: white;">${gun}</th>`;
    });
    tableHTML += '</tr></thead>';
    
    // Tablo gövdesi - Her ders için satır
    tableHTML += '<tbody>';
    DERS_SIRASI.forEach(ders => {
      tableHTML += `<tr><td class="subject-cell">${ders}</td>`;
      
      HAFTA_GUNLERI.slice(0, 6).forEach(gun => {
        const cellData = tableData[ders][gun];
        const cellClass = cellData.content ? 'filled-cell' : 'empty-cell';
        const priorityClass = cellData.priority === 'high' ? 'high-priority' : '';
        
        // Kısa referans metni oluştur
        let topicDisplay = '';
        if (cellData.content) {
          if (ders === 'Paragraf') {
            topicDisplay = '25 Paragraf Sorusu';
          } else {
            // Kazanım referansını bul
            const refInfo = kazanimRefMap.refMap.get(cellData.topicFull);
            if (refInfo) {
              if (refInfo.type === 'eksik') {
                topicDisplay = `Eksik #${refInfo.refId}`;
              } else if (refInfo.type === 'haftalik') {
                topicDisplay = `Haftalık: ${refInfo.week}. Hafta`;
              }
            } else {
              // Referans bulunamazsa kısa metin göster (max 30 karakter)
              topicDisplay = cellData.topic.length > 30 
                ? cellData.topic.substring(0, 27) + '...' 
                : cellData.topic;
            }
          }
        }
        
      tableHTML += `
          <td class="plan-cell ${cellClass} ${priorityClass}" style="background-color: ${GUN_RENKLERI[gun]}40">
            ${cellData.content ? `
              <div class="cell-content">
                <div class="cell-topic">${topicDisplay}</div>
                <div class="cell-meta">
                  ${cellData.questionCount > 0 ? `<span class="cell-questions">${cellData.questionCount} soru</span>` : ''}
                  ${cellData.duration > 0 ? `<span class="cell-duration">${cellData.duration}dk</span>` : ''}
          </div>
          </div>
            ` : '<div class="cell-empty">-</div>'}
          </td>
      `;
    });
      
      tableHTML += '</tr>';
    });
    tableHTML += '</tbody>';
    
    tableHTML += '</table>';
    
    // Kazanım referansları bölümü ekle
    const kazanimRefs = buildKazanimReferences(
      advancedPlan,
      weakAchievements,
      kazanimlarData,
      selectedGrade,
      advancedPlan.metadata.week,
      tableData
    );
    tableHTML += kazanimRefs;

    tableHTML += '</div>';
    
    takvimGridContainer.innerHTML = tableHTML;
  };

  // Öğrenci seçimi değiştiğinde analizi güncelle
  ogrenciSec.addEventListener('change', (e) => {
    selectedProfileId = e.target.value;
    localStorage.setItem('selectedPlannerId', selectedProfileId);
    
    // Profilin sınıf düzeyini otomatik seç
    const selectedOption = e.target.querySelector(`option[value="${selectedProfileId}"]`);
    if (selectedOption && selectedOption.dataset.grade) {
      sinifSecimi.value = selectedOption.dataset.grade;
      selectedGrade = selectedOption.dataset.grade;
      localStorage.setItem('selectedPlannerGrade', selectedGrade);
    }
    
    console.log('DersPlanlayici: Öğrenci seçildi:', selectedProfileId);
    console.log('DersPlanlayici: Selected option datasets:', {
      grade: selectedOption?.dataset.grade,
      learningStyle: selectedOption?.dataset.learningStyle,
      class: selectedOption?.dataset.class,
      id: selectedOption?.dataset.id
    });
    
    updateStudentAnalysis();
  });

  // Sınıf seçimi değiştiğinde
  sinifSecimi.addEventListener('change', (e) => {
    selectedGrade = e.target.value;
    localStorage.setItem('selectedPlannerGrade', selectedGrade);
  });

  // PDF Export Event Listener
  pdfExportBtn.addEventListener('click', () => {
    exportToPDF();
  });

  // PDF Export Fonksiyonu
  const exportToPDF = async () => {
    const content = takvimGridContainer.innerHTML;
    if (!content || content.trim() === '') {
      alert('Önce bir haftalık plan oluşturun.');
      return;
    }

    try {
      // 1. Loading göster
      if (window.showToast) {
        window.showToast('PDF Hazırlanıyor', 'İçerik render ediliyor...', 'info');
      }
      
      // 2. Print class'ını ekle (sadece ders programı görünsün)
      const body = document.body;
      const originalClasses = body.className;
      
      // Önce print-target class'ını ekle (içerik görünür olsun)
      takvimGridContainer.classList.add('print-target');
      
      // Sonra print-section ekle (diğer şeyleri gizle)
      body.classList.add('print-section');
      
      // 3. DOM'un tamamen render edilmesini bekle
      await new Promise(resolve => {
        requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
          });
        });
      });
      
      // 4. CSS kurallarının uygulanmasını bekle
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 5. İçeriğin görünür olduğundan emin ol
      const table = takvimGridContainer.querySelector('.weekly-plan-table');
      if (table) {
        table.style.display = 'table';
        table.style.visibility = 'visible';
        table.style.opacity = '1';
        
        // Tüm tablo elementlerini görünür yap
        const allTableElements = table.querySelectorAll('thead, tbody, tr, th, td, .cell-content, .cell-topic, .cell-meta');
        allTableElements.forEach(el => {
          el.style.visibility = 'visible';
          el.style.opacity = '1';
        });
      }
      
      // 6. PDF oluştur - Ders planı için landscape modunu zorla
      const result = await window.electronAPI.exportToPDF({ 
        forceLandscape: true,
        source: 'ders-plani' 
      });
      
      // 7. Print class'larını ve inline style'ları temizle
      body.className = originalClasses;
      takvimGridContainer.classList.remove('print-target');
      
      // Inline style'ları temizle
      if (table) {
        table.style.display = '';
        table.style.visibility = '';
        table.style.opacity = '';
        
        const allTableElements = table.querySelectorAll('thead, tbody, tr, th, td, .cell-content, .cell-topic, .cell-meta');
        allTableElements.forEach(el => {
          el.style.visibility = '';
          el.style.opacity = '';
        });
      }
      
      if (result.canceled) {
        console.log('PDF kaydetme iptal edildi');
        return;
      }
      
      if (result.success) {
        const fileName = result.filePath.split('\\').pop() || result.filePath.split('/').pop();
        if (window.showToast) {
          window.showToast('PDF Kaydedildi!', `${fileName} başarıyla kaydedildi`, 'success', 5000);
        }
      } else if (result.error) {
        if (window.showToast) {
          window.showToast('PDF Kaydetme Hatası', result.error, 'error', 6000);
        }
      }
    } catch (error) {
      console.error('PDF export hatası:', error);
      
      // Hata durumunda da class'ları ve inline style'ları temizle
      const body = document.body;
      if (takvimGridContainer) {
        takvimGridContainer.classList.remove('print-target');
        
        // Inline style'ları temizle
        const table = takvimGridContainer.querySelector('.weekly-plan-table');
        if (table) {
          table.style.display = '';
          table.style.visibility = '';
          table.style.opacity = '';
          
          const allTableElements = table.querySelectorAll('thead, tbody, tr, th, td, .cell-content, .cell-topic, .cell-meta');
          allTableElements.forEach(el => {
            el.style.visibility = '';
            el.style.opacity = '';
          });
        }
      }
      body.classList.remove('print-section');
      
      if (window.showToast) {
        window.showToast('Beklenmeyen Hata', 'PDF kaydetme sırasında bir hata oluştu', 'error', 5000);
      }
    }
  };

  // Başlangıç verilerini yükle
  fetchInitialData();
};

// ============================================
// GAMİFİCATION SİSTEMİ (Rozet ve İlerleme)
// ============================================

class StudyGamification {
  constructor() {
    this.badges = {
      weekCompleted: {
        id: 'week_completed',
        icon: '🏆',
        name: 'Hafta Tamamlandı',
        description: 'Tüm haftalık hedefleri tamamladın!',
        xp: 100,
        condition: (stats) => stats.weekCompletion >= 100
      },
      perfectWeek: {
        id: 'perfect_week',
        icon: '⭐',
        name: 'Mükemmel Hafta',
        description: '%100 tamamlama oranı!',
        xp: 250,
        condition: (stats) => stats.weekCompletion === 100
      },
      streakWeek: {
        id: 'streak_week',
        icon: '🔥',
        name: '3 Hafta Üst Üste',
        description: '3 hafta boyunca düzenli çalıştın!',
        xp: 500,
        condition: (stats) => stats.streak >= 21 // 3 hafta = 21 gün
      },
      earlyBird: {
        id: 'early_bird',
        icon: '🌅',
        name: 'Erken Kuş',
        description: '5 gün üst üste sabah çalıştın!',
        xp: 150,
        condition: (stats) => stats.morningStudyDays >= 5
      },
      nightOwl: {
        id: 'night_owl',
        icon: '🦉',
        name: 'Gece Kuşu',
        description: '5 gün üst üste akşam çalıştın!',
        xp: 150,
        condition: (stats) => stats.eveningStudyDays >= 5
      },
      weakTopicMaster: {
        id: 'weak_topic_master',
        icon: '💪',
        name: 'Zayıf Konu Ustası',
        description: 'Bir zayıf konuyu ustalaştırdın!',
        xp: 300,
        condition: (stats) => stats.masteredWeakTopics >= 1
      },
      marathoner: {
        id: 'marathoner',
        icon: '🏃',
        name: 'Maraton Koşucusu',
        description: '1000+ soru çözdün!',
        xp: 400,
        condition: (stats) => stats.totalQuestions >= 1000
      },
      consistent: {
        id: 'consistent',
        icon: '📅',
        name: 'Tutarlı Çalışkan',
        description: '30 gün boyunca her gün çalıştın!',
        xp: 750,
        condition: (stats) => stats.streak >= 30
      }
    };

    this.levels = [
      { level: 1, name: 'Yeni Başlayan', minXP: 0, maxXP: 99 },
      { level: 2, name: 'Acemi', minXP: 100, maxXP: 299 },
      { level: 3, name: 'Öğrenci', minXP: 300, maxXP: 599 },
      { level: 4, name: 'Çalışkan', minXP: 600, maxXP: 999 },
      { level: 5, name: 'Deneyimli', minXP: 1000, maxXP: 1499 },
      { level: 6, name: 'Uzman', minXP: 1500, maxXP: 2499 },
      { level: 7, name: 'Master', minXP: 2500, maxXP: 3999 },
      { level: 8, name: 'Efsane', minXP: 4000, maxXP: 5999 },
      { level: 9, name: 'Kahraman', minXP: 6000, maxXP: 9999 },
      { level: 10, name: 'LGS Şampiyonu', minXP: 10000, maxXP: Infinity }
    ];
  }

  /**
   * XP'den seviye hesapla
   */
  calculateLevel(xp) {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const levelInfo = this.levels[i];
      if (xp >= levelInfo.minXP) {
        const nextLevel = this.levels[i + 1];
        const xpInCurrentLevel = xp - levelInfo.minXP;
        const xpNeededForNextLevel = nextLevel
          ? nextLevel.minXP - levelInfo.minXP
          : 0;
        const progressPercent = nextLevel
          ? Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)
          : 100;

        return {
          level: levelInfo.level,
          name: levelInfo.name,
          xp,
          xpInLevel: xpInCurrentLevel,
          xpForNext: xpNeededForNextLevel - xpInCurrentLevel,
          progressPercent,
          nextLevelName: nextLevel?.name || 'Maksimum Seviye'
        };
      }
    }

    return {
      level: 1,
      name: 'Yeni Başlayan',
      xp: 0,
      xpInLevel: 0,
      xpForNext: 100,
      progressPercent: 0,
      nextLevelName: 'Acemi'
    };
  }

  /**
   * Kazanılan rozetleri kontrol et
   */
  checkBadges(stats) {
    const earnedBadges = [];

    Object.values(this.badges).forEach(badge => {
      if (badge.condition(stats) && !stats.earnedBadges?.includes(badge.id)) {
        earnedBadges.push(badge);
      }
    });

    return earnedBadges;
  }

  /**
   * Dashboard için istatistikleri hazırla
   */
  generateDashboardData(studentProgress) {
    const level = this.calculateLevel(studentProgress.totalXP || 0);
    const earnedBadges = studentProgress.earnedBadges || [];

    return {
      level,
      totalXP: studentProgress.totalXP || 0,
      earnedBadges: earnedBadges.map(badgeId => this.badges[badgeId]),
      availableBadges: Object.values(this.badges).filter(
        badge => !earnedBadges.includes(badge.id)
      ),
      stats: {
        todayCompletion: studentProgress.todayCompletion || 0,
        weekCompletion: studentProgress.weekCompletion || 0,
        streak: studentProgress.streak || 0,
        totalQuestions: studentProgress.totalQuestions || 0
      }
    };
  }

  /**
   * İlerleme barı HTML'i oluştur
   */
  renderProgressBar(percent, label) {
    return `
      <div class="progress-bar-container">
        <div class="progress-bar-label">${label}</div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width: ${percent}%"></div>
        </div>
        <div class="progress-bar-percent">${percent}%</div>
      </div>
    `;
  }

  /**
   * Rozet kartı HTML'i oluştur
   */
  renderBadgeCard(badge, earned = false) {
    return `
      <div class="badge-card ${earned ? 'earned' : 'locked'}">
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-name">${badge.name}</div>
        <div class="badge-description">${badge.description}</div>
        <div class="badge-xp">${badge.xp} XP</div>
        ${earned ? '<div class="badge-status">✅ Kazanıldı</div>' : '<div class="badge-status">🔒 Kilitli</div>'}
      </div>
    `;
  }

  /**
   * Tam dashboard HTML'i oluştur
   */
  renderDashboard(studentProgress) {
    const dashData = this.generateDashboardData(studentProgress);

    return `
      <div class="study-dashboard">
        <!-- Seviye ve XP -->
        <div class="dashboard-section level-section">
          <h3>⭐ Seviye ${dashData.level.level} - ${dashData.level.name}</h3>
          <div class="level-info">
            <p>Toplam XP: <strong>${dashData.totalXP}</strong></p>
            <p>Sonraki seviye için: <strong>${dashData.level.xpForNext} XP</strong></p>
          </div>
          ${this.renderProgressBar(dashData.level.progressPercent, `${dashData.level.nextLevelName} seviyesine ilerleme`)}
        </div>

        <!-- Günlük ve Haftalık İlerleme -->
        <div class="dashboard-section progress-section">
          <h3>📊 İlerleme</h3>
          ${this.renderProgressBar(dashData.stats.todayCompletion, 'Bugünkü Hedefler')}
          ${this.renderProgressBar(dashData.stats.weekCompletion, 'Haftalık Hedefler')}
          <div class="streak-display">
            <span class="streak-icon">🔥</span>
            <span class="streak-number">${dashData.stats.streak}</span>
            <span class="streak-label">gün üst üste</span>
          </div>
        </div>

        <!-- Kazanılan Rozetler -->
        <div class="dashboard-section badges-section">
          <h3>🏅 Rozetler (${dashData.earnedBadges.length}/${Object.keys(this.badges).length})</h3>
          <div class="badge-grid">
            ${dashData.earnedBadges.map(badge => this.renderBadgeCard(badge, true)).join('')}
            ${dashData.availableBadges.slice(0, 3).map(badge => this.renderBadgeCard(badge, false)).join('')}
          </div>
        </div>

        <!-- İstatistikler -->
        <div class="dashboard-section stats-section">
          <h3>📈 İstatistikler</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📝</div>
              <div class="stat-value">${dashData.stats.totalQuestions}</div>
              <div class="stat-label">Toplam Soru</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⭐</div>
              <div class="stat-value">${dashData.level.level}</div>
              <div class="stat-label">Seviye</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🏆</div>
              <div class="stat-value">${dashData.earnedBadges.length}</div>
              <div class="stat-label">Rozet</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🔥</div>
              <div class="stat-value">${dashData.stats.streak}</div>
              <div class="stat-label">Seri</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Global gamification instance
window.studyGamification = new StudyGamification();


