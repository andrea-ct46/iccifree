document.addEventListener('DOMContentLoaded', () => {
    const setupProfileForm = document.getElementById('setupProfileForm');
    const errorMessageDiv = document.getElementById('errorMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');

    const showLoading = () => loadingOverlay.classList.add('show');
    const hideLoading = () => loadingOverlay.classList.remove('show');
    const showMessage = (message) => {
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.add('show');
        window.scrollTo(0, 0);
    };

    avatarInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => { avatarPreview.src = e.target.result; };
            reader.readAsDataURL(file);
        }
    });

    if (setupProfileForm) {
        setupProfileForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const usernameInput = document.getElementById('username');
            const newUsername = usernameInput.value;
            const dobInput = document.getElementById('dob');

            if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername)) {
                showMessage("L'username non è valido. Deve contenere solo lettere, numeri e underscore (_), e essere lungo tra 3 e 20 caratteri.");
                return;
            }
            if (!dobInput.value) {
                showMessage("La data di nascita è obbligatoria.");
                return;
            }
            
            showLoading();

            try {
                const user = await checkUser();
                if (!user) throw new Error("Utente non trovato. Effettua nuovamente il login.");

                let avatarUrl = null;
                const file = avatarInput.files[0];

                if (file) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    const filePath = `${user.id}/${fileName}`;
                    const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, file);
                    if (uploadError) throw uploadError;
                    const { data } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
                    avatarUrl = data.publicUrl;
                }

                const updates = {
                    id: user.id,
                    username: newUsername,
                    date_of_birth: dobInput.value,
                    bio: document.getElementById('bio').value,
                    updated_at: new Date(),
                    ...(avatarUrl && { avatar_url: avatarUrl }),
                };

                const { error } = await supabaseClient.from('profiles').upsert(updates);
                if (error) throw error;
                
                // --- MODIFICA CRUCIALE PER RISOLVERE IL BUG DEL REFRESH ---
                // Aggiungiamo un piccolo ritardo prima di reindirizzare.
                // Questo dà a Supabase il tempo di processare l'aggiornamento prima
                // che la dashboard faccia il suo controllo.
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 500); // 500 millisecondi (mezzo secondo)

            } catch (error) {
                console.error("Errore durante il salvataggio del profilo:", error);
                showMessage(`Errore: ${error.message}`);
                hideLoading(); // Nasconde il caricamento in caso di errore
            }
            // Non nascondiamo il caricamento qui, così l'utente lo vede fino al redirect.
        });
    }
});

