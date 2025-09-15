document.addEventListener('DOMContentLoaded', () => {
    // ... (tutto il codice precedente rimane invariato)
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const errorMessageDiv = document.getElementById('errorMessage');
    const successMessageDiv = document.getElementById('successMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // ... (funzioni di utilità come showMessage, showLoading, etc. rimangono invariate)
    // --- FUNZIONI DI UTILITÀ PER L'INTERFACCIA ---

    // Mostra un messaggio (errore o successo)
    function showMessage(message, type = 'error') {
        hideMessage(); // Nasconde eventuali messaggi precedenti
        const div = type === 'error' ? errorMessageDiv : successMessageDiv;
        div.textContent = message;
        div.classList.add('show');
    }

    // Nasconde tutti i messaggi
    function hideMessage() {
        errorMessageDiv.classList.remove('show');
        successMessageDiv.classList.remove('show');
    }

    // Mostra l'indicatore di caricamento
    function showLoading() {
        loadingOverlay.classList.add('show');
    }

    // Nasconde l'indicatore di caricamento
    function hideLoading() {
        loadingOverlay.classList.remove('show');
    }

    // Gestione del form di LOGIN (invariato)
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage();
            showLoading();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            try {
                const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) throw error;
                window.location.href = '/dashboard.html';
            } catch (error) {
                showMessage(error.message || 'Email o password non corretti.');
            } finally {
                hideLoading();
            }
        });
    }

    // Gestione del form di SIGN UP (invariato)
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage();
            showLoading();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            try {
                const { data, error } = await supabaseClient.auth.signUp({ email, password });
                if (error) throw error;
                showMessage('Registrazione completata! Controlla la tua email per il link di conferma.', 'success');
                signupForm.reset();
            } catch (error) {
                showMessage(error.message || 'Si è verificato un errore durante la registrazione.');
            } finally {
                hideLoading();
            }
        });
    }
});

// --- FUNZIONI GLOBALI ---

function switchTab(tabName) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabIndicator = document.getElementById('tabIndicator');
    const tabs = document.querySelectorAll('.tab');
    
    document.getElementById('errorMessage').classList.remove('show');
    document.getElementById('successMessage').classList.remove('show');

    if (tabName === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        tabIndicator.classList.remove('signup');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        tabIndicator.classList.add('signup');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

async function signInWithProvider(providerName) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if(loadingOverlay) loadingOverlay.classList.add('show');

    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: providerName,
        options: {
            // MODIFICA CRUCIALE:
            // Ora reindirizziamo SEMPRE alla dashboard dopo il login social.
            // La dashboard gestirà poi il reindirizzamento a 'setup-profile' se necessario.
            redirectTo: window.location.origin + '/dashboard.html'
        }
    });
    if (error) {
        const errorMessageDiv = document.getElementById('errorMessage');
        errorMessageDiv.textContent = `Errore con ${providerName}: ${error.message}`;
        errorMessageDiv.classList.add('show');
        if(loadingOverlay) loadingOverlay.classList.remove('show');
    }
}

// Funzioni specifiche per ogni provider
function signInWithGoogle() { signInWithProvider('google'); }
function signInWithDiscord() { signInWithProvider('discord'); }
function signInWithGitHub() { signInWithProvider('github'); }
function signInWithTikTok() { signInWithProvider('tiktok'); }
function showForgotPassword() { alert("Funzionalità di recupero password in arrivo!"); }

// Controllo utente all'avvio della pagina
(async function() {
    const user = await checkUser();
    if (user && window.location.pathname.includes('auth.html')) {
        window.location.href = '/dashboard.html';
    }
})();

