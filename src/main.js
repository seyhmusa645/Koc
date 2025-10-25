const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Windows konsol kodlamasını UTF-8'e çevir
if (process.platform === 'win32') {
  try {
    // Windows konsol kodlamasını UTF-8'e çevir
    process.stdout.setEncoding('utf8');
    process.stderr.setEncoding('utf8');
    
    // Konsol kodlamasını ayarla
    if (process.env.TERM !== 'cygwin') {
      process.env.CHCP = '65001';
    }
  } catch (error) {
    console.log('Konsol kodlaması ayarlanamadı:', error.message);
  }
}

// Pencereler
let mainWindow;
let authWindow;
let activeUser = null; // YENİ: Aktif kullanıcı oturumunu tutacak değişken

// Veri yolları
const userDataPath = app.getPath('userData');
const licenseFilePath = path.join(userDataPath, 'license.json');
const usersFilePath = path.join(userDataPath, 'users.json');
const installGuidFilePath = path.join(userDataPath, 'install.json');

// Shared klasör yolları
const sharedPath = path.join(userDataPath, 'shared');
const sharedLogsPath = path.join(sharedPath, 'logs');

// Shared dosya yolları
const sharedKazanimlarPath = path.join(sharedPath, 'Kazanımlar.json');
const sharedStudentsPath = path.join(sharedPath, 'students.json');
const sharedDataPath = path.join(sharedPath, 'data.json');
const sharedHaftalikPlanPath = path.join(sharedPath, 'haftalikPlan.json');
const kazanimOperationsLogPath = path.join(sharedLogsPath, 'kazanim-operations.log');

// Eski yollar (migrasyon için)
const oldKazanimlarPath = path.join(app.getAppPath(), 'data', 'Kazanımlar.json');
const oldDataPath = path.join(userDataPath, 'data.json');
const oldHaftalikPlanPath = path.join(app.getAppPath(), 'data', 'haftalikPlan.json');

// Mevcut Veri Dosyaları (geriye dönük uyumluluk için)
const dataFilePath = path.join(userDataPath, 'data.json');
const profilesFilePath = path.join(userDataPath, 'profiles.json'); // Sadece migrasyonu için
const studentsFilePath = path.join(userDataPath, 'students.json');
console.log('Ana İşlem: Öğrenci dosyasının yolu:', studentsFilePath);
const outcomesFilePath = sharedKazanimlarPath; // Yönlendirme

// YENİ: Kullanıcıya özel öğrenci veri yolunu alan yardımcı fonksiyon
function getUserStudentsFilePath(userId) {
  if (!userId) return null;
  const userSpecificPath = path.join(userDataPath, 'users', userId);
  // Klasör yoksa oluştur
  if (!fs.existsSync(userSpecificPath)) {
    fs.mkdirSync(userSpecificPath, { recursive: true });
  }
  return path.join(userSpecificPath, 'students.json');
}

// YENİ: Ortak öğrenci deposu yolu
function getSharedStudentsPath() {
  const sharedPath = path.join(userDataPath, 'shared');
  // Klasör yoksa oluştur
  if (!fs.existsSync(sharedPath)) {
    fs.mkdirSync(sharedPath, { recursive: true });
  }
  return path.join(sharedPath, 'students.json');
}

// YENİ: Rol bazlı öğrenci dosya yolu belirleme
function getStudentsFilePathForRole(userRole, userId = null) {
  if (userRole === 'manager') {
    // Müdürler ortak dosyayı kullanır
    return getSharedStudentsPath();
  } else if (userRole === 'teacher') {
    // Öğretmenler ortak dosyayı okur
    return getSharedStudentsPath();
  } else {
    // Varsayılan olarak kullanıcıya özel dosya
    return userId ? getUserStudentsFilePath(userId) : null;
  }
}

