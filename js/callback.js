// Questo script si attiva sulla pagina callback.html e gestisce il post-login.

async function handleLoginCallback() {
    // onAuthStateChange è l'unico metodo affidabile perché si attiva
    // non appena Supabase ha finito di processare la sessione dall'URL.
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
        // Ci interessa solo il primo evento 'SIGNED_IN'.
        if (event === 'SIGNED_IN' && session) {
            // Annulla l'ascolto per non eseguire il codice più volte.
            subscription.unsubscribe();

            const user = session.user;

            try {
                // Controlla il profilo dell'utente nel database.
                const { data: profile, error } = await supabaseClient
                    .from('profiles')
                    .select('username, date_of_birth')
                    .eq('id', user.id)
                    .single();

                // Ignoriamo l'errore se il profilo non esiste ancora, è normale.
                if (error && error.code !== 'PGRST116') throw error;

                // Prende la decisione finale.
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

document.addEventListener('DOMContentLoaded', handleLoginCallback);

