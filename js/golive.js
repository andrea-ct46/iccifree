// =================================================================================
// ICCI FREE - LOGICA "GO LIVE" CON DIAGNOSTICA
// =================================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Seleziona tutti gli elementi interattivi dalla pagina
    const videoElement = document.getElementById('cameraPreview');
    const goLiveBtn = document.getElementById('goLiveBtn');
    const streamTitleInput = document.getElementById('streamTitle');
    const permissionMessage = document.getElementById('permissionMessage');
    const permissionText = document.getElementById('permissionText');
    
    // --- PASSO 1: Controllo di Sicurezza ---
    const user = await checkUser();
    if (!user) {
        alert("Devi effettuare l'accesso per poter andare in diretta.");
        window.location.href = '/auth.html';
        return;
    }

    // --- PASSO 2: Avvio della Fotocamera ---
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoElement.srcObject = stream;
            permissionMessage.style.display = 'none';
        } catch (error) {
            console.error("Errore nell'accesso alla fotocamera:", error);
            permissionText.textContent = "Accesso a fotocamera e microfono negato. Abilita i permessi nelle impostazioni del browser.";
            permissionMessage.style.display = 'flex';
        }
    }

    startCamera();

    // --- PASSO 3: Gestione del Pulsante "GO LIVE" ---
    goLiveBtn.addEventListener('click', async () => {
        console.log("--- TEST GO LIVE: Pulsante cliccato. ---");
        const title = streamTitleInput.value.trim();

        if (!title) {
            alert("Per favore, inserisci un titolo per la tua diretta.");
            console.warn("Test fallito: Titolo mancante.");
            return;
        }

        goLiveBtn.disabled = true;
        goLiveBtn.textContent = 'CREAZIONE IN CORSO...';

        try {
            console.log("CHECKPOINT 1: Controllo utente passato. ID Utente:", user.id);
            
            const streamData = {
                user_id: user.id,
                title: title,
                category: 'Talk Show' // Categoria di default, puoi cambiarla
            };

            console.log("CHECKPOINT 2: Sto per inviare questi dati al database:", streamData);

            const { data, error } = await supabaseClient
                .from('streams')
                .insert(streamData)
                .select()
                .single();

            console.log("CHECKPOINT 3: Risposta ricevuta da Supabase.");

            if (error) {
                // Se c'è un errore, lo lanciamo per essere catturato dal blocco 'catch'
                throw error;
            }

            if (!data) {
                // Questo è un caso anomalo: nessun errore ma nessun dato.
                throw new Error("Supabase non ha restituito i dati della diretta creata.");
            }

            console.log("CHECKPOINT 4: Diretta creata con successo! Dati:", data);
            
            console.log(`CHECKPOINT 5: Reindirizzamento a /stream.html?id=${data.id}`);
            window.location.href = `/stream.html?id=${data.id}`;

        } catch (error) {
            console.error("--- ERRORE FINALE CATTURATO ---");
            console.error("Oggetto di errore completo restituito da Supabase:", error);
            alert(`Si è verificato un errore. Impossibile avviare la diretta: ${error.message}. Controlla la console (F12) per i dettagli.`);
            
            goLiveBtn.disabled = false;
            goLiveBtn.textContent = 'GO LIVE';
        }
    });
});

