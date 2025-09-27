// ============= WEBRTC STREAMING V5.0 - ULTRA OTTIMIZZATO =============

console.log('🎬 WebRTC V5.0 - Production Ready');

class WebRTCStreamingV5 {
    constructor(streamId, mode = 'viewer') {
        // Validazione
        if (!streamId) throw new Error('Stream ID required');
        
        this.streamId = typeof streamId === 'object' ? streamId.roomId : streamId;
        this.mode = typeof streamId === 'object' 
            ? (streamId.isBroadcaster ? 'broadcaster' : 'viewer')
            : mode;
        
        // Core WebRTC
        this.pc = null;
        this.localStream = null;
        this.remoteStream = null;
        this.dataChannel = null;
        
        // State
        this.isConnected = false;
        this.isInitialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Intervals
        this.intervals = new Map();
        this.processedCandidates = new Set();
        
        // Callbacks con defaults
        this.callbacks = {
            onLocalStream: (stream) => console.log('📹 Local:', stream.id),
            onRemoteStream: (stream) => console.log('📺 Remote:', stream.id),
            onConnectionSuccess: () => console.log('✅ Connected'),
            onConnectionFailed: () => console.log('❌ Failed'),
            onDataMessage: (msg) => console.log('💬 Message:', msg),
            onStatsUpdate: (stats) => console.log('📊 Stats:', stats)
        };
        
        // Merge callbacks custom
        Object.keys(this.callbacks).forEach(key => {
            if (this[key]) this.callbacks[key] = this[key];
        });
        
        console.log(`🎯 WebRTC init: ${this.mode} - ${this.streamId}`);
    }
    
    // ============= INIT =============
    async init() {
        if (this.isInitialized) {
            console.warn('⚠️ Already initialized');
            return;
        }
        
        try {
            console.log('🔧 Init WebRTC V5...');
            
            // Check support
            if (!this.checkSupport()) {
                throw new Error('WebRTC not supported');
            }
            
            // ICE config
            const config = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ],
                iceCandidatePoolSize: 10,
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require'
            };
            
            this.pc = new RTCPeerConnection(config);
            this.setupHandlers();
            
            if (this.mode === 'broadcaster') {
                await this.initBroadcaster();
            } else {
                await this.initViewer();
            }
            
