document.addEventListener('DOMContentLoaded', () => {
    // Selezioniamo tutti gli elementi importanti dalla pagina HTML
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const errorMessageDiv = document.getElementById('errorMessage');
    const successMessageDiv = document.getElementById('successMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // --- FUNZIONI DI UTILITÀ PER L'INTERFACCIA ---
    function showMessage(message, type = 'error') {
        hideMessage();
        const div = type === 'error' ? errorMessageDiv : successMessageDiv;
        div.textContent = message;
        div.classList.add('show');
    }

    function hideMessage() {
        errorMessageDiv.classList.remove('show');
        successMessageDiv.classList.remove('show');
    }

    function showLoading() {
        loadingOverlay.classList.add('show');
    }

    function hideLoading() {
        loadingOverlay.classList.remove('show');
    }

    // Gestione del form di LOGIN
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage();
            showLoading();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({ 
                    email, 
                    password 
                });
                
                if (error) throw error;
                
                // Controlla se il profilo è completo
                const user = data.user;
                const profileComplete = await hasCompletedProfile(user.id);
                
                if (!profileComplete) {
                    window.location.href = '/setup-profile.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
                
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
                const { data, error } = await supabaseClient.auth.signUp({ 
                    email, 
                    password 
                });
                
                if (error) throw error;
                
                showMessage('Registrazione completata! Ti stiamo reindirizzando...', 'success');
                
                // Aspetta 2 secondi poi vai al setup profilo
                setTimeout(async () => {
                    // Prova a fare il login automatico
                    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
                        email,
                        password
                    });
                    
                    if (!loginError) {
                        window.location.href = '/setup-profile.html';
                    } else {
                        window.location.href = '/auth.html';
                    }
                }, 2000);
                
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
            redirectTo: window.location.origin + '/setup-profile.html'
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
        const profileComplete = await hasCompletedProfile(user.id);
        if (!profileComplete) {
            window.location.href = '/setup-profile.html';
        } else {
            window.location.href = '/dashboard.html';
        }
    }
})();
