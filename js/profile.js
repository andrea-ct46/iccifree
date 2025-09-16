// =================================================================================
// ICCI FREE - LOGICA DELLA PAGINA PROFILO
// Carica i dati dell'utente e gestisce l'interattività.
// =================================================================================

// Funzione principale che si avvia al caricamento della pagina
async function initializeProfilePage() {
    const messageContainer = document.getElementById('messageState');
    const messageText = document.getElementById('messageText');
    const profileContainer = document.getElementById('profileContainer');

    try {
        // 1. Legge lo username dall'URL (es. ?user=NOMEUTENTE)
        const params = new URLSearchParams(window.location.search);
        const username = params.get('user');

        if (!username) {
            throw new Error("Nessun utente specificato nell'URL.");
        }

        // 2. Cerca il profilo nel database usando lo username
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*') // Prende tutti i dati del profilo
            .eq('username', username)
            .single(); // .single() si aspetta un solo risultato

        if (error || !profile) {
            throw new Error(`Utente "${username}" non trovato.`);
        }

        // 3. Popola la pagina con i dati trovati
        populateProfileData(profile);

        // 4. Controlla chi è l'utente loggato per mostrare i pulsanti giusti
        const currentUser = await checkUser();
        await setupActionButtons(profile, currentUser);

        // 5. Mostra il contenuto e nascondi il caricamento
        profileContainer.style.display = 'block';
        messageContainer.style.display = 'none';

    } catch (error) {
        // In caso di errore, mostra un messaggio chiaro
        messageText.textContent = error.message;
        console.error("Errore nel caricamento del profilo:", error);
    }
}

// Funzione per inserire i dati del profilo nell'HTML
function populateProfileData(profile) {
    document.title = `${profile.username} - ICCI FREE`; // Aggiorna il titolo della pagina
    document.getElementById('profileUsername').textContent = profile.username;
    document.getElementById('profileBio').textContent = profile.bio || 'Questo utente non ha ancora una biografia.';
    document.getElementById('followersCount').textContent = profile.followers_count || 0;
    document.getElementById('followingCount').textContent = profile.following_count || 0;
    // Gestione avatar fallback
    document.getElementById('profileAvatar').src = profile.avatar_url || `https://placehold.co/150x150/181818/A0A0A0?text=${profile.username.charAt(0).toUpperCase()}`;
}

// Funzione per decidere se mostrare "Follow", "Unfollow" o "Edit Profile"
async function setupActionButtons(profile, currentUser) {
    const profileActionsDiv = document.getElementById('profileActions');
    if (!profileActionsDiv) return;

    // Se non c'è un utente loggato, non mostrare nessun pulsante
    if (!currentUser) {
        profileActionsDiv.innerHTML = '';
        return;
    }

    // Se l'utente sta guardando il suo stesso profilo
    if (currentUser.id === profile.id) {
        profileActionsDiv.innerHTML = `<a href="/setup-profile.html" class="action-btn edit">Modifica Profilo</a>`;
    } else {
        // Se l'utente sta guardando il profilo di qualcun altro
        const isFollowing = await checkIfFollowing(currentUser.id, profile.id);
        
        // Creiamo il pulsante
        const followButton = document.createElement('button');
        followButton.classList.add('action-btn', 'follow');
        updateFollowButton(followButton, isFollowing);

        // Aggiungiamo la logica al click
        followButton.addEventListener('click', async () => {
            await toggleFollow(followButton, currentUser.id, profile.id);
        });

        profileActionsDiv.innerHTML = ''; // Pulisce l'area
        profileActionsDiv.appendChild(followButton);
    }
}

// Funzione per gestire il click del pulsante follow/unfollow
async function toggleFollow(button, followerId, followingId) {
    button.disabled = true; // Previene doppi click
    const isCurrentlyFollowing = button.textContent.includes('Smetti');

    let success;
    if (isCurrentlyFollowing) {
        success = await unfollowUser(followerId, followingId);
    } else {
        success = await followUser(followerId, followingId);
    }

    if (success) {
        // Aggiorna l'interfaccia solo se l'operazione è andata a buon fine
        updateFollowButton(button, !isCurrentlyFollowing);
        updateFollowerCount(!isCurrentlyFollowing);
    }

    button.disabled = false;
}

// Funzione helper per aggiornare lo stile e il testo del pulsante
function updateFollowButton(button, isFollowing) {
    if (isFollowing) {
        button.textContent = 'Smetti di seguire';
        // Aggiungi una classe per cambiare stile se vuoi, es:
        button.classList.add('unfollow-style'); 
    } else {
        button.textContent = 'Segui';
        button.classList.remove('unfollow-style');
    }
}

// Funzione helper per aggiornare il contatore dei follower sull'interfaccia
function updateFollowerCount(isFollowing) {
    const followersSpan = document.getElementById('followersCount');
    let currentCount = parseInt(followersSpan.textContent);
    followersSpan.textContent = isFollowing ? currentCount + 1 : currentCount - 1;
}


// Avvia tutto al caricamento della pagina
document.addEventListener('DOMContentLoaded', initializeProfilePage);

