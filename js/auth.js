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
        if (div) {
            div.textContent = message;
            div.classList.add('show');
        }
    }

    function hideMessage() {
        if (errorMessageDiv) errorMessageDiv.classList.remove('show');
        if (successMessageDiv) successMessageDiv.classList.remove('show');
    }

    function showLoading() {
        if (loadingOverlay) loadingOverlay.classList.add('show');
    }

    function hideLoading() {
        if (loadingOverlay) loadingOverlay.classList.remove('show');
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
                // Fai il login
                const { data, error } = await supabaseClient.auth.signInWithPassword({ 
                    email, 
                    password 
                });
                
                if (error) throw error;
                
                // Login riuscito!
                console.log('Login riuscito per:', data.user.email);
                
                // Controlla se il profilo esiste
                const { data: profile, error: profileError } = await supabaseClient
                    .from('profiles')
                    .select('username')
                    .eq('id', data.user.id)
                    .single();
                
                console.log('Profilo trovato:', profile);
                
                // Se non c'è profilo O non ha username, vai al setup
                if (!profile || !profile.username) {
                    console.log('Profilo incompleto, redirect a setup-profile.html');
                    window.location.href = '/setup-profile.html';
                } else {
                    console.log('Profilo completo, redirect a dashboard.html');
                    window.location.href = '/dashboard.html';
                }
                
            } catch (error) {
                console.error('Errore login:', error);
                showMessage(error.message || 'Email o password non corretti.');
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
                // Registra l'utente
                const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({ 
                    email, 
                    password
                });
                
                if (signUpError) throw signUpError;
                
                console.log('Registrazione completata:', signUpData);
                
                // Mostra messaggio di successo
                showMessage('Account creato! Effettua il login...', 'success');
                
                // Dopo 2 secondi, fai il login automatico
                setTimeout(async () => {
                    try {
                        const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
                            email: email,
                            password: password
                        });
                        
                        if (!loginError && loginData.user) {
                            console.log('Login automatico riuscito, redirect a setup-profile');
                            window.location.href = '/setup-profile.html';
                        } else {
                            // Se fallisce, passa al tab login
                            switchTab('login');
                            showMessage('Registrazione completata! Ora effettua il login.', 'success');
                            hideLoading();
                        }
                    } catch (e) {
                        console.error('Errore login automatico:', e);
                        switchTab('login');
                        hideLoading();
                    }
                }, 1500);
                
            } catch (error) {
                console.error('Errore registrazione:', error);
                showMessage(error.message || 'Errore durante la registrazione.');
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

    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: providerName,
            options: {
                redirectTo: window.location.origin + '/setup-profile.html'
            }
        });
        
        if (error) {
            console.error('Errore OAuth:', error);
            const errorMessageDiv = document.getElementById('errorMessage');
            if (errorMessageDiv) {
                errorMessageDiv.textContent = `Errore con ${providerName}: ${error.message}`;
                errorMessageDiv.classList.add('show');
            }
            if(loadingOverlay) loadingOverlay.classList.remove('show');
        }
    } catch (e) {
        console.error('Errore provider:', e);
        if(loadingOverlay) loadingOverlay.classList.remove('show');
    }
}

// Funzioni specifiche per ogni provider
function signInWithGoogle() { signInWithProvider('google'); }
function signInWithDiscord() { signInWithProvider('discord'); }
function signInWithGitHub() { signInWithProvider('github'); }
function signInWithTikTok() { signInWithProvider('tiktok'); }
function showForgotPassword() { alert("Funzionalità di recupero password in arrivo!"); }

// Controllo iniziale quando la pagina si carica
(async function() {
    // Solo se siamo nella pagina auth.html
    if (window.location.pathname.includes('auth.html')) {
        const user = await checkUser();
        if (user) {
            console.log('Utente già loggato:', user.email);
            
            // Controlla se ha il profilo completo
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();
            
            if (!profile || !profile.username) {
                console.log('Redirect a setup-profile (da check iniziale)');
                window.location.href = '/setup-profile.html';
            } else {
                console.log('Redirect a dashboard (da check iniziale)');
                window.location.href = '/dashboard.html';
            }
        }
    }
})();
