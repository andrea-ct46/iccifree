// CONFIGURAZIONE SUPABASE
// IMPORTANTE: Sostituisci con le TUE chiavi da supabase.com

const SUPABASE_URL = 'https://xxxxx.supabase.co'; // CAMBIA!
const SUPABASE_ANON_KEY = 'eyJ...'; // CAMBIA!

// Inizializza Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Controlla se utente è loggato
async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

// Logout
async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = '/';
}
