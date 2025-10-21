#!/usr/bin/env node

/**
 * Öğrenci Veri Migrasyon Scripti
 * 
 * Bu script mevcut students.json dosyalarını yeni kabiliyet verisi şemasına göre günceller.
 * Eski kayıtlara abilityLevels ve learningStyle alanları ekler.
 * 
 * Kullanım:
 * node scripts/migrate_students_data.js
 */

const fs = require('fs');
const path = require('path');

// Varsayılan kabiliyet seviyeleri
const defaultAbilityLevels = {
  visualSpatial: { level: 0, score: 0 },
  verbalLinguistic: { level: 0, score: 0 },
  logicalMathematical: { level: 0, score: 0 },
  musicalRhythmic: { level: 0, score: 0 },
  bodilyKinesthetic: { level: 0, score: 0 },
  interpersonal: { level: 0, score: 0 },
  intrapersonal: { level: 0, score: 0 },
  naturalist: { level: 0, score: 0 }
};

// Migrasyon fonksiyonu
function migrateStudentData(student) {
  return {
    ...student,
    abilityLevels: student.abilityLevels || defaultAbilityLevels,
    learningStyle: student.learningStyle || 'Belirlenmemiş',
    updatedAt: new Date().toISOString()
  };
}

// Dosya migrasyonu
function migrateFile(filePath) {
  try {
    console.log(`📁 Migrasyon başlatılıyor: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Dosya bulunamadı: ${filePath}`);
      return false;
    }
    
    // Dosyayı oku
    const data = fs.readFileSync(filePath, 'utf8');
    const studentsData = JSON.parse(data);
    
    // Backup oluştur
    const backupPath = filePath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, data);
    console.log(`💾 Backup oluşturuldu: ${backupPath}`);
    
    // Öğrencileri migrate et
    if (studentsData.students && Array.isArray(studentsData.students)) {
      studentsData.students = studentsData.students.map(migrateStudentData);
      studentsData.lastUpdated = new Date().toISOString();
      studentsData.migrationDate = new Date().toISOString();
      
      // Dosyayı güncelle
      fs.writeFileSync(filePath, JSON.stringify(studentsData, null, 2));
      console.log(`✅ Migrasyon tamamlandı: ${studentsData.students.length} öğrenci güncellendi`);
      return true;
    } else {
      console.log(`⚠️  Geçersiz dosya formatı: ${filePath}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Migrasyon hatası (${filePath}):`, error.message);
    return false;
  }
}

// Ana migrasyon fonksiyonu
function runMigration() {
  console.log('🚀 Öğrenci Veri Migrasyonu Başlatılıyor...\n');
  
  const migrationPaths = [
    // Ana students.json dosyası
    path.join(__dirname, '..', 'data', 'students.json'),
    // Kullanıcı bazlı dosyalar (varsa)
    path.join(__dirname, '..', 'data', 'users'),
    // Diğer olası konumlar
    path.join(__dirname, '..', 'students.json')
  ];
  
  let migratedCount = 0;
  let totalCount = 0;
  
  // Ana dosyaları migrate et
  migrationPaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      if (fs.statSync(filePath).isDirectory()) {
        // Klasör ise içindeki JSON dosyalarını migrate et
        const files = fs.readdirSync(filePath).filter(file => file.endsWith('.json'));
        files.forEach(file => {
          const fullPath = path.join(filePath, file);
          totalCount++;
          if (migrateFile(fullPath)) {
            migratedCount++;
          }
        });
      } else {
        // Dosya ise direkt migrate et
        totalCount++;
        if (migrateFile(filePath)) {
          migratedCount++;
        }
      }
    }
  });
  
  console.log(`\n📊 Migrasyon Özeti:`);
  console.log(`   Toplam dosya: ${totalCount}`);
  console.log(`   Başarılı: ${migratedCount}`);
  console.log(`   Başarısız: ${totalCount - migratedCount}`);
  
  if (migratedCount > 0) {
    console.log(`\n✅ Migrasyon tamamlandı! ${migratedCount} dosya güncellendi.`);
    console.log(`💡 Backup dosyaları oluşturuldu. Gerekirse eski verileri geri yükleyebilirsiniz.`);
  } else {
    console.log(`\n⚠️  Migrasyon edilecek dosya bulunamadı.`);
  }
}

// Script çalıştır
if (require.main === module) {
  runMigration();
}

module.exports = { migrateStudentData, migrateFile, runMigration };
