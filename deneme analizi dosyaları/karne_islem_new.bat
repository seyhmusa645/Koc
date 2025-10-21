@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
color 0A
title Karne Isleme Sistemi

:MENU
cls
echo ================================================================
echo           KARNE PDF ISLEME SISTEMI - v2.0
echo           5-6-7-8. Sinif Desteği
echo ================================================================
echo.
echo [1] Tek PDF Isle (Text Dosyalari)
echo [2] Tek PDF Isle (Excel Dosyasi)
echo [3] Klasordeki Tum PDF'leri Isle (Text)
echo [4] Klasordeki Tum PDF'leri Isle (Excel)
echo [5] Kurulum Yap (Ilk Kullanim)
echo [6] Cikis
echo.
set /p choice="Seciminiz (1-6): "

if "%choice%"=="1" goto SINGLE_TEXT
if "%choice%"=="2" goto SINGLE_EXCEL
if "%choice%"=="3" goto BATCH_TEXT
if "%choice%"=="4" goto BATCH_EXCEL
if "%choice%"=="5" goto INSTALL
if "%choice%"=="6" goto EXIT
goto MENU

:SINGLE_TEXT
cls
echo ================================================================
echo           TEK PDF ISLE (TEXT)
echo ================================================================
echo.
set /p pdffile="PDF dosyasinin adini girin (orn: karne.pdf): "
if not exist "%pdffile%" (
    echo.
    echo [HATA] Dosya bulunamadi: %pdffile%
    echo.
    pause
    goto MENU
)

echo.
echo Isleniyor...
python karne_ayristir.py "%pdffile%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [BASARILI] Islem tamamlandi!
    echo Cikti klasorune bakabilirsiniz.
) else (
    echo.
    echo [HATA] Islem basarisiz!
)
echo.
pause
goto MENU

:SINGLE_EXCEL
cls
echo ================================================================
echo           TEK PDF ISLE (EXCEL)
echo ================================================================
echo.
set /p pdffile="PDF dosyasinin adini girin (orn: karne.pdf): "
if not exist "%pdffile%" (
    echo.
    echo [HATA] Dosya bulunamadi: %pdffile%
    echo.
    pause
    goto MENU
)

echo.
echo Isleniyor...
python karne_excel.py "%pdffile%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [BASARILI] Excel dosyasi olusturuldu!
) else (
    echo.
    echo [HATA] Islem basarisiz!
)
echo.
pause
goto MENU

:BATCH_TEXT
cls
echo ================================================================
echo           TUM PDF'LERI ISLE (TEXT)
echo ================================================================
echo.
echo Mevcut klasordeki tum PDF dosyalari islenecek...
echo.

REM PDF dosya kontrolu
set count=0
for %%f in (*.pdf) do set /a count+=1
if %count% EQU 0 (
    echo [UYARI] Klasorde PDF dosyasi bulunamadi!
    echo.
    pause
    goto MENU
)

echo %count% adet PDF dosyasi bulundu.
echo.
pause

set count=0
for %%f in (*.pdf) do (
    echo.
    echo [%%f] isleniyor...
    python karne_ayristir.py "%%f"
    set /a count+=1
)

echo.
echo ================================================================
echo [TAMAMLANDI] %count% adet PDF islendi!
echo ================================================================
echo.
pause
goto MENU

:BATCH_EXCEL
cls
echo ================================================================
echo           TUM PDF'LERI ISLE (EXCEL)
echo ================================================================
echo.
echo Mevcut klasordeki tum PDF dosyalari tek Excel'de birlestirilecek...
echo.

REM PDF dosya kontrolu
set count=0
for %%f in (*.pdf) do set /a count+=1
if %count% EQU 0 (
    echo [UYARI] Klasorde PDF dosyasi bulunamadi!
    echo.
    pause
    goto MENU
)

echo %count% adet PDF dosyasi bulundu.
echo.
set /p excelname="Excel dosya adi (orn: tum_karneler.xlsx): "

if "%excelname%"=="" set excelname=tum_karneler.xlsx

echo.
echo Isleniyor...

REM Ilk PDF'yi isle
set first=1
for %%f in (*.pdf) do (
    if !first! EQU 1 (
        python karne_excel.py "%%f" "%excelname%"
        set first=0
    ) else (
        python karne_excel.py "%%f" "%excelname%"
    )
)

echo.
echo [BASARILI] Tum karneler %excelname% dosyasina eklendi!
echo.
pause
goto MENU

:INSTALL
cls
echo ================================================================
echo           KURULUM
echo ================================================================
echo.
echo Python kontrol ediliyor...
python --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Python bulunamadi!
    echo Lutfen Python 3.7+ yukleyin: https://www.python.org/downloads/
    echo.
    pause
    goto MENU
)

echo [OK] Python bulundu
echo.
echo Gerekli kutuphaneler kuruluyor...
echo.

pip install --break-system-packages PyMuPDF 2>nul
if %ERRORLEVEL% NEQ 0 pip install PyMuPDF

pip install --break-system-packages openpyxl 2>nul
if %ERRORLEVEL% NEQ 0 pip install openpyxl

pip install --break-system-packages python-docx 2>nul
if %ERRORLEVEL% NEQ 0 pip install python-docx

echo.
echo ================================================================
echo [TAMAMLANDI] Kurulum basarili!
echo ================================================================
echo.
pause
goto MENU

:EXIT
cls
echo.
echo Gule gule!
echo.
timeout /t 2 > nul
exit

:ERROR
echo.
echo [HATA] Bir sorun olustu!
echo.
pause
goto MENU