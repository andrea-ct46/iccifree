document.addEventListener('DOMContentLoaded', () => {
    // Seleziona gli elementi del form
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const errorMessageDiv = document.getElementById('errorMessage');
    const successMessageDiv = document.getElementById('successMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Funzioni di utilità per l'interfaccia
    const showMessage = (message, type = 'error') => {
        const div = type === 'error' ? errorMessageDiv : successMessageDiv;
        div.textContent = message;
        div.classList.add('show');
    };
    const hideMessage = () => {
        errorMessageDiv.classList.remove('show');
        successMessageDiv.classList.remove('show');
    };
    const showLoading = () => loadingOverlay.classList.add('show');
    const hideLoading = () => loadingOverlay.classList.remove('show');

    // Gestione del form di LOGIN
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
                // Dopo il login con email, mandiamo direttamente alla dashboard
                // perché il profilo dovrebbe essere già completo.
                window.location.href = '/dashboard.html';
            } catch (error) {
                showMessage(error.message || 'Email o password non corretti.');
            } finally {
                hideLoading();
            }
        });
    }

    // Gestione del form di SIGN UP
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
            // --- MODIFICA ARCHITETTURALE ---
            // Reindirizziamo SEMPRE al nostro gatekeeper 'callback.html'.
            redirectTo: window.location.origin + '/callback.html'
        }
    });
    if (error) {
        document.getElementById('errorMessage').textContent = `Errore con ${providerName}: ${error.message}`;
        document.getElementById('errorMessage').classList.add('show');
        if(loadingOverlay) loadingOverlay.classList.remove('show');
    }
}

// Funzioni specifiche per ogni provider
function signInWithGoogle() { signInWithProvider('google'); }
function signInWithDiscord() { signInWithProvider('discord'); }
function showForgotPassword() { alert("Funzionalità di recupero password in arrivo!"); }

// Controllo per utenti già loggati
(async function() {
    const user = await checkUser();
    if (user) {
        window.location.href = '/dashboard.html';
    }
})();

