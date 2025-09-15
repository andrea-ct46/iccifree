document.addEventListener('DOMContentLoaded', () => {
    const setupProfileForm = document.getElementById('setupProfileForm');
    const errorMessageDiv = document.getElementById('errorMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const usernameInput = document.getElementById('username');

    const showLoading = () => loadingOverlay.classList.add('show');
    const hideLoading = () => loadingOverlay.classList.remove('show');
    const showMessage = (message) => {
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.add('show');
        window.scrollTo(0, 0);
    };
    const hideMessage = () => {
        errorMessageDiv.classList.remove('show');
    };

    // FIX 4: Validazione username in tempo reale
    let usernameCheckTimeout;
    if (usernameInput) {
        usernameInput.addEventListener('input', async (e) => {
            clearTimeout(usernameCheckTimeout);
            const value = e.target.value;
            
            // Reset dello stato
            usernameInput.style.borderColor = '';
            hideMessage();
            
            // Validazione del formato
            if (value.length < 3) {
                return; // Troppo corto, non controllare ancora
            }
            
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
                usernameInput.style.borderColor = '#ff4444';
                showMessage("Username non valido. Solo lettere, numeri e underscore (_), 3-20 caratteri.");
                return;
            }
            
            // Controlla duplicati dopo 500ms di inattività
            usernameCheckTimeout = setTimeout(async () => {
                try {
                    const { data, error } = await supabaseClient
                        .from('profiles')
                        .select('username')
                        .eq('username', value)
                        .single();
                    
                    if (data) {
                        usernameInput.style.borderColor = '#ff4444';
                        showMessage(`Username "${value}" già in uso. Scegline un altro.`);
                    } else {
                        usernameInput.style.borderColor = '#00ff00';
                        hideMessage();
                    }
                } catch (err) {
                    // Se non trova nessun username (errore PGRST116), è disponibile
                    if (err.code === 'PGRST116') {
                        usernameInput.style.borderColor = '#00ff00';
                        hideMessage();
                    }
                }
            }, 500);
        });
    }

    // Gestione preview avatar
    avatarInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // FIX: Validazione dimensione file (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showMessage("L'immagine è troppo grande. Max 5MB.");
                event.target.value = '';
                return;
            }
            
            // FIX: Validazione tipo file
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                showMessage("Formato non supportato. Usa JPG, PNG, GIF o WebP.");
                event.target.value = '';
                return;
            }
            
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
            const newUsername = usernameInput.value;
            const dobInput = document.getElementById('dob');

            // Validazioni finali
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername)) {
                showMessage("L'username non è valido. Deve contenere solo lettere, numeri e underscore (_), e essere lungo tra 3 e 20 caratteri.");
                return;
            }
            
            if (!dobInput.value) {
                showMessage("La data di nascita è obbligatoria.");
                return;
            }
            
            // FIX: Validazione età minima (13 anni)
            const birthDate = new Date(dobInput.value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const dayDiff = today.getDate() - birthDate.getDate();
            const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
            
            if (actualAge < 13) {
                showMessage("Devi avere almeno 13 anni per utilizzare ICCI FREE.");
                return;
            }
            
            showLoading();

            try {
                const user = await checkUser();
                if (!user) throw new Error("Utente non trovato. Effettua nuovamente il login.");

                // FIX 4: Controlla ancora una volta che l'username sia disponibile
                const { data: existingUser } = await supabaseClient
                    .from('profiles')
                    .select('username')
                    .eq('username', newUsername)
                    .neq('id', user.id) // Escludi l'utente corrente (nel caso stia modificando)
                    .single();
                
                if (existingUser) {
                    hideLoading();
                    showMessage(`Username "${newUsername}" già in uso. Scegline un altro.`);
                    return;
                }

                // Gestione upload avatar
                let avatarUrl = null;
                const file = avatarInput.files[0];

                if (file) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                    const filePath = `${user.id}/${fileName}`;
                    
                    const { error: uploadError } = await supabaseClient.storage
                        .from('avatars')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: false
                        });
                        
                    if (uploadError) throw uploadError;
                    
                    const { data } = supabaseClient.storage
                        .from('avatars')
                        .getPublicUrl(filePath);
                    avatarUrl = data.publicUrl;
                }

                // Prepara i dati del profilo
                const updates = {
                    id: user.id,
                    username: newUsername,
                    date_of_birth: dobInput.value,
                    bio: document.getElementById('bio').value || null,
                    updated_at: new Date().toISOString(),
                    ...(avatarUrl && { avatar_url: avatarUrl }),
                };

                // Salva i dati del profilo
                const { error } = await supabaseClient
                    .from('profiles')
                    .upsert(updates);
                    
                if (error) throw error;
                
                // Aggiorna la sessione per assicurarsi che i dati siano freschi
                await supabaseClient.auth.refreshSession();
                
                // Redirect alla dashboard
                window.location.href = '/dashboard.html';

            } catch (error) {
                console.error("Errore durante il salvataggio del profilo:", error);
                showMessage(`Errore: ${error.message}`);
                hideLoading();
            }
        });
    }
    
    // FIX: Se l'utente è già loggato e ha un profilo completo, vai alla dashboard
    (async function checkExistingProfile() {
        try {
            const user = await checkUser();
            if (user) {
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('username, date_of_birth')
                    .eq('id', user.id)
                    .single();
                
                if (profile && profile.username && profile.date_of_birth) {
                    // Profilo già completo, vai alla dashboard
                    window.location.href = '/dashboard.html';
                }
            }
        } catch (error) {
            console.error("Errore controllo profilo esistente:", error);
        }
    })();
});