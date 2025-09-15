document.addEventListener('DOMContentLoaded', () => {
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
        window.scrollTo(0, 0); // Torna in cima per vedere l'errore
    };

    // Gestione anteprima avatar
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

    // Gestione invio form
    if (setupProfileForm) {
        setupProfileForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            showLoading();

            try {
                const user = await checkUser();
                if (!user) throw new Error("Utente non trovato. Effettua nuovamente il login.");

                let avatarUrl = null;
                const file = avatarInput.files[0];

                // 1. Se c'è un file, caricalo
                if (file) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    const filePath = `${user.id}/${fileName}`; // Es: 'uuid-xyz/166...jpg'

                    const { error: uploadError } = await supabaseClient.storage
                        .from('avatars')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    // 2. Ottieni l'URL pubblico del file caricato
                    const { data } = supabaseClient.storage
                        .from('avatars')
                        .getPublicUrl(filePath);
                    
                    if (!data.publicUrl) throw new Error("Impossibile ottenere l'URL pubblico dell'avatar.");
                    
                    avatarUrl = data.publicUrl;
                }

                // 3. Prepara i dati da salvare
                const updates = {
                    id: user.id,
                    username: document.getElementById('username').value,
                    date_of_birth: document.getElementById('dob').value,
                    bio: document.getElementById('bio').value,
                    updated_at: new Date(),
                    // Includi l'avatarUrl solo se è stato caricato
                    ...(avatarUrl && { avatar_url: avatarUrl }), 
                };

                // 4. Salva tutto nella tabella 'profiles'
                const { error } = await supabaseClient.from('profiles').upsert(updates);

                if (error) {
                     if (error.message.includes('duplicate key')) {
                        throw new Error('Username già in uso. Scegline un altro.');
                    }
                    throw error;
                }
                
                // 5. Reindirizza alla dashboard
                window.location.href = '/dashboard.html';

            } catch (error) {
                showMessage(error.message);
            } finally {
                hideLoading();
            }
        });
    }
});

