// Questo script si attiva sulla pagina callback.html e gestisce il post-login.

async function handleLoginCallback() {
    // 1. Attende che Supabase processi la sessione dall'URL.
    // onAuthStateChange è perfetto qui perché si attiva non appena la sessione è pronta.
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
        // Ci interessa solo il primo evento 'SIGNED_IN' dopo il redirect.
        if (event === 'SIGNED_IN' && session) {
            // Annulla l'ascolto per non eseguire il codice più volte.
            subscription.unsubscribe();

            const user = session.user;

            try {
                // 2. Controlla il profilo dell'utente nel database.
                const { data: profile, error } = await supabaseClient
                    .from('profiles')
                    .select('username, date_of_birth')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

                // 3. Prende la decisione finale.
                if (!profile || !profile.username || !profile.date_of_birth) {
                    // Profilo incompleto -> vai al setup.
                    window.location.replace('/setup-profile.html');
                } else {
                    // Profilo completo -> vai alla dashboard.
                    window.location.replace('/dashboard.html');
                }
            } catch (error) {
                console.error("Errore critico durante il callback:", error);
                // In caso di errore, manda l'utente alla pagina di login per riprovare.
                window.location.replace('/auth.html');
            }
        }
    });
}

// Avvia il processo non appena la pagina è pronta.
document.addEventListener('DOMContentLoaded', handleLoginCallback);
