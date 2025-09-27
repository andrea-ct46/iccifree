// ============= TESTING & MONITORING UTILITIES =============

class TestingUtils {
    constructor() {
        this.testResults = [];
        this.performanceMarks = [];
    }
    
    // ============= WEBRTC TESTING =============
    async testWebRTC() {
        console.log('🧪 Testing WebRTC...');
        
        const results = {
            supported: false,
            getUserMedia: false,
            peerConnection: false,
            dataChannel: false,
            iceServers: []
        };
        
        // Check support
        results.supported = !!(window.RTCPeerConnection && navigator.mediaDevices);
        
        if (!results.supported) {
            console.error('❌ WebRTC not supported');
            return results;
        }
        
        // Test getUserMedia
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            results.getUserMedia = true;
            stream.getTracks().forEach(t => t.stop());
            console.log('✅ getUserMedia working');
        } catch (e) {
            console.error('❌ getUserMedia failed:', e);
        }
        
        // Test PeerConnection
        try {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            results.peerConnection = true;
            
            // Test data channel
            const dc = pc.createDataChannel('test');
            results.dataChannel = true;
            
            pc.close();
            console.log('✅ PeerConnection working');
        } catch (e) {
            console.error('❌ PeerConnection failed:', e);
        }
        
        // Test STUN servers
        const stunServers = [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302'
        ];
        
        for (const url of stunServers) {
            try {
                const pc = new RTCPeerConnection({ iceServers: [{ urls: url }] });
                await pc.createOffer();
                results.iceServers.push({ url, status: 'ok' });
                pc.close();
            } catch (e) {
                results.iceServers.push({ url, status: 'failed' });
            }
        }
        
