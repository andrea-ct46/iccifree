// File: js/webrtc-streaming.js
// Core WebRTC helper for ICCI FREE - VERSIONE CON TUTTI I FIX
// Uses global supabaseClient for signaling (table: webrtc_signals).

class WebRTCStreaming {
    constructor({ roomId, isBroadcaster = false, onRemoteStream, onStats, onDataMessage }) {
        this.roomId = roomId;
        this.isBroadcaster = isBroadcaster;
        this.onRemoteStream = onRemoteStream;
        this.onStats = onStats;
        this.onDataMessage = onDataMessage;

        // ✅ CORREZIONE: ICE servers più robusti
        this.pcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun.cloudflare.com:3478' },
                // Aggiungi TURN servers in produzione per NAT traversal
            ],
            iceCandidatePoolSize: 10  // ✅ CORREZIONE: Pool più ampio
        };

        this.pc = null;
        this.localStream = null;
        this.dataChannel = null;
        this.statsInterval = null;
        this.signalSubscription = null;
        this.clientId = this._makeId();
        
        // ✅ CORREZIONE: Flag per tracking stato
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxAttempts = 3;
    }

    _makeId() {
        return 'c_' + Math.random().toString(36).substring(2, 9);
    }

    async init() {
        // create peer connection
        this.pc = new RTCPeerConnection(this.pcConfig);

        // ✅ CORREZIONE: Event handlers migliorati
        this.pc.onicecandidate = (e) => {
            if (!e.candidate) return;
            console.log('📤 Invio ICE candidate');
            this._sendSignal({ type: 'ice-candidate', candidate: e.candidate });
        };

        this.pc.ontrack = (e) => {
            console.log('🎥 Traccia ricevuta!');
            if (this.onRemoteStream && e.streams[0]) {
                this.onRemoteStream(e.streams[0]);
                this.isConnected = true;
            }
        };

        this.pc.ondatachannel = (event) => {
            console.log('💬 Data channel ricevuto');
            this._setupDataChannel(event.channel);
        };

        // ✅ CORREZIONE: Monitoring connessione
        this.pc.onconnectionstatechange = () => {
            console.log('🔗 Stato connessione:', this.pc.connectionState);
            
            if (this.pc.connectionState === 'connected') {
                this.isConnected = true;
                this.connectionAttempts = 0;
                console.log('✅ WebRTC connesso!');
            } else if (this.pc.connectionState === 'failed') {
                console.warn('⚠️ Connessione fallita, retry...');
                this._retryConnection();
            } else if (this.pc.connectionState === 'disconnected') {
                console.warn('⚠️ WebRTC disconnesso');
                this.isConnected = false;
            }
        };

        // ✅ CORREZIONE: Monitor ICE connection
        this.pc.oniceconnectionstatechange = () => {
            console.log('🧊 ICE state:', this.pc.iceConnectionState);
            
            if (this.pc.iceConnectionState === 'failed' || 
                this.pc.iceConnectionState === 'disconnected') {
                console.warn('⚠️ ICE connection issues, retry...');
                setTimeout(() => this._retryConnection(), 2000);
            }
        };

        await this._subscribeSignals();
    }

    // ✅ CORREZIONE: Retry automatico
    async _retryConnection() {
        this.connectionAttempts++;
        if (this.connectionAttempts > this.maxAttempts) {
            console.error('❌ Max retry attempts reached');
            return;
        }

        try {
            console.log(`🔄 Retry connessione (${this.connectionAttempts}/${this.maxAttempts})`);
            
            if (this.pc) {
                this.pc.close();
            }
            
            await this.init();
            
            if (!this.isBroadcaster) {
                // Per i viewer, riprova a ottenere l'offer
                const { data: stream } = await supabaseClient
                    .from('streams')
                    .select('offer_sdp')
                    .eq('id', this.roomId)
                    .single();
                    
                if (stream?.offer_sdp) {
                    await this.setRemoteDescription(stream.offer_sdp, 'offer');
                    await this.createAnswer();
                }
            }
        } catch (error) {
            console.error('❌ Retry fallito:', error);
        }
    }

    async startLocalCameraAudio(constraints = { 
        video: { width: 1280, height: 720, facingMode: 'user' }, 
        audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true 
        } 
    }) {
        if (this.localStream) {
            // stop existing tracks
            this.localStream.getTracks().forEach(t => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.localStream = stream;
        // add tracks to pc
        stream.getTracks().forEach(track => {
            console.log('📤 Aggiunto track:', track.kind);
            this.pc.addTrack(track, stream);
        });
        return stream;
    }

    async startScreenShare() {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        // replace video track if existing
        const videoTrack = stream.getVideoTracks()[0];
        const senders = this.pc.getSenders();
        const sender = senders.find(s => s.track && s.track.kind === 'video');
        if (sender) {
            await sender.replaceTrack(videoTrack);
        } else {
            this.pc.addTrack(videoTrack, stream);
        }
        // when screen sharing stops, you should handle replacement back to camera
        videoTrack.onended = () => {
            console.log('Screen share stopped');
        };
        return stream;
    }

    async stopLocalStream() {
        if (!this.localStream) return;
        this.localStream.getTracks().forEach(t => t.stop());
        this.localStream = null;
    }

    createDataChannel(label = 'chat') {
        if (!this.pc) throw new Error('PC not initialized');
        const dc = this.pc.createDataChannel(label);
        this._setupDataChannel(dc);
        return dc;
    }

    _setupDataChannel(dc) {
        this.dataChannel = dc;
        dc.onopen = () => {
            console.log('💬 DataChannel opened');
            this.isConnected = true;
        };
        dc.onmessage = (evt) => {
            try {
                const msg = JSON.parse(evt.data);
                if (this.onDataMessage) this.onDataMessage(msg);
            } catch (e) {
                if (this.onDataMessage) this.onDataMessage({ text: evt.data });
            }
        };
        dc.onerror = (error) => {
            console.error('❌ DataChannel error:', error);
        };
        dc.onclose = () => {
            console.warn('💬 DataChannel closed');
        };
    }

    async createOffer() {
        // broadcaster creates offer
        const offer = await this.pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        await this.pc.setLocalDescription(offer);

        // save offer in signals (so viewers can find it)
        await this._sendSignal({ type: 'offer', sdp: offer.sdp, sdpType: offer.type });
        return offer;
    }

    async createAnswer() {
        // viewer: create answer after receiving offer
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        await this._sendSignal({ type: 'answer', sdp: answer.sdp, sdpType: answer.type });
        return answer;
    }

    async setRemoteDescription(sdp, type) {
        if (!this.pc) await this.init();
        const desc = { type, sdp };
        
        try {
            await this.pc.setRemoteDescription(desc);
            console.log(`✅ Remote description set (${type})`);
        } catch (error) {
            console.error('❌ Error setting remote description:', error);
            throw error;
        }
    }

    async addIceCandidate(candidate) {
        try {
            await this.pc.addIceCandidate(candidate);
            console.log('✅ ICE candidate added');
        } catch (err) {
            console.warn('⚠️ Failed to add ICE candidate:', err);
        }
    }

    async _subscribeSignals() {
        // subscribe to realtime changes on table webrtc_signals for this room
        const channel = supabaseClient.channel(`webrtc_${this.roomId}`);
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'webrtc_signals', filter: `room_id=eq.${this.roomId}` },
            (payload) => this._handleSignal(payload)
        );
        await channel.subscribe();
        this.signalSubscription = channel;
        console.log('📡 Subscribed to WebRTC signals for room:', this.roomId);
    }

    async _sendSignal(payload) {
        // add meta: sender id and timestamp
        const record = {
            room_id: this.roomId,
            sender: this.clientId,
            payload: JSON.stringify(payload),
            created_at: new Date().toISOString()
        };
        
        try {
            await supabaseClient.from('webrtc_signals').insert(record).select();
            console.log('📤 Signal sent:', payload.type);
        } catch (error) {
            console.error('❌ Error sending signal:', error);
        }
    }

    async _handleSignal(payload) {
        if (!payload || !payload.record) return;
        let rec = payload.record;
        if (!rec.payload) return;
        
        try {
            const obj = JSON.parse(rec.payload);
            if (rec.sender === this.clientId) return;

            console.log('📡 Segnale ricevuto:', obj.type);

            if (obj.type === 'offer') {
                // ✅ CORREZIONE: Gestione offer migliorata
                console.log('📥 Ricevuta offer, creando answer...');
                await this.setRemoteDescription(obj.sdp, 'offer');
                const answer = await this.createAnswer();
                console.log('📤 Answer inviata');
            } else if (obj.type === 'answer') {
                // ✅ CORREZIONE: Gestione answer migliorata
                console.log('📥 Ricevuta answer');
                await this.setRemoteDescription(obj.sdp, 'answer');
            } else if (obj.type === 'ice-candidate') {
                console.log('📥 Ricevuto ICE candidate');
                await this.addIceCandidate(obj.candidate);
            }
        } catch (err) {
            console.error('❌ Errore gestione segnale:', err);
            
            // ✅ CORREZIONE: Retry automatico
            this.connectionAttempts++;
            if (this.connectionAttempts < this.maxAttempts) {
                console.log(`🔄 Retry connessione (${this.connectionAttempts}/${this.maxAttempts})`);
                setTimeout(() => this._retryConnection(), 2000);
            }
        }
    }

    async close() {
        console.log('🚪 Closing WebRTC connection...');
        
        if (this.signalSubscription) {
            await this.signalSubscription.unsubscribe();
            this.signalSubscription = null;
        }
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
        if (this.dataChannel) {
            this.dataChannel.close();
        }
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        
        console.log('✅ WebRTC connection closed');
    }

    // optional: start periodic stats callback (fps/bitrate approximated)
    startStats(intervalMs = 2000) {
        if (!this.pc) return;
        this.statsInterval = setInterval(async () => {
            try {
                const stats = await this.pc.getStats();
                // naive extraction: look for outbound-rtp for bitrate
                let out = { connected: this.isConnected };
                stats.forEach(report => {
                    if (report.type === 'outbound-rtp' && report.kind === 'video') {
                        out.bitrate = report.bitrateMean || 'N/A';
                    }
                });
                if (this.onStats) this.onStats(out);
            } catch (err) { 
                console.warn('Stats error:', err);
            }
        }, intervalMs);
    }
}

// export to window
window.WebRTCStreaming = WebRTCStreaming;
console.log('✅ WebRTC Streaming con FIX caricato!');