            this.isInitialized = true;
            console.log('✅ WebRTC V5 initialized');
            
        } catch (error) {
            console.error('💥 Init error:', error);
            this.cleanup();
            throw error;
        }
    }
    
    // ============= CHECK SUPPORT =============
    checkSupport() {
        return !!(window.RTCPeerConnection && 
                  navigator.mediaDevices?.getUserMedia);
    }
    
    // ============= SETUP HANDLERS =============
    setupHandlers() {
        // Connection state
        this.pc.onconnectionstatechange = () => {
            const state = this.pc.connectionState;
            console.log('🔗 Connection:', state);
            
            if (state === 'connected') {
                this.isConnected = true;
                this.retryCount = 0;
                this.callbacks.onConnectionSuccess();
                this.startMonitoring();
            } else if (state === 'failed') {
                this.handleFailure();
            } else if (state === 'disconnected') {
                this.scheduleReconnect();
            }
        };
        
        // ICE candidate
        this.pc.onicecandidate = (e) => {
            if (e.candidate) {
                console.log('🧊 ICE:', e.candidate.type);
                this.saveIceCandidate(e.candidate);
            }
        };
        
        // Remote track
        this.pc.ontrack = (e) => {
            if (e.streams[0]) {
                this.remoteStream = e.streams[0];
                console.log('📺 Remote stream received');
                this.callbacks.onRemoteStream(this.remoteStream);
            }
        };
        
        // Data channel
        this.pc.ondatachannel = (e) => {
            this.setupDataChannel(e.channel);
        };
    }
    
    // ============= INIT BROADCASTER =============
    async initBroadcaster() {
        console.log('📡 Init broadcaster...');
        
        // Get media
        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        // Add tracks
        this.localStream.getTracks().forEach(track => {
            this.pc.addTrack(track, this.localStream);
        });
        
        this.callbacks.onLocalStream(this.localStream);
        this.createDataChannel('chat');
        await this.createOffer();
        this.startPolling();
    }
    
    // ============= INIT VIEWER =============
    async initViewer() {
        console.log('👁️ Init viewer...');
        this.startPolling();
    }
    
    // ============= CREATE OFFER =============
    async createOffer() {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        
        await supabaseClient
            .from('streams')
            .update({ offer: offer.sdp })
            .eq('id', this.streamId);
        
        console.log('✅ Offer saved');
    }
    
    // ============= SAVE ICE CANDIDATE =============
    async saveIceCandidate(candidate) {
        try {
            await supabaseClient.rpc('add_ice_candidate', {
                stream_id_param: this.streamId,
                candidate_param: JSON.stringify({
                    candidate: candidate.candidate,
                    sdpMid: candidate.sdpMid,
                    sdpMLineIndex: candidate.sdpMLineIndex
                })
            });
        } catch (e) {
            console.warn('⚠️ ICE save error:', e);
        }
    }
    
    // ============= START POLLING =============
    startPolling() {
        const interval = setInterval(async () => {
            try {
                const { data } = await supabaseClient
                    .from('streams')
                    .select('offer, answer, ice_candidates')
                    .eq('id', this.streamId)
                    .single();
                
                if (!data) return;
                
                // Handle offer (viewer)
                if (this.mode === 'viewer' && data.offer && !this.pc.remoteDescription) {
                    await this.handleOffer(data.offer);
                }
                
                // Handle answer (broadcaster)
                if (this.mode === 'broadcaster' && data.answer && !this.pc.remoteDescription) {
                    await this.handleAnswer(data.answer);
                }
                
                // Handle ICE
                if (data.ice_candidates) {
                    await this.processIceCandidates(data.ice_candidates);
                }
            } catch (e) {
                console.warn('⚠️ Poll error:', e);
            }
        }, 2000);
        
        this.intervals.set('polling', interval);
    }
    
    // ============= HANDLE OFFER =============
    async handleOffer(sdp) {
        await this.pc.setRemoteDescription({ type: 'offer', sdp });
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        
        await supabaseClient
            .from('streams')
            .update({ answer: answer.sdp })
            .eq('id', this.streamId);
        
        console.log('✅ Answer sent');
    }
    
    // ============= HANDLE ANSWER =============
    async handleAnswer(sdp) {
        await this.pc.setRemoteDescription({ type: 'answer', sdp });
        console.log('✅ Answer received');
    }
    
    // ============= PROCESS ICE CANDIDATES =============
    async processIceCandidates(candidates) {
        for (const candidateStr of candidates) {
            try {
                const data = JSON.parse(candidateStr);
                const id = `${data.candidate}-${data.sdpMid}`;
                
                if (this.processedCandidates.has(id)) continue;
                
                await this.pc.addIceCandidate(new RTCIceCandidate(data));
                this.processedCandidates.add(id);
            } catch (e) {
                console.warn('⚠️ ICE error:', e);
            }
        }
    }
    
    // ============= DATA CHANNEL =============
    createDataChannel(label) {
        this.dataChannel = this.pc.createDataChannel(label);
        this.setupDataChannel(this.dataChannel);
    }
    
    setupDataChannel(channel) {
        channel.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                this.callbacks.onDataMessage(msg);
            } catch (error) {
                console.error('💥 Data channel error:', error);
            }
        };
    }
    
    // ============= MONITORING =============
    startMonitoring() {
        const interval = setInterval(async () => {
            if (this.pc?.connectionState !== 'connected') return;
            
            try {
                const stats = await this.getStats();
                this.callbacks.onStatsUpdate(stats);
            } catch (error) {
                console.warn('⚠️ Stats error:', error);
            }
        }, 5000);
        
        this.intervals.set('monitoring', interval);
    }
    
    async getStats() {
        const stats = await this.pc.getStats();
        const report = {
            connectionState: this.pc.connectionState,
            bytesReceived: 0,
            bytesSent: 0
        };
        
        stats.forEach(stat => {
            if (stat.type === 'inbound-rtp') {
                report.bytesReceived += stat.bytesReceived || 0;
            } else if (stat.type === 'outbound-rtp') {
                report.bytesSent += stat.bytesSent || 0;
            }
        });
        
        return report;
    }
    
    // ============= FAILURE HANDLING =============
    handleFailure() {
        console.error('💥 Connection failed');
        this.callbacks.onConnectionFailed();
        
        if (this.retryCount < this.maxRetries) {
            this.scheduleReconnect();
        }
    }
    
    scheduleReconnect() {
        this.retryCount++;
        const delay = Math.min(2000 * this.retryCount, 10000);
        
        console.log(`🔄 Reconnect in ${delay}ms (${this.retryCount}/${this.maxRetries})`);
        
        setTimeout(async () => {
            await this.reconnect();
        }, delay);
    }
    
    async reconnect() {
        console.log('🔄 Reconnecting...');
        
        this.stopPolling();
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        
        this.isInitialized = false;
        this.processedCandidates.clear();
        
        await this.init();
    }
    
    // ============= STOP POLLING =============
    stopPolling() {
        this.intervals.forEach((interval, key) => {
            clearInterval(interval);
            this.intervals.delete(key);
        });
    }
    
    // ============= CLEANUP =============
    cleanup() {
        console.log('🧹 Cleanup...');
        
        this.stopPolling();
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(t => t.stop());
        }
        
        if (this.dataChannel) {
            this.dataChannel.close();
        }
        
        if (this.pc) {
            this.pc.close();
        }
        
        this.isConnected = false;
        this.isInitialized = false;
    }
    
    disconnect() {
        this.cleanup();
    }
    
    // ============= MEDIA CONTROLS =============
    toggleAudio(enabled) {
        if (!this.localStream) return false;
        const track = this.localStream.getAudioTracks()[0];
        if (!track) return false;
        
        track.enabled = enabled ?? !track.enabled;
        return track.enabled;
    }
    
    toggleVideo(enabled) {
        if (!this.localStream) return false;
        const track = this.localStream.getVideoTracks()[0];
        if (!track) return false;
        
        track.enabled = enabled ?? !track.enabled;
        return track.enabled;
    }
}

// ============= EXPORT =============
window.WebRTCStreaming = WebRTCStreamingV5;

console.log('✅ WebRTC V5 loaded');
