#!/usr/bin/env node

/**
 * Backfill Script: Mevcut sınav verilerine net değerlerini ekler
 * 
 * Bu script data.json dosyasındaki tüm sınav kayıtlarını tarar ve
 * eksik olan net değerlerini hesaplayarak ekler.
 * 
 * Formül: net = correct - (incorrect / 4)
 * 
 * Kullanım:
 * node scripts/backfill-net-values.js
 */

const fs = require('fs');
const path = require('path');

// Data dosyası yolu
const dataPath = path.join(
  require('os').homedir(),
  'AppData',
  'Roaming',
  'kapsul-kocluk-programi',
  'shared',
  'data.json'
);

console.log('🔧 Net Değerleri Backfill Scripti Başlatılıyor...');
console.log(`📁 Veri dosyası: ${dataPath}`);

// Dosya var mı kontrol et
if (!fs.existsSync(dataPath)) {
  console.error('❌ Hata: data.json dosyası bulunamadı!');
  console.error(`   Beklenen konum: ${dataPath}`);
  process.exit(1);
}

try {
  // Mevcut veriyi oku
  console.log('📖 Veri dosyası okunuyor...');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(rawData);
  
  if (!data.value || !Array.isArray(data.value)) {
    console.error('❌ Hata: Geçersiz veri formatı!');
    process.exit(1);
  }
  
  console.log(`📊 Toplam ${data.value.length} sınav kaydı bulundu`);
  
  // Yedek oluştur
  const backupPath = dataPath + '.backup-' + Date.now();
  console.log(`💾 Yedek oluşturuluyor: ${backupPath}`);
  fs.writeFileSync(backupPath, rawData);
  console.log('✅ Yedek oluşturuldu');
  
  // İstatistikler
  let totalExams = 0;
  let updatedCourses = 0;
  let skippedCourses = 0;
  
  // Her sınav için net değerlerini hesapla
  console.log('🔄 Net değerleri hesaplanıyor...');
  
  data.value.forEach((exam, examIndex) => {
    if (!exam.courses || typeof exam.courses !== 'object') {
      return;
    }
    
    totalExams++;
    let examUpdated = false;
    
    Object.keys(exam.courses).forEach(subjectKey => {
      const course = exam.courses[subjectKey];
      
      if (!course || typeof course !== 'object') {
        return;
      }
      
      // Net değeri yoksa veya null/undefined ise hesapla
      if (course.net === undefined || course.net === null) {
        const correct = parseInt(course.correct) || 0;
        const incorrect = parseInt(course.incorrect) || 0;
        
        // Net hesapla: doğru - (yanlış / 4)
        const net = correct - (incorrect / 4);
        
        course.net = parseFloat(net.toFixed(2));
        updatedCourses++;
        examUpdated = true;
        
        console.log(`   📝 ${exam.profile} - ${exam.name} - ${subjectKey}: ${correct}D/${incorrect}Y → ${course.net} net`);
      } else {
        skippedCourses++;
      }
    });
    
    if (examUpdated) {
      console.log(`   ✅ Sınav güncellendi: ${exam.profile} - ${exam.name}`);
    }
  });
  
  // Güncellenmiş veriyi kaydet
  console.log('💾 Güncellenmiş veri kaydediliyor...');
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  
  // Sonuçları göster
  console.log('\n🎉 Backfill Tamamlandı!');
  console.log('═══════════════════════════════════════');
  console.log(`📊 Toplam sınav: ${totalExams}`);
  console.log(`✅ Güncellenen ders: ${updatedCourses}`);
  console.log(`⏭️  Atlanan ders: ${skippedCourses}`);
  console.log(`💾 Yedek dosyası: ${backupPath}`);
  console.log('═══════════════════════════════════════');
  
  if (updatedCourses > 0) {
    console.log('\n🚀 Artık grafikler doğru değerleri gösterecek!');
    console.log('   - Performans Karşılaştırma Grafiği');
    console.log('   - Ders Bazında Gelişim Trendi');
    console.log('   - Tüm net hesaplamaları');
  } else {
    console.log('\nℹ️  Tüm net değerleri zaten mevcut.');
  }
  
} catch (error) {
  console.error('❌ Hata oluştu:', error.message);
  console.error('   Detay:', error);
  process.exit(1);
}
