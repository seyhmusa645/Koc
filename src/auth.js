function openTab(evt, tabName) {
    let i, tabcontent, tablinks;

    // Tüm tab içeriklerini gizle
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }

    // Tüm tab linklerinden "active" classını kaldır
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    // Tıklanan tabın içeriğini göster ve linki aktif yap
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth window renderer process loaded.');

    // Gerekli tüm DOM elementlerini bir kerede al
    const requestCodeElement = document.getElementById('request-code');
    const copyRequestCodeButton = document.getElementById('copy-request-code');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const importLicenseButton = document.getElementById('import-license-key');
    const licenseStatusElement = document.getElementById('license-status');

    // --- Yardımcı Fonksiyonlar ---
    const updateLicenseStatus = (status) => {
        let statusText = 'Durum: ';
        switch (status) {
            case 'active': statusText += 'Aktif'; break;
            case 'expired': statusText += 'Süresi Dolmuş'; break;
            case 'invalid': statusText += 'Geçersiz Lisans'; break;
            case 'unlicensed':
            default: statusText += 'Lisanslanmamış'; break;
        }
        licenseStatusElement.textContent = statusText;
    };

    // --- Sayfa Yüklendiğinde Çalışacaklar ---

    // 1. Lisans durumunu al ve göster
    window.electronAPI.getLicenseStatus().then(license => {
        updateLicenseStatus(license.status);
    }).catch(err => {
        console.error('Lisans durumu alınamadı:', err);
        updateLicenseStatus('invalid');
    });

    // 2. Kurulum kodunu al ve göster
    window.electronAPI.getRequestCode().then(code => {
        requestCodeElement.textContent = code;
    }).catch(err => {
        requestCodeElement.textContent = 'Hata: Kod alınamadı.';
        console.error(err);
    });

    // --- Olay Dinleyicileri (Event Listeners) ---

    // 1. Lisans Aktarma Butonu
    importLicenseButton.addEventListener('click', () => {
        const licenseKey = document.getElementById('license-key-input').value;
        if (!licenseKey) {
            alert('Lütfen bir lisans anahtarı girin.');
            return;
        }
        window.electronAPI.importLicense(licenseKey).then(result => {
            if (result.success) {
                alert('Lisans başarıyla aktarıldı!');
                updateLicenseStatus(result.status);
            } else {
                alert(`Lisans aktarılamadı: ${result.error}`);
                updateLicenseStatus('invalid');
            }
        });
    });

    // 2. Kurulum Kodu Kopyalama Butonu
    copyRequestCodeButton.addEventListener('click', () => {
        // Kopyalama işleminden önce butona odaklanmayı dene
        copyRequestCodeButton.focus();
        navigator.clipboard.writeText(requestCodeElement.textContent).then(() => {
            alert('Kurulum kodu panoya kopyalandı!');
        }).catch(err => {
            console.error('Kopyalama başarısız oldu:', err);
            alert('Kopyalama başarısız oldu. Lütfen kodu manuel olarak kopyalayın.');
        });
    });

    // 3. Giriş Formu
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            alert('E-posta ve şifre alanları zorunludur.');
            return;
        }

        window.electronAPI.login({ email, password }).then(result => {
            if (result.success) {
                console.log('Giriş başarılı, ana pencere bekleniyor...');
            } else {
                alert(`Giriş başarısız: ${result.error}`);
            }
        }).catch(err => {
            alert(`Giriş sırasında bir hata oluştu: ${err.message}`);
            console.error(err);
        });
    });

    // 4. Kayıt Formu
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        const role = document.querySelector('input[name="role"]:checked')?.value;

        if (!email || !password || !passwordConfirm) {
            alert('Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        if (!role) {
            alert('Lütfen bir rol seçin (Müdür veya Öğretmen).');
            return;
        }

        if (password !== passwordConfirm) {
            alert('Şifreler eşleşmiyor. Lütfen kontrol edin.');
            return;
        }

        window.electronAPI.register({ name, email, password, role }).then(result => {
            if (result.success) {
                alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
                document.querySelector('.tab-link[onclick*="Login"]').click();
                document.getElementById('login-email').value = email;
                document.getElementById('login-password').focus();
            } else {
                alert(`Kayıt başarısız: ${result.error}`);
            }
        }).catch(err => {
            alert(`Kayıt sırasında bir hata oluştu: ${err.message}`);
            console.error(err);
        });
    });
});