// YENİ: Veri migrasyonu - müdür verilerini ortak alana taşı
function migrateManagerDataToShared() {
  if (!activeUser || activeUser.role !== 'manager') {
    return; // Sadece müdürler için çalışır
  }
  
  const userStudentsPath = getUserStudentsFilePath(activeUser.id);
  const sharedStudentsPath = getSharedStudentsPath();
  
  try {
    // Kullanıcıya özel dosya var mı kontrol et
    if (fs.existsSync(userStudentsPath)) {
      const userData = JSON.parse(fs.readFileSync(userStudentsPath, 'utf8'));
      
      // Ortak dosya var mı kontrol et
      let sharedData = { students: [] };
      if (fs.existsSync(sharedStudentsPath)) {
        sharedData = JSON.parse(fs.readFileSync(sharedStudentsPath, 'utf8'));
      }
      
      // Kullanıcı verilerini ortak veriye ekle (çakışma kontrolü ile)
      if (userData.students && userData.students.length > 0) {
        let migratedCount = 0;
        userData.students.forEach(userStudent => {
          // Aynı ID'li öğrenci var mı kontrol et
          const exists = sharedData.students.some(sharedStudent => 
            sharedStudent.id === userStudent.id
          );
          
          if (!exists) {
            sharedData.students.push(userStudent);
            migratedCount++;
          }
        });
        
        if (migratedCount > 0) {
          // Ortak dosyayı güncelle
          sharedData.lastUpdated = new Date().toISOString();
          writeJsonFileWithBackup(sharedStudentsPath, sharedData);
          
          // Kullanıcı dosyasını yedekle ve sil
          const backupPath = userStudentsPath + '.migrated.' + Date.now();
          fs.copyFileSync(userStudentsPath, backupPath);
          fs.unlinkSync(userStudentsPath);
          
          console.log(`✅ ${migratedCount} öğrenci verisi ortak alana taşındı`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Veri migrasyonu hatası:', error);
  }
}

function getInstallGuid() {
  try {
    if (fs.existsSync(installGuidFilePath)) {
      const data = fs.readFileSync(installGuidFilePath, 'utf8');
      return JSON.parse(data).guid;
    } else {
      const guid = crypto.randomUUID();
      fs.writeFileSync(installGuidFilePath, JSON.stringify({ guid }));
      return guid;
    }
  } catch {
    const guid = crypto.randomUUID();
    return guid; // Fallback
  }
}

function getRequestCode() {
    try {
        const cpu = os.cpus()[0];
        const cpuId = cpu.model + cpu.speed;
        const installGuid = getInstallGuid();
        const hardwareId = crypto.createHash('sha256').update(cpuId + installGuid).digest('hex');
        return Buffer.from(hardwareId).toString('base64url');
    } catch (error) {
        console.error("Request code oluşturulurken hata:", error);
        const installGuid = getInstallGuid();
        const hardwareId = crypto.createHash('sha256').update(installGuid).digest('hex');
        return Buffer.from(hardwareId).toString('base64url');
    }
}

function createAuthWindow() {
  authWindow = new BrowserWindow({
    width: 600,
    height: 700,
    title: 'Lisans ve Giriş',
    icon: path.join(__dirname, '..', 'Kapsül-Photoroom.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  authWindow.loadFile('src/auth.html');
  // authWindow.webContents.openDevTools();
  authWindow.on('closed', () => {
    authWindow = null;
    // If the main window never opened, quit the app
    if (!mainWindow) {
        app.quit();
    }
  });
}

function createMainWindow() {
  // Auth penceresi açıksa kapat
  if (authWindow) {
    authWindow.close();
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '..', 'Kapsül-Photoroom.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('src/index.html');
  
  // Menüyü ana pencere için ayarla
  const menu = Menu.buildFromTemplate(createAppMenu());
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function handleLogout() {
  activeUser = null; // Aktif kullanıcıyı temizle
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  if (!authWindow) {
    createAuthWindow();
  }
}

function createAppMenu() {
    // This is the original menu template from the file
    return [
    {
      label: 'Dosya',
      submenu: [
        {
          label: 'Kazanımları Yeniden Yükle',
          click: () => {
            BrowserWindow.getAllWindows().forEach(w => {
              try { 
                w.webContents.send('kazanimlar-updated'); 
              } catch {}
            });
          }
        },
        {
          label: 'Kazanım Listesi Yükle (JSON)',
          click: async () => {
            try {
              const win = BrowserWindow.getFocusedWindow();
              const { canceled, filePaths } = await dialog.showOpenDialog(win, {
                title: 'Kazanım Listesi Yükle',
                properties: ['openFile'],
                filters: [{ name: 'JSON', extensions: ['json'] }]
              });
              if (canceled || !filePaths || !filePaths[0]) return;
              
              const src = filePaths[0];
              const raw = fs.readFileSync(src, 'utf8');
              const parsed = JSON.parse(raw || '{}');
              
              if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                throw new Error('Beklenen format nesne olmalı (ders -> kazanım listesi).');
              }
              
              // ZORUNLU: Validasyon kontrolü
              let oldData = {};
              if (fs.existsSync(sharedKazanimlarPath)) {
                const content = fs.readFileSync(sharedKazanimlarPath, 'utf8');
                oldData = JSON.parse(content.replace(/^\uFEFF/, ''));
              }
              
              const isValid = validateKazanimCount(oldData, parsed, 'MENU_IMPORT');
              if (!isValid) {
                dialog.showErrorBox(
                  'Kazanım Kaybı Uyarısı',
                  'Yüklenecek dosya mevcut kazanımlardan daha az içeriyor. Devam etmek istediğinizden emin misiniz?'
                );
                // Yine de kaydet ama uyar
              }
              
              // Shared path'e yaz
              writeJsonFileWithBackup(sharedKazanimlarPath, parsed);
              
              // Belleği güncelle
              outcomesData = parsed;
              
              // Tüm pencereleri bilgilendir
              BrowserWindow.getAllWindows().forEach(w => {
                try { 
                  w.webContents.send('outcomes-updated');
                  w.webContents.send('kazanimlar-updated');
                } catch {}
              });
              
              const newCount = countTotalKazanimlar(parsed);
              logKazanimOperation('MENU_IMPORT', { 
                source: src, 
                totalKazanimlar: newCount 
              });
              
            } catch (err) {
              console.error('Kazanım yükleme hatası:', err);
              dialog.showErrorBox('Kazanım Yükleme Hatası', err?.message || String(err));
            }
          }
        },
        {
          label: 'Verileri Dışa Aktar',
          click: async () => {
            try {
              const win = BrowserWindow.getFocusedWindow();
              const { canceled, filePath } = await dialog.showSaveDialog(win, {
                title: 'Verileri Dışa Aktar',
                defaultPath: 'kazanım-analiz-veri.json',
                filters: [{ name: 'JSON', extensions: ['json'] }]
              });
              if (canceled || !filePath) return;
              let currentData = [];
              if (fs.existsSync(dataFilePath)) {
                const buf = fs.readFileSync(dataFilePath, 'utf8');
                currentData = JSON.parse(buf || '[]');
              }
              fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2), 'utf8');
            } catch (err) {
              console.error('Dışa aktarma hatası:', err);
              dialog.showErrorBox('Dışa Aktarma Hatası', err?.message || String(err));
            }
          }
        },
        {
          label: 'CSV Olarak Dışa Aktar (Premium)',
          click: async () => {
            const licenseData = readJsonFile(licenseFilePath);
            if (!licenseData || licenseData.plan !== 'premium') {
              dialog.showErrorBox('Premium Özellik', 'Toplu veri (CSV) dışa aktarma özelliği yalnızca Premium plan sahipleri için geçerlidir.');
              return;
            }
            try {
              const win = BrowserWindow.getFocusedWindow();
              const { canceled, filePath } = await dialog.showSaveDialog(win, {
                title: 'CSV Olarak Dışa Aktar',
                defaultPath: 'kazanım-analiz-veri.csv',
                filters: [{ name: 'CSV', extensions: ['csv'] }]
              });
              if (canceled || !filePath) return;
              let currentData = [];
              if (fs.existsSync(dataFilePath)) {
                const buf = fs.readFileSync(dataFilePath, 'utf8');
                currentData = JSON.parse(buf || '[]');
              }
              const headers = ['id','name','date','totalNet','lgsScore','turkce','inkilap','din','ingilizce','matematik','fen'];
              const lines = [headers.join(',')];
              currentData.forEach(exam => {
                const row = [
                  exam.id,
                  JSON.stringify(exam.name ?? ''),
                  exam.date ?? '',
                  (exam.totalNet ?? 0),
                  (exam.lgsScore ?? 0),
                  (exam.courses?.turkce?.net ?? 0),
                  (exam.courses?.inkilap?.net ?? 0),
                  (exam.courses?.din?.net ?? 0),
                  (exam.courses?.ingilizce?.net ?? 0),
                  (exam.courses?.matematik?.net ?? 0),
                  (exam.courses?.fen?.net ?? 0)
                ];
                lines.push(row.join(','));
              });
              fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
            } catch (err) {
              console.error('CSV dışa aktırma hatası:', err);
              dialog.showErrorBox('CSV Dışa Aktarma Hatası', err?.message || String(err));
            }
          }
        },
        {
          label: 'Verileri İçe Aktar (Premium)',
          click: async () => {
            const licenseData = readJsonFile(licenseFilePath);
            if (!licenseData || licenseData.plan !== 'premium') {
              dialog.showErrorBox('Premium Özellik', 'Toplu veri içe aktarma özelliği yalnızca Premium plan sahipleri için geçerlidir.');
              return;
            }
            try {
              const win = BrowserWindow.getFocusedWindow();
              const { canceled, filePaths } = await dialog.showOpenDialog(win, {
                title: 'Verileri İçe Aktar',
                properties: ['openFile'],
                filters: [{ name: 'JSON', extensions: ['json'] }]
              });
              if (canceled || !filePaths || !filePaths[0]) return;
              const importPath = filePaths[0];
              const buf = fs.readFileSync(importPath, 'utf8');
              const imported = JSON.parse(buf || '[]');
              if (!Array.isArray(imported)) {
                throw new Error('Beklenen formatta değil (Array).');
              }
              fs.writeFileSync(dataFilePath, JSON.stringify(imported, null, 2), 'utf8');
              BrowserWindow.getAllWindows().forEach(w => {
                try { w.webContents.send('data-imported'); } catch { /* ignore */ }
              });
            } catch (err) {
              console.error('İçe aktarma hatası:', err);
              dialog.showErrorBox('İçe Aktarma Hatası', err?.message || String(err));
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Oturumu Kapat',
          click: handleLogout
        },
        {
          label: 'Kapat',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click() {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { role: 'reload', label: 'Yeniden Yükle' },
        { role: 'toggledevtools', label: 'Geliştirici Araçları' },
        { type: 'separator' },
        { role: 'resetzoom', label: 'Yakınlaştırmayı Sıfırla' },
        { role: 'zoomin', label: 'Yakınlaştır' },
        { role: 'zoomout', label: 'Uzaklaştır' },
      ]
    }
  ];
}

app.whenReady().then(() => {
  // TODO: Check for existing valid license/session.
  // For now, always start with the authentication window.
  
  // İlk migrasyon
  migrateToSharedDirectory();
  
  // Shared klasörü izleme
  watchSharedDirectory();
  
  // Kullanıcı verilerini normalize et (geriye dönük uyumluluk için)
  try {
    if (fs.existsSync(usersFilePath)) {
      const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
      normalizeUserData(usersData);
      console.log('✅ Kullanıcı verileri normalize edildi');
    }
  } catch (error) {
    console.error('❌ Kullanıcı verileri normalize edilirken hata:', error);
  }
  
  createAuthWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
        createAuthWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// --- YENİ: Kimlik Doğrulama IPC Handler'ları ---

ipcMain.handle('license:get-request-code', () => {
    return getRequestCode();
});

// Örnek bir login işlemi. Şimdilik her zaman başarılı.
ipcMain.handle('user:login', async (event, { email, password }) => {
    console.log(`Giriş denemesi: ${email}`);

    // Önce lisans durumunu kontrol et
    const licenseData = readJsonFile(licenseFilePath);
    if (!licenseData || licenseData.status !== 'active') {
      return { success: false, error: 'Giriş yapmak için geçerli bir lisans gereklidir.' };
    }
    // Son kullanma tarihini tekrar kontrol et
    if (new Date(licenseData.expiresAt) < new Date()) {
      return { success: false, error: 'Lisansınızın süresi dolmuş. Lütfen yenileyin.' };
    }

    // Kullanıcı dosyasını oku
    if (!fs.existsSync(usersFilePath)) {
        return { success: false, error: 'Hiç kayıtlı kullanıcı bulunamadı.' };
    }

    try {
        const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
        const user = usersData.users.find(u => u.email === email);

        if (!user) {
            return { success: false, error: 'Bu e-posta ile kayıtlı bir kullanıcı bulunamadı.' };
        }

        // Şifreleri karşılaştır
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (isMatch) {
            console.log('✅ Giriş başarılı:', email);
            activeUser = { id: user.id, name: user.name, email: user.email, role: user.role }; // Aktif kullanıcıyı ayarla
            console.log('🔍 DEBUG: activeUser set edildi:', activeUser);
            createMainWindow();
            // Lisans ve kullanıcı bilgilerini ana pencereye gönder
            mainWindow.webContents.on('did-finish-load', () => {
              console.log('🔍 DEBUG: Ana pencere yüklendi, kullanıcı bilgisi gönderiliyor:', activeUser);
              // Lisans bilgisini oku ve gönder
              const licenseData = readJsonFile(licenseFilePath);
              mainWindow.webContents.send('license-info', licenseData || { status: 'unlicensed' });
              mainWindow.webContents.send('user-session', activeUser);
            });
            return { success: true, user: activeUser };
        } else {
            console.log('Hatalı şifre:', email);
            return { success: false, error: 'Hatalı şifre.' };
        }
    } catch (error) {
        console.error('Giriş sırasında hata:', error);
        return { success: false, error: 'Giriş yapılırken bir hata oluştu.' };
    }
});

// YENİ: Rol ve Yetki Tanımları
const ROLE_PERMISSIONS = {
  manager: {
    canManageStudents: true,
    canManageExams: true,
    canViewReports: true,
    canManageUsers: true,
    canEvaluateStudents: true,
    canViewAnalytics: true,
    canExportData: true
  },
  teacher: {
    canManageStudents: false, // Sadece öğrenci ekleme/silme engelli
    canManageExams: false,    // Sadece sınav ekleme engelli
    canViewReports: true,
    canManageUsers: false,
    canEvaluateStudents: true, // Öğrenci değerlendirme yapabilir
    canViewAnalytics: true,    // Analizleri görebilir
    canExportData: true        // Veri dışa aktarabilir
  }
};

// Yetki kontrolü yardımcı fonksiyonu
function ensurePermission(userRole, action) {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) {
    console.error(`Geçersiz kullanıcı rolü: ${userRole}`);
    return false;
  }
  
  const hasPermission = permissions[action];
  if (!hasPermission) {
    console.log(`Kullanıcı rolü ${userRole} için ${action} yetkisi yok`);
  }
  
  return hasPermission;
}

// Kullanıcı verilerini normalize eden yardımcı fonksiyon
function normalizeUserData(usersData) {
  if (!usersData || !usersData.users) return usersData;
  
  let needsUpdate = false;
  
  usersData.users.forEach(user => {
    if (!user.role) {
      user.role = 'teacher'; // Varsayılan rol
      needsUpdate = true;
    }
  });
  
  // Artık ilk kullanıcıyı otomatik müdür yapmıyoruz
  // Kullanıcılar kayıt sırasında kendi rollerini seçiyor
  
  if (needsUpdate) {
    try {
      writeJsonFileWithBackup(usersFilePath, usersData);
      console.log('Kullanıcı verileri normalize edildi');
    } catch (error) {
      console.error('Kullanıcı verileri normalize edilirken hata:', error);
    }
  }
  
  return usersData;
}

// YENİ: Kullanıcı Kayıt
ipcMain.handle('user:register', async (event, { email, password, name, role }) => {
  // Lisans kontrolü
  const licenseData = readJsonFile(licenseFilePath);
  if (!licenseData || licenseData.status !== 'active') {
    return { success: false, error: 'Kayıt olmak için geçerli bir lisans gereklidir.' };
  }

  // Rol kontrolü
  if (!role || !['manager', 'teacher'].includes(role)) {
    return { success: false, error: 'Geçerli bir rol seçmelisiniz (Müdür veya Öğretmen).' };
  }

  // users.json dosyasını oku veya oluştur
  let usersData = { users: [] };
  try {
    if (fs.existsSync(usersFilePath)) {
      usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
      // Mevcut verileri normalize et
      usersData = normalizeUserData(usersData);
    } else {
      // Dosya yoksa, boş bir şema ile oluştur
      fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2));
    }
  } catch (error) {
    console.error('users.json okuma/oluşturma hatası:', error);
    return { success: false, error: 'Kullanıcı veritabanına erişilemedi.' };
  }

  // E-postanın zaten kayıtlı olup olmadığını kontrol et
  const existingUser = usersData.users.find(u => u.email === email);
  if (existingUser) {
    return { success: false, error: 'Bu e-posta adresi zaten kullanılıyor.' };
  }

  // Şifreyi hash'le
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Yeni kullanıcı nesnesi oluştur
  const newUser = {
    id: `user_${Date.now()}`,
    email,
    passwordHash,
    name: name || '',
    role: role, // Kullanıcının seçtiği rol
    createdAt: new Date().toISOString(),
  };

  // YENİ: Kullanıcıya özel klasörü ve boş students.json dosyasını oluştur
  try {
    const userStudentsPath = getUserStudentsFilePath(newUser.id);
    const emptyStudentsData = {
      version: "2.0",
      lastUpdated: new Date().toISOString(),
      students: []
    };
    fs.writeFileSync(userStudentsPath, JSON.stringify(emptyStudentsData, null, 2));
    console.log(`${newUser.email} için özel öğrenci dosyası oluşturuldu.`);
  } catch (error) {
    console.error(`Kullanıcıya özel dosya oluşturulurken hata:`, error);
    return { success: false, error: 'Kullanıcı veri deposu oluşturulamadı.' };
  }

  // Kullanıcıyı ana kullanıcı listesine ekle ve dosyayı kaydet
  usersData.users.push(newUser);
  try {
    writeJsonFileWithBackup(usersFilePath, usersData);
    console.log('Yeni kullanıcı kaydedildi:', email);
    return { success: true };
  } catch (error) {
    console.error('users.json yazma hatası:', error);
    return { success: false, error: 'Kullanıcı kaydedilirken bir hata oluştu.' };
  }
});

// YENİ: Lisans IPC Handler'ları
ipcMain.handle('license:import', (event, licenseKey) => {
  try {
    const parts = licenseKey.split('.');
    if (parts.length !== 3) throw new Error('Lisans formatı geçersiz.');

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

    const publicKey = `-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEs+8C3l+AXKRZWfvfwCJEMVoJLJv+\nlhr58NZIVa0DfAn4ACvYtuHcy47Rqt9DU6hgEXBhheoCbIZp7QwBfTPLmw==\n-----END PUBLIC KEY-----`;

    // 1. İmza Doğrulaması
    const dataToVerify = `${parts[0]}.${parts[1]}`;
    const signature = parts[2];
    const verifier = crypto.createVerify('sha256');
    verifier.update(dataToVerify);
    const isSignatureValid = verifier.verify(publicKey, signature, 'base64url');

    if (!isSignatureValid) {
      throw new Error('Lisans imzası geçersiz.');
    }

    // 2. Request Code Kontrolü
    const localRequestCode = getRequestCode();
    if (payload.requestCode !== localRequestCode) {
      throw new Error('Lisans bu bilgisayar için geçerli değil.');
    }

    // 3. Son Kullanma Tarihi Kontrolü
    const expiresAt = new Date(payload.expiresAt);
    if (expiresAt < new Date()) {
      throw new Error('Lisansın süresi dolmuş.');
    }

    // Lisans geçerliyse kaydet
    const licenseData = {
      ...payload,
      licenseKey,
      status: 'active'
    };
    writeJsonFileWithBackup(licenseFilePath, licenseData);
    
    // Ana pencere açıksa lisans bilgisini güncelle
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('license-info', licenseData);
    }
    
    return { success: true, status: 'active' };

  } catch (error) {
    console.error('Lisans aktarma hatası:', error);
    // Hata durumunda geçersiz olarak işaretle ve yedekle
    writeJsonFileWithBackup(licenseFilePath, { status: 'invalid' });
    return { success: false, error: error.message };
  }
});

ipcMain.handle('license:status', () => {
  try {
    if (fs.existsSync(licenseFilePath)) {
      return JSON.parse(fs.readFileSync(licenseFilePath, 'utf8'));
    }
    return { status: 'unlicensed' }; // Lisans dosyası yok
  } catch {
    return { status: 'invalid' }; // Dosya bozuksa
  }
});


// --- MEVCUT IPC HANDLER'LAR ---

// Veri kaydetme işlemi
ipcMain.handle('save-data', (event, data) => {
  // Yetki kontrolü - sınav verilerini etkileyebilir
  if (!activeUser) {
    return { success: false, error: 'Aktif kullanıcı oturumu bulunamadı.' };
  }
  
  // Sınav verilerini etkileyen işlemler için yetki kontrolü
  if (data && (data.exams || data.students || data.value)) {
    // data.value varsa ve içinde sınav/öğrenci verisi varsa kontrol et
    let hasExamData = false;
    if (data.value && Array.isArray(data.value)) {
      // Sınav verisi kontrolü - exam objesi özelliklerine bak
      hasExamData = data.value.some(item => 
        item && typeof item === 'object' && 
        (item.examName || item.examDate || item.courses || item.subjects)
      );
    }
    
    if (data.exams || data.students || hasExamData) {
      if (!ensurePermission(activeUser.role, 'canManageExams') && !ensurePermission(activeUser.role, 'canManageStudents')) {
        console.log('❌ save-data: Yetki yok - Kullanıcı rolü:', activeUser.role);
        return { success: false, error: 'PERMISSION_DENIED', message: 'Bu işlem için müdür yetkisi gereklidir.' };
      }
    }
  }
  
  try {
    // Shared dizine kaydet
    fs.writeFileSync(sharedDataPath, JSON.stringify(data, null, 2), 'utf8');
    
    // Yedek oluştur
    const backupPath = sharedDataPath + '.bak';
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');
    
    return { success: true };
  } catch (error) {
    console.error('Veri kaydetme hatası:', error);
    return { success: false, error: error.message };
  }
});

// JSON dosyası okuma yardımcı fonksiyonu (Yedekten geri yükleme özelliği eklendi)
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // BOM karakterini temizle
    const cleanContent = content.replace(/^\uFEFF/, '');
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error(`JSON okuma hatası: ${filePath}. Hata: ${error.message}. Yedek deneniyor...`);
    const backupPath = filePath + '.bak';
    if (fs.existsSync(backupPath)) {
      try {
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        const backupData = JSON.parse(backupContent.replace(/^\uFEFF/, ''));
        // Ana dosyayı yedekten onar
        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
        console.log(`${filePath} dosyası yedekten başarıyla onarıldı.`);
        return backupData;
      } catch (backupError) {
        console.error(`Yedek dosya (${backupPath}) okunurken de hata oluştu:`, backupError);
        return null;
      }
    }
    return null;
  }
}

// YENİ: JSON dosyası yazma ve yedekleme yardımcı fonksiyonu
function writeJsonFileWithBackup(filePath, data) {
  const backupPath = filePath + '.bak';
  const content = JSON.stringify(data, null, 2);
  
  // Ana dosyayı yaz
  fs.writeFileSync(filePath, content, 'utf8');
  // Yedek dosyayı yaz
  fs.writeFileSync(backupPath, content, 'utf8');
  console.log(`${filePath} dosyası ve yedeği başarıyla yazıldı.`);
}

// Kazanım operasyonlarını loglama
function logKazanimOperation(operation, details) {
  try {
    if (!fs.existsSync(sharedLogsPath)) {
      fs.mkdirSync(sharedLogsPath, { recursive: true });
    }
    const logEntry = `[${new Date().toISOString()}] ${operation}: ${JSON.stringify(details)}\n`;
    fs.appendFileSync(kazanimOperationsLogPath, logEntry, 'utf8');
  } catch (error) {
    console.error('Log yazma hatası:', error);
  }
}

// Kazanım sayısını kontrol et
function validateKazanimCount(oldData, newData, operation) {
  const oldCount = countTotalKazanimlar(oldData);
  const newCount = countTotalKazanimlar(newData);
  
  // Eğer eski veri yoksa (ilk kurulum), validasyonu geç
  if (oldCount === 0) {
    logKazanimOperation('VALIDATION_SUCCESS', {
      operation,
      oldCount,
      newCount,
      added: newCount - oldCount,
      reason: 'İlk kurulum'
    });
    return true;
  }
  
  if (newCount < oldCount) {
    const diff = oldCount - newCount;
    console.error(`⚠️ UYARI: Kazanım kaybı tespit edildi! ${diff} kazanım eksik.`);
    logKazanimOperation('VALIDATION_FAILED', {
      operation,
      oldCount,
      newCount,
      difference: diff,
      error: 'Kazanım sayısı azaldı'
    });
    return false;
  }
  
  logKazanimOperation('VALIDATION_SUCCESS', {
    operation,
    oldCount,
    newCount,
    added: newCount - oldCount
  });
  return true;
}

function countTotalKazanimlar(kazanimlarData) {
  if (!kazanimlarData || typeof kazanimlarData !== 'object') {
    return 0;
  }
  
  let total = 0;
  const subjects = Object.keys(kazanimlarData);
  
  subjects.forEach(subject => {
    if (typeof kazanimlarData[subject] === 'object' && kazanimlarData[subject] !== null) {
      const grades = Object.keys(kazanimlarData[subject]);
      
      grades.forEach(grade => {
        if (Array.isArray(kazanimlarData[subject][grade])) {
          const count = kazanimlarData[subject][grade].length;
          total += count;
        }
      });
    }
  });
  
  return total;
}

// JSON dosyasını güvenli şekilde kontrol et (SİLME YOK!)
function checkJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log('Dosya mevcut değil:', filePath);
      return false;
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    const cleanData = data.replace(/^\uFEFF/, '').trim();
    
    // Eğer dosya boşsa veya çok küçükse
    if (!cleanData || cleanData.length < 10) {
      console.log('⚠️ Dosya boş veya çok küçük:', filePath, 'Boyut:', cleanData.length);
      return false;
    }
    
    // JSON parse dene
    try {
      const parsed = JSON.parse(cleanData);
      console.log('✅ JSON dosyası sağlam:', filePath);
      return true;
    } catch (parseError) {
      console.log('❌ JSON parse hatası:', filePath);
      console.log('Hata:', parseError.message);
      console.log('İlk 200 karakter:', cleanData.substring(0, 200));
      return false;
    }
  } catch (error) {
    console.error('Dosya kontrol hatası:', error);
    return false;
  }
}

// İlk açılış migrasyonu
function migrateToSharedDirectory() {
  try {
    // Shared klasörü oluştur
    if (!fs.existsSync(sharedPath)) {
      fs.mkdirSync(sharedPath, { recursive: true });
      console.log('✅ Shared klasoru olusturuldu');
    }
    
    // Dosyaları kontrol et (SİLME YOK!)
    console.log('🔍 Shared dosyaları kontrol ediliyor...');
    checkJsonFile(sharedKazanimlarPath);
    
    // Kazanımlar migrasyonu - EN ÖNEMLİ
    if (!fs.existsSync(sharedKazanimlarPath) && fs.existsSync(oldKazanimlarPath)) {
      const kazanimlarData = readJsonFile(oldKazanimlarPath);
      const kazanimCount = countTotalKazanimlar(kazanimlarData);
      
      writeJsonFileWithBackup(sharedKazanimlarPath, kazanimlarData);
      logKazanimOperation('INITIAL_MIGRATION', {
        source: oldKazanimlarPath,
        destination: sharedKazanimlarPath,
        totalKazanimlar: kazanimCount
      });
      console.log(`✅ Kazanimlar shared\'e kopyalandi: ${kazanimCount} kazanim`);
    }
    
    // Data.json migrasyonu
    if (!fs.existsSync(sharedDataPath) && fs.existsSync(oldDataPath)) {
      const dataContent = readJsonFile(oldDataPath);
      writeJsonFileWithBackup(sharedDataPath, dataContent);
      console.log('✅ Sinav verileri shared\'e kopyalandi');
    }
    
    // HaftalikPlan migrasyonu
    if (!fs.existsSync(sharedHaftalikPlanPath) && fs.existsSync(oldHaftalikPlanPath)) {
      const planContent = readJsonFile(oldHaftalikPlanPath);
      writeJsonFileWithBackup(sharedHaftalikPlanPath, planContent);
      console.log('✅ Haftalik plan shared\'e kopyalandi');
    }
    
    // Students için shared klasörü zaten mevcut (getSharedStudentsPath fonksiyonu)
    
  } catch (error) {
    console.error('❌ Migrasyon hatasi:', error);
    logKazanimOperation('MIGRATION_ERROR', { error: error.message });
  }
}

// Shared klasörü izleme
function watchSharedDirectory() {
  if (!fs.existsSync(sharedPath)) return;
  
  try {
    // Kazanımlar.json izleme
    fs.watch(sharedKazanimlarPath, (eventType, filename) => {
      if (eventType === 'change') {
        console.log('🔄 Kazanimlar.json degisti, pencereler bilgilendiriliyor...');
        BrowserWindow.getAllWindows().forEach(w => {
          try { 
            w.webContents.send('kazanimlar-updated'); 
          } catch (err) {
            console.error('Pencere guncelleme hatasi:', err);
          }
        });
      }
    });
    
    console.log('✅ Shared klasoru izleniyor');
  } catch (error) {
    console.error('❌ Dosya izleme hatasi:', error);
  }
}

// Veri yükleme işlemi
ipcMain.handle('load-data', (event) => {
  try {
    // Önce shared'den dene
    if (fs.existsSync(sharedDataPath)) {
      const fileData = readJsonFile(sharedDataPath);
      return fileData || [];
    }
    // Fallback: eski konum
    if (fs.existsSync(oldDataPath)) {
      const fileData = readJsonFile(oldDataPath);
      // Shared'e kopyala
      if (fileData) {
        writeJsonFileWithBackup(sharedDataPath, fileData);
      }
      return fileData || [];
    }
    return [];
  } catch (error) {
    console.error('Veri yükleme hatası:', error);
    return [];
  }
});

// Eski profiles sistemi kaldırıldı - students.json kullanılıyor

// Kazanım listesi yükleme
let outcomesData = null; // Kazanımları bellekte tutmak için

ipcMain.on('outcomes-load', (event) => {
  // Veri daha önce yüklendiyse, bellekten gönder
  if (outcomesData) {
    event.sender.send('outcomes-loaded', { outcomes: outcomesData });
    return;
  }

  // Önce shared klasöründen oku
  const readPath = fs.existsSync(sharedKazanimlarPath) 
    ? sharedKazanimlarPath 
    : oldKazanimlarPath; // Fallback

  fs.readFile(readPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Kazanımlar dosyası okunamadı:', err);
      event.sender.send('outcomes-loaded', { error: 'Kazanımlar dosyası okunamadı.' });
      return;
    }
    try {
      if (data.charCodeAt(0) === 0xFEFF) {
        data = data.slice(1);
      }
      outcomesData = JSON.parse(data);
      event.sender.send('outcomes-loaded', { outcomes: outcomesData });
    } catch (error) {
      console.error('JSON parse hatası:', error);
      console.error('Dosya yolu:', readPath);
      console.error('Dosya boyutu:', data ? data.length : 'null');
      console.error('İlk 100 karakter:', data ? data.substring(0, 100) : 'null');
      
      // Yedek dosyayı dene
      const backupPath = readPath + '.bak';
      if (fs.existsSync(backupPath)) {
        try {
          const backupData = fs.readFileSync(backupPath, 'utf8');
          const cleanBackupData = backupData.replace(/^\uFEFF/, '');
          outcomesData = JSON.parse(cleanBackupData);
          console.log('✅ Yedek dosyadan yüklendi');
          event.sender.send('outcomes-loaded', { outcomes: outcomesData });
          return;
        } catch (backupError) {
          console.error('Yedek dosya da bozuk:', backupError);
        }
      }
      
      event.sender.send('outcomes-loaded', { error: 'JSON formatı bozuk veya dosya UTF-8 değil.' });
    }
  });
});

// Eski profiles-save handler kaldırıldı

// Kazanım listesi yükleme (DersPlanlayici.js için)
ipcMain.handle('load-kazanimlar', async () => {
  try {
    // Shared'den yükle
    if (fs.existsSync(sharedKazanimlarPath)) {
      let data = fs.readFileSync(sharedKazanimlarPath, 'utf8');
      if (data.charCodeAt(0) === 0xFEFF) {
        data = data.slice(1);
      }
      
      try {
        const kazanimlarData = JSON.parse(data);
        const count = countTotalKazanimlar(kazanimlarData);
        console.log(`✅ Kazanimlar yuklendi: ${count} kazanim`);
        logKazanimOperation('LOAD', { totalKazanimlar: count });
        return kazanimlarData;
      } catch (parseError) {
        console.error('JSON parse hatası:', parseError);
        console.error('Dosya yolu:', sharedKazanimlarPath);
        console.error('Dosya boyutu:', data ? data.length : 'null');
        
        // Yedek dosyayı dene
        const backupPath = sharedKazanimlarPath + '.bak';
        if (fs.existsSync(backupPath)) {
          try {
            const backupData = fs.readFileSync(backupPath, 'utf8');
            const cleanBackupData = backupData.replace(/^\uFEFF/, '');
            const kazanimlarData = JSON.parse(cleanBackupData);
            const count = countTotalKazanimlar(kazanimlarData);
            console.log('✅ Yedek dosyadan yüklendi:', count, 'kazanim');
            logKazanimOperation('LOAD_FROM_BACKUP', { totalKazanimlar: count });
            return kazanimlarData;
          } catch (backupError) {
            console.error('Yedek dosya da bozuk:', backupError);
          }
        }
        
        // Eski konumdan dene
        if (fs.existsSync(oldKazanimlarPath)) {
          try {
            const oldData = fs.readFileSync(oldKazanimlarPath, 'utf8');
            const cleanOldData = oldData.replace(/^\uFEFF/, '');
            const kazanimlarData = JSON.parse(cleanOldData);
            const count = countTotalKazanimlar(kazanimlarData);
            console.log('✅ Eski konumdan yüklendi:', count, 'kazanim');
            logKazanimOperation('LOAD_FROM_OLD', { totalKazanimlar: count });
            return kazanimlarData;
          } catch (oldError) {
            console.error('Eski dosya da bozuk:', oldError);
          }
        }
        
        throw parseError;
      }
    }
    
    console.warn('⚠️ Kazanimlar.json bulunamadi, bos donduruluyor');
    return {};
  } catch (error) {
    console.error('Kazanimlar yukleme hatasi:', error);
    logKazanimOperation('LOAD_ERROR', { error: error.message });
    return { error: error.message };
  }
});

// Kazanımları kaydet
ipcMain.handle('kazanimlar:save', async (event, kazanimlarData) => {
  try {
    // Önce mevcut veriyi yükle ve karşılaştır
    let oldData = {};
    if (fs.existsSync(sharedKazanimlarPath)) {
      const content = fs.readFileSync(sharedKazanimlarPath, 'utf8');
      oldData = JSON.parse(content.replace(/^\uFEFF/, ''));
    }
    
    // Validasyon kontrolü
    const isValid = validateKazanimCount(oldData, kazanimlarData, 'SAVE');
    if (!isValid) {
      // Kullanıcıya hata göster
      const { dialog } = require('electron');
      dialog.showErrorBox(
        'Kazanım Kaybı Tespit Edildi',
        'Yeni veri mevcut kazanımlardan daha az içeriyor. İşlem iptal edildi. Lütfen log dosyasını kontrol edin.'
      );
      return { 
        error: 'Kazanım sayısı azaldığı için kaydetme engellendi',
        logPath: kazanimOperationsLogPath 
      };
    }
    
    // Güvenli kaydetme
    await fs.promises.writeFile(
      sharedKazanimlarPath,
      JSON.stringify(kazanimlarData, null, 2),
      'utf-8'
    );
    
    // Yedek oluştur
    const backupPath = sharedKazanimlarPath + '.bak';
    await fs.promises.writeFile(
      backupPath,
      JSON.stringify(kazanimlarData, null, 2),
      'utf-8'
    );
    
    const newCount = countTotalKazanimlar(kazanimlarData);
    console.log(`✅ Kazanimlar.json kaydedildi: ${newCount} kazanim`);
    logKazanimOperation('SAVE_SUCCESS', { totalKazanimlar: newCount });
    
    return { success: true, count: newCount };
  } catch (error) {
    console.error('❌ Kazanimlar kaydetme hatasi:', error);
    logKazanimOperation('SAVE_ERROR', { error: error.message });
    return { error: error.message };
  }
});

// Haftalık Plan yükleme (DersPlanlayici.js için)
ipcMain.handle('load-haftalik-plan', async () => {
  try {
    if (fs.existsSync(sharedHaftalikPlanPath)) {
      let data = fs.readFileSync(sharedHaftalikPlanPath, 'utf8');
      if (data.charCodeAt(0) === 0xFEFF) {
        data = data.slice(1);
      }
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Haftalik Plan yukleme hatasi:', error);
    return { error: error.message };
  }
});

// --- Students.json Yönetimi ---

// Öğrencileri yükle (Rol bazlı paylaşım modeli)
ipcMain.handle('students-load', () => {
  console.log('🔍 DEBUG: students-load çağrıldı');
  console.log('🔍 DEBUG: activeUser:', activeUser);
  
  if (!activeUser) {
    console.error('❌ students-load: Aktif kullanıcı oturumu bulunamadı!');
    return { error: 'Öğrenci verisini yüklemek için kullanıcı girişi gereklidir.' };
  }
  
  console.log('🔍 DEBUG: activeUser.role:', activeUser.role);
  console.log('🔍 DEBUG: activeUser.id:', activeUser.id);

  // Müdür girişinde veri migrasyonu yap
  if (activeUser.role === 'manager') {
    migrateManagerDataToShared();
  }

  // Rol bazlı dosya yolu belirle
  const studentsPath = getStudentsFilePathForRole(activeUser.role, activeUser.id);
  console.log('🔍 DEBUG: studentsPath:', studentsPath);
  console.log('🔍 DEBUG: Dosya var mı?', fs.existsSync(studentsPath));

  try {
    // Dosya var mı kontrol et
    if (fs.existsSync(studentsPath)) {
      const data = fs.readFileSync(studentsPath, 'utf8');
      const studentsData = JSON.parse(data);
      
      // Eski kayıtları migrate et
      const migratedStudents = (studentsData.students || []).map(student => {
        return {
          ...student,
          abilityLevels: student.abilityLevels || {},
          learningStyle: student.learningStyle || 'Belirlenmemiş'
        };
      });
      
      console.log(`Ana İşlem: ${activeUser.email} için students-load başarılı, ${migratedStudents.length} öğrenci`);
      return { students: migratedStudents };
    } else {
      // Dosya yoksa boş liste döndür
      console.log(`Ana İşlem: ${activeUser.email} için students dosyası bulunamadı, boş liste döndürülüyor`);
      return { students: [] };
    }
  } catch (error) {
    console.error(`Ana İşlem: ${activeUser.email} için students-load hatası:`, error);
    return { error: error.message };
  }
});

// YENİ: CSV'den öğrenci import etme (Kullanıcı bazlı)
ipcMain.handle('students-import', async (event, importedStudents) => {
  console.log('🔍 DEBUG: students-import çağrıldı');
  console.log('🔍 DEBUG: activeUser:', activeUser);
  
  if (!activeUser) {
    console.error('❌ students-import: Aktif kullanıcı oturumu bulunamadı!');
    return { error: 'Öğrenci import etmek için kullanıcı girişi gereklidir.' };
  }

  // Yetki kontrolü
  if (!ensurePermission(activeUser.role, 'canManageStudents')) {
    console.log('❌ students-import: Yetki yok - Kullanıcı rolü:', activeUser.role);
    return { error: 'PERMISSION_DENIED', message: 'Öğrenci import etme yetkiniz yok. Sadece müdürler bu işlemi yapabilir.' };
  }

  if (!importedStudents || !Array.isArray(importedStudents)) {
    console.error('❌ students-import: Geçersiz öğrenci verisi');
    return { error: 'Geçersiz öğrenci verisi sağlandı.' };
  }

  const studentsPath = getStudentsFilePathForRole(activeUser.role, activeUser.id);
  console.log('🔍 DEBUG: studentsPath:', studentsPath);

  try {
    // Mevcut öğrenci dosyasını oku
    let studentsData;
    if (fs.existsSync(studentsPath)) {
      const data = fs.readFileSync(studentsPath, 'utf8');
      studentsData = JSON.parse(data);
    } else {
      // Dosya yoksa boş şema oluştur
      studentsData = {
        version: "2.0",
        lastUpdated: new Date().toISOString(),
        students: []
      };
    }

    const existingStudents = studentsData.students || [];
    const existingIds = new Set(existingStudents.map(s => s.id));
    
    // Öğrenci eşleştirme sistemi
    const matchedStudents = [];
    const newStudents = [];
    const unmatchedStudents = [];
    let duplicateCount = 0;
    
    for (const csvStudent of importedStudents) {
      // Mevcut öğrencilerle eşleştirme yap (isim ve sınıf bazında)
      const existingStudent = existingStudents.find(existing => 
        existing.name.toLowerCase().trim() === csvStudent.name.toLowerCase().trim() &&
        existing.grade === csvStudent.grade
      );
      
      if (existingStudent) {
        // Mevcut öğrenciyi güncelle (kabiliyet verileri ile)
        const updatedStudent = {
          ...existingStudent,
          ...csvStudent,
          updatedAt: new Date().toISOString(),
          lastExamResults: csvStudent.examResults || csvStudent,
          // Kabiliyet verilerini güncelle
          abilityLevels: csvStudent.abilityLevels || existingStudent.abilityLevels || {},
          learningStyle: csvStudent.learningStyle || existingStudent.learningStyle || 'Belirlenmemiş'
        };
        
        // Mevcut öğrenciyi listede güncelle
        const index = existingStudents.findIndex(s => s.id === existingStudent.id);
        if (index !== -1) {
          existingStudents[index] = updatedStudent;
        }
        
        matchedStudents.push({
          name: csvStudent.name,
          grade: csvStudent.grade,
          action: 'updated'
        });
        
        console.log(`✅ Eşleştirildi ve güncellendi: ${csvStudent.name} (${csvStudent.grade}. sınıf)`);
      } else {
        // Yeni öğrenci olarak ekle
        const newStudent = {
          ...csvStudent,
          id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Kabiliyet verilerini ekle
          abilityLevels: csvStudent.abilityLevels || {},
          learningStyle: csvStudent.learningStyle || 'Belirlenmemiş'
        };
        
        newStudents.push(newStudent);
        existingStudents.push(newStudent);
        existingIds.add(newStudent.id);
        
        console.log(`➕ Yeni öğrenci eklendi: ${csvStudent.name} (${csvStudent.grade}. sınıf)`);
      }
    }

    // Dosyayı güncelle
    studentsData.students = existingStudents;
    studentsData.lastUpdated = new Date().toISOString();
    
    writeJsonFileWithBackup(studentsPath, studentsData);
    
    console.log(`✅ Ana İşlem: ${activeUser.email} için ${matchedStudents.length} öğrenci eşleştirildi, ${newStudents.length} yeni öğrenci eklendi`);
    
    return { 
      success: true, 
      matched: matchedStudents.length,
      added: newStudents.length,
      total: existingStudents.length,
      details: {
        matched: matchedStudents,
        added: newStudents.map(s => ({ name: s.name, grade: s.grade }))
      }
    };

  } catch (error) {
    console.error(`Ana İşlem: ${activeUser.email} için students-import hatası:`, error);
    return { error: error.message };
  }
});

// Öğrenci kaydet (Kullanıcı bazlı olarak güncellendi)
ipcMain.handle('student-save', (event, studentData) => {
  if (!activeUser) return { error: 'Aktif kullanıcı oturumu bulunamadı.' };
  
  // Yetki kontrolü
  if (!ensurePermission(activeUser.role, 'canManageStudents')) {
    console.log('❌ student-save: Yetki yok - Kullanıcı rolü:', activeUser.role);
    return { error: 'PERMISSION_DENIED', message: 'Öğrenci kaydetme yetkiniz yok. Sadece müdürler bu işlemi yapabilir.' };
  }
  
  const studentsPath = getStudentsFilePathForRole(activeUser.role, activeUser.id);

  try {
    let studentsData;
    
    if (fs.existsSync(studentsPath)) {
      const data = fs.readFileSync(studentsPath, 'utf8');
      studentsData = JSON.parse(data);
    } else {
      // Normalde bu olmamalı çünkü register/load sırasında dosya oluşturulur
      studentsData = {
        version: "2.0",
        lastUpdated: new Date().toISOString(),
        students: []
      };
    }
    
    // Yeni öğrenci ekle
    const studentWithDefaults = {
      ...studentData,
      abilityLevels: studentData.abilityLevels || {},
      learningStyle: studentData.learningStyle || 'Belirlenmemiş',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    studentsData.students.push(studentWithDefaults);
    studentsData.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(studentsPath, JSON.stringify(studentsData, null, 2));
    console.log(`Ana İşlem: ${activeUser.email} için yeni öğrenci kaydedildi: ${studentData.name}`);
    
    return { success: true };
  } catch (error) {
    console.error(`Ana İşlem: ${activeUser.email} için student-save hatası:`, error);
    return { error: error.message };
  }
});

// Öğrenci sil (Kullanıcı bazlı olarak güncellendi)
ipcMain.handle('student-delete', (event, studentId) => {
  if (!activeUser) return { error: 'Aktif kullanıcı oturumu bulunamadı.' };
  
  // Yetki kontrolü
  if (!ensurePermission(activeUser.role, 'canManageStudents')) {
    console.log('❌ student-delete: Yetki yok - Kullanıcı rolü:', activeUser.role);
    return { error: 'PERMISSION_DENIED', message: 'Öğrenci silme yetkiniz yok. Sadece müdürler bu işlemi yapabilir.' };
  }
  
  const studentsPath = getStudentsFilePathForRole(activeUser.role, activeUser.id);

  try {
    if (!fs.existsSync(studentsPath)) {
      return { error: 'Öğrenci dosyası bulunamadı.' };
    }
    
    const data = fs.readFileSync(studentsPath, 'utf8');
    const studentsData = JSON.parse(data);
    
    const initialLength = studentsData.students.length;
    studentsData.students = studentsData.students.filter(s => s.id !== studentId);
    
    if (studentsData.students.length === initialLength) {
      return { error: 'Silinecek öğrenci bulunamadı.' };
    }
    
    studentsData.lastUpdated = new Date().toISOString();
    fs.writeFileSync(studentsPath, JSON.stringify(studentsData, null, 2));
    
    console.log(`Ana İşlem: ${activeUser.email} öğrencisi silindi: ${studentId}`);
    return { success: true };
  } catch (error) {
    console.error(`Ana İşlem: ${activeUser.email} için student-delete hatası:`, error);
    return { error: error.message };
  }
});

// Öğrenci güncelle (Kullanıcı bazlı olarak güncellendi)
ipcMain.handle('student-update', (event, studentId, updateData) => {
  if (!activeUser) return { error: 'Aktif kullanıcı oturumu bulunamadı.' };
  
  // Yetki kontrolü
  if (!ensurePermission(activeUser.role, 'canManageStudents')) {
    console.log('❌ student-update: Yetki yok - Kullanıcı rolü:', activeUser.role);
    return { error: 'PERMISSION_DENIED', message: 'Öğrenci güncelleme yetkiniz yok. Sadece müdürler bu işlemi yapabilir.' };
  }
  
  const studentsPath = getStudentsFilePathForRole(activeUser.role, activeUser.id);

  try {
    if (!fs.existsSync(studentsPath)) {
      return { error: 'Öğrenci dosyası bulunamadı.' };
    }
    
    const data = fs.readFileSync(studentsPath, 'utf8');
    const studentsData = JSON.parse(data);
    
    const studentIndex = studentsData.students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) {
      return { error: 'Güncellenecek öğrenci bulunamadı.' };
    }
    
    // Öğrenci verilerini güncelle
    studentsData.students[studentIndex] = {
      ...studentsData.students[studentIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    studentsData.lastUpdated = new Date().toISOString();
    fs.writeFileSync(studentsPath, JSON.stringify(studentsData, null, 2));
    
    console.log(`Ana İşlem: ${activeUser.email} öğrencisi güncellendi: ${studentId}`);
    return { success: true };
  } catch (error) {
    console.error(`Ana İşlem: ${activeUser.email} için student-update hatası:`, error);
    return { error: error.message };
  }
});

// PDF Export handler
ipcMain.handle('export-to-pdf', async (event) => {
  const { dialog } = require('electron');
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Aktif window'u al
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      return { error: 'Aktif pencere bulunamadı' };
    }

    // PDF seçenekleri - Türkçe karakter desteği için güncellendi
    const pdfOptions = {
      marginsType: 1, // Minimal margin
      pageSize: 'A4',
      printBackground: true,
      printSelectionOnly: false,
      landscape: true, // Geniş planlar için yatay mod
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size:10px; text-align:center; width:100%; color:#666;">Kapsül - Ders Planı</div>',
      footerTemplate: '<div style="font-size:10px; text-align:center; width:100%; color:#666;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      scale: 0.9, // İçeriği biraz küçült
      // Encoding için ek ayarlar
      webSecurity: false,
      allowRunningInsecureContent: true
    };

    // PDF verisini oluştur
    const pdfData = await win.webContents.printToPDF(pdfOptions);
    
    // Aktif sayfaya göre varsayılan dosya adını belirle
    const currentTitle = await win.webContents.getTitle();
    let defaultFileName = 'Kapsul-Rapor.pdf';
    
    if (currentTitle.includes('Ders Program') || currentTitle.includes('Planlayıcı')) {
      defaultFileName = 'Ders-Plani.pdf';
    } else if (currentTitle.includes('Etüt') || currentTitle.includes('Grup')) {
      defaultFileName = 'Etut-Programi.pdf';
    } else if (currentTitle.includes('Rapor') || currentTitle.includes('Analiz')) {
      defaultFileName = 'Ogrenci-Raporu.pdf';
    }
    
    // Kullanıcıya dosya kaydetme dialogu göster
    const result = await dialog.showSaveDialog(win, {
      title: 'PDF Olarak Kaydet',
      defaultPath: path.join(require('os').homedir(), 'Desktop', defaultFileName),
      filters: [
        { name: 'PDF Dosyaları', extensions: ['pdf'] }
      ]
    });

    if (result.canceled) {
      return { canceled: true };
    }

    // PDF dosyasını kaydet
    fs.writeFileSync(result.filePath, pdfData);
    
    console.log('Ana İşlem: PDF başarıyla kaydedildi:', result.filePath);
    return {
      success: true,
      filePath: result.filePath
    };

  } catch (error) {
    console.error('Ana İşlem: PDF export hatası:', error);
    return { error: error.message };
  }
});

// 🆕 YENİ: ZIP Arşivi Oluşturma Handler
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

// YENİ: AI Destekli Öğrenci Değerlendirme (Premium) - Gelişmiş Sistem

// JSON dosyalarını oku
let learningStyleData = {};
let abilityData = {};

try {
  const learningStylesPath = path.join(__dirname, '..', 'data', 'learning_styles.json');
  const abilitiesPath = path.join(__dirname, '..', 'data', 'abilities.json');
  
  if (fs.existsSync(learningStylesPath)) {
    learningStyleData = JSON.parse(fs.readFileSync(learningStylesPath, 'utf8'));
  }
  
  if (fs.existsSync(abilitiesPath)) {
    abilityData = JSON.parse(fs.readFileSync(abilitiesPath, 'utf8'));
  }
} catch (error) {
  console.error('JSON dosyaları yüklenirken hata:', error);
}

// Değerlendirme sıklığı sistemi
const evaluationFrequency = {
    8: { period: 'weekly', days: 7, label: 'Haftalık', description: '8. sınıf öğrencileri için haftalık değerlendirme (LGS hazırlık)' },
    7: { period: 'biweekly', days: 14, label: 'İki Haftalık', description: '7. sınıf öğrencileri için iki haftalık değerlendirme' },
    6: { period: 'monthly', days: 30, label: 'Aylık', description: '6. sınıf öğrencileri için aylık değerlendirme' },
    5: { period: 'monthly', days: 30, label: 'Aylık', description: '5. sınıf öğrencileri için aylık değerlendirme' }
};

// Değerlendirme zamanı kontrolü
function shouldEvaluate(student, force = false) {
    if (force) {
        return { should: true, reason: 'Zorla değerlendirme' };
    }
    
    if (!student.aiEvaluations || student.aiEvaluations.length === 0) {
        return { should: true, reason: 'İlk değerlendirme' };
    }
    
    const lastEval = student.aiEvaluations[student.aiEvaluations.length - 1];
    const lastEvalDate = new Date(lastEval.date);
    const now = new Date();
    const daysPassed = Math.floor((now - lastEvalDate) / (1000 * 60 * 60 * 24));
    
    const frequency = evaluationFrequency[student.grade];
    const shouldEval = daysPassed >= frequency.days;
    
    return {
        should: shouldEval,
        reason: shouldEval 
            ? `${frequency.label} değerlendirme zamanı (${daysPassed} gün geçti)`
            : `Henüz erken (${daysPassed}/${frequency.days} gün)`,
        nextDate: new Date(lastEvalDate.getTime() + (frequency.days * 24 * 60 * 60 * 1000)).toLocaleDateString('tr-TR')
    };
}

// Temel kabiliyet verilerini CSV'den parse et
function parseAbilitiesFromCSV(studentName, abilitiesCSV) {
    if (!abilitiesCSV) return null;
    
    const lines = abilitiesCSV.split('\n');
    const headers = lines[0].split(',');
    const studentLine = lines.find(line => line.includes(studentName));
    
    if (!studentLine) return null;
    
    const values = studentLine.split(',');
    const abilities = {};
    
    // Kabiliyet sütunlarını bul
    const abilityColumns = [
        'Görsel Uzamsal Düşünme',
        'Kodlama', 
        'Analojiler ve Sayısal Akıl Yürütme',
        'Parça-Bütün ve Görsel Akıl Yürütme',
        'Sözel Akıl Yürütme',
        'İlişkisel Düşünme'
    ];
    
    abilityColumns.forEach(ability => {
        const colIndex = headers.indexOf(ability);
        if (colIndex !== -1 && values[colIndex]) {
            abilities[ability] = values[colIndex].trim();
        }
    });
    
    // En güçlü ve en zayıf kabiliyetleri bul
    const strongestAbility = values[headers.indexOf('En Güçlü Temel Kabiliyet')]?.trim() || 'Belirlenmemiş';
    const strongAbilities = values[headers.indexOf('Güçlü Temel Kabiliyetler')]?.split(';').map(a => a.trim()) || [];
    
    return {
        abilities,
        strongest: strongestAbility,
        strong: strongAbilities,
        weakest: Object.keys(abilities).find(key => abilities[key]?.includes('Kırmızı bölgenin altı')) || 'Belirlenmemiş'
    };
}

// Sınav performansını hesapla
function calculateExamPerformance(exams) {
    if (!exams || exams.length === 0) {
        return {
            totalExams: 0,
            avgLgsScore: 0,
            avgNets: {},
            trend: 'Sabit'
        };
    }
    
    const last3Exams = exams.slice(-3);
    const avgLgsScore = last3Exams.reduce((sum, exam) => sum + (exam.lgsScore || 0), 0) / last3Exams.length;
    
    const subjects = ['turkce', 'matematik', 'fen', 'inkilap', 'ingilizce', 'din'];
    const avgNets = {};
    
    subjects.forEach(subject => {
        const avgNet = last3Exams.reduce((sum, exam) => {
            if (exam.courses && exam.courses[subject]) {
                const course = exam.courses[subject];
                // Net hesapla: doğru - (yanlış / 4)
                const net = course.correct - (course.incorrect / 4);
                return sum + Math.max(0, net);
            }
            return sum;
        }, 0) / last3Exams.length;
        avgNets[subject] = avgNet;
    });
    
    // Trend hesapla
    let trend = 'Sabit';
    if (last3Exams.length >= 2) {
        const first = last3Exams[0].lgsScore || 0;
        const last = last3Exams[last3Exams.length - 1].lgsScore || 0;
        if (last > first + 10) trend = 'Yükseliş';
        else if (last < first - 10) trend = 'Düşüş';
    }
    
    return {
        totalExams: exams.length,
        avgLgsScore: Math.round(avgLgsScore),
        avgNets,
        trend
    };
}

// Eksik kazanımları analiz et
function analyzeWeakOutcomes(exams) {
    if (!exams || exams.length === 0) return { total: 0, bySubject: {}, mostRepeated: [] };
    
    const last2Exams = exams.slice(-2);
    const weakOutcomes = {};
    const outcomeCounts = {};
    
    last2Exams.forEach(exam => {
        if (exam.courses) {
            Object.keys(exam.courses).forEach(subject => {
                const course = exam.courses[subject];
                if (course.incorrectOutcomes && course.incorrectOutcomes.length > 0) {
                    if (!weakOutcomes[subject]) weakOutcomes[subject] = [];
                    if (!outcomeCounts[subject]) outcomeCounts[subject] = {};
                    
                    course.incorrectOutcomes.forEach(outcome => {
                        if (!weakOutcomes[subject].includes(outcome)) {
                            weakOutcomes[subject].push(outcome);
                        }
                        outcomeCounts[subject][outcome] = (outcomeCounts[subject][outcome] || 0) + 1;
                    });
                }
            });
        }
    });
    
    // En çok tekrar eden kazanımları bul
    const mostRepeated = [];
    Object.keys(outcomeCounts).forEach(subject => {
        Object.keys(outcomeCounts[subject]).forEach(outcome => {
            mostRepeated.push({
                outcome,
                subject,
                count: outcomeCounts[subject][outcome]
            });
        });
    });
    
    mostRepeated.sort((a, b) => b.count - a.count);
    
    const total = Object.values(weakOutcomes).reduce((sum, outcomes) => sum + outcomes.length, 0);
    
    return {
        total,
        bySubject: Object.keys(weakOutcomes).reduce((acc, subject) => {
            acc[subject] = weakOutcomes[subject].length;
            return acc;
        }, {}),
        mostRepeated: mostRepeated.slice(0, 3)
    };
}

// AI Prompt oluştur
function generateAIPrompt(studentData) {
    let prompt = `=== ÖĞRENCİ BİLGİLERİ ===\n`;
    prompt += `Ad Soyad: ${studentData.basicInfo.name}\n`;
    prompt += `Sınıf: ${studentData.basicInfo.grade}\n`;
    prompt += `Şube: ${studentData.basicInfo.class}\n`;
    prompt += `Cinsiyet: ${studentData.basicInfo.gender}\n\n`;
    
    // Öğrenme stili
    if (studentData.learningStyle) {
        prompt += `=== ÖĞRENME STİLİ ===\n`;
        prompt += `Stil: ${studentData.learningStyle.name}\n`;
        prompt += `Tanım: ${studentData.learningStyle.description}\n`;
        prompt += `Özellikler:\n`;
        studentData.learningStyle.characteristics.forEach(char => {
            prompt += `- ${char}\n`;
        });
        prompt += `Güçlü Yönler:\n`;
        studentData.learningStyle.strengths.forEach(strength => {
            prompt += `- ${strength}\n`;
        });
        prompt += `Önerilen Yöntemler:\n`;
        studentData.learningStyle.recommendations.forEach(rec => {
            prompt += `- ${rec}\n`;
        });
        prompt += `\n`;
    }
    
    // Temel kabiliyetler
    if (studentData.abilities) {
        prompt += `=== TEMEL KABİLİYETLER ===\n`;
        prompt += `En Güçlü: ${studentData.abilities.strongest}\n`;
        prompt += `Güçlü Kabiliyetler: ${studentData.abilities.strong.join(', ')}\n\n`;
        
        prompt += `Detaylı Performans:\n`;
        Object.keys(studentData.abilities.abilities).forEach((ability, index) => {
            const level = studentData.abilities.abilities[ability];
            const emoji = level?.includes('Turuncu bölgenin üstü') ? '🌟' : 
                         level?.includes('Turuncu bölgenin ortası') ? '💪' :
                         level?.includes('Turuncu bölgenin altı') ? '📈' :
                         level?.includes('Kırmızı bölgenin üstü') ? '⚠️' :
                         level?.includes('Kırmızı bölgenin ortası') ? '🆘' :
                         level?.includes('Kırmızı bölgenin altı') ? '🚨' : '❓';
            
            prompt += `${index + 1}. ${ability}: ${level} ${emoji}\n`;
            if (abilityData[ability]) {
                prompt += `   Geliştirme Önerileri: ${abilityData[ability].activities.slice(0, 2).join(', ')}\n`;
            }
        });
        prompt += `\n`;
    }
    
    // Sınav performansı
    prompt += `=== SINAV PERFORMANSI ===\n`;
    prompt += `Toplam Deneme: ${studentData.examPerformance.totalExams}\n`;
    prompt += `Son 3 Deneme Ortalaması:\n`;
    prompt += `- LGS Puanı: ${studentData.examPerformance.avgLgsScore}\n`;
    prompt += `- Türkçe Net: ${studentData.examPerformance.avgNets.turkce?.toFixed(1) || 0}\n`;
    prompt += `- Matematik Net: ${studentData.examPerformance.avgNets.matematik?.toFixed(1) || 0}\n`;
    prompt += `- Fen Net: ${studentData.examPerformance.avgNets.fen?.toFixed(1) || 0}\n`;
    const socialSubjectName = studentData.basicInfo.grade === '8' ? 'İnkılap Tarihi' : 'Sosyal Bilgiler';
    prompt += `- ${socialSubjectName} Net: ${studentData.examPerformance.avgNets.inkilap?.toFixed(1) || 0}\n`;
    prompt += `- İngilizce Net: ${studentData.examPerformance.avgNets.ingilizce?.toFixed(1) || 0}\n`;
    prompt += `- Din Net: ${studentData.examPerformance.avgNets.din?.toFixed(1) || 0}\n\n`;
    prompt += `Performans Trendi: ${studentData.examPerformance.trend} ${studentData.examPerformance.trend === 'Yükseliş' ? '📈' : studentData.examPerformance.trend === 'Düşüş' ? '📉' : '➡️'}\n\n`;
    
    // Eksik kazanımlar
    prompt += `=== EKSİK KAZANIMLAR ===\n`;
    prompt += `Toplam Eksik: ${studentData.weakOutcomes.total} kazanım\n\n`;
    
    if (studentData.weakOutcomes.mostRepeated.length > 0) {
        prompt += `En Çok Tekrar Edenler (Son 2 Deneme):\n`;
        studentData.weakOutcomes.mostRepeated.forEach((item, index) => {
            prompt += `${index + 1}. ${item.outcome} - ${item.count} kez\n`;
        });
        prompt += `\n`;
    }
    
    prompt += `Ders Bazlı:\n`;
    Object.keys(studentData.weakOutcomes.bySubject).forEach(subject => {
        const subjectName = subject === 'inkilap' ? 
                           (studentData.basicInfo.grade === '8' ? 'İnkılap Tarihi' : 'Sosyal Bilgiler') :
                           subject === 'turkce' ? 'Türkçe' :
                           subject === 'matematik' ? 'Matematik' :
                           subject === 'fen' ? 'Fen Bilimleri' :
                           subject === 'ingilizce' ? 'İngilizce' :
                           subject === 'din' ? 'Din Kültürü' : subject;
        prompt += `- ${subjectName}: ${studentData.weakOutcomes.bySubject[subject]} kazanım\n`;
    });
    prompt += `\n`;
    
    // Geçmiş değerlendirmeler (son 3)
    if (studentData.previousEvaluations && studentData.previousEvaluations.length > 0) {
        prompt += `=== GEÇMİŞ DEĞERLENDİRMELER ===\n`;
        prompt += `Toplam ${studentData.previousEvaluations.length} önceki değerlendirme mevcut.\n\n`;
        
        studentData.previousEvaluations.forEach((evaluation, index) => {
            const label = index === 0 ? '(En Son)' : index === studentData.previousEvaluations.length - 1 ? '(En Eski)' : '';
            prompt += `--- ${index + 1}. Değerlendirme ${label} ---\n`;
            prompt += `Tarih: ${new Date(evaluation.date).toLocaleDateString('tr-TR')}\n`;
            prompt += `Güçlü Yönler: ${evaluation.summary?.strongPoints || 'Belirtilmemiş'}\n`;
            prompt += `Zayıf Yönler: ${evaluation.summary?.weakPoints || 'Belirtilmemiş'}\n`;
            prompt += `Öneriler: ${evaluation.summary?.recommendations || 'Belirtilmemiş'}\n`;
            prompt += `Risk Seviyesi: ${evaluation.summary?.riskLevel || 'Belirtilmemiş'}\n`;
            prompt += `Metrikler:\n`;
            prompt += `- LGS Puanı: ${evaluation.metrics?.lgsScore || 'Belirtilmemiş'}\n`;
            prompt += `- Eksik Kazanım: ${evaluation.metrics?.weakOutcomesCount || 'Belirtilmemiş'}\n`;
            prompt += `- En Güçlü Kabiliyet: ${evaluation.metrics?.strongestAbility || 'Belirtilmemiş'}\n`;
            prompt += `- En Zayıf Kabiliyet: ${evaluation.metrics?.weakestAbility || 'Belirtilmemiş'}\n\n`;
        });
    }
    
    // Değerlendirme talimatı
    prompt += `=== DEĞERLENDİRME TALİMATI ===\n\n`;
    prompt += `Sen bir eğitim uzmanısın. Yukarıdaki verilere dayanarak bu öğrenci hakkında kapsamlı bir değerlendirme yap.\n\n`;
    
    if (studentData.previousEvaluations && studentData.previousEvaluations.length > 0) {
        prompt += `1. GELİŞİM TRENDİ ANALİZİ (3-4 cümle)\n`;
        prompt += `   - Son ${studentData.previousEvaluations.length} değerlendirme boyunca genel trend nedir?\n`;
        prompt += `   - Hangi alanlarda sürekli ilerleme gözlemleniyor?\n`;
        prompt += `   - Hangi alanlarda durgunluk veya gerileme var?\n`;
        prompt += `   - Önceki öneriler zamanla uygulanıyor mu?\n`;
        prompt += `   - Tekrarlayan sorunlar var mı?\n\n`;
        
        prompt += `2. DEVAM EDEN GÜÇLÜ YÖNLER (2-3 madde)\n`;
        prompt += `   - Hangi kabiliyetler hala güçlü?\n`;
        prompt += `   - Hangi dersler stabil başarılı?\n\n`;
        
        prompt += `3. YENİ GELİŞMELER (2-3 madde)\n`;
        prompt += `   - Yeni ortaya çıkan güçlü yönler\n`;
        prompt += `   - Yeni zayıf yönler\n`;
        prompt += `   - Yeni riskler\n\n`;
        
        prompt += `4. DEVAM EDEN SORUNLAR (2-3 madde)\n`;
        prompt += `   - Hangi zayıf yönler hala devam ediyor?\n`;
        prompt += `   - Hangi öneriler uygulanmamış?\n\n`;
        
        prompt += `5. GÜNCELLENMİŞ ÖNERİLER (5-6 madde)\n`;
        prompt += `   - Başarılı önerilere devam et (✅ işareti)\n`;
        prompt += `   - Etkisiz önerileri güncelle (🔄 işareti)\n`;
        prompt += `   - Yeni öneriler ekle (🆕 işareti)\n`;
        prompt += `   - Öğrenme stiline uygun yöntemler\n`;
        prompt += `   - Zayıf kabiliyetler için özel aktiviteler\n\n`;
        
        prompt += `6. RİSK ANALİZİ\n`;
        prompt += `   - Risk seviyesi değişimi\n`;
        prompt += `   - Acil müdahale gereken alanlar\n\n`;
    } else {
        prompt += `1. GENEL PROFIL (2-3 cümle)\n`;
        prompt += `   - Öğrencinin genel akademik durumu\n`;
        prompt += `   - Öğrenme stiline uygun yaklaşımı\n\n`;
        
        prompt += `2. GÜÇLÜ YÖNLER (3-4 madde)\n`;
        prompt += `   - Hangi kabiliyetlerde öne çıkıyor?\n`;
        prompt += `   - Hangi derslerde başarılı?\n`;
        prompt += `   - Öğrenme stilinin avantajları\n\n`;
        
        prompt += `3. GELİŞTİRİLMESİ GEREKEN ALANLAR (3-4 madde)\n`;
        prompt += `   - Hangi kabiliyetler zayıf?\n`;
        prompt += `   - Hangi derslerde zorlanıyor?\n`;
        prompt += `   - Hangi kazanımlar eksik?\n\n`;
        
        prompt += `4. KİŞİSELLEŞTİRİLMİŞ ÖNERİLER (5-6 madde)\n`;
        prompt += `   - Öğrenme stiline uygun çalışma teknikleri\n`;
        prompt += `   - Zayıf kabiliyetleri geliştirme aktiviteleri\n`;
        prompt += `   - Eksik kazanımlar için özel çalışma planı\n`;
        prompt += `   - Güçlü yönlerini kullanarak zayıf yönlerini geliştirme\n`;
        prompt += `   - Motivasyon ve özgüven artırıcı öneriler\n\n`;
        
        prompt += `5. RİSK ANALİZİ\n`;
        prompt += `   - Performans düşüşü var mı?\n`;
        prompt += `   - Hangi alanlarda acil müdahale gerekiyor?\n`;
        prompt += `   - Potansiyel sorunlar neler?\n\n`;
    }
    
    prompt += `ÖNEMLI NOTLAR:\n`;
    prompt += `- Geçmiş değerlendirmeyi TEKRAR ETME! Sadece değişimleri vurgula.\n`;
    prompt += `- Öğrenme stiline uygun öneriler ver.\n`;
    prompt += `- Temel kabiliyet geliştirme aktivitelerini dahil et.\n`;
    prompt += `- Türkçe, net, anlaşılır ve yapıcı bir dil kullan.\n`;
    prompt += `- Öğrenciyi motive edici ol.\n`;
    prompt += `- ${studentData.basicInfo.grade}. sınıf için ${evaluationFrequency[studentData.basicInfo.grade]?.label} değerlendirme olduğunu unutma.\n`;
    
    return prompt;
}

// Değerlendirme zamanı kontrolü için IPC handler
ipcMain.handle('student:check-evaluation-timing', async (event, studentId) => {
    try {
        // Önce shared klasöründeki dosyayı dene
        let studentsData = null;
        const sharedStudentsPath = path.join(userDataPath, 'shared', 'students.json');
        
        if (fs.existsSync(sharedStudentsPath)) {
            studentsData = readJsonFile(sharedStudentsPath);
        } else if (fs.existsSync(studentsFilePath)) {
            studentsData = readJsonFile(studentsFilePath);
        }
        
        if (!studentsData || !studentsData.students || !Array.isArray(studentsData.students)) {
            console.error('Öğrenci verisi yüklenemedi veya geçersiz format');
            return { error: 'Öğrenci verisi yüklenemedi' };
        }
        
        const studentsList = studentsData.students;
        const student = studentsList.find(s => s.id === studentId);
        
        if (!student) {
            return { error: 'Öğrenci bulunamadı' };
        }
        
        return shouldEvaluate(student);
    } catch (error) {
        console.error('Değerlendirme zamanı kontrolü hatası:', error);
        return { error: 'Değerlendirme zamanı kontrol edilemedi' };
    }
});
// Premium Ders Planı Oluşturma (Premium)
ipcMain.handle('plan:generate', async (event, planRequest = {}) => {
  const licenseData = readJsonFile(licenseFilePath);
  if (!licenseData || licenseData.plan !== 'premium') {
    return {
      error: 'Bu özellik yalnızca Premium plan sahipleri için geçerlidir. Lütfen lisansınızı yükseltin.'
    };
  }

  const samplePlan = {
    week: String(planRequest?.week ?? 1),
    summary: [
      'Günlük 2 saatlik odaklanmış çalışma blokları planlandı.',
      'Hafta sonu konu tekrarlı ve deneme sınavı odaklı ilerleniyor.',
      'Eksik kazanımlar için hedefli ödevler eklendi.'
    ],
    days: [
      {
        day: 'Pazartesi',
        focus: 'Temel tekrar',
        blocks: [
          { type: 'study', subject: 'Matematik', duration: 40, topic: 'Cebirsel ifadeler' },
          { type: 'study', subject: 'Fen', duration: 30, topic: 'Hücre yapısı' },
          { type: 'break', duration: 15, activity: 'Kısa mola' }
        ]
      },
      {
        day: 'Salı',
        focus: 'Problem çözme',
        blocks: [
          { type: 'study', subject: 'Matematik', duration: 45, topic: 'Problemler' },
          { type: 'study', subject: 'Türkçe', duration: 35, topic: 'Paragraf analizleri' },
          { type: 'break', duration: 10, activity: 'Nefes egzersizi' }
        ]
      },
      {
        day: 'Çarşamba',
        focus: 'Fen ve sosyal',
        blocks: [
          { type: 'study', subject: 'Fen', duration: 40, topic: 'DNA ve genetik kod' },
          { type: 'study', subject: 'Sosyal Bilgiler', duration: 30, topic: 'Kültür ve miras' },
          { type: 'break', duration: 15, activity: 'Hafif egzersiz' }
        ]
      },
      {
        day: 'Perşembe',
        focus: 'Dil becerileri',
        blocks: [
          { type: 'study', subject: 'İngilizce', duration: 30, topic: 'Kelime tekrarı' },
          { type: 'study', subject: 'Türkçe', duration: 35, topic: 'Dil bilgisi soruları' },
          { type: 'break', duration: 15, activity: 'Okuma molası' }
        ]
      },
      {
        day: 'Cuma',
        focus: 'Genel tekrar',
        blocks: [
          { type: 'study', subject: 'Din', duration: 25, topic: 'Temel kavramlar' },
          { type: 'study', subject: 'Matematik', duration: 35, topic: 'Hatalı sorular üzerinden tekrar' },
          { type: 'break', duration: 15, activity: 'Serbest zaman' }
        ]
      },
      {
        day: 'Cumartesi',
        focus: 'Deneme + analiz',
        blocks: [
          { type: 'study', subject: 'Deneme', duration: 90, topic: 'Tam sürelik deneme' },
          { type: 'study', subject: 'Analiz', duration: 45, topic: 'Yanlış sorular incelemesi' }
        ]
      },
      {
        day: 'Pazar',
        focus: 'Hafif tekrar',
        blocks: [
          { type: 'study', subject: 'Fen', duration: 30, topic: 'Kavram haritası çıkarma' },
          { type: 'study', subject: 'Matematik', duration: 30, topic: 'Hafif problem çözümü' },
          { type: 'break', duration: 20, activity: 'Aile ile zaman' }
        ]
      }
    ]
  };

  return {
    success: true,
    plan: samplePlan
  };
});
// YEN�: AI Destekli ��renci De�erlendirme (Premium)
ipcMain.handle('student:get-ai-evaluation', async (event, studentData, force = false) => {
    console.log('🔍 DEBUG: AI evaluation başlatılıyor...');
    
    const licenseData = readJsonFile(licenseFilePath);
    console.log('🔍 DEBUG: license plan:', licenseData?.plan, 'user:', activeUser?.email);
    
    if (!licenseData || licenseData.plan !== 'premium') {
        console.log('❌ DEBUG: Premium kontrolü başarısız');
        return {
            error: 'Bu özellik yalnızca Premium plan sahipleri için geçerlidir.'
        };
    }

    if (!studentData) {
        console.log('❌ DEBUG: Öğrenci verisi eksik');
        return { error: 'Değerlendirme için öğrenci verisi sağlanmadı.' };
    }

    // Değerlendirme zamanı kontrolü
    const evaluationTiming = shouldEvaluate(studentData, force);
    if (!evaluationTiming.should) {
        return {
            warning: true,
            message: evaluationTiming.reason,
            nextDate: evaluationTiming.nextDate
        };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log('🔍 DEBUG: Gemini key okundu mu?', !!apiKey);
    if (!apiKey) {
        console.error('❌ DEBUG: Gemini API anahtarı .env dosyasında bulunamadı!');
        return { error: 'API anahtarı yapılandırılmamış. Lütfen ayarları kontrol edin.' };
    }

    try {
        // Öğrenci verilerini hazırla - önce shared klasöründeki dosyayı dene
        let studentsData = null;
        const sharedStudentsPath = path.join(userDataPath, 'shared', 'students.json');
        
        if (fs.existsSync(sharedStudentsPath)) {
            studentsData = readJsonFile(sharedStudentsPath);
        } else if (fs.existsSync(studentsFilePath)) {
            studentsData = readJsonFile(studentsFilePath);
        }
        
        if (!studentsData || !studentsData.students || !Array.isArray(studentsData.students)) {
            return { error: 'Öğrenci verisi yüklenemedi' };
        }
        
        const studentsList = studentsData.students;
        const fullStudent = studentsList.find(s => s.id === studentData.id);
        
        if (!fullStudent) {
            return { error: 'Öğrenci verisi bulunamadı' };
        }

        // Temel kabiliyet CSV'sini oku
        let abilitiesCSV = '';
        try {
            const fs = require('fs');
            abilitiesCSV = fs.readFileSync('./Program_Uyumlu_Temel_Kabiliyetler_GUNCELLENMIS.csv', 'utf8');
        } catch (error) {
            console.log('⚠️ DEBUG: Kabiliyet CSV dosyası okunamadı:', error.message);
        }

        // Veri hazırlama
        const basicInfo = {
            name: fullStudent.name,
            grade: fullStudent.grade,
            class: fullStudent.class,
            gender: fullStudent.gender || 'Belirtilmemiş'
        };
        
        const learningStyle = learningStyleData[fullStudent.learningStyle] || null;
        const abilities = parseAbilitiesFromCSV(fullStudent.name, abilitiesCSV);
        
        // Sınav verilerini data.json dosyasından al
        let examHistory = [];
        try {
            const dataPath = sharedDataPath;
            console.log('🔍 DEBUG: Veri dosyası yolu:', dataPath);
            console.log('🔍 DEBUG: Dosya var mı?', fs.existsSync(dataPath));
            
            if (fs.existsSync(dataPath)) {
                const dataFile = readJsonFile(dataPath);
                console.log('🔍 DEBUG: Dosya okundu, veri yapısı:', dataFile ? Object.keys(dataFile) : 'null');
                
                if (dataFile && dataFile.value && Array.isArray(dataFile.value)) {
                    console.log('🔍 DEBUG: Toplam sınav sayısı:', dataFile.value.length);
                    console.log('🔍 DEBUG: İlk sınav örneği:', dataFile.value[0] ? Object.keys(dataFile.value[0]) : 'boş');
                    
                    // Öğrencinin sınavlarını filtrele
                    examHistory = dataFile.value.filter(exam => exam.profile === fullStudent.name);
                    console.log(`🔍 DEBUG: ${fullStudent.name} için ${examHistory.length} sınav bulundu`);
                } else {
                    console.log('🔍 DEBUG: dataFile.value bulunamadı veya array değil');
                }
            } else {
                console.log('🔍 DEBUG: data.json dosyası bulunamadı');
            }
        } catch (error) {
            console.error('Sınav verileri okunamadı:', error);
        }
        
        const examPerformance = calculateExamPerformance(examHistory);
        const weakOutcomes = analyzeWeakOutcomes(examHistory);
        
        // Debug: Veri kontrolü
        console.log('🔍 DEBUG: Öğrenci sınav sayısı:', examHistory.length);
        console.log('🔍 DEBUG: Exam performance:', examPerformance);
        console.log('🔍 DEBUG: Weak outcomes:', weakOutcomes);
        console.log('🔍 DEBUG: Learning style:', fullStudent.learningStyle);
        console.log('🔍 DEBUG: Exam history structure:', examHistory.length > 0 ? Object.keys(examHistory[0]) : 'No exams');
        // Öğrenci bazlı değerlendirme dosyasından oku
        const evalFileName = fullStudent.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_ığüşöçİĞÜŞÖÇ]/g, '');
        const evalFilePath = path.join(userDataPath, 'shared', 'evaluations', `${evalFileName}.json`);

        let previousEvaluations = [];
        if (fs.existsSync(evalFilePath)) {
            try {
                const evalData = readJsonFile(evalFilePath);
                // Son 3 değerlendirmeyi topla: currentEvaluation + history'den ilk 2
                if (evalData?.currentEvaluation) {
                    previousEvaluations.push(evalData.currentEvaluation);
                }
                if (evalData?.history && Array.isArray(evalData.history)) {
                    previousEvaluations.push(...evalData.history.slice(0, 2));
                }
                console.log(`🔍 DEBUG: ${previousEvaluations.length} önceki değerlendirme bulundu`);
            } catch (error) {
                console.error('Önceki değerlendirmeler okunamadı:', error);
            }
        }

        const preparedData = {
            basicInfo,
            learningStyle,
            abilities,
            examPerformance,
            weakOutcomes,
            previousEvaluations,
            evaluationTiming
        };

        // AI Prompt oluştur
        let prompt;
        if (preparedData.subjectSpecificPrompt) {
            // Ders özgü prompt kullan
            prompt = preparedData.subjectSpecificPrompt;
            console.log('🔍 DEBUG: Ders özgü prompt kullanılıyor:', preparedData.subject);
        } else {
            // Genel prompt oluştur
            prompt = generateAIPrompt(preparedData);
        }
        console.log('🔍 DEBUG: Prompt oluşturuldu, uzunluk:', prompt.length);

        const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
        
        const response = await fetch(`${API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('❌ DEBUG: Gemini API Hatası - Status:', response.status);
            console.error('❌ DEBUG: Gemini API Hatası - Response:', errorBody);
            return { error: `API Hatası (${response.status}): ${errorBody.error?.message || 'Bilinmeyen hata'}` };
        }

        const data = await response.json();
        const evaluationText = data.candidates[0].content.parts[0].text;

        // Değerlendirmeyi öğrenci verisine kaydet
        const evaluationRecord = {
            date: new Date().toISOString(),
            evaluationText: evaluationText,
            summary: {
                strongPoints: 'AI tarafından analiz edildi',
                weakPoints: 'AI tarafından analiz edildi',
                recommendations: 'AI tarafından önerildi',
                riskLevel: 'AI tarafından değerlendirildi'
            },
            metrics: {
                lgsScore: examPerformance.avgLgsScore,
                totalExams: examPerformance.totalExams,
                weakOutcomesCount: weakOutcomes.total,
                strongestAbility: abilities?.strongest || 'Belirlenmemiş',
                weakestAbility: abilities?.weakest || 'Belirlenmemiş'
            }
        };

        // Değerlendirmeyi öğrenci bazlı dosyaya kaydet
        const saveFileName = fullStudent.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_ığüşöçİĞÜŞÖÇ]/g, '');
        const saveFilePath = path.join(userDataPath, 'shared', 'evaluations', `${saveFileName}.json`);

        // Evaluations klasörünü oluştur
        const evaluationsDir = path.join(userDataPath, 'shared', 'evaluations');
        if (!fs.existsSync(evaluationsDir)) {
            fs.mkdirSync(evaluationsDir, { recursive: true });
        }

        // Değerlendirme verisini hazırla - geçmiş kayıtları koru
        let historyArray = [];
        
        // Eğer dosya varsa, mevcut değerlendirmeyi history'e ekle
        if (fs.existsSync(saveFilePath)) {
            try {
                const existingData = readJsonFile(saveFilePath);
                if (existingData?.currentEvaluation) {
                    historyArray.push(existingData.currentEvaluation);
                }
                if (existingData?.history && Array.isArray(existingData.history)) {
                    historyArray.push(...existingData.history);
                }
            } catch (error) {
                console.error('Mevcut değerlendirme dosyası okunamadı:', error);
            }
        }
        
        // Son 3 değerlendirmeyi tut (en yeniden en eskiye)
        historyArray = historyArray.slice(0, 3);
        
        const evaluationData = {
            studentId: fullStudent.id,
            studentName: fullStudent.name,
            grade: fullStudent.grade,
            lastUpdated: new Date().toISOString(),
            currentEvaluation: evaluationRecord,
            history: historyArray
        };

        // Dosyaya yaz
        writeJsonFileWithBackup(saveFilePath, evaluationData);
        console.log(`✅ Değerlendirme kaydedildi. Geçmiş kayıt sayısı: ${historyArray.length}`);
        console.log(`Değerlendirme kaydedildi: ${saveFilePath}`);

        return {
            success: true,
            evaluation: evaluationText,
            timing: evaluationTiming
        };

    } catch (error) {
        console.error('AI değerlendirmesi sırasında hata:', error);
        return { error: 'Yapay zeka servisine bağlanırken bir hata oluştu.' };
    }
});

// ===========================================
// ETÜT GRUPLARI YÖNETİMİ (STUDY SESSIONS)
// ===========================================

// Etüt grupları dosya yolu
function getEtutGroupsFilePath() {
  return path.join(userDataPath, 'shared', 'etut_groups.json');
}

// Etüt gruplarını yükle
ipcMain.handle('etut:load', () => {
  console.log('🔍 DEBUG: etut:load çağrıldı');
  
  if (!activeUser) {
    console.error('❌ etut:load: Aktif kullanıcı oturumu bulunamadı!');
    return { error: 'Etüt verisini yüklemek için kullanıcı girişi gereklidir.' };
  }
  
  const etutGroupsPath = getEtutGroupsFilePath();
  console.log('🔍 DEBUG: etutGroupsPath:', etutGroupsPath);
  
  try {
    if (fs.existsSync(etutGroupsPath)) {
      const data = fs.readFileSync(etutGroupsPath, 'utf8');
      const etutData = JSON.parse(data);
      
      console.log(`✅ Etüt grupları yüklendi: ${etutData.etutGroups?.length || 0} grup`);
      return { 
        success: true, 
        etutGroups: etutData.etutGroups || [],
        lastUpdated: etutData.lastUpdated || null
      };
    } else {
      // Dosya yoksa boş yapı oluştur
      const emptyData = {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        etutGroups: []
      };
      
      // Dosyayı oluştur
      const etutDir = path.dirname(etutGroupsPath);
      if (!fs.existsSync(etutDir)) {
        fs.mkdirSync(etutDir, { recursive: true });
      }
      fs.writeFileSync(etutGroupsPath, JSON.stringify(emptyData, null, 2));
      
      console.log('✅ Boş etüt grupları dosyası oluşturuldu');
      return { 
        success: true, 
        etutGroups: [],
        lastUpdated: emptyData.lastUpdated
      };
    }
  } catch (error) {
    console.error(`❌ Etüt grupları yükleme hatası:`, error);
    return { error: error.message };
  }
});

// Etüt grubu kaydet
ipcMain.handle('etut:save', (event, etutGroup) => {
  console.log('💾 DEBUG: etut:save çağrıldı');
  
  if (!activeUser) {
    console.error('❌ etut:save: Aktif kullanıcı oturumu bulunamadı!');
    return { error: 'Etüt grubu kaydetmek için kullanıcı girişi gereklidir.' };
  }
  
  // Yetki kontrolü
  if (!ensurePermission(activeUser.role, 'canManageStudents')) {
    console.log('❌ etut:save: Yetki yok - Kullanıcı rolü:', activeUser.role);
    return { error: 'PERMISSION_DENIED', message: 'Etüt grubu oluşturma yetkiniz yok.' };
  }
  
  const etutGroupsPath = getEtutGroupsFilePath();
  
  try {
    let etutData;
    
    if (fs.existsSync(etutGroupsPath)) {
      const data = fs.readFileSync(etutGroupsPath, 'utf8');
      etutData = JSON.parse(data);
    } else {
      etutData = {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        etutGroups: []
      };
    }
    
    // Yeni etüt grubu ekle
    const newEtutGroup = {
      ...etutGroup,
      id: etutGroup.id || `etut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: etutGroup.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      teacher: etutGroup.teacher || activeUser.name || 'Bilinmeyen Öğretmen'
    };
    
    etutData.etutGroups.push(newEtutGroup);
    etutData.lastUpdated = new Date().toISOString();
    
    // Dosyaya yaz
    fs.writeFileSync(etutGroupsPath, JSON.stringify(etutData, null, 2));
    
    // Yedek oluştur
    const backupPath = etutGroupsPath + '.bak';
    fs.writeFileSync(backupPath, JSON.stringify(etutData, null, 2));
    
    console.log(`✅ Etüt grubu kaydedildi: ${newEtutGroup.name} (${newEtutGroup.id})`);
    return { success: true, etutGroup: newEtutGroup };
    
  } catch (error) {
    console.error(`❌ Etüt grubu kaydetme hatası:`, error);
    return { error: error.message };
  }
});

// Etüt grubu güncelle
ipcMain.handle('etut:update', (event, groupId, updates) => {
  console.log('🔄 DEBUG: etut:update çağrıldı', groupId);
  
  if (!activeUser) {
    console.error('❌ etut:update: Aktif kullanıcı oturumu bulunamadı!');
    return { error: 'Etüt grubu güncellemek için kullanıcı girişi gereklidir.' };
  }
  
  // Yetki kontrolü
  if (!ensurePermission(activeUser.role, 'canManageStudents')) {
    console.log('❌ etut:update: Yetki yok - Kullanıcı rolü:', activeUser.role);
    return { error: 'PERMISSION_DENIED', message: 'Etüt grubu düzenleme yetkiniz yok.' };
  }
  
  const etutGroupsPath = getEtutGroupsFilePath();
  
  try {
    if (!fs.existsSync(etutGroupsPath)) {
      return { error: 'Etüt grupları dosyası bulunamadı.' };
    }
    
    const data = fs.readFileSync(etutGroupsPath, 'utf8');
    const etutData = JSON.parse(data);
    
    // Grubu bul ve güncelle
    const groupIndex = etutData.etutGroups.findIndex(group => group.id === groupId);
    if (groupIndex === -1) {
      return { error: 'Etüt grubu bulunamadı.' };
    }
    
    // Güncelleme yap
    etutData.etutGroups[groupIndex] = {
      ...etutData.etutGroups[groupIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    etutData.lastUpdated = new Date().toISOString();
    
    // Dosyaya yaz
    fs.writeFileSync(etutGroupsPath, JSON.stringify(etutData, null, 2));
    
    // Yedek oluştur
    const backupPath = etutGroupsPath + '.bak';
    fs.writeFileSync(backupPath, JSON.stringify(etutData, null, 2));
    
    console.log(`✅ Etüt grubu güncellendi: ${groupId}`);
    return { success: true, etutGroup: etutData.etutGroups[groupIndex] };
    
  } catch (error) {
    console.error(`❌ Etüt grubu güncelleme hatası:`, error);
    return { error: error.message };
  }
});

// Etüt grubu sil
ipcMain.handle('etut:delete', (event, groupId) => {
  console.log('🗑️ DEBUG: etut:delete çağrıldı', groupId);
  
  if (!activeUser) {
    console.error('❌ etut:delete: Aktif kullanıcı oturumu bulunamadı!');
    return { error: 'Etüt grubu silmek için kullanıcı girişi gereklidir.' };
  }
  
  // Yetki kontrolü
  if (!ensurePermission(activeUser.role, 'canManageStudents')) {
    console.log('❌ etut:delete: Yetki yok - Kullanıcı rolü:', activeUser.role);
    return { error: 'PERMISSION_DENIED', message: 'Etüt grubu silme yetkiniz yok.' };
  }
  
  const etutGroupsPath = getEtutGroupsFilePath();
  
  try {
    if (!fs.existsSync(etutGroupsPath)) {
      return { error: 'Etüt grupları dosyası bulunamadı.' };
    }
    
    const data = fs.readFileSync(etutGroupsPath, 'utf8');
    const etutData = JSON.parse(data);
    
    // Grubu bul ve sil
    const groupIndex = etutData.etutGroups.findIndex(group => group.id === groupId);
    if (groupIndex === -1) {
      return { error: 'Etüt grubu bulunamadı.' };
    }
    
    const deletedGroup = etutData.etutGroups[groupIndex];
    etutData.etutGroups.splice(groupIndex, 1);
    etutData.lastUpdated = new Date().toISOString();
    
    // Dosyaya yaz
    fs.writeFileSync(etutGroupsPath, JSON.stringify(etutData, null, 2));
    
    // Yedek oluştur
    const backupPath = etutGroupsPath + '.bak';
    fs.writeFileSync(backupPath, JSON.stringify(etutData, null, 2));
    
    console.log(`✅ Etüt grubu silindi: ${deletedGroup.name} (${groupId})`);
    return { success: true, deletedGroup };
    
  } catch (error) {
    console.error(`❌ Etüt grubu silme hatası:`, error);
    return { error: error.message };
  }
});

// Öğrenci bazlı etüt raporu
ipcMain.handle('etut:get-student-report', (event, studentId) => {
  console.log('📊 DEBUG: etut:get-student-report çağrıldı', studentId);
  
  if (!activeUser) {
    console.error('❌ etut:get-student-report: Aktif kullanıcı oturumu bulunamadı!');
    return { error: 'Etüt raporu için kullanıcı girişi gereklidir.' };
  }
  
  const etutGroupsPath = getEtutGroupsFilePath();
  
  try {
    if (!fs.existsSync(etutGroupsPath)) {
      return { success: true, report: { studentId, totalEtuts: 0, etuts: [], statistics: {} } };
    }
    
    const data = fs.readFileSync(etutGroupsPath, 'utf8');
    const etutData = JSON.parse(data);
    
    // Öğrencinin katıldığı etütleri bul
    const studentEtuts = etutData.etutGroups.filter(group => 
      group.students && group.students.some(student => student.id === studentId)
    );
    
    // Rapor verilerini hazırla
    const report = {
      studentId,
      totalEtuts: studentEtuts.length,
      etuts: studentEtuts.map(etut => ({
        id: etut.id,
        name: etut.name,
        subject: etut.subject,
        date: etut.date,
        startTime: etut.startTime,
        endTime: etut.endTime,
        status: etut.status || 'planned',
        teacher: etut.teacher,
        attendanceStatus: etut.students.find(s => s.id === studentId)?.attendanceStatus || 'planned'
      })),
      statistics: {
        bySubject: {},
        byStatus: {},
        byMonth: {}
      }
    };
    
    // Ders bazında istatistikler
    studentEtuts.forEach(etut => {
      const subject = etut.subject;
      if (!report.statistics.bySubject[subject]) {
        report.statistics.bySubject[subject] = 0;
      }
      report.statistics.bySubject[subject]++;
      
      const status = etut.status || 'planned';
      if (!report.statistics.byStatus[status]) {
        report.statistics.byStatus[status] = 0;
      }
      report.statistics.byStatus[status]++;
      
      // Ay bazında (YYYY-MM formatında)
      if (etut.date) {
        const month = etut.date.substring(0, 7); // YYYY-MM
        if (!report.statistics.byMonth[month]) {
          report.statistics.byMonth[month] = 0;
        }
        report.statistics.byMonth[month]++;
      }
    });
    
    console.log(`✅ Öğrenci etüt raporu oluşturuldu: ${studentId} - ${report.totalEtuts} etüt`);
    return { success: true, report };
    
  } catch (error) {
    console.error(`❌ Etüt raporu oluşturma hatası:`, error);
    return { error: error.message };
  }
});

// ===========================================
// PERFORMANS PANOSU IPC HANDLERS
// ===========================================

// Performans verilerini yükle
ipcMain.handle('performance:load', (event, sinif) => {
  console.log('📊 DEBUG: performance:load çağrıldı', sinif);
  
  if (!activeUser) {
    console.error('❌ performance:load: Aktif kullanıcı oturumu bulunamadı!');
    return { error: 'Performans verisi yüklemek için kullanıcı girişi gereklidir.' };
  }

  try {
    const performanceFilePath = path.join(sharedPath, `performans_${sinif}.json`);
    
    if (!fs.existsSync(performanceFilePath)) {
      console.log(`⚠️ Performans dosyası bulunamadı: ${performanceFilePath}`);
      return { success: true, data: null };
    }

    const data = JSON.parse(fs.readFileSync(performanceFilePath, 'utf8'));
    console.log(`✅ Performans verisi yüklendi: ${sinif}`);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Performans verisi yükleme hatası:', error);
    return { error: error.message };
  }
});

// Performans verilerini kaydet
ipcMain.handle('performance:save', (event, data) => {
  console.log('💾 DEBUG: performance:save çağrıldı');
  
  if (!activeUser) {
    console.error('❌ performance:save: Aktif kullanıcı oturumu bulunamadı!');
    return { error: 'Performans verisi kaydetmek için kullanıcı girişi gereklidir.' };
  }

  try {
    const sinif = data.sinif;
    const performanceFilePath = path.join(sharedPath, `performans_${sinif}.json`);
    
    // Shared klasörü yoksa oluştur
    if (!fs.existsSync(sharedPath)) {
      fs.mkdirSync(sharedPath, { recursive: true });
    }

    fs.writeFileSync(performanceFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Performans verisi kaydedildi: ${sinif}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Performans verisi kaydetme hatası:', error);
    return { error: error.message };
  }
});

// Excel'e aktar
ipcMain.handle('performance:export-excel', async (event, data) => {
  console.log('📤 DEBUG: performance:export-excel çağrıldı');
  
  if (!activeUser) {
    console.error('❌ performance:export-excel: Aktif kullanıcı oturumu bulunamadı!');
    return { error: 'Excel aktarmak için kullanıcı girişi gereklidir.' };
  }

  try {
    const { dialog } = require('electron');
    
    // Kaydetme konumunu seç
    const result = await dialog.showSaveDialog({
      title: 'Performans Verilerini Kaydet',
      defaultPath: `${data.sinif}_performans_${new Date().toISOString().split('T')[0]}.csv`,
      filters: [
        { name: 'CSV Dosyaları', extensions: ['csv'] },
        { name: 'Tüm Dosyalar', extensions: ['*'] }
      ]
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    // CSV formatına çevir
    let csvContent = '';
    
    // Başlıklar
    csvContent += 'Ders,Öğrenci Adı,Tema Başarı (%),Yazılı,Deneme Ort.,Etüt Sayısı,Ödev Tamamlama (%),Genel Başarı\n';
    
    // Verileri ekle
    for (const [ders, ogrenciler] of Object.entries(data.dersler)) {
      if (ogrenciler && ogrenciler.length > 0) {
        ogrenciler.forEach(ogrenci => {
          csvContent += `${ders},${ogrenci.ad},${ogrenci.temaBasari || ''},${ogrenci.yazili || ''},${ogrenci.denemeOrt || ''},${ogrenci.etutSayisi || ''},${ogrenci.odevTamamlama || ''},${ogrenci.genelBasari ? ogrenci.genelBasari.toFixed(1) : ''}\n`;
        });
      }
    }

    fs.writeFileSync(result.filePath, csvContent, 'utf8');
    console.log(`✅ Performans verileri Excel'e aktarıldı: ${result.filePath}`);
    return { success: true, filePath: result.filePath };
    
  } catch (error) {
    console.error('❌ Excel aktarım hatası:', error);
    return { error: error.message };
  }
});

// ===========================================
// HEDEF TAKİBİ IPC HANDLERS
// ===========================================

// Hedefleri kaydet
ipcMain.handle('goals:save', (event, studentId, goalsData) => {
  console.log('🎯 DEBUG: goals:save çağrıldı', studentId);
  
  if (!activeUser) {
    console.error('❌ goals:save: Aktif kullanıcı oturumu bulunamadı!');
    return { error: 'Hedef kaydetmek için kullanıcı girişi gereklidir.' };
  }

  try {
    // Goals klasörünü oluştur
    const goalsDir = path.join(sharedPath, 'goals');
    if (!fs.existsSync(goalsDir)) {
      fs.mkdirSync(goalsDir, { recursive: true });
    }

    const goalsFilePath = path.join(goalsDir, `student_${studentId}.json`);
    
    // Hedef verisini kaydet
    const goalsDataWithMeta = {
      ...goalsData,
      studentId: studentId,
      lastUpdated: new Date().toISOString(),
      version: "1.0"
    };
    
    fs.writeFileSync(goalsFilePath, JSON.stringify(goalsDataWithMeta, null, 2), 'utf8');
    console.log(`✅ Hedefler kaydedildi: ${studentId}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Hedef kaydetme hatası:', error);
    return { error: error.message };
  }
});

// Hedefleri yükle
ipcMain.handle('goals:load', (event, studentId) => {
  console.log('🎯 DEBUG: goals:load çağrıldı', studentId);
  
  if (!activeUser) {
    console.error('❌ goals:load: Aktif kullanıcı oturumu bulunamadı!');
    return { error: 'Hedef yüklemek için kullanıcı girişi gereklidir.' };
  }

  try {
    const goalsFilePath = path.join(sharedPath, 'goals', `student_${studentId}.json`);
    
    if (!fs.existsSync(goalsFilePath)) {
      console.log(`⚠️ Hedef dosyası bulunamadı: ${goalsFilePath}`);
      return { success: true, data: null };
    }

    const data = JSON.parse(fs.readFileSync(goalsFilePath, 'utf8'));
    console.log(`✅ Hedefler yüklendi: ${studentId}`);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Hedef yükleme hatası:', error);
    return { error: error.message };
  }
});



