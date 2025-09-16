// =================================================================================
// ICCI FREE - LOGICA "GO LIVE" CON WEBRTC
// =================================================================================

// Variabile globale per mantenere lo stream della fotocamera
let localStream = null;

document.addEventListener('DOMContentLoaded', async () => {
    const videoElement = document.getElementById('cameraPreview');
    const goLiveBtn = document.getElementById('goLiveBtn');
    const streamTitleInput = document.getElementById('streamTitle');
    const permissionMessage = document.getElementById('permissionMessage');
    const permissionText = document.getElementById('permissionText');
    
    const user = await checkUser();
    if (!user) {
        alert("Devi effettuare l'accesso per poter andare in diretta.");
        window.location.href = '/auth.html';
        return;
    }

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 }, // Richiede una qualità HD
                audio: true
            });
            videoElement.srcObject = stream;
            localStream = stream; // Salva lo stream per usarlo dopo
            permissionMessage.style.display = 'none';
        } catch (error) {
            console.error("Errore nell'accesso alla fotocamera:", error);
            permissionText.textContent = "Accesso a fotocamera e microfono negato. Abilita i permessi nelle impostazioni del browser.";
            permissionMessage.style.display = 'flex';
        }
    }

    startCamera();

    goLiveBtn.addEventListener('click', async () => {
        const title = streamTitleInput.value.trim();
        if (!title) {
            alert("Per favore, inserisci un titolo per la tua diretta.");
            return;
        }
        if (!localStream) {
            alert("Fotocamera non ancora pronta o permessi negati.");
            return;
        }

        goLiveBtn.disabled = true;
        goLiveBtn.textContent = 'NEGOZIAZIONE IN CORSO...';

        try {
            // --- INIZIO LOGICA WEBRTC ---
            
            // 1. Crea una nuova RTCPeerConnection.
            // In un'app reale, qui si aggiungerebbero i server STUN/TURN.
            const peerConnection = new RTCPeerConnection();

            // 2. Aggiungi le tracce audio e video dalla fotocamera alla connessione.
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });

            // 3. Crea l' "offerta" SDP (Session Description Protocol).
            // Questo è un messaggio che descrive il tuo stream.
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            // --- FINE LOGICA WEBRTC ---

            console.log("Offerta WebRTC creata:", offer.sdp);

            // 4. Salva la diretta e l'offerta SDP nel database.
            const { data, error } = await supabaseClient
                .from('streams')
                .insert({
                    user_id: user.id,
                    title: title,
                    offer_sdp: offer.sdp // Salva l'offerta
                })
                .select()
                .single();

            if (error) throw error;
            
            // 5. Reindirizza alla pagina dello streaming.
            window.location.href = `/stream.html?id=${data.id}`;

        } catch (error) {
            console.error("Errore nella creazione della diretta WebRTC:", error.message);
            alert("Si è verificato un errore. Impossibile avviare la diretta.");
            goLiveBtn.disabled = false;
            goLiveBtn.textContent = 'GO LIVE';
        }
    });
});

