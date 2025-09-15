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
        window.scrollTo(0, 0);
    };

    // Gestione anteprima avatar
    avatarInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => { avatarPreview.src = e.target.result; };
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

                if (file) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    const filePath = `${user.id}/${fileName}`;

                    const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, file);
                    if (uploadError) throw uploadError;

                    const { data } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
                    if (!data.publicUrl) throw new Error("Impossibile ottenere l'URL pubblico dell'avatar.");
                    avatarUrl = data.publicUrl;
                }

                const updates = {
                    id: user.id,
                    username: document.getElementById('username').value,
                    date_of_birth: document.getElementById('dob').value,
                    bio: document.getElementById('bio').value,
                    updated_at: new Date(),
                    ...(avatarUrl && { avatar_url: avatarUrl }),
                };

                // Riportato allo standard 'profiles'
                const { error } = await supabaseClient.from('profiles').upsert(updates); // <<<--- CORRETTO E STANDARDIZZATO

                if (error) {
                     if (error.message.includes('duplicate key')) {
                        throw new Error('Username già in uso. Scegline un altro.');
                    }
                    throw error;
                }
                
                window.location.href = '/dashboard.html';

            } catch (error) {
                showMessage(error.message);
            } finally {
                hideLoading();
            }
        });
    }
});

