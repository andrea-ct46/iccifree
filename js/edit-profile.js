// Edit Profile Logic
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('editProfileForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const infoMessage = document.getElementById('infoMessage');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const avatarInput = document.getElementById('avatarInput');
    const currentAvatar = document.getElementById('currentAvatar');
    const bioInput = document.getElementById('bio');
    const charCount = document.getElementById('charCount');
    
    let currentUser = null;
    let currentProfile = null;
    let avatarFile = null;
    
    // Helper functions
    const showMessage = (message, type = 'error') => {
        const elem = type === 'error' ? errorMessage : successMessage;
        elem.textContent = message;
        elem.classList.add('show');
        setTimeout(() => elem.classList.remove('show'), 5000);
    };
    
    const showLoading = () => loadingOverlay.classList.add('show');
    const hideLoading = () => loadingOverlay.classList.remove('show');
    
    // Load current user profile
    async function loadProfile() {
        infoMessage.classList.add('show');
        
        try {
            currentUser = await checkUser();
            if (!currentUser) {
                window.location.href = '/auth.html';
                return;
            }
            
            // Get profile data
            const { data: profile, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();
            
            if (error) throw error;
            
            currentProfile = profile;
            
            // Populate form with current data
            document.getElementById('username').value = profile.username || '';
            document.getElementById('bio').value = profile.bio || '';
            document.getElementById('dob').value = profile.date_of_birth || '';
            
            if (profile.avatar_url) {
                currentAvatar.src = profile.avatar_url;
            } else {
                // Generate placeholder based on username
                const initials = profile.username ? 
                    profile.username.substring(0, 2).toUpperCase() : '??';
                currentAvatar.src = `https://placehold.co/120x120/FFD700/000000?text=${initials}`;
            }
            
            // Update char counter
            charCount.textContent = (profile.bio || '').length;
            
            infoMessage.classList.remove('show');
            
        } catch (error) {
            console.error('Error loading profile:', error);
            showMessage('Errore nel caricamento del profilo: ' + error.message);
            infoMessage.classList.remove('show');
        }
    }
    
    // Avatar upload handling
    avatarInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showMessage('Immagine troppo grande. Max 5MB.');
                event.target.value = '';
                return;
            }
            
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                showMessage('Formato non supportato. Usa JPG, PNG, GIF o WebP.');
                event.target.value = '';
                return;
            }
            
            avatarFile = file;
            
            // Preview
            const reader = new FileReader();
            reader.onload = (e) => {
                currentAvatar.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Bio character counter
    bioInput.addEventListener('input', () => {
        charCount.textContent = bioInput.value.length;
        if (bioInput.value.length > 140) {
            charCount.style.color = '#ff4444';
        } else {
            charCount.style.color = '#666';
        }
    });
    
    // Username validation
    let usernameCheckTimeout;
    document.getElementById('username').addEventListener('input', async (e) => {
        clearTimeout(usernameCheckTimeout);
        const value = e.target.value;
        
        // Reset style
        e.target.style.borderColor = '';
        
        if (value.length < 3) return;
        
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
            e.target.style.borderColor = '#ff4444';
            showMessage('Username non valido. Solo lettere, numeri e underscore (_).');
            return;
        }
        
        // Skip check if username hasn't changed
        if (value === currentProfile.username) {
            e.target.style.borderColor = '#00ff00';
            return;
        }
        
        // Check for duplicates
        usernameCheckTimeout = setTimeout(async () => {
            try {
                const { data, error } = await supabaseClient
                    .from('profiles')
                    .select('username')
                    .eq('username', value)
                    .neq('id', currentUser.id)
                    .single();
                
                if (data) {
                    e.target.style.borderColor = '#ff4444';
                    showMessage(`Username "${value}" già in uso.`);
                } else {
                    e.target.style.borderColor = '#00ff00';
                }
            } catch (err) {
                if (err.code === 'PGRST116') {
                    // Username available
                    e.target.style.borderColor = '#00ff00';
                }
            }
        }, 500);
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const bio = document.getElementById('bio').value;
        const dob = document.getElementById('dob').value;
        
        // Validate
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            showMessage('Username non valido.');
            return;
        }
        
        if (!dob) {
            showMessage('Data di nascita obbligatoria.');
            return;
        }
        
        showLoading();
        
        try {
            let avatarUrl = currentProfile.avatar_url;
            
            // Upload new avatar if selected
            if (avatarFile) {
                // Delete old avatar if exists
                if (currentProfile.avatar_url) {
                    const oldPath = currentProfile.avatar_url.split('/').pop();
                    await supabaseClient.storage
                        .from('avatars')
                        .remove([`${currentUser.id}/${oldPath}`]);
                }
                
                // Upload new avatar
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
                const filePath = `${currentUser.id}/${fileName}`;
                
                const { error: uploadError } = await supabaseClient.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, {
                        cacheControl: '3600',
                        upsert: false
                    });
                
                if (uploadError) throw uploadError;
                
                const { data } = supabaseClient.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                    
                avatarUrl = data.publicUrl;
            }
            
            // Update profile
            const updates = {
                id: currentUser.id,
                username: username,
                bio: bio || null,
                date_of_birth: dob,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString()
            };
            
            const { error } = await supabaseClient
                .from('profiles')
                .update(updates)
                .eq('id', currentUser.id);
            
            if (error) throw error;
            
            showMessage('Profilo aggiornato con successo!', 'success');
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = `/profile.html?user=${username}`;
            }, 2000);
            
        } catch (error) {
            console.error('Error updating profile:', error);
            showMessage('Errore: ' + error.message);
        } finally {
            hideLoading();
        }
    });
    
    // Initialize
    loadProfile();
});

// Delete profile function
async function deleteProfile() {
    if (!confirm('Sei sicuro di voler eliminare il tuo profilo? Questa azione è irreversibile!')) {
        return;
    }
    
    if (!confirm('ULTIMA CONFERMA: Vuoi davvero eliminare tutto?')) {
        return;
    }
    
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('show');
    
    try {
        const user = await checkUser();
        if (!user) return;
        
        // Delete profile
        await supabaseClient
            .from('profiles')
            .delete()
            .eq('id', user.id);
        
        // Sign out
        await supabaseClient.auth.signOut();
        
        alert('Profilo eliminato. Ci dispiace vederti andare via 😢');
        window.location.href = '/';
        
    } catch (error) {
        console.error('Error deleting profile:', error);
        alert('Errore durante l\'eliminazione: ' + error.message);
        loadingOverlay.classList.remove('show');
    }
}
