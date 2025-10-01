// ============= MOBILE DETECTOR & AUTO-ADAPTER V1.0 =============
// Rilevamento automatico dispositivo mobile e adattamento UI

console.log('📱 Mobile Detector loading...');

class MobileDetector {
    constructor() {
        this.isMobile = false;
        this.isTablet = false;
        this.isDesktop = false;
        this.deviceType = 'unknown';
        this.orientation = 'portrait';
        this.touchEnabled = false;
        this.userAgent = navigator.userAgent;
        
        this.init();
    }
    
    // ============= DETECT DEVICE TYPE =============
    detectDeviceType() {
        // Touch detection
        this.touchEnabled = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 || 
                           navigator.msMaxTouchPoints > 0;
        
        // Mobile detection (comprehensive)
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
        const tabletRegex = /iPad|Android(?=.*Tablet)|Kindle|Silk/i;
        
        // Screen size detection
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isSmallScreen = screenWidth <= 768;
        const isMediumScreen = screenWidth > 768 && screenWidth <= 1024;
        
        // Determine device type
        if (tabletRegex.test(this.userAgent) || (this.touchEnabled && isMediumScreen)) {
            this.deviceType = 'tablet';
            this.isTablet = true;
        } else if (mobileRegex.test(this.userAgent) || (this.touchEnabled && isSmallScreen)) {
            this.deviceType = 'mobile';
            this.isMobile = true;
        } else {
            this.deviceType = 'desktop';
            this.isDesktop = true;
        }
        
        console.log(`📱 Device detected: ${this.deviceType}`, {
            userAgent: this.userAgent,
            touchEnabled: this.touchEnabled,
            screenSize: `${screenWidth}x${screenHeight}`,
            isSmallScreen,
            isMediumScreen
        });
    }
    
