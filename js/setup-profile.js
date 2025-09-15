document.addEventListener('DOMContentLoaded', async () => {
    // Controlla subito se l'utente è loggato
    const user = await checkUser();
    if (!user) {
        window.location.href = '/auth.html';
        return;
    }
    
    // Se ha già un profilo completo, vai alla dashboard
    const profileComplete = await hasCompletedProfile(user.id);
    if (profileComplete) {
        window.location.href = '/dashboard.html';
        return;
    }
    
    const setupProfileForm = document.getElementById('setupProfileForm');
    const errorMessageDiv = document.getElementById('errorMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');

    // Funzioni di utilità
    const showLoading = () => loadingOverlay.classList.add('show');
    const hideLoading = () => loadingOverlay.classList.remove('show');
    const showMessage = (message) => {
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.add('show');
        window.scrollTo(0, 0);
    };

    // Gestione anteprima avatar
    if (avatarInput) {
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
    }

    // Gestione invio form
    if (setupProfileForm) {
        setupProfileForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            showLoading();

            try {
                const currentUser = await checkUser();
                if (!currentUser) throw new Error("Utente non trovato. Effettua nuovamente il login.");

                let avatarUrl = null;
                const file = avatarInput.files[0];

                // Se c'è un file, caricalo
                if (file) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    const filePath = `${currentUser.id}/${fileName}`;

                    const { error: uploadError } = await supabaseClient.storage
                        .from('avatars')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data } = supabaseClient.storage
                        .from('avatars')
                        .getPublicUrl(filePath);
                    
                    if (data.publicUrl) {
                        avatarUrl = data.publicUrl;
                    }
                }

                // Prepara i dati da salvare
                const updates = {
                    id: currentUser.id,
                    username: document.getElementById('username').value,
                    bio: document.getElementById('bio').value,
                    updated_at: new Date().toISOString(),
                };

                // Aggiungi avatar_url solo se esiste
                if (avatarUrl) {
                    updates.avatar_url = avatarUrl;
                }

                // Aggiungi data di nascita se presente
                const dobElement = document.getElementById('dob');
                if (dobElement && dobElement.value) {
                    updates.date_of_birth = dobElement.value;
                }

                // Salva nella tabella 'profiles'
                const { error } = await supabaseClient
                    .from('profiles')
                    .upsert(updates);

                if (error) {
                    if (error.message.includes('duplicate key') || error.message.includes('unique')) {
                        throw new Error('Username già in uso. Scegline un altro.');
                    }
                    throw error;
                }
                
                // Reindirizza alla dashboard
                window.location.href = '/dashboard.html';

            } catch (error) {
                showMessage(error.message || 'Errore durante il salvataggio del profilo');
            } finally {
                hideLoading();
            }
        });
    }
});