        this.testResults.push({ test: 'WebRTC', results });
        return results;
    }
    
    // ============= PERFORMANCE TESTING =============
    async testPerformance() {
        console.log('⚡ Testing Performance...');
        
        const results = {
            navigation: {},
            resources: [],
            marks: [],
            measures: []
        };
        
        // Navigation timing
        if (performance.getEntriesByType) {
            const nav = performance.getEntriesByType('navigation')[0];
            if (nav) {
                results.navigation = {
                    dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
                    tcp: Math.round(nav.connectEnd - nav.connectStart),
                    ttfb: Math.round(nav.responseStart - nav.requestStart),
                    download: Math.round(nav.responseEnd - nav.responseStart),
                    domLoad: Math.round(nav.domContentLoadedEventEnd - nav.fetchStart),
                    pageLoad: Math.round(nav.loadEventEnd - nav.fetchStart)
                };
            }
        }
        
        // Resource timing
        if (performance.getEntriesByType) {
            const resources = performance.getEntriesByType('resource');
            results.resources = resources
                .map(r => ({
                    name: r.name.split('/').pop(),
                    type: r.initiatorType,
                    duration: Math.round(r.duration),
                    size: r.transferSize || 0
                }))
                .sort((a, b) => b.duration - a.duration)
                .slice(0, 10);
        }
        
        // Performance marks
        if (performance.getEntriesByType) {
            results.marks = performance.getEntriesByType('mark');
            results.measures = performance.getEntriesByType('measure');
        }
        
        this.testResults.push({ test: 'Performance', results });
        return results;
    }
    
    // ============= NETWORK TESTING =============
    async testNetwork() {
        console.log('🌐 Testing Network...');
        
        const results = {
            online: navigator.onLine,
            connection: null,
            latency: null,
            bandwidth: null
        };
        
        // Connection info
        if ('connection' in navigator) {
            const conn = navigator.connection;
            results.connection = {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt,
                saveData: conn.saveData
            };
        }
        
        // Measure latency
        try {
            const start = performance.now();
            await fetch('/ping', { method: 'HEAD', cache: 'no-store' });
            results.latency = Math.round(performance.now() - start);
        } catch (e) {
            results.latency = 'failed';
        }
        
        this.testResults.push({ test: 'Network', results });
        return results;
    }
    
    // ============= STORAGE TESTING =============
    testStorage() {
        console.log('💾 Testing Storage...');
        
        const results = {
            localStorage: false,
            sessionStorage: false,
            indexedDB: false,
            serviceWorker: false,
            quota: null
        };
        
        // LocalStorage
        try {
            localStorage.setItem('test', '1');
            localStorage.removeItem('test');
            results.localStorage = true;
        } catch (e) {
            results.localStorage = false;
        }
        
        // SessionStorage
        try {
            sessionStorage.setItem('test', '1');
            sessionStorage.removeItem('test');
            results.sessionStorage = true;
        } catch (e) {
            results.sessionStorage = false;
        }
        
        // IndexedDB
        results.indexedDB = 'indexedDB' in window;
        
        // Service Worker
        results.serviceWorker = 'serviceWorker' in navigator;
        
        // Storage quota
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                results.quota = {
                    usage: (estimate.usage / 1048576).toFixed(2) + ' MB',
                    quota: (estimate.quota / 1048576).toFixed(2) + ' MB',
                    percent: ((estimate.usage / estimate.quota) * 100).toFixed(1) + '%'
                };
            });
        }
        
        this.testResults.push({ test: 'Storage', results });
        return results;
    }
    
    // ============= MEDIA TESTING =============
    async testMedia() {
        console.log('📹 Testing Media...');
        
        const results = {
            devices: [],
            constraints: {},
            supported: []
        };
        
        // Enumerate devices
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                results.devices = devices.map(d => ({
                    kind: d.kind,
                    label: d.label || 'Unknown',
                    id: d.deviceId.slice(0, 20) + '...'
                }));
            } catch (e) {
                console.error('Device enumeration failed:', e);
            }
        }
        
        // Test constraints
        const testConstraints = [
            { video: true, audio: true },
            { video: { width: 1280, height: 720 }, audio: true },
            { video: { width: 1920, height: 1080 }, audio: true },
            { video: { facingMode: 'user' }, audio: true },
            { video: { facingMode: 'environment' }, audio: true }
        ];
        
        for (const constraint of testConstraints) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraint);
                results.supported.push({
                    constraint: JSON.stringify(constraint),
                    status: 'supported'
                });
                stream.getTracks().forEach(t => t.stop());
            } catch (e) {
                results.supported.push({
                    constraint: JSON.stringify(constraint),
                    status: 'not supported'
                });
            }
        }
        
        this.testResults.push({ test: 'Media', results });
        return results;
    }
    
    // ============= BROWSER TESTING =============
    testBrowser() {
        console.log('🌍 Testing Browser...');
        
        const results = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            hardwareConcurrency: navigator.hardwareConcurrency,
            maxTouchPoints: navigator.maxTouchPoints,
            vendor: navigator.vendor,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                ratio: window.devicePixelRatio
            },
            features: {
                webgl: !!document.createElement('canvas').getContext('webgl'),
                webgl2: !!document.createElement('canvas').getContext('webgl2'),
                webrtc: !!(window.RTCPeerConnection),
                websocket: 'WebSocket' in window,
                webworker: 'Worker' in window,
                serviceworker: 'serviceWorker' in navigator,
                notifications: 'Notification' in window,
                geolocation: 'geolocation' in navigator,
                battery: 'getBattery' in navigator,
                vibration: 'vibrate' in navigator
            }
        };
        
        this.testResults.push({ test: 'Browser', results });
        return results;
    }
    
    // ============= RUN ALL TESTS =============
    async runAllTests() {
        console.log('🧪 Running all tests...');
        
        const startTime = performance.now();
        
        await this.testWebRTC();
        await this.testPerformance();
        await this.testNetwork();
        this.testStorage();
        await this.testMedia();
        this.testBrowser();
        
        const duration = Math.round(performance.now() - startTime);
        
        console.log(`✅ All tests completed in ${duration}ms`);
        return {
            results: this.testResults,
            duration,
            timestamp: new Date().toISOString()
        };
    }
    
    // ============= GENERATE REPORT =============
    generateReport() {
        const report = {
            summary: {
                totalTests: this.testResults.length,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            },
            results: this.testResults
        };
        
        return report;
    }
    
    // ============= DOWNLOAD REPORT =============
    downloadReport() {
        const report = this.generateReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('📥 Report downloaded');
    }
    
    // ============= CONSOLE REPORT =============
    consoleReport() {
        console.group('📊 Test Report');
        
        this.testResults.forEach(({ test, results }) => {
            console.group(`🔍 ${test}`);
            console.table(results);
            console.groupEnd();
        });
        
        console.groupEnd();
    }
    
    // ============= PERFORMANCE MARK =============
    mark(name) {
        performance.mark(name);
        this.performanceMarks.push({
            name,
            timestamp: performance.now()
        });
    }
    
    // ============= PERFORMANCE MEASURE =============
    measure(name, startMark, endMark) {
        performance.measure(name, startMark, endMark);
        const measures = performance.getEntriesByName(name, 'measure');
        if (measures.length > 0) {
            const measure = measures[measures.length - 1];
            console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
            return measure.duration;
        }
    }
}

// ============= AUTO-INIT =============
const testUtils = new TestingUtils();
window.TestingUtils = testUtils;

// ============= DEBUG COMMANDS =============
window.runTests = () => testUtils.runAllTests();
window.testReport = () => testUtils.consoleReport();
window.downloadReport = () => testUtils.downloadReport();
window.testWebRTC = () => testUtils.testWebRTC();
window.testPerformance = () => testUtils.testPerformance();
window.testNetwork = () => testUtils.testNetwork();

console.log('✅ Testing Utils loaded');
console.log('💡 Run "runTests()" to test everything');
console.log('💡 Run "testReport()" for console report');
console.log('💡 Run "downloadReport()" to download JSON');
