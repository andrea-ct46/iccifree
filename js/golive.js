// =================================================================================
// ICCI FREE - GO LIVE JAVASCRIPT FUNZIONANTE
// Sistema WebRTC completo per streaming
// =================================================================================

let localStream = null;
let webRTCStreaming = null;
let currentUser = null;
let currentStreamRecord = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inizializzazione Go Live...');
    
    // Controlla autenticazione
    currentUser = await checkUser();
    if (!currentUser) {
        alert("Devi effettuare l'accesso per andare in diretta.");
        window.location.href = '/auth.html';
        return;
    }
    
    // Elementi DOM
    const videoElement = document.getElementById('cameraPreview');
    const goLiveBtn = document.getElementById('goLiveBtn');
    const streamTitleInput = document.getElementById('streamTitle');
    const permissionMessage = document.getElementById('permissionMessage');
    const permissionText = document.getElementById('permissionText');
    const flipCameraBtn = document.getElementById('flipCameraBtn');
    const toggleMicBtn = document.getElementById('toggleMicBtn');
    
    let currentFacingMode = 'user'; // 'user' o 'environment'
    let micEnabled = true;
    
    // ============= FUNZIONI CAMERA =============
    
    async function startCamera(facingMode = 'user') {
        try {
            // Ferma stream esistente
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            
            const constraints = {
                video: { 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 },
                    facingMode: facingMode
                },
                audio: true
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = stream;
            localStream = stream;
            
            permissionMessage.style.display = 'none';
            console.log('✅ Camera avviata');
            
        } catch (error) {
            console.error("Errore camera:", error);
            permissionText.textContent = "Accesso negato a camera/microfono. Abilita i permessi e ricarica.";
            permissionMessage.style.display = 'flex';
            
            const retryBtn = document.getElementById('requestPermissionBtn');
            retryBtn.style.display = 'block';
            retryBtn.onclick = () => location.reload();
        }
    }
    
    // ============= EVENT LISTENERS =============
    
    // Flip Camera
    flipCameraBtn.addEventListener('click', async () => {
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        await startCamera(currentFacingMode);
    });
    
    // Toggle Microfono
    toggleMicBtn.addEventListener('click', () => {
        if (!localStream) return;
        
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            micEnabled = !micEnabled;
            audioTrack.enabled = micEnabled;
            
            toggleMicBtn.innerHTML = micEnabled ? 
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>' :
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="2" x2="22" y2="22"/><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>';
        }
    });
    
    // GO LIVE Button
    goLiveBtn.addEventListener('click', async () => {
        const title = streamTitleInput.value.trim();
        if (!title) {
            alert("Inserisci un titolo per la diretta!");
            streamTitleInput.focus();
            return;
        }
        
        if (!localStream) {
            alert("Camera non pronta. Riprova.");
            return;
        }
        
        goLiveBtn.disabled = true;
        goLiveBtn.textContent = '⏳ AVVIO...';
        
        try {
            await startWebRTCStream(title);
        } catch (error) {
            console.error('Errore Go Live:', error);
            alert('Errore nell\'avvio della diretta: ' + error.message);
            goLiveBtn.disabled = false;
            goLiveBtn.textContent = 'GO LIVE';
        }
    });
    
    // ============= WEBRTC STREAMING =============
    
    async function startWebRTCStream(title) {
        try {
            // 1. Crea record stream nel database
            const { data: streamRecord, error: streamError } = await supabaseClient
                .from('streams')
                .insert({
                    user_id: currentUser.id,
                    title: title,
                    status: 'live',
                    category: 'Live Stream',
                    viewer_count: 0,
                    started_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (streamError) throw streamError;
            currentStreamRecord = streamRecord;
            console.log('✅ Stream record creato:', streamRecord.id);
            
            // 2. Inizializza WebRTC
            webRTCStreaming = new WebRTCStreaming({
                roomId: streamRecord.id,
                isBroadcaster: true,
                onStats: (stats) => {
                    console.log('📊 Stats:', stats);
                }
            });
            
            await webRTCStreaming.init();
            console.log('✅ WebRTC inizializzato');
            
            // 3. Aggiungi stream locale al WebRTC
            localStream.getTracks().forEach(track => {
                webRTCStreaming.pc.addTrack(track, localStream);
            });
            
            // 4. Crea data channel per chat
            webRTCStreaming.createDataChannel('chat');
            
            // 5. Crea offer per i viewer
            await webRTCStreaming.createOffer();
            console.log('✅ Offer WebRTC creato');
            
            // 6. Avvia statistiche
            webRTCStreaming.startStats(3000);
            
            // 7. Reindirizza alla pagina streaming
            goLiveBtn.textContent = '🔴 IN DIRETTA!';
            setTimeout(() => {
                window.location.href = `/stream-webrtc.html?id=${streamRecord.id}&mode=broadcaster`;
            }, 1000);
            
        } catch (error) {
            console.error('Errore WebRTC:', error);
            throw error;
        }
    }
    
    // ============= CLEANUP =============
    
    window.addEventListener('beforeunload', async () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (webRTCStreaming) {
            await webRTCStreaming.close();
        }
        if (currentStreamRecord) {
            // Segna stream come terminato
            await supabaseClient
                .from('streams')
                .update({ 
                    status: 'offline',
                    ended_at: new Date().toISOString() 
                })
                .eq('id', currentStreamRecord.id);
        }
    });
    
    // ============= INIZIALIZZA =============
    
    await startCamera();
    console.log('✅ Go Live pronto!');
});

// ============= UTILITY FUNCTIONS =============

function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--surface-dark);
        color: var(--text-primary);
        padding: 16px 20px;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<strong>${icon}</strong> ${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
