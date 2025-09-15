// Aggiungiamo un listener per assicurarci che l'HTML sia caricato prima di eseguire lo script
document.addEventListener('DOMContentLoaded', () => {

    // Selezioniamo tutti gli elementi importanti dalla pagina HTML
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const errorMessageDiv = document.getElementById('errorMessage');
    const successMessageDiv = document.getElementById('successMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');

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
    
    // --- GESTIONE DEGLI EVENTI ---

    // Gestione del form di LOGIN
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impedisce il ricaricamento della pagina
            hideMessage();
            showLoading();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const { error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) {
                    throw error; // Lancia l'errore per essere catturato dal blocco catch
                }

                // Se il login ha successo, reindirizza alla dashboard
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

            const username = document.getElementById('signupUsername').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            try {
                // Per prima cosa, registriamo l'utente con email e password
                const { data, error } = await supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        // Passiamo lo username come metadata, che il trigger SQL userà
                        data: {
                            username: username
                        }
                    }
                });
                
                if (error) {
                    // Se l'errore indica che l'username è già preso (dal trigger del DB), mostriamo un messaggio specifico
                    if (error.message.includes('duplicate key value violates unique constraint "profiles_username_key"')) {
                         throw new Error('Questo username è già stato preso. Scegline un altro.');
                    }
                    throw error;
                }

                // Se la registrazione ha successo, mostra un messaggio
                showMessage('Registrazione completata! Controlla la tua email per il link di conferma.', 'success');
                signupForm.reset(); // Svuota il form

            } catch (error) {
                showMessage(error.message || 'Si è verificato un errore durante la registrazione.');
            } finally {
                hideLoading();
            }
        });
    }
});


// --- FUNZIONI GLOBALI (devono stare fuori dal 'DOMContentLoaded' per essere accessibili da onclick) ---

// Funzione per cambiare tra tab Login e Sign Up
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

// Funzione generica per il Social Login
async function signInWithProvider(providerName) {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: providerName,
        options: {
            redirectTo: window.location.origin + '/dashboard.html'
        }
    });
    if (error) {
        const errorMessageDiv = document.getElementById('errorMessage');
        errorMessageDiv.textContent = `Errore con ${providerName}: ${error.message}`;
        errorMessageDiv.classList.add('show');
    }
}

// Funzioni specifiche per ogni provider
function signInWithGoogle() {
    signInWithProvider('google');
}

function signInWithDiscord() {
    signInWithProvider('discord');
}

function signInWithGitHub() {
    signInWithProvider('github');
}

function signInWithTikTok() {
    // Nota: TikTok potrebbe richiedere configurazioni aggiuntive
    signInWithProvider('tiktok');
}

function showForgotPassword() {
    alert("Funzionalità di recupero password in arrivo!");
}

// Controllo utente all'avvio della pagina
(async function() {
    const user = await checkUser();
    // Se l'utente è sulla pagina di auth ma è già loggato, lo mandiamo alla dashboard
    if (user && window.location.pathname.includes('auth.html')) {
        window.location.href = '/dashboard.html';
    }
})();


