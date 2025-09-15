// Aggiungiamo un listener per assicurarci che l'HTML sia caricato prima di eseguire lo script
document.addEventListener('DOMContentLoaded', () => {

    // Selezioniamo tutti gli elementi importanti dalla pagina HTML
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const errorMessageDiv = document.getElementById('errorMessage');
    const successMessageDiv = document.getElementById('successMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const tabIndicator = document.getElementById('tabIndicator');
    const tabs = document.querySelectorAll('.tab');

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
            showMessage(error.message || 'Si è verificato un errore durante il login.');
        } finally {
            hideLoading();
        }
    });

    // Gestione del form di SIGN UP
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideMessage();
        showLoading();

        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        try {
            // Controlliamo prima se l'username è già stato preso
            const { data: existingUser, error: checkError } = await supabaseClient
                .from('profiles') // Assicurati di avere una tabella 'profiles'
                .select('username')
                .eq('username', username)
                .single();
            
            if (checkError && checkError.code !== 'PGRST116') { // Ignora l'errore "nessuna riga trovata"
                 throw checkError;
            }

            if (existingUser) {
                throw new Error('Questo username è già stato preso. Scegline un altro.');
            }

            // Se l'username è libero, procediamo con la registrazione
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    // Passiamo dati extra che verranno salvati nel profilo dell'utente
                    data: {
                        username: username,
                    }
                }
            });
            
            if (error) {
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

    // Controlla se l'utente è già loggato quando la pagina carica
    (async function() {
        const user = await checkUser();
        if (user) {
            // Se è loggato, non deve stare qui. Lo mandiamo alla dashboard.
            window.location.href = '/dashboard.html';
        }
    })();
});


// --- FUNZIONI GLOBALI (accessibili dall'HTML) ---

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

// Funzioni per il Social Login
async function signInWithProvider(providerName) {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: providerName,
    });
    if (error) {
        document.getElementById('errorMessage').textContent = `Errore con ${providerName}: ${error.message}`;
        document.getElementById('errorMessage').classList.add('show');
    }
}

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
    signInWithProvider('tiktok');
}

function showForgotPassword() {
    alert("Funzionalità di recupero password non ancora implementata.");
}
```

### **PASSO 3: Collega i file JavaScript ad `auth.html`**

Ora dobbiamo dire alla tua pagina `auth.html` di usare i due file JavaScript che abbiamo creato. Apri il file `auth.html` su GitHub e **aggiungi queste due righe** subito prima della chiusura del tag `</body>`:

```html
<!-- ... tutto il tuo codice HTML ... -->

        <!-- ... ... -->
    </div>

    <!-- I NOSTRI SCRIPT (IN QUEST'ORDINE!) -->
    <script src="js/supabase.js"></script>
    <script src="js/auth.js"></script>

</body>
</html>

