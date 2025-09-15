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
            .select('*')
            .eq('username', username)
            .single(); // .single() ci dà un solo risultato

        if (error || !profile) {
            throw new Error(`Utente "${username}" non trovato.`);
        }

        // 3. Popola la pagina con i dati trovati
        populateProfileData(profile);

        // 4. Controlla chi è l'utente loggato per mostrare i pulsanti giusti
        await setupActionButtons(profile);

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
    document.title = `${profile.username} - ICCI FREE`; // Aggiorna il titolo della scheda del browser
    document.getElementById('profileUsername').textContent = profile.username;
    document.getElementById('profileBio').textContent = profile.bio || 'Nessuna biografia impostata.';
    document.getElementById('followersCount').textContent = profile.followers_count || 0;
    document.getElementById('followingCount').textContent = profile.following_count || 0;
    if (profile.avatar_url) {
        document.getElementById('profileAvatar').src = profile.avatar_url;
    }
}

// Funzione per decidere se mostrare "Follow" o "Edit Profile"
async function setupActionButtons(profile) {
    const currentUser = await checkUser();
    const profileActionsDiv = document.getElementById('profileActions');
    const headerActionBtn = document.getElementById('headerActionBtn');

    // Se un utente è loggato...
    if (currentUser) {
        if (currentUser.id === profile.id) {
            // ...e sta guardando il suo stesso profilo
            profileActionsDiv.innerHTML = `<a href="/setup-profile.html" class="action-btn edit">Modifica Profilo</a>`;
            headerActionBtn.style.display = 'none'; // Nasconde il pulsante nell'header
        } else {
            // ...e sta guardando il profilo di qualcun altro
            profileActionsDiv.innerHTML = `<a href="#" class="action-btn follow">Segui</a>`;
            headerActionBtn.href = '/dashboard.html';
            headerActionBtn.textContent = 'Vai alla Dashboard';
            headerActionBtn.style.display = 'block';
        }
    } else {
        // Se l'utente non è loggato, mostra solo "Segui"
        profileActionsDiv.innerHTML = `<a href="/auth.html" class="action-btn follow">Segui</a>`;
        headerActionBtn.href = '/auth.html';
        headerActionBtn.textContent = 'Accedi';
        headerActionBtn.style.display = 'block';
    }
}

// Avvia tutto al caricamento della pagina
document.addEventListener('DOMContentLoaded', initializeProfilePage);

