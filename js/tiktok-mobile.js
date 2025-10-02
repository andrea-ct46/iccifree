// ============= TIKTOK-STYLE MOBILE APP CONTROLLER =============

console.log('🎬 TikTok Mobile App loading...');

const TikTokApp = {
    // ============= STATE =============
    currentStreamIndex: 0,
    streams: [],
    isLoading: false,
    currentUser: null,
    
    // Elements
    videoPlayer: null,
    loadingState: null,
    noStreamsState: null,
    
    // Touch handling
    startY: 0,
    currentY: 0,
    isScrolling: false,
    
    // ============= INITIALIZE =============
    init: async function() {
        console.log('🎬 TikTok App initializing...');
        
        try {
            // Get elements
            this.videoPlayer = document.getElementById('videoPlayer');
            this.loadingState = document.getElementById('loadingState');
            this.noStreamsState = document.getElementById('noStreamsState');
            
            // Setup touch events
            this.setupTouchEvents();
            
            // Load user
            await this.loadUser();
            
            // Load streams
            await this.loadStreams();
            
            // Setup auto-refresh
            this.setupAutoRefresh();
            
            // Setup PWA features
            this.setupPWA();
            
            console.log('✅ TikTok App ready');
            
        } catch (error) {
            console.error('❌ TikTok App init error:', error);
            this.showNotification('❌ Errore inizializzazione app');
        }
    },
    
    // ============= USER MANAGEMENT =============
    loadUser: async function() {
        try {
            if (window.supabaseClient) {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                this.currentUser = user;
                console.log('👤 User loaded:', user ? user.email : 'Not logged in');
            }
        } catch (error) {
            console.error('❌ Error loading user:', error);
        }
    },
    
    // ============= STREAMS MANAGEMENT =============
    loadStreams: async function() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Try to load real streams from Supabase
            if (window.supabaseClient) {
                const { data: realStreams, error } = await window.supabaseClient
                    .from('streams')
                    .select('id, title, description, viewer_count, started_at, user_id')
                    .eq('is_live', true)
                    .order('viewer_count', { ascending: false })
                    .limit(10);
                
                if (!error && realStreams && realStreams.length > 0) {
                    this.streams = realStreams.map(stream => ({
                        id: stream.id,
                        title: stream.title || 'Live Stream',
                        username: `user_${stream.user_id?.slice(0, 8) || 'unknown'}`,
                        avatar: this.getRandomAvatar(),
                        viewers: stream.viewer_count || 0,
                        likes: Math.floor(stream.viewer_count * 0.3) || 0,
                        gems: Math.floor(stream.viewer_count * 0.1) || 0,
                        videoUrl: null,
                        isReal: true
                    }));
                }
            }
            
            // If no real streams, use demo streams
            if (this.streams.length === 0) {
                this.streams = this.getDemoStreams();
            }
            
            if (this.streams.length > 0) {
                this.hideLoading();
                this.showStream(0);
            } else {
                this.showNoStreams();
            }
            
        } catch (error) {
            console.error('❌ Error loading streams:', error);
            // Fallback to demo streams
            this.streams = this.getDemoStreams();
            if (this.streams.length > 0) {
                this.hideLoading();
                this.showStream(0);
            } else {
                this.showNoStreams();
            }
        } finally {
            this.isLoading = false;
        }
    },
    
    getDemoStreams: function() {
        return [
            {
                id: 'demo_1',
                title: '🔥 Live Gaming Session - Fortnite Battle Royale Epic Wins!',
                username: 'gamer_pro_2024',
                avatar: '🎮',
                viewers: 1234,
                likes: 567,
                gems: 89,
                videoUrl: null,
                isReal: false
            },
            {
                id: 'demo_2', 
                title: '🎵 Acoustic Guitar Session - Taking Song Requests Live!',
                username: 'music_lover_official',
                avatar: '🎸',
                viewers: 892,
                likes: 234,
                gems: 45,
                videoUrl: null,
                isReal: false
            },
            {
                id: 'demo_3',
                title: '💬 Just Chatting - AMA About Life, Travel & Dreams!',
                username: 'chat_master_live',
                avatar: '💭',
                viewers: 456,
                likes: 123,
                gems: 23,
                videoUrl: null,
                isReal: false
            },
            {
                id: 'demo_4',
                title: '🍳 Cooking Live - Making Authentic Italian Pasta!',
                username: 'chef_italia',
                avatar: '👨‍🍳',
                viewers: 678,
                likes: 345,
                gems: 67,
                videoUrl: null,
                isReal: false
            },
            {
                id: 'demo_5',
                title: '🎨 Digital Art Creation - Drawing Anime Characters!',
                username: 'artist_creative',
                avatar: '🎨',
                viewers: 543,
                likes: 287,
                gems: 34,
                videoUrl: null,
                isReal: false
            }
        ];
    },
    
    getRandomAvatar: function() {
        const avatars = ['🎮', '🎸', '💭', '👨‍🍳', '🎨', '📚', '🏋️', '🎭', '🎪', '🎯'];
        return avatars[Math.floor(Math.random() * avatars.length)];
    },
    
    // ============= STREAM DISPLAY =============
    showStream: function(index) {
        if (!this.streams || this.streams.length === 0) return;
        
        // Clamp index to valid range
        index = Math.max(0, Math.min(index, this.streams.length - 1));
        this.currentStreamIndex = index;
        
        const stream = this.streams[index];
        
        // Update UI elements
        this.updateStreamUI(stream);
        
        // Set video placeholder
        this.setVideoPlaceholder();
        
        // Add demo chat messages
        this.addDemoChatMessages();
        
        // Track view
        this.trackStreamView(stream.id);
        
        // Add some visual feedback
        this.addStreamTransition();
    },
    
    updateStreamUI: function(stream) {
        // Update stream info
        document.getElementById('streamTitle').textContent = stream.title;
        document.getElementById('username').textContent = '@' + stream.username;
        document.getElementById('userAvatar').textContent = stream.avatar;
        
        // Update stats with animation
        this.animateCounter('viewerCount', stream.viewers);
        this.animateCounter('likeCount', stream.likes);
        this.animateCounter('gemsCount', stream.gems);
        
        // Reset like button
        document.getElementById('likeBtn').classList.remove('liked');
    },
    
    animateCounter: function(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const currentValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
        const increment = Math.ceil((targetValue - currentValue) / 20);
        
        let current = currentValue;
        const timer = setInterval(() => {
            current += increment;
            if (current >= targetValue) {
                current = targetValue;
                clearInterval(timer);
            }
            element.textContent = current.toLocaleString();
        }, 50);
    },
    
    addStreamTransition: function() {
        // Add a subtle transition effect
        const overlay = document.querySelector('.overlay');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 100);
    },
    
    // ============= VIDEO PLACEHOLDER =============
    setVideoPlaceholder: function() {
        // Create animated gradient background
        this.videoPlayer.style.background = `
            linear-gradient(45deg, 
                #1a1a1a 0%, 
                #2d2d2d 25%, 
                #1a1a1a 50%, 
                #2d2d2d 75%, 
                #1a1a1a 100%
            )
        `;
        this.videoPlayer.style.backgroundSize = '400% 400%';
        this.videoPlayer.style.animation = 'gradientShift 3s ease infinite';
        
        // Add overlay pattern
        if (!this.videoPlayer.querySelector('.video-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'video-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.3) 100%);
                pointer-events: none;
            `;
            this.videoPlayer.parentElement.appendChild(overlay);
        }
    },
    
    // ============= CHAT SIMULATION =============
    addDemoChatMessages: function() {
        const chatOverlay = document.getElementById('chatOverlay');
        chatOverlay.innerHTML = '';
        
        const messages = [
            '🔥 Awesome stream bro!',
            '❤️ Love this content so much',
            '👏 Keep it up, you\'re amazing!',
            '🎉 This is incredible!',
            '💎 Sending gifts your way!',
            '😍 Best streamer ever!',
            '🚀 You\'re going viral!',
            '⭐ Five stars content!',
            '🎯 Perfect stream quality!',
            '🏆 You deserve more followers!'
        ];
        
        let messageIndex = 0;
        const addMessage = () => {
            if (messageIndex >= messages.length) {
                messageIndex = 0;
            }
            
            const messageEl = document.createElement('div');
            messageEl.className = 'chat-message';
            messageEl.textContent = messages[messageIndex];
            chatOverlay.appendChild(messageEl);
            
            // Remove old messages
            if (chatOverlay.children.length > 3) {
                chatOverlay.removeChild(chatOverlay.firstChild);
            }
            
            messageIndex++;
        };
        
        // Add initial messages
        addMessage();
        setTimeout(addMessage, 1000);
        setTimeout(addMessage, 2000);
        
        // Continue adding messages
        setInterval(addMessage, 3000 + Math.random() * 2000);
    },
    
    // ============= TOUCH EVENTS =============
    setupTouchEvents: function() {
        const app = document.getElementById('tiktokApp');
        
        app.addEventListener('touchstart', (e) => {
            this.startY = e.touches[0].clientY;
            this.isScrolling = false;
            
            // Add touch feedback
            this.addTouchFeedback(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        
        app.addEventListener('touchmove', (e) => {
            if (!this.startY) return;
            
            this.currentY = e.touches[0].clientY;
            const diff = this.startY - this.currentY;
            
            if (Math.abs(diff) > 10) {
                this.isScrolling = true;
            }
        }, { passive: true });
        
        app.addEventListener('touchend', (e) => {
            if (!this.isScrolling || !this.startY) return;
            
            const diff = this.startY - this.currentY;
            const threshold = 50;
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    // Swipe up - next stream
                    this.nextStream();
                } else {
                    // Swipe down - previous stream
                    this.previousStream();
                }
            }
            
            this.startY = 0;
            this.currentY = 0;
            this.isScrolling = false;
        }, { passive: true });
        
        // Double tap to like
        let lastTap = 0;
        app.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                // Double tap detected
                this.toggleLike();
                e.preventDefault();
            }
            
            lastTap = currentTime;
        });
    },
    
    addTouchFeedback: function(x, y) {
        const feedback = document.createElement('div');
        feedback.className = 'touch-feedback';
        feedback.style.left = (x - 50) + 'px';
        feedback.style.top = (y - 50) + 'px';
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 600);
    },
    
    // ============= NAVIGATION =============
    nextStream: function() {
        if (this.streams.length === 0) return;
        
        const nextIndex = (this.currentStreamIndex + 1) % this.streams.length;
        this.showStream(nextIndex);
        
        // Haptic feedback
        this.hapticFeedback();
        
        // Show transition effect
        this.showSwipeEffect('up');
    },
    
    previousStream: function() {
        if (this.streams.length === 0) return;
        
        const prevIndex = this.currentStreamIndex === 0 
            ? this.streams.length - 1 
            : this.currentStreamIndex - 1;
        this.showStream(prevIndex);
        
        // Haptic feedback
        this.hapticFeedback();
        
        // Show transition effect
        this.showSwipeEffect('down');
    },
    
    showSwipeEffect: function(direction) {
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed;
            ${direction === 'up' ? 'bottom: 100px' : 'top: 100px'};
            left: 50%;
            transform: translateX(-50%);
            color: rgba(255, 215, 0, 0.8);
            font-size: 2rem;
            z-index: 100;
            pointer-events: none;
            animation: swipeIndicator 0.5s ease-out;
        `;
        effect.textContent = direction === 'up' ? '⬆️' : '⬇️';
        
        document.body.appendChild(effect);
        
        setTimeout(() => effect.remove(), 500);
        
        // Add CSS animation if not exists
        if (!document.getElementById('swipeAnimation')) {
            const style = document.createElement('style');
            style.id = 'swipeAnimation';
            style.textContent = `
                @keyframes swipeIndicator {
                    0% { opacity: 0; transform: translateX(-50%) scale(0.5); }
                    50% { opacity: 1; transform: translateX(-50%) scale(1.2); }
                    100% { opacity: 0; transform: translateX(-50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    hapticFeedback: function() {
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    },
    
    // ============= ACTION HANDLERS =============
    toggleLike: function() {
        const likeBtn = document.getElementById('likeBtn');
        const likeCount = document.getElementById('likeCount');
        
        likeBtn.classList.toggle('liked');
        
        if (likeBtn.classList.contains('liked')) {
            // Increase like count
            const current = parseInt(likeCount.textContent.replace(/,/g, ''));
            this.animateCounter('likeCount', current + 1);
            
            // Strong haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([50, 50, 50]);
            }
            
            this.showNotification('❤️ Like aggiunto!');
            this.createHeartAnimation();
        } else {
            // Decrease like count
            const current = parseInt(likeCount.textContent.replace(/,/g, ''));
            this.animateCounter('likeCount', Math.max(0, current - 1));
        }
    },
    
    createHeartAnimation: function() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.textContent = '❤️';
                heart.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * window.innerWidth}px;
                    top: ${window.innerHeight}px;
                    font-size: 2rem;
                    z-index: 1000;
                    pointer-events: none;
                    animation: floatUp 2s ease-out forwards;
                `;
                
                document.body.appendChild(heart);
                
                setTimeout(() => heart.remove(), 2000);
            }, i * 200);
        }
        
        // Add CSS animation if not exists
        if (!document.getElementById('heartAnimation')) {
            const style = document.createElement('style');
            style.id = 'heartAnimation';
            style.textContent = `
                @keyframes floatUp {
                    0% {
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-200px) scale(0.5);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    showComments: function() {
        if (window.TikTokModals) {
            window.TikTokModals.showChatModal();
        } else {
            this.showNotification('💬 Chat in caricamento...');
        }
    },
    
    showGifts: function() {
        if (!this.currentUser) {
            this.showNotification('🔐 Login richiesto per inviare regali');
            setTimeout(() => {
                window.location.href = '/auth.html';
            }, 1500);
            return;
        }
        
        if (window.TikTokModals) {
            window.TikTokModals.showGiftsModal();
        } else {
            this.showNotification('🎁 Sistema regali in caricamento...');
        }
    },
    
    shareStream: async function() {
        try {
            const stream = this.streams[this.currentStreamIndex];
            const shareData = {
                title: 'ICCI FREE - ' + stream.title,
                text: 'Guarda questo stream live su ICCI FREE! 🔥',
                url: window.location.href
            };
            
            if (navigator.share) {
                await navigator.share(shareData);
                this.showNotification('📤 Stream condiviso!');
            } else {
                await navigator.clipboard.writeText(shareData.url);
                this.showNotification('🔗 Link copiato negli appunti!');
            }
        } catch (error) {
            console.error('Share error:', error);
            this.showNotification('❌ Errore condivisione');
        }
    },
    
    showProfile: function() {
        if (!this.currentUser) {
            window.location.href = '/auth.html';
        } else {
            if (window.TikTokModals) {
                window.TikTokModals.showProfileModal();
            } else {
                this.showNotification('👤 Profilo in caricamento...');
            }
        }
    },
    
    // ============= NAVIGATION HANDLERS =============
    showHome: function() {
        this.updateNavigation('home');
        // Already on home (streams view)
    },
    
    showDiscover: function() {
        this.updateNavigation('discover');
        if (window.TikTokModals) {
            window.TikTokModals.showDiscoverModal();
        } else {
            this.showNotification('🔍 Scopri in caricamento...');
        }
    },
    
    goLive: function() {
        if (!this.currentUser) {
            this.showNotification('🔐 Login richiesto per andare live');
            setTimeout(() => {
                window.location.href = '/auth.html';
            }, 1500);
        } else {
            window.location.href = '/golive.html';
        }
    },
    
    showInbox: function() {
        this.updateNavigation('inbox');
        if (window.TikTokModals) {
            window.TikTokModals.showInboxModal();
        } else {
            this.showNotification('💬 Inbox in caricamento...');
        }
    },
    
    updateNavigation: function(active) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItems = document.querySelectorAll('.nav-item');
        const itemMap = { home: 0, discover: 1, live: 2, inbox: 3, profile: 4 };
        
        if (navItems[itemMap[active]]) {
            navItems[itemMap[active]].classList.add('active');
        }
    },
    
    // ============= UI STATE MANAGEMENT =============
    showLoading: function() {
        this.loadingState.style.display = 'block';
        this.noStreamsState.style.display = 'none';
    },
    
    hideLoading: function() {
        this.loadingState.style.display = 'none';
    },
    
    showNoStreams: function() {
        this.loadingState.style.display = 'none';
        this.noStreamsState.style.display = 'block';
    },
    
    // ============= AUTO-REFRESH =============
    setupAutoRefresh: function() {
        // Refresh streams every 30 seconds
        setInterval(() => {
            if (!this.isLoading) {
                this.loadStreams();
            }
        }, 30000);
        
        // Auto-advance to next stream every 30 seconds (optional)
        // setInterval(() => {
        //     if (this.streams.length > 1) {
        //         this.nextStream();
        //     }
        // }, 30000);
    },
    
    // ============= PWA FEATURES =============
    setupPWA: function() {
        // Install prompt
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button after a delay
            setTimeout(() => {
                this.showInstallPrompt(deferredPrompt);
            }, 10000);
        });
        
        // App installed
        window.addEventListener('appinstalled', () => {
            this.showNotification('📱 App installata con successo!');
        });
    },
    
    showInstallPrompt: function(deferredPrompt) {
        const installBtn = document.createElement('button');
        installBtn.innerHTML = '📱 Installa App';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 20px;
            right: 20px;
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #000;
            border: none;
            padding: 16px;
            border-radius: 25px;
            font-weight: 700;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);
            animation: slideUp 0.3s ease;
        `;
        
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`PWA install outcome: ${outcome}`);
                deferredPrompt = null;
                installBtn.remove();
            }
        });
        
        document.body.appendChild(installBtn);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (installBtn.parentElement) {
                installBtn.style.animation = 'slideDown 0.3s ease';
                setTimeout(() => installBtn.remove(), 300);
            }
        }, 10000);
        
        // Add CSS animations if not exists
        if (!document.getElementById('installAnimations')) {
            const style = document.createElement('style');
            style.id = 'installAnimations';
            style.textContent = `
                @keyframes slideUp {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideDown {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(100px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // ============= ANALYTICS =============
    trackStreamView: function(streamId) {
        try {
            if (window.Analytics) {
                window.Analytics.track('tiktok_stream_view', {
                    streamId: streamId,
                    platform: 'mobile',
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                });
            }
            
            console.log('📊 Stream view tracked:', streamId);
        } catch (error) {
            console.error('❌ Analytics error:', error);
        }
    },
    
    // ============= NOTIFICATIONS =============
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            left: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            color: #fff;
            padding: 16px 20px;
            border-radius: 25px;
            z-index: 10000;
            text-align: center;
            font-weight: 600;
            border: 1px solid rgba(255, 215, 0, 0.3);
            transform: translateY(-100px);
            opacity: 0;
            transition: all 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Animate out
        setTimeout(() => {
            notification.style.transform = 'translateY(-100px)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 2700);
    }
};

// ============= AUTO INITIALIZE =============
document.addEventListener('DOMContentLoaded', () => {
    TikTokApp.init();
});

// Export globally
window.TikTokApp = TikTokApp;

console.log('✅ TikTok-style Mobile App loaded');