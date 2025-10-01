// ============= ANALYTICS SYSTEM V2.0 =============

class Analytics {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.batchSize = 10;
        this.flushInterval = null;
    }
    
    // ============= GENERATE SESSION ID =============
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // ============= INIT =============
    init(userId = null) {
        this.userId = userId;
        
        console.log('📊 Analytics init - Session:', this.sessionId);
        
        // Track page views
        this.trackPageView();
        
        // Track user interactions
        this.trackClicks();
        this.trackFormSubmits();
        this.trackScroll();
        
        // Track session duration
        this.trackSessionDuration();
        
        // Track performance
        this.trackPerformance();
        
        // Track device info (mobile detection)
        this.trackDeviceInfo();
        
        // Flush batch periodicamente
        this.startAutoFlush();
        
        console.log('✅ Analytics attivo');
    }
    
    // ============= TRACK PAGE VIEW =============
    trackPageView() {
        const pageData = {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            path: window.location.pathname,
            query: window.location.search
        };
        
        this.track('page_view', pageData);
    }
    
    // ============= TRACK CLICKS =============
    trackClicks() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button, [data-track]');
            if (!target) return;
            
            const eventData = {
                element: target.tagName,
                text: target.textContent?.trim().substring(0, 50) || null,
                href: target.href || null,
                id: target.id || null,
                class: target.className || null,
                trackId: target.dataset.track || null
            };
            
            this.track('click', eventData);
        });
    }
    
    // ============= TRACK FORM SUBMITS =============
    trackFormSubmits() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            
            this.track('form_submit', {
                formId: form.id || 'unknown',
                formName: form.name || null,
                action: form.action || window.location.href,
                fieldCount: form.elements.length
            });
        });
    }
    
    // ============= TRACK SCROLL =============
    trackScroll() {
        let maxScroll = 0;
        const milestones = [25, 50, 75, 90, 100];
        const reached = new Set();
        
        const checkScroll = () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
            }
            
            milestones.forEach(milestone => {
                if (scrollPercent >= milestone && !reached.has(milestone)) {
                    reached.add(milestone);
                    this.track('scroll_depth', { 
                        depth: milestone,
                        page: window.location.pathname
                    });
                }
            });
        };
        
        window.addEventListener('scroll', this.throttle(checkScroll, 500));
    }
    
    // ============= TRACK SESSION DURATION =============
    trackSessionDuration() {
        const startTime = Date.now();
        
        // Track su visibilità
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                const duration = Math.round((Date.now() - startTime) / 1000);
                this.track('session_pause', { duration });
            }
        });
        
        // Track su beforeunload
        window.addEventListener('beforeunload', () => {
            const duration = Math.round((Date.now() - startTime) / 1000);
            this.track('session_end', { duration });
            this.flush(); // Flush immediato
        });
    }
    
    // ============= TRACK PERFORMANCE =============
    trackPerformance() {
        if ('PerformanceObserver' in window) {
            // Navigation timing
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const nav = performance.getEntriesByType('navigation')[0];
                    if (nav) {
                        this.track('performance', {
                            dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
                            tcp: Math.round(nav.connectEnd - nav.connectStart),
                            ttfb: Math.round(nav.responseStart - nav.requestStart),
                            download: Math.round(nav.responseEnd - nav.responseStart),
                            dom: Math.round(nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart),
                            load: Math.round(nav.loadEventEnd - nav.loadEventStart),
                            total: Math.round(nav.loadEventEnd - nav.fetchStart)
                        });
                    }
                }, 0);
            });
        }
    }
    
    // ============= TRACK (MAIN METHOD) =============
    track(eventName, data = {}) {
        const event = {
            name: eventName,
            data,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userId: this.userId,
            url: window.location.href,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            device: this.getDeviceInfo()
        };
        
        this.events.push(event);
        
        console.log('📊 Event:', eventName, data);
        
        // Flush se batch pieno
        if (this.events.length >= this.batchSize) {
            this.flush();
        }
    }
    
    // ============= TRACK DEVICE INFO =============
    trackDeviceInfo() {
        // Wait for mobile detector to initialize
        setTimeout(() => {
            const deviceInfo = this.getDeviceInfo();
            this.track('device_info', deviceInfo);
        }, 100);
    }
    
    // ============= GET DEVICE INFO =============
    getDeviceInfo() {
        const ua = navigator.userAgent;
        const baseInfo = {
            type: /Mobile|Android|iPhone|iPad/.test(ua) ? 'mobile' : 'desktop',
            os: this.getOS(),
            browser: this.getBrowser(),
            userAgent: ua,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            touchEnabled: 'ontouchstart' in window
        };
        
        // Add mobile detector info if available
        if (window.MobileDetector) {
            return {
                ...baseInfo,
                detectedType: window.MobileDetector.deviceType,
                isMobile: window.MobileDetector.isMobile,
                isTablet: window.MobileDetector.isTablet,
                isDesktop: window.MobileDetector.isDesktop,
                orientation: window.MobileDetector.orientation
            };
        }
        
        return baseInfo;
    }
    
    getOS() {
        const ua = navigator.userAgent;
        if (/Windows/.test(ua)) return 'Windows';
        if (/Mac/.test(ua)) return 'macOS';
        if (/Linux/.test(ua)) return 'Linux';
        if (/Android/.test(ua)) return 'Android';
        if (/iOS|iPhone|iPad/.test(ua)) return 'iOS';
        return 'Unknown';
    }
    
    getBrowser() {
        const ua = navigator.userAgent;
        if (/Chrome/.test(ua) && !/Edge/.test(ua)) return 'Chrome';
        if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
        if (/Firefox/.test(ua)) return 'Firefox';
        if (/Edge/.test(ua)) return 'Edge';
        return 'Other';
    }
    
    // ============= FLUSH BATCH =============
    async flush() {
        if (this.events.length === 0) return;
        
        const batch = [...this.events];
        this.events = [];
        
        try {
            // Invia a backend analytics
            // await fetch('/api/analytics', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ events: batch })
            // });
            
            console.log('📊 Batch inviato:', batch.length, 'eventi');
            
            // Per ora salva in localStorage per debug
            this.saveToLocalStorage(batch);
            
        } catch (error) {
            console.error('❌ Analytics error:', error);
            // Re-aggiungi eventi in caso di errore
            this.events.unshift(...batch);
        }
    }
    
    // ============= SAVE TO LOCALSTORAGE (DEBUG) =============
    saveToLocalStorage(batch) {
        try {
            const existing = JSON.parse(localStorage.getItem('iccifree_analytics') || '[]');
            const updated = [...existing, ...batch].slice(-100); // Keep last 100
            localStorage.setItem('iccifree_analytics', JSON.stringify(updated));
        } catch (e) {
            // Quota exceeded
        }
    }
    
    // ============= AUTO FLUSH =============
    startAutoFlush() {
        this.flushInterval = setInterval(() => {
            if (this.events.length > 0) {
                this.flush();
            }
        }, 30000); // Flush ogni 30 secondi
    }
    
    // ============= HELPER METHODS =============
    
    // Streaming events
    trackStreamStart(streamId) {
        this.track('stream_start', { streamId });
    }
    
    trackStreamEnd(streamId, duration) {
        this.track('stream_end', { streamId, duration });
    }
    
    trackStreamView(streamId) {
        this.track('stream_view', { streamId });
    }
    
    // Chat events
    trackChatMessage(streamId, messageLength) {
        this.track('chat_message', { 
            streamId, 
            length: messageLength 
        });
    }
    
    // Social events
    trackFollow(targetUserId) {
        this.track('follow', { targetUserId });
    }
    
    trackUnfollow(targetUserId) {
        this.track('unfollow', { targetUserId });
    }
    
    // Auth events
    trackSignup(method) {
        this.track('signup', { method });
    }
    
    trackLogin(method) {
        this.track('login', { method });
    }
    
    trackLogout() {
        this.track('logout');
    }
    
    // Error events
    trackError(errorType, errorMessage) {
        this.track('error', { 
            type: errorType, 
            message: errorMessage 
        });
    }
    
    // ============= THROTTLE HELPER =============
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // ============= GET ANALYTICS DATA =============
    getAnalyticsData() {
        try {
            return JSON.parse(localStorage.getItem('iccifree_analytics') || '[]');
        } catch (e) {
            return [];
        }
    }
    
    // ============= CLEAR ANALYTICS =============
    clearAnalytics() {
        this.events = [];
        localStorage.removeItem('iccifree_analytics');
        console.log('🧹 Analytics cleared');
    }
}

// ============= AUTO-INIT =============
const analytics = new Analytics();

// Init con userId dopo login
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const user = await (window.checkUser ? window.checkUser() : null);
            analytics.init(user?.id);
        } catch (e) {
            analytics.init();
        }
    });
} else {
    (async () => {
        try {
            const user = await (window.checkUser ? window.checkUser() : null);
            analytics.init(user?.id);
        } catch (e) {
            analytics.init();
        }
    })();
}

// Export globalmente
window.Analytics = analytics;

// Debug helpers
window.getAnalytics = () => analytics.getAnalyticsData();
window.clearAnalytics = () => analytics.clearAnalytics();

console.log('✅ Analytics loaded');