    // ============= DETECT ORIENTATION =============
    detectOrientation() {
        this.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        
        // Add orientation change listener
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
                this.handleOrientationChange();
            }, 100);
        });
        
        window.addEventListener('resize', this.debounce(() => {
            this.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
            this.handleOrientationChange();
        }, 250));
    }
    
    // ============= APPLY MOBILE CLASSES =============
    applyMobileClasses() {
        const html = document.documentElement;
        const body = document.body;
        
        // Remove existing classes
        html.classList.remove('mobile', 'tablet', 'desktop', 'portrait', 'landscape');
        body.classList.remove('mobile', 'tablet', 'desktop', 'portrait', 'landscape');
        
        // Add device type classes
        html.classList.add(this.deviceType);
        body.classList.add(this.deviceType);
        
        // Add orientation classes
        html.classList.add(this.orientation);
        body.classList.add(this.orientation);
        
        // Add touch class if touch enabled
        if (this.touchEnabled) {
            html.classList.add('touch-enabled');
            body.classList.add('touch-enabled');
        } else {
            html.classList.add('no-touch');
            body.classList.add('no-touch');
        }
        
        console.log(`📱 Applied classes: ${this.deviceType}, ${this.orientation}, ${this.touchEnabled ? 'touch' : 'no-touch'}`);
    }
    
    // ============= ENABLE MOBILE FEATURES =============
    enableMobileFeatures() {
        if (this.isMobile || this.isTablet) {
            console.log('📱 Enabling mobile-specific features...');
            
            // Enable viewport meta tag optimization
            this.optimizeViewport();
            
            // Enable touch gestures
            this.enableTouchGestures();
            
            // Enable mobile navigation
            this.enableMobileNavigation();
            
            // Enable mobile streaming UI
            this.enableMobileStreamingUI();
            
            // Enable mobile performance optimizations
            this.enableMobilePerformance();
            
            // Enable mobile-specific analytics
            this.enableMobileAnalytics();
            
            // Enable mobile PWA features
            this.enableMobilePWA();
        }
    }
    
    // ============= OPTIMIZE VIEWPORT =============
    optimizeViewport() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            if (this.isMobile) {
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
            } else if (this.isTablet) {
                viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
            }
        }
    }
    
    // ============= ENABLE TOUCH GESTURES =============
    enableTouchGestures() {
        console.log('👆 Enabling touch gestures...');
        
        // Add touch-specific CSS
        const touchCSS = `
            <style id="mobile-touch-css">
                /* Touch-friendly elements */
                .touch-enabled button, .touch-enabled a, .touch-enabled [role="button"] {
                    min-height: 44px;
                    min-width: 44px;
                    touch-action: manipulation;
                }
                
                /* Prevent zoom on input focus */
                .touch-enabled input, .touch-enabled textarea, .touch-enabled select {
                    font-size: 16px;
                }
                
                /* Smooth scrolling for touch */
                .touch-enabled {
                    -webkit-overflow-scrolling: touch;
                }
                
                /* Mobile-specific styles */
                .mobile .navbar {
                    padding: 10px 15px;
                }
                
                .mobile .nav-links {
                    display: none;
                }
                
                .mobile .mobile-menu-toggle {
                    display: block;
                }
                
                .mobile .hero-section {
                    padding: 60px 20px 40px;
                }
                
                .mobile .hero-title {
                    font-size: 2.5rem;
                    line-height: 1.2;
                }
                
                .mobile .features-grid {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
                
                .mobile .feature-card {
                    padding: 20px;
                }
                
                /* Tablet-specific styles */
                .tablet .features-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                /* Portrait vs Landscape */
                .portrait .hero-section {
                    min-height: 100vh;
                }
                
                .landscape .hero-section {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                }
            </style>
        `;
        
        if (!document.getElementById('mobile-touch-css')) {
            document.head.insertAdjacentHTML('beforeend', touchCSS);
        }
    }
    
    // ============= ENABLE MOBILE NAVIGATION =============
    enableMobileNavigation() {
        console.log('🧭 Enabling mobile navigation...');
        
        // Auto-show mobile menu toggle on mobile
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileToggle && this.isMobile) {
            mobileToggle.style.display = 'block';
        }
        
        // Enable swipe navigation
        if (this.touchEnabled) {
            this.enableSwipeNavigation();
        }
    }
    
    // ============= ENABLE SWIPE NAVIGATION =============
    enableSwipeNavigation() {
        let startX = 0;
        let startY = 0;
        let isScrolling = false;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isScrolling = false;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            const diffX = Math.abs(e.touches[0].clientX - startX);
            const diffY = Math.abs(e.touches[0].clientY - startY);
            
            if (diffY > diffX) {
                isScrolling = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (isScrolling || !startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;
            
            // Swipe threshold
            if (Math.abs(diffX) > 100) {
                if (diffX > 0) {
                    // Swipe left - next page/section
                    this.handleSwipeLeft();
                } else {
                    // Swipe right - previous page/section
                    this.handleSwipeRight();
                }
            }
            
            startX = 0;
            startY = 0;
        }, { passive: true });
    }
    
    // ============= SWIPE HANDLERS =============
    handleSwipeLeft() {
        console.log('👈 Swipe left detected');
        
        // Navigate to next section or page
        const currentPath = window.location.pathname;
        
        if (currentPath === '/') {
            // On homepage, scroll to next section
            const sections = document.querySelectorAll('section');
            const currentSection = this.getCurrentSection();
            if (currentSection && currentSection.nextElementSibling) {
                currentSection.nextElementSibling.scrollIntoView({ 
                    behavior: 'smooth' 
                });
            }
        }
    }
    
    handleSwipeRight() {
        console.log('👉 Swipe right detected');
        
        // Navigate to previous section or page
        const currentPath = window.location.pathname;
        
        if (currentPath === '/') {
            // On homepage, scroll to previous section
            const sections = document.querySelectorAll('section');
            const currentSection = this.getCurrentSection();
            if (currentSection && currentSection.previousElementSibling) {
                currentSection.previousElementSibling.scrollIntoView({ 
                    behavior: 'smooth' 
                });
            }
        }
    }
    
    // ============= GET CURRENT SECTION =============
    getCurrentSection() {
        const sections = document.querySelectorAll('section');
        let currentSection = sections[0];
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                currentSection = section;
            }
        });
        
        return currentSection;
    }
    
    // ============= ENABLE MOBILE STREAMING UI =============
    enableMobileStreamingUI() {
        console.log('📺 Enabling mobile streaming UI...');
        
        // Auto-enable mobile streaming features
        if (this.isMobile && window.location.pathname.includes('stream-viewer')) {
            this.enableMobileStreamViewer();
        }
        
        if (this.isMobile && window.location.pathname.includes('golive')) {
            this.enableMobileGoLive();
        }
    }
    
    // ============= ENABLE MOBILE STREAM VIEWER =============
    enableMobileStreamViewer() {
        const mobileStreamCSS = `
            <style id="mobile-stream-css">
                .mobile .stream-page {
                    overflow: hidden;
                }
                
                .mobile .action-rail {
                    right: 10px;
                    bottom: 100px;
                }
                
                .mobile .action-btn {
                    width: 48px;
                    height: 48px;
                    font-size: 20px;
                }
                
                .mobile .bottom-info {
                    right: 70px;
                }
                
                .mobile .gems-display-header {
                    top: 10px;
                    right: 10px;
                    padding: 8px 12px;
                }
                
                /* Enable TikTok-style vertical scrolling */
                .mobile .stream-page {
                    height: 100vh;
                    overflow-y: hidden;
                }
            </style>
        `;
        
        if (!document.getElementById('mobile-stream-css')) {
            document.head.insertAdjacentHTML('beforeend', mobileStreamCSS);
        }
    }
    
    // ============= ENABLE MOBILE GO LIVE =============
    enableMobileGoLive() {
        const mobileGoLiveCSS = `
            <style id="mobile-golive-css">
                .mobile .stream-setup {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
                
                .mobile .preview-area {
                    min-height: 250px;
                }
                
                .mobile .stream-controls {
                    flex-direction: column;
                }
                
                .mobile .control-button {
                    min-width: auto;
                    margin-bottom: 10px;
                }
            </style>
        `;
        
        if (!document.getElementById('mobile-golive-css')) {
            document.head.insertAdjacentHTML('beforeend', mobileGoLiveCSS);
        }
    }
    
    // ============= ENABLE MOBILE PERFORMANCE =============
    enableMobilePerformance() {
        console.log('⚡ Enabling mobile performance optimizations...');
        
        // Reduce animations on mobile for better performance
        if (this.isMobile) {
            const performanceCSS = `
                <style id="mobile-performance-css">
                    .mobile * {
                        animation-duration: 0.3s !important;
                        transition-duration: 0.3s !important;
                    }
                    
                    .mobile .hero-section {
                        background-attachment: scroll;
                    }
                    
                    /* Disable expensive effects on mobile */
                    .mobile .feature-card:hover {
                        transform: none;
                    }
                </style>
            `;
            
            if (!document.getElementById('mobile-performance-css')) {
                document.head.insertAdjacentHTML('beforeend', performanceCSS);
            }
        }
        
        // Enable mobile-specific optimizations
        if (this.isMobile && window.PerformanceOptimizer) {
            // Reduce image quality on mobile
            window.PerformanceOptimizer.mobileImageQuality = 60;
            
            // Reduce batch size for analytics
            if (window.Analytics) {
                window.Analytics.batchSize = 5;
            }
        }
    }
    
    // ============= ENABLE MOBILE ANALYTICS =============
    enableMobileAnalytics() {
        console.log('📊 Enabling mobile analytics...');
        
        // Track mobile-specific events
        if (window.Analytics) {
            window.Analytics.track('mobile_detection', {
                deviceType: this.deviceType,
                orientation: this.orientation,
                touchEnabled: this.touchEnabled,
                screenSize: `${window.innerWidth}x${window.innerHeight}`,
                userAgent: this.userAgent
            });
        }
    }
    
    // ============= ENABLE MOBILE PWA =============
    enableMobilePWA() {
        console.log('📱 Enabling mobile PWA features...');
        
        if (this.isMobile && 'serviceWorker' in navigator) {
            // Auto-register service worker on mobile
            navigator.serviceWorker.register('/service-worker.js')
                .then(() => console.log('📱 Mobile PWA: Service Worker registered'))
                .catch(err => console.warn('📱 Mobile PWA: Service Worker failed', err));
        }
        
        // Enable mobile-specific PWA features
        if (this.isMobile) {
            this.enableMobileInstallPrompt();
        }
    }
    
    // ============= ENABLE MOBILE INSTALL PROMPT =============
    enableMobileInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show custom install button
            this.showMobileInstallButton(deferredPrompt);
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('📱 PWA installed successfully');
            if (window.Analytics) {
                window.Analytics.track('pwa_installed', { deviceType: this.deviceType });
            }
        });
    }
    
    // ============= SHOW MOBILE INSTALL BUTTON =============
    showMobileInstallButton(deferredPrompt) {
        const installButton = document.createElement('button');
        installButton.innerHTML = '📱 Installa App';
        installButton.className = 'mobile-install-btn';
        installButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 700;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);
        `;
        
        installButton.addEventListener('click', () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('📱 User accepted PWA install');
                }
                deferredPrompt = null;
                installButton.remove();
            });
        });
        
        document.body.appendChild(installButton);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (installButton.parentElement) {
                installButton.remove();
            }
        }, 10000);
    }
    
    // ============= HANDLE ORIENTATION CHANGE =============
    handleOrientationChange() {
        console.log(`📱 Orientation changed to: ${this.orientation}`);
        
        // Re-apply classes
        this.applyMobileClasses();
        
        // Track orientation change
        if (window.Analytics) {
            window.Analytics.track('orientation_change', {
                orientation: this.orientation,
                deviceType: this.deviceType
            });
        }
        
        // Handle specific orientation changes
        if (this.orientation === 'landscape' && this.isMobile) {
            this.handleLandscapeMode();
        } else if (this.orientation === 'portrait' && this.isMobile) {
            this.handlePortraitMode();
        }
    }
    
    // ============= HANDLE LANDSCAPE MODE =============
    handleLandscapeMode() {
        console.log('📱 Handling landscape mode...');
        
        // Adjust video player for landscape
        const video = document.querySelector('video');
        if (video) {
            video.style.objectFit = 'contain';
        }
        
        // Hide mobile menu if open
        const navLinks = document.querySelector('.nav-links');
        if (navLinks && navLinks.classList.contains('mobile-active')) {
            navLinks.classList.remove('mobile-active');
        }
    }
    
    // ============= HANDLE PORTRAIT MODE =============
    handlePortraitMode() {
        console.log('📱 Handling portrait mode...');
        
        // Adjust video player for portrait
        const video = document.querySelector('video');
        if (video) {
            video.style.objectFit = 'cover';
        }
    }
    
    // ============= UTILITY METHODS =============
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // ============= GET DEVICE INFO =============
    getDeviceInfo() {
        return {
            deviceType: this.deviceType,
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            isDesktop: this.isDesktop,
            orientation: this.orientation,
            touchEnabled: this.touchEnabled,
            screenSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            userAgent: this.userAgent
        };
    }
    
    // ============= INIT =============
    init() {
        console.log('📱 Mobile Detector initializing...');
        
        // Detect device type
        this.detectDeviceType();
        
        // Detect orientation
        this.detectOrientation();
        
        // Apply mobile classes
        this.applyMobileClasses();
        
        // Enable mobile features
        this.enableMobileFeatures();
        
        console.log('✅ Mobile Detector ready:', this.getDeviceInfo());
    }
}

// ============= AUTO-INIT =============
const mobileDetector = new MobileDetector();

// Export globally
window.MobileDetector = mobileDetector;

// Export device info
window.isMobile = () => mobileDetector.isMobile;
window.isTablet = () => mobileDetector.isTablet;
window.isDesktop = () => mobileDetector.isDesktop;
window.getDeviceInfo = () => mobileDetector.getDeviceInfo();

console.log('✅ Mobile Detector loaded');