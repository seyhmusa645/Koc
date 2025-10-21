// DersPlanlayici.js - Advanced Study Planning System
// Gelişmiş Ders Planlama Sistemi

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

    // Sadece son iki sınavdan eksik kazanımları topla
    lastTwoExams.forEach(exam => {
      Object.values(exam.courses).forEach(course => {
        if (course.incorrectOutcomes) {
          course.incorrectOutcomes.forEach(outcome => {
            if (!weakOutcomes[outcome]) {
              weakOutcomes[outcome] = 0;
              outcomeFrequency[outcome] = 0;
            }
            weakOutcomes[outcome]++;
            outcomeFrequency[outcome]++;
          });
        }
      });
    });

    // Öncelik sırasına göre sırala (daha sık tekrarlanan eksiklikler önce)
    const priorityList = Object.entries(weakOutcomes)
      .map(([outcome, count]) => ({
        outcome,
        count,
        subject: this.extractSubjectFromOutcome(outcome),
        frequency: count / lastTwoExams.length // Kaç denemede kaç kez yanlış yapıldığı oranı
      }))
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
    if (outcome.includes('SB.')) return 'Sosyal Bilgiler';
    if (outcome.includes('M.')) return 'Matematik';
    if (outcome.includes('F.') || outcome.includes('FB.')) return 'Fen Bilimleri';
    if (outcome.includes('DK.') || outcome.includes('Din')) return 'Din Kültürü';
    if (outcome.includes('T.') || outcome.includes('Türkçe')) return 'Türkçe';
    if (outcome.includes('İ.') || outcome.includes('İngilizce')) return 'İngilizce';
    if (outcome.includes('İTA.') || outcome.includes('İnkılap')) return 'Sosyal Bilgiler';
    return 'Bilinmeyen';
  }

  // Öğrenci seviyesine göre günlük soru sayısını hesapla
  calculateQuestionsByLevel(weekNumber, selectedGrade, performance) {
    const grade = parseInt(selectedGrade);
    const level = performance.level; // 'beginner', 'intermediate', 'advanced'
    
    console.log(`Seviye hesaplaması: Sınıf=${grade}, Hafta=${weekNumber}, Seviye=${level}`);
    
    if (weekNumber <= 16) {
      // İlk 16 hafta
      if (grade === 8) {
        // 8. sınıf
        switch(level) {
          case 'advanced': return 200; // İyi
          case 'intermediate': return 150; // Orta
          case 'beginner': return 100; // Zayıf
          default: return 150; // Varsayılan orta
        }
      } else {
        // 5, 6, 7. sınıf
        switch(level) {
          case 'advanced': return 150; // İyi
          case 'intermediate': return 100; // Orta
          case 'beginner': return 70; // Zayıf
          default: return 100; // Varsayılan orta
        }
      }
    } else {
      // 16. haftadan sonra - eski sistem
      return 300;
    }
  }

  // Ders içeriğini belirle (eksik kazanım varsa eksik, yoksa haftalık)
  getSubjectContent(subject, weakAchievements, kazanimlarData, selectedGrade, selectedWeek, isWeaknessDay) {
    // Türkçe ve İngilizce için özel kontrol
    const nonWeeklySubjects = ['Türkçe', 'İngilizce'];
    const isNonWeeklySubject = nonWeeklySubjects.includes(subject);
    
    if (isNonWeeklySubject) {
      // Türkçe/İngilizce için eksiklik bazlı planlama
      const subjectKey = subject === 'Türkçe' ? 'turkce' : 'ingilizce';
      const topicData = this.generateTopicForNonWeeklySubject(subjectKey, weakAchievements.priorityList, selectedGrade);
      
      return {
        type: 'weakness-based',
        content: topicData.topic,
        description: topicData.description,
        focusAreas: topicData.focusAreas,
        priority: topicData.priority
      };
    }
    
    if (!isWeaknessDay) {
      // Haftalık konu günü - her zaman haftalık kazanımlar
      return this.getWeeklyContent(subject, kazanimlarData, selectedGrade, selectedWeek);
    }
    
    // Eksik kazanım günü - önce eksik kazanım ara
    const subjectWeaknesses = weakAchievements.priorityList.filter(w => 
      this.extractSubjectFromOutcome(w.outcome) === subject
    );
    
    if (subjectWeaknesses.length > 0) {
      // Eksik kazanım varsa eksik kazanımları kullan
      return {
        type: 'weakness',
        content: subjectWeaknesses.map(w => w.outcome).join(', '),
        description: `${subject} eksik kazanım soru çözümü`
      };
    } else {
      // Eksik kazanım yoksa haftalık kazanımları kullan
      return this.getWeeklyContent(subject, kazanimlarData, selectedGrade, selectedWeek);
    }
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

  // Pazar konu tekrarı
  addSundayReview(daySchedule, weakAchievements, questionCount, currentTime, remainingTime) {
    if (weakAchievements.priorityList.length === 0) return;
    
    const studyTime = Math.min(remainingTime, 60); // 1 saat konu tekrarı
    
    daySchedule.blocks.push({
      type: 'study',
      subject: 'Eksik Kazanım Tekrarı',
      topic: 'Tüm eksik kazanımların konu tekrarı',
      startTime: this.formatTime(currentTime),
      duration: studyTime,
      priority: 'high',
      activity: 'Konu Tekrarı ve Pekiştirme',
      description: `Eksik kazanımların konu tekrarı - ${questionCount} soru`,
      questionCount: questionCount
    });
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
      const paragrafResult = this.addDailySubject(dailySchedule[day], 'Paragraf', 25, currentTime, remainingTime, 'Paragraf soruları çözme');
      currentTime = paragrafResult.currentTime;
      remainingTime = paragrafResult.remainingTime;
      usedQuestions += 25;
      
      // 2. Matematik (her gün)
      const mathContent = this.getSubjectContent('Matematik', weakAchievements, kazanimlarData, selectedGrade, selectedWeek, isWeaknessDay);
      const mathResult = this.addDailySubject(dailySchedule[day], 'Matematik', questionsPerCoreSubject, currentTime, remainingTime, mathContent);
      currentTime = mathResult.currentTime;
      remainingTime = mathResult.remainingTime;
      usedQuestions += questionsPerCoreSubject;
      
      // 3. Fen Bilimleri (her gün)
      const fenContent = this.getSubjectContent('Fen Bilimleri', weakAchievements, kazanimlarData, selectedGrade, selectedWeek, isWeaknessDay);
      const fenResult = this.addDailySubject(dailySchedule[day], 'Fen Bilimleri', questionsPerCoreSubject, currentTime, remainingTime, fenContent);
      currentTime = fenResult.currentTime;
      remainingTime = fenResult.remainingTime;
      usedQuestions += questionsPerCoreSubject;
      
      // 4. Türkçe (her gün)
      const turkceContent = this.getSubjectContent('Türkçe', weakAchievements, kazanimlarData, selectedGrade, selectedWeek, isWeaknessDay);
      const turkceResult = this.addDailySubject(dailySchedule[day], 'Türkçe', questionsPerCoreSubject, currentTime, remainingTime, turkceContent);
      currentTime = turkceResult.currentTime;
      remainingTime = turkceResult.remainingTime;
      usedQuestions += questionsPerCoreSubject;
      
      // 5. Dönüşümlü Ders (İngilizce/Sosyal/Din)
      if (!isPazar) {
        const rotatingSubjects = ['İngilizce', 'Sosyal Bilgiler', 'Din Kültürü'];
        const rotatingSubject = rotatingSubjects[dayIndex % rotatingSubjects.length];
        const rotatingContent = this.getSubjectContent(rotatingSubject, weakAchievements, kazanimlarData, selectedGrade, selectedWeek, isWeaknessDay);
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
window.initializeDersPlanlayici = async (containerElement) => {
  let okuldanCikis = "16:00";
  let uyumaSaati = "22:00";
  let calismaBaslangic = "17:00";
  let currentWeek = 1;
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
          <input type="number" id="hafta-secimi" value="${currentWeek}" min="1" max="38" />
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
  haftaSecimiInput.addEventListener('change', (e) => currentWeek = parseInt(e.target.value)); // Yeni eklenecek

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

      displayAdvancedSchedule(advancedPlan);

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
          <p><strong>Ortalama Net:</strong> ${performance.averageNet.toFixed(1)}/90</p>
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

  // Gelişmiş plan görüntüleme fonksiyonu
  const displayAdvancedSchedule = (advancedPlan) => {
    if (!advancedPlan || !advancedPlan.dailySchedule) {
      takvimGridContainer.innerHTML = '<p>Plan oluşturulamadı.</p>';
      return;
    }

    let tableHTML = '<div class="advanced-schedule">';
    
    // Plan başlığı ve özeti
    tableHTML += `
      <div class="schedule-header">
        <h3>📅 ${advancedPlan.metadata.week}. Hafta Çalışma Planı</h3>
        <p><strong>Teknik:</strong> ${algorithms.studyTechniques[advancedPlan.metadata.technique].name}</p>
        <p><strong>Öğrenci:</strong> ${advancedPlan.metadata.studentProfile}</p>
      </div>
    `;

    // Plan özeti hesapla
    let totalWeeklyStudyMinutes = 0;
    let totalWeeklyQuestions = 0;
    let totalWeeklyBreakMinutes = 0;
    
    HAFTA_GUNLERI.forEach(day => {
      const daySchedule = advancedPlan.dailySchedule[day];
      if (daySchedule) {
        totalWeeklyStudyMinutes += daySchedule.totalStudyTime || 0;
        totalWeeklyQuestions += daySchedule.totalQuestions || 0;
        totalWeeklyBreakMinutes += daySchedule.totalBreakTime || 0;
      }
    });
    
    const totalWeeklyStudyHours = Math.floor(totalWeeklyStudyMinutes / 60);
    const remainingStudyMinutes = totalWeeklyStudyMinutes % 60;
    
    // Plan özeti
    tableHTML += `
      <div class="plan-summary">
        <h4>📊 Plan Özeti</h4>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Toplam Çalışma:</span>
            <span class="stat-value">${totalWeeklyStudyHours}s ${remainingStudyMinutes}dk</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Toplam Soru:</span>
            <span class="stat-value">${totalWeeklyQuestions} soru</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Toplam Mola:</span>
            <span class="stat-value">${Math.floor(totalWeeklyBreakMinutes / 60)}s ${totalWeeklyBreakMinutes % 60}dk</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Seviye:</span>
            <span class="stat-value">${advancedPlan.metadata.performance?.level === 'beginner' ? 'Başlangıç' : advancedPlan.metadata.performance?.level === 'intermediate' ? 'Orta' : 'İleri'}</span>
          </div>
        </div>
      </div>
    `;

    // Renk kodlu gösterge
    tableHTML += `
      <div class="plan-legend">
        <h4>🎨 Gösterge</h4>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-color weakness-based"></div>
            <span>Eksiklik Bazlı (Türkçe/İngilizce)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color weakness"></div>
            <span>Eksik Kazanım</span>
          </div>
          <div class="legend-item">
            <div class="legend-color week-based"></div>
            <span>Hafta Bazlı</span>
          </div>
        </div>
      </div>
    `;

    // Günlük programlar
    HAFTA_GUNLERI.forEach(day => {
      const daySchedule = advancedPlan.dailySchedule[day];
      if (!daySchedule) return;

      const totalStudyMinutes = daySchedule.totalStudyTime || 0;
      const totalBreakMinutes = daySchedule.totalBreakTime || 0;

      tableHTML += `
        <div class="daily-schedule">
          <div class="day-header">
            <h4>${day}</h4>
            <div class="day-stats">
              <span class="study-time">📚 ${Math.floor(totalStudyMinutes/60)}s ${totalStudyMinutes%60}dk</span>
              <span class="break-time">☕ ${Math.floor(totalBreakMinutes/60)}s ${totalBreakMinutes%60}dk</span>
            </div>
          </div>
          <div class="day-blocks">
      `;

      daySchedule.blocks.forEach(block => {
        const blockClass = block.type === 'study' ? `study-block priority-${block.priority || 'normal'}` : 'break-block';
        const subjectClass = block.subject ? DERS_KEY_MAP[block.subject] || block.subject.toLowerCase() : '';
        
        // Eksiklik bazlı planlama için özel class
        const planningTypeClass = block.planningType === 'weakness-based' ? 'weakness-based' : 
                                 block.planningType === 'weakness' ? 'weakness' : 'week-based';
        
        // Badge metni
        let badgeText = '';
        if (block.planningType === 'weakness-based') {
          badgeText = '<div class="planning-badge weakness-based-badge">🎯 Eksiklik Bazlı</div>';
        } else if (block.planningType === 'weakness') {
          badgeText = '<div class="planning-badge weakness-badge">⚠️ Eksik Kazanım</div>';
        } else if (block.planningType === 'weekly') {
          badgeText = '<div class="planning-badge weekly-badge">📅 Hafta Bazlı</div>';
        }
        
        tableHTML += `
          <div class="time-block ${blockClass} ${planningTypeClass}" data-subject="${subjectClass}">
            <div class="block-time">${block.startTime} (${block.duration}dk)</div>
            <div class="block-content">
              <div class="block-title">${block.activity || block.subject || 'Mola'}</div>
              ${block.topic ? `<div class="block-topic">${block.topic}</div>` : ''}
              ${block.description ? `<div class="block-description">${block.description}</div>` : ''}
              ${block.focusAreas && block.focusAreas.length > 0 ? 
                `<div class="focus-areas">Odak Alanları: ${block.focusAreas.slice(0, 2).join(', ')}${block.focusAreas.length > 2 ? '...' : ''}</div>` : ''}
            </div>
            ${badgeText}
            ${block.priority === 'high' ? '<div class="priority-badge">🔥</div>' : ''}
          </div>
        `;
      });

      // Günlük özet istatistikleri
      tableHTML += `
          </div>
          <div class="day-summary">
            <span>📚 ${totalStudyMinutes}dk çalışma</span>
            <span>☕ ${totalBreakMinutes}dk mola</span>
            <span>📝 ${daySchedule.totalQuestions || 0} soru</span>
          </div>
        </div>
      `;
    });

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
      
      // 2. DOM'un tamamen render edilmesini bekle
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });
      
      // 3. Dinamik içeriklerin yüklenmesini bekle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 4. PDF oluştur
      const result = await window.electronAPI.exportToPDF();
      
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
      if (window.showToast) {
        window.showToast('Beklenmeyen Hata', 'PDF kaydetme sırasında bir hata oluştu', 'error', 5000);
      }
    }
  };

  // Başlangıç verilerini yükle
  fetchInitialData();
};

// renderer.js'den çağrılacak global fonksiyon
window.initializeDersPlanlayici = initializeDersPlanlayici;


