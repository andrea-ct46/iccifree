document.addEventListener('DOMContentLoaded', () => {
    const setupProfileForm = document.getElementById('setupProfileForm');
    const errorMessageDiv = document.getElementById('errorMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');

    // Funzioni di utilità per l'interfaccia
    const showLoading = () => loadingOverlay.classList.add('show');
    const hideLoading = () => loadingOverlay.classList.remove('show');
    const showMessage = (message) => {
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.add('show');
        window.scrollTo(0, 0); // Torna in cima alla pagina per far vedere l'errore
    };

    // Gestisce l'anteprima dell'avatar quando un file viene selezionato
    avatarInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Gestisce l'invio del form quando l'utente clicca "Salva"
    if (setupProfileForm) {
        setupProfileForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impedisce alla pagina di ricaricarsi
            showLoading();

            try {
                // Controlla chi è l'utente loggato
                const user = await checkUser();
                if (!user) throw new Error("Utente non trovato. Effettua nuovamente il login.");

                let avatarUrl = null;
                const file = avatarInput.files[0];

                // 1. Se l'utente ha caricato una foto, la salviamo
                if (file) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    const filePath = `${user.id}/${fileName}`; // Percorso unico: es. 'uuid-xyz/16..._avatar.png'

                    // Carica il file nello storage 'avatars'
                    const { error: uploadError } = await supabaseClient.storage
                        .from('avatars')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    // 2. Otteniamo l'URL pubblico dell'immagine appena caricata
                    const { data } = supabaseClient.storage
                        .from('avatars')
                        .getPublicUrl(filePath);
                    
                    if (!data.publicUrl) throw new Error("Impossibile ottenere l'URL pubblico dell'avatar.");
                    
                    avatarUrl = data.publicUrl;
                }

                // 3. Prepariamo tutti i dati da salvare nel database
                const updates = {
                    id: user.id,
                    username: document.getElementById('username').value,
                    date_of_birth: document.getElementById('dob').value,
                    bio: document.getElementById('bio').value,
                    updated_at: new Date(),
                    // Includiamo l'URL dell'avatar solo se ne abbiamo caricato uno
                    ...(avatarUrl && { avatar_url: avatarUrl }), 
                };

                // 4. Usiamo 'upsert' per salvare i dati. 'upsert' crea la riga se non esiste o la aggiorna se esiste già.
                const { error } = await supabaseClient.from('profiles').upsert(updates);

                if (error) {
                     // Gestisce l'errore se lo username è già stato preso
                     if (error.message.includes('duplicate key')) {
                        throw new Error('Username già in uso. Scegline un altro.');
                    }
                    throw error;
                }
                
                // 5. Se tutto è andato a buon fine, reindirizziamo alla dashboard
                window.location.href = '/dashboard.html';

            } catch (error) {
                showMessage(error.message);
            } finally {
                hideLoading();
            }
        });
    }
});

