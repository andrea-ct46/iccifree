// =================================================================================
// ICCI FREE - FILE DI CONFIGURAZIONE SUPABASE
// Questo è il cuore della connessione tra il tuo sito e il backend.
// =================================================================================

// --- CHIAVI API DEL PROGETTO ---
const SUPABASE_URL = 'https://itfndtgrfjvnavbitfgy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0Zm5kdGdyZmp2bmF2Yml0Zmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4ODc3MjIsImV4cCI6MjA3MzQ2MzcyMn0.73_f6oR5cQWL2Y69EMZ-FciDXkle_85okZ9pOOgmXu4';

// --- Inizializzazione del Client ---
// Usiamo le chiavi fornite per creare l'oggetto 'supabaseClient',
// che useremo in tutti gli altri file per interagire con il database e l'autenticazione.
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// =================================================================================
// FUNZIONI GLOBALI DI AUTENTICAZIONE
// Queste funzioni possono essere richiamate da qualsiasi pagina del sito.
// =================================================================================

/**
 * Controlla in modo sicuro se c'è un utente attualmente loggato.
 * È la funzione base per proteggere le pagine e personalizzare l'interfaccia.
 * @returns {Promise<object|null>} Ritorna l'oggetto utente se loggato, altrimenti null.
 */
async function checkUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) {
            console.error("Errore nel recuperare l'utente:", error.message);
            return null;
        }
        return user;
    } catch (e) {
        console.error("Eccezione in checkUser:", e.message);
        return null;
    }
}

/**
 * Controlla se un utente ha completato il suo profilo (verificando l'esistenza di uno username).
 * @param {string} userId L'ID dell'utente da controllare.
 * @returns {Promise<boolean>} Ritorna true se il profilo è completo, altrimenti false.
 */
async function hasCompletedProfile(userId) {
    if (!userId) return false;
    try {
        const { data, error } = await supabaseClient
            .from('profiles') // Assicurati che il nome della tabella sia 'profiles' e non 'profili'
            .select('username')
            .eq('id', userId)
            .single();
        
        // Ignoriamo l'errore "nessuna riga trovata", perché è un caso valido (profilo non ancora creato)
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        // Il profilo è considerato completo se esiste un record e ha uno username.
        return data && data.username && data.username.length > 0;
    } catch (error) {
        console.error("Errore nel controllare il profilo:", error.message);
        return false;
    }
}

/**
 * Esegue il logout dell'utente corrente e lo reindirizza alla pagina principale.
 * Questa versione non usa 'confirm' per essere più affidabile e professionale.
 */
async function logout() {
    try {
        console.log("Logout in corso...");
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            // Se c'è un errore durante il logout, lo mostriamo in console ma proviamo comunque a reindirizzare.
            console.error("Errore durante il signOut di Supabase:", error.message);
        }
        // Reindirizza sempre alla pagina principale dopo il tentativo di logout.
        window.location.href = '/';
    } catch (e) {
        console.error("Eccezione in logout:", e.message);
        // Anche in caso di eccezione, prova a reindirizzare.
        window.location.href = '/';
    }
}

