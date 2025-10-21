# 🔨 Program Derleme ve Dağıtım Rehberi

## 📋 Gereksinimler

### Sistem Gereksinimleri:
- **Node.js** (v14 veya üzeri)
- **npm** veya **yarn**
- **Git** (isteğe bağlı)

### Platform Gereksinimleri:
- **Windows:** Windows 10/11 (x64, x86)
- **macOS:** macOS 10.14+ (x64, ARM64)
- **Linux:** Ubuntu 18.04+ / Debian 10+ (x64)

## 🚀 Hızlı Başlangıç

### Windows için:
```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Windows için derle
npm run build:win

# 3. Veya otomatik script kullan
build.bat
```

### macOS için:
```bash
# 1. Bağımlılıkları yükle
npm install

# 2. macOS için derle
npm run build:mac
```

### Linux için:
```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Linux için derle
npm run build:linux
```

### Tüm platformlar için:
```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Tüm platformlar için derle
npm run build:all

# 3. Veya otomatik script kullan
chmod +x build.sh
./build.sh
```

## 📦 Çıktı Dosyaları

### Windows:
- **`Kapsul Koçluk Programı Setup.exe`** - NSIS Installer
- **`Kapsul Koçluk Programı Portable.exe`** - Portable Version
- **`Kapsul Koçluk Programı Setup.exe.zip`** - Compressed Installer

### macOS:
- **`Kapsul Koçluk Programı.dmg`** - DMG Installer
- **`Kapsul Koçluk Programı.app`** - Application Bundle

### Linux:
- **`Kapsul Koçluk Programı.AppImage`** - AppImage (Portable)
- **`kapsul-kocluk-programi_1.0.0_amd64.deb`** - Debian Package

## 🎯 Dağıtım Seçenekleri

### 1. 📁 Manuel Dağıtım:
- Çıktı dosyalarını USB ile kopyalayın
- Email ile gönderin
- Cloud storage'a yükleyin

### 2. 🌐 Web Dağıtımı:
- GitHub Releases kullanın
- Kendi web sitenizde barındırın
- CDN kullanın

### 3. 📱 App Store Dağıtımı:
- Microsoft Store (Windows)
- Mac App Store (macOS)
- Snap Store (Linux)

## ⚙️ Gelişmiş Konfigürasyon

### Build Script'leri:

#### Windows (build.bat):
```batch
@echo off
echo Building for Windows...
npm run build:win
echo Build completed!
pause
```

#### Linux/Mac (build.sh):
```bash
#!/bin/bash
echo "Building for all platforms..."
npm run build:all
echo "Build completed!"
```

### Package.json Script'leri:
```json
{
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux",
    "build:all": "electron-builder --win --mac --linux",
    "dist": "electron-builder --publish=never",
    "pack": "electron-builder --dir"
  }
}
```

## 🔧 Sorun Giderme

### Yaygın Hatalar:

#### 1. **"electron-builder not found"**
```bash
npm install electron-builder --save-dev
```

#### 2. **"Permission denied" (Linux/Mac)**
```bash
chmod +x build.sh
sudo npm install -g electron-builder
```

#### 3. **"Icon not found"**
- `Kapsül-Photoroom.png` dosyasının mevcut olduğundan emin olun
- Icon dosyası 512x512 piksel olmalı

#### 4. **"Build failed"**
```bash
# Cache temizle
npm cache clean --force
rm -rf node_modules
npm install
```

## 📊 Build Optimizasyonu

### Dosya Boyutunu Küçültme:
1. **Gereksiz dosyaları hariç tut:**
```json
"files": [
  "**/*",
  "!**/node_modules/*/{test,__tests__,tests}",
  "!**/*.md",
  "!**/*.txt"
]
```

2. **Compression kullan:**
```json
"compression": "maximum"
```

3. **Unused dependencies temizle:**
```bash
npm prune
```

## 🚀 Otomatik Dağıtım

### GitHub Actions ile:
```yaml
name: Build and Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run build
      - uses: actions/upload-artifact@v2
        with:
          name: ${{ matrix.os }}-build
          path: dist/
```

## 📞 Destek

Sorun yaşarsanız:
1. **GitHub Issues** kullanın
2. **Email** gönderin
3. **Dokümantasyonu** kontrol edin

---

**Not:** Bu rehber MIT lisansı altında lisanslanmıştır.
