const fs = require('fs');
const path = require('path');

// Yedek al
const kazanimlarPath = path.join(__dirname, '..', 'data', 'Kazanımlar.json');
const backupPath = path.join(__dirname, '..', 'data', 'Kazanımlar_backup_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');

console.log('🔄 Kazanımlar.json normalizasyonu başlıyor...');

try {
  // Yedek oluştur
  console.log('📁 Yedek oluşturuluyor:', backupPath);
  fs.copyFileSync(kazanimlarPath, backupPath);
  console.log('✅ Yedek oluşturuldu');

  // Dosyayı oku
  const data = fs.readFileSync(kazanimlarPath, 'utf8');
  const kazanimlar = JSON.parse(data);

  let totalFixed = 0;
  let subjectsFixed = [];

  // Her ders için kontrol et
  Object.keys(kazanimlar).forEach(subject => {
    if (typeof kazanimlar[subject] === 'object') {
      Object.keys(kazanimlar[subject]).forEach(grade => {
        if (Array.isArray(kazanimlar[subject][grade])) {
          kazanimlar[subject][grade].forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              // ogrenme_cikti varsa kazanim'e taşı
              if (item.ogrenme_cikti && !item.kazanim) {
                item.kazanim = item.ogrenme_cikti;
                delete item.ogrenme_cikti;
                totalFixed++;
                console.log(`✅ ${subject} ${grade}. sınıf - ${index + 1}. kayıt düzeltildi`);
              }
            }
          });
        }
      });
    }
  });

  // Düzeltilmiş veriyi kaydet
  fs.writeFileSync(kazanimlarPath, JSON.stringify(kazanimlar, null, 2), 'utf8');
  
  console.log(`🎉 Normalizasyon tamamlandı!`);
  console.log(`📊 Toplam düzeltilen kayıt: ${totalFixed}`);
  console.log(`💾 Yedek dosyası: ${backupPath}`);

} catch (error) {
  console.error('❌ Hata:', error.message);
  process.exit(1);
}
