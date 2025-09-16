// Funzione principale che si avvia al caricamento della pagina
async function initializeProfilePage() {
    const messageContainer = document.getElementById('messageState');
    const messageText = document.getElementById('messageText');
    const profileContainer = document.getElementById('profileContainer');

    try {
        // 1. Legge lo username dall'URL (es. ?user=NOMEUTENTE)
        const params = new URLSearchParams(window.location.search);
        const username = params.get('user');

        // FIX 3: Gestione migliore quando manca il parametro user
        if (!username) {
            // Se non c'è username nell'URL, controlla se l'utente è loggato
            const currentUser = await checkUser();
            if (currentUser) {
                // Se è loggato, vai al suo profilo
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('username')
                    .eq('id', currentUser.id)
                    .single();
                
                if (profile && profile.username) {
                    // Redirect al proprio profilo
                    window.location.replace(`/profile.html?user=${profile.username}`);
                    return;
                }
            }
            
            // Se non è loggato o non ha un profilo, mostra messaggio di errore
            messageText.innerHTML = `
                <div style="text-align: center;">
                    <h2 style="color: #FFD700; margin-bottom: 20px;">Nessun profilo specificato</h2>
                    <p style="margin-bottom: 20px;">Per vedere un profilo, usa un link del tipo:<br>
                    <code style="background: #282828; padding: 5px; border-radius: 4px;">
                        /profile.html?user=username
                    </code></p>
                    <a href="/dashboard.html" style="color: #FFD700;">Torna alla Dashboard</a>
                </div>
            `;
            return;
        }

        // 2. Cerca il profilo nel database usando lo username
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !profile) {
            // FIX 3: Messaggio di errore più user-friendly
            messageText.innerHTML = `
                <div style="text-align: center;">
                    <h2 style="color: #ff4444; margin-bottom: 20px;">Utente non trovato</h2>
                    <p style="margin-bottom: 20px;">L'utente "<strong>${username}</strong>" non esiste o è stato eliminato.</p>
                    <a href="/dashboard.html" style="color: #FFD700;">Torna alla Dashboard</a>
                </div>
            `;
            return;
        }

        // 3. Popola la pagina con i dati trovati
        populateProfileData(profile);

        // 4. Controlla chi è l'utente loggato per mostrare i pulsanti giusti
        await setupActionButtons(profile);

        // 5. Mostra il contenuto e nascondi il caricamento
        profileContainer.style.display = 'block';
        messageContainer.style.display = 'none';

    } catch (error) {
        // In caso di errore generico, mostra un messaggio chiaro
        console.error("Errore nel caricamento del profilo:", error);
        messageText.innerHTML = `
            <div style="text-align: center;">
                <h2 style="color: #ff4444; margin-bottom: 20px;">Errore</h2>
                <p style="margin-bottom: 20px;">Si è verificato un errore nel caricamento del profilo.</p>
                <p style="color: #888; font-size: 14px; margin-bottom: 20px;">${error.message}</p>
                <a href="/dashboard.html" style="color: #FFD700;">Torna alla Dashboard</a>
            </div>
        `;
    }
}

// Funzione per inserire i dati del profilo nell'HTML
function populateProfileData(profile) {
    document.title = `${profile.username} - ICCI FREE`;
    document.getElementById('profileUsername').textContent = profile.username;
    document.getElementById('profileBio').textContent = profile.bio || 'Nessuna biografia impostata.';
    document.getElementById('followersCount').textContent = profile.followers_count || 0;
    document.getElementById('followingCount').textContent = profile.following_count || 0;
    
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        if (profile.avatar_url) {
            profileAvatar.src = profile.avatar_url;
        } else {
            // FIX 5: Avatar placeholder unico per ogni utente
            const initials = profile.username.substring(0, 2).toUpperCase();
            // Genera un colore basato sull'username per rendere unico ogni placeholder
            const colors = ['FF5733', '33FF57', '3357FF', 'FF33F5', 'F5FF33', '33FFF5'];
            const colorIndex = profile.username.charCodeAt(0) % colors.length;
            profileAvatar.src = `https://placehold.co/150x150/${colors[colorIndex]}/FFFFFF?text=${initials}`;
        }
    }
}

// Funzione per decidere se mostrare "Follow" o "Edit Profile"
async function setupActionButtons(profile) {
    const currentUser = await checkUser();
    const profileActionsDiv = document.getElementById('profileActions');
    const headerActionBtn = document.getElementById('headerActionBtn');

    if (currentUser) {
        if (currentUser.id === profile.id) {
            // L'utente sta guardando il suo stesso profilo
            profileActionsDiv.innerHTML = `
                <a href="/edit-profile.html" class="action-btn edit">
                    ✏️ Modifica Profilo
                </a>`;
            headerActionBtn.style.display = 'none';
        } else {
            // L'utente sta guardando il profilo di qualcun altro
            profileActionsDiv.innerHTML = `
                <button class="action-btn follow" onclick="followUser('${profile.id}')">
                    ➕ Segui
                </button>`;
            headerActionBtn.href = '/dashboard.html';
            headerActionBtn.textContent = '← Dashboard';
            headerActionBtn.style.display = 'block';
        }
    } else {
        // Se l'utente non è loggato
        profileActionsDiv.innerHTML = `
            <a href="/auth.html" class="action-btn follow">
                🔒 Accedi per seguire
            </a>`;
        headerActionBtn.href = '/auth.html';
        headerActionBtn.textContent = 'Accedi';
        headerActionBtn.style.display = 'block';
    }
}

// Funzione placeholder per il follow (da implementare)
async function followUser(userId) {
    alert('Sistema di following in arrivo presto!');
    // TODO: Implementare la logica di follow
}

// Avvia tutto al caricamento della pagina
document.addEventListener('DOMContentLoaded', initializeProfilePage);
