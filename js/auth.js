// Gestione del form di SIGN UP
if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
        // ... codice esistente ...
        try {
            const { data, error } = await supabaseClient.auth.signUp({ email, password });
            if (error) throw error;
            
            // INVECE DI MOSTRARE SOLO IL MESSAGGIO, FACCIAMO IL LOGIN AUTOMATICO
            showMessage('Registrazione completata! Controlla la tua email per il link di conferma.', 'success');
            
            // AGGIUNGI QUESTO:
            // Aspetta 2 secondi poi vai al setup profilo
            setTimeout(() => {
                window.location.href = '/setup-profile.html';
            }, 2000);
            
        } catch (error) {
            // ...
        }
    });
}
