// Questo file gestisce solo la homepage e pagine generiche, NON l'autenticazione
document.addEventListener('DOMContentLoaded', async () => {
    
    // Solo se siamo nella homepage (index.html)
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        
        // Controlla se l'utente è loggato
        const user = await checkUser();
        
        // Aggiorna i bottoni in base allo stato di login
        const navLoginBtn = document.getElementById('navLoginBtn');
        const heroCtaBtn = document.getElementById('heroCtaBtn');
        
        if (user) {
            // Utente loggato
            if (navLoginBtn) {
                navLoginBtn.textContent = 'Dashboard';
                navLoginBtn.href = '/dashboard.html';
            }
            if (heroCtaBtn) {
                heroCtaBtn.textContent = 'Vai alla Dashboard';
                heroCtaBtn.href = '/dashboard.html';
            }
        } else {
            // Utente non loggato
            if (navLoginBtn) {
                navLoginBtn.textContent = 'Login';
                navLoginBtn.href = '/auth.html';
            }
            if (heroCtaBtn) {
                heroCtaBtn.textContent = 'Inizia a Streammare';
                heroCtaBtn.href = '/auth.html';
            }
        }
        
        // Animazione contatore per gli stats (opzionale)
        let liveCount = 0;
        const liveCounter = document.querySelector('.stats .number');
        
        if (liveCounter) {
            setInterval(() => {
                liveCount = Math.floor(Math.random() * 10);
                liveCounter.textContent = liveCount;
            }, 3000);
        }
    }
});

// Non mettere nulla che riguarda login/signup qui!
// Tutto quello che riguarda l'autenticazione va in auth.js
