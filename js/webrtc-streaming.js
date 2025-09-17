// File: js/webrtc-streaming.js
// Core WebRTC helper for ICCI FREE - minimal, usable for streamer & viewer
// Uses global supabaseClient for signaling (table: webrtc_signals).
// Requires: supabaseClient, checkUser()

class WebRTCStreaming {
    constructor({ roomId, isBroadcaster = false, onRemoteStream, onStats, onDataMessage }) {
        this.roomId = roomId;
        this.isBroadcaster = isBroadcaster;
        this.onRemoteStream = onRemoteStream;
        this.onStats = onStats;
        this.onDataMessage = onDataMessage;

        // RTCPeerConnection config: include STUN; add TURN in production
        this.pcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                // add TURN servers here if available
            ]
        };

        this.pc = null;
        this.localStream = null;
        this.dataChannel = null;
        this.statsInterval = null;
        this.signalSubscription = null;
        this.clientId = this._makeId();
    }

    _makeId() {
        return 'c_' + Math.random().toString(36).substring(2, 9);
    }

    async init() {
        // create peer connection
        this.pc = new RTCPeerConnection(this.pcConfig);

        // ICE -> push to supabase signals
        this.pc.onicecandidate = (e) => {
            if (!e.candidate) return;
            this._sendSignal({ type: 'ice-candidate', candidate: e.candidate });
        };

        // Remote stream
        this.pc.ontrack = (e) => {
            if (this.onRemoteStream) this.onRemoteStream(e.streams[0]);
        };

        // Data channel (for viewers only, or broadcaster can create)
        this.pc.ondatachannel = (event) => {
            const dc = event.channel;
            this._setupDataChannel(dc);
        };

        // monitor connection state
        this.pc.onconnectionstatechange = () => {
            console.log('PC state', this.pc.connectionState);
        };

        // subscribe to signaling messages for this room
        await this._subscribeSignals();
    }

    async startLocalCameraAudio(constraints = { video: { width: 1280, height: 720, facingMode: 'user' }, audio: true }) {
        if (this.localStream) {
            // stop existing tracks
            this.localStream.getTracks().forEach(t => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.localStream = stream;
        // add tracks to pc
        stream.getTracks().forEach(track => this.pc.addTrack(track, stream));
        return stream;
    }

    async startScreenShare() {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        // replace video track if existing
        const videoTrack = stream.getVideoTracks()[0];
        const senders = this.pc.getSenders();
        const sender = senders.find(s => s.track && s.track.kind === 'video');
        if (sender) {
            sender.replaceTrack(videoTrack);
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
        dc.onopen = () => console.log('DataChannel opened');
        dc.onmessage = (evt) => {
            try {
                const msg = JSON.parse(evt.data);
                if (this.onDataMessage) this.onDataMessage(msg);
            } catch (e) {
                if (this.onDataMessage) this.onDataMessage({ text: evt.data });
            }
        };
    }

    async createOffer() {
        // broadcaster creates offer
        const offer = await this.pc.createOffer();
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
        await this.pc.setRemoteDescription(desc);
    }

    async addIceCandidate(candidate) {
        try {
            await this.pc.addIceCandidate(candidate);
        } catch (err) {
            console.warn('Failed to add ICE candidate', err);
        }
    }

    async _subscribeSignals() {
        // subscribe to realtime changes on table webrtc_signals for this room
        // we use supabaseClient.from('webrtc_signals:roomId=eq.<roomId>')
        const channel = supabaseClient.channel(`webrtc_${this.roomId}`);
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'webrtc_signals', filter: `room_id=eq.${this.roomId}` },
            (payload) => this._handleSignal(payload)
        );
        await channel.subscribe();
        this.signalSubscription = channel;
    }

    async _sendSignal(payload) {
        // add meta: sender id and timestamp
        const record = {
            room_id: this.roomId,
            sender: this.clientId,
            payload: JSON.stringify(payload),
            created_at: new Date().toISOString()
        };
        await supabaseClient.from('webrtc_signals').insert(record).select(); // select() avoids 406 on REST
    }

    async _handleSignal(payload) {
        // payload.record contains inserted row (on INSERT)
        if (!payload || !payload.record) return;
        let rec = payload.record;
        if (!rec.payload) return;
        try {
            const obj = JSON.parse(rec.payload);
            // ignore signals sent by self
            if (rec.sender === this.clientId) return;

            if (obj.type === 'offer') {
                // viewer receives offer -> setRemote + createAnswer
                await this.setRemoteDescription(obj.sdp, obj.sdpType || 'offer');
                await this.createAnswer();
            } else if (obj.type === 'answer') {
                await this.setRemoteDescription(obj.sdp, obj.sdpType || 'answer');
            } else if (obj.type === 'ice-candidate') {
                await this.addIceCandidate(obj.candidate);
            }
        } catch (err) {
            console.error('Signal handle error', err);
        }
    }

    async close() {
        if (this.signalSubscription) {
            await this.signalSubscription.unsubscribe();
            this.signalSubscription = null;
        }
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
    }

    // optional: start periodic stats callback (fps/bitrate approximated)
    startStats(intervalMs = 2000) {
        if (!this.pc) return;
        this.statsInterval = setInterval(async () => {
            try {
                const stats = await this.pc.getStats();
                // naive extraction: look for outbound-rtp for bitrate
                let out = {};
                stats.forEach(report => {
                    if (report.type === 'outbound-rtp' && report.kind === 'video') {
                        out.bitrate = report.bitrateMean || null;
                    }
                });
                if (this.onStats) this.onStats(out);
            } catch (err) { /* ignore */ }
        }, intervalMs);
    }
}

// export to window
window.WebRTCStreaming = WebRTCStreaming;