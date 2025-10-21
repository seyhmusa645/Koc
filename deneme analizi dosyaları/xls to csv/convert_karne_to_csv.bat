@echo off
chcp 65001 >nul
echo ================================================================================
echo XLS TO CSV CONVERTER - KARNE VERİLERİNİ SİSTEM FORMATINA DÖNÜŞTÜRÜCÜ
echo ================================================================================
echo.

REM Python'un kurulu olup olmadığını kontrol et
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python bulunamadı! Lütfen Python'u yükleyin.
    echo    https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

REM Gerekli kütüphaneleri kontrol et
echo 📦 Python kütüphaneleri kontrol ediliyor...
python -c "import openpyxl" >nul 2>&1
if errorlevel 1 (
    echo ⚠️ openpyxl kütüphanesi eksik. Yükleniyor...
    pip install openpyxl
    if errorlevel 1 (
        echo ❌ openpyxl yüklenemedi!
        pause
        exit /b 1
    )
)

echo ✅ Tüm kütüphaneler hazır
echo.

REM Python betiğini çalıştır (etkileşimli mod)
echo 🔄 Dönüştürücü başlatılıyor...
echo.

python "%~dp0xls_to_csv_converter.py"

if errorlevel 1 (
    echo.
    echo ❌ Dönüştürme hatası!
    pause
    exit /b 1
)

echo.
echo ✅ İşlem tamamlandı!
echo.

pause
