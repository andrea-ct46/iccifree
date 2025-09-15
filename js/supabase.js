// CONFIGURAZIONE SUPABASE
// IMPORTANTE: Sostituisci con le TUE chiavi da supabase.com

const SUPABASE_URL = 'https://itfndtgrfjvnavbitfgy.supabase.co
'; // CAMBIA!
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0Zm5kdGdyZmp2bmF2Yml0Zmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4ODc3MjIsImV4cCI6MjA3MzQ2MzcyMn0.73_f6oR5cQWL2Y69EMZ-FciDXkle_85okZ9pOOgmXu4'; // CAMBIA!

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
