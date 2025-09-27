// ============= PERFORMANCE OPTIMIZER V2.0 =============

class PerformanceOptimizer {
    constructor() {
        this.observer = null;
        this.imageCache = new Map();
        this.performanceMetrics = [];
    }
    
    // ============= LAZY LOADING =============
    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        
                        if (img.dataset.srcset) {
                            img.srcset = img.dataset.srcset;
                            img.removeAttribute('data-srcset');
                        }
                        
                        this.observer.unobserve(img);
                    }
                });
            }, { 
                rootMargin: '50px',
                threshold: 0.01
            });
            
            // Osserva tutte le immagini con data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.observer.observe(img);
            });
            
            console.log('✅ Lazy loading attivo');
        }
    }
    
    // ============= IMAGE OPTIMIZATION =============
    optimizeImage(url, width = 400, quality = 80) {
        const cacheKey = `${url}-${width}-${quality}`;
        
        if (this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey);
        }
        
        let optimized = url;
        
        // Supabase Storage transformation
        if (url.includes('supabase.co/storage')) {
            optimized = `${url}?width=${width}&quality=${quality}`;
        }
        // Cloudinary transformation
        else if (url.includes('cloudinary.com')) {
            optimized = url.replace('/upload/', `/upload/w_${width},q_${quality}/`);
        }
        
        this.imageCache.set(cacheKey, optimized);
        return optimized;
    }
    
    // ============= PRECONNECT =============
    preconnect() {
        const domains = [
            'https://cdn.jsdelivr.net',
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://www.google.com'
        ];
        
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
        
        console.log('✅ Preconnect configurato');
    }
    
    // ============= DEBOUNCE =============
    debounce(func, wait = 200) {
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
    
    // ============= THROTTLE =============
    throttle(func, limit = 100) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // ============= REQUEST IDLE CALLBACK =============
    requestIdleCallback(callback) {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(callback);
        } else {
            setTimeout(callback, 1);
        }
    }
    
    // ============= PREFETCH PAGES =============
    prefetchPages() {
        const pages = [
            '/dashboard.html',
            '/auth.html',
            '/golive.html'
        ];
        
        this.requestIdleCallback(() => {
            pages.forEach(page => {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = page;
                link.as = 'document';
                document.head.appendChild(link);
            });
            
            console.log('✅ Pages prefetched');
        });
    }
    
    // ============= MONITOR PERFORMANCE =============
    monitorPerformance() {
        if ('PerformanceObserver' in window) {
            try {
                // Monitor long tasks
                const longTaskObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.duration > 50) {
                            console.warn('⚠️ Long task:', entry.duration.toFixed(2) + 'ms');
                            this.performanceMetrics.push({
                                type: 'long-task',
                                duration: entry.duration,
                                timestamp: Date.now()
                            });
                        }
                    });
                });
                
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                
                // Monitor layout shifts
                const clsObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.value > 0.1) {
                            console.warn('⚠️ Layout shift:', entry.value.toFixed(3));
                        }
                    });
                });
                
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                
                console.log('✅ Performance monitoring attivo');
            } catch (e) {
                console.warn('Performance monitoring non disponibile');
            }
        }
    }
    
    // ============= CORE WEB VITALS =============
    measureCoreWebVitals() {
        // LCP - Largest Contentful Paint
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('📊 LCP:', lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // FID - First Input Delay
        new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach(entry => {
                console.log('📊 FID:', entry.processingStart - entry.startTime);
            });
        }).observe({ entryTypes: ['first-input'] });
        
        // CLS - Cumulative Layout Shift
        let clsScore = 0;
        new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsScore += entry.value;
                }
            });
            console.log('📊 CLS:', clsScore.toFixed(3));
        }).observe({ entryTypes: ['layout-shift'] });
    }
    
    // ============= OPTIMIZE FONTS =============
    optimizeFonts() {
        // Font display swap
        const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        fontLinks.forEach(link => {
            const url = new URL(link.href);
            url.searchParams.set('display', 'swap');
            link.href = url.toString();
        });
    }
    
    // ============= REDUCE MOTION =============
    respectReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            document.documentElement.style.setProperty('--transition-fast', '0s');
            document.documentElement.style.setProperty('--transition-medium', '0s');
            document.documentElement.style.setProperty('--transition-slow', '0s');
            
            console.log('✅ Reduced motion attivo');
        }
    }
    
    // ============= INIT =============
    init() {
        console.log('🚀 Performance Optimizer init...');
        
        this.preconnect();
        this.initLazyLoading();
        this.prefetchPages();
        this.monitorPerformance();
        this.measureCoreWebVitals();
        this.optimizeFonts();
        this.respectReducedMotion();
        
        // Re-observe su contenuto dinamico
        const mutationObserver = new MutationObserver(() => {
            const newImages = document.querySelectorAll('img[data-src]:not([data-observed])');
            newImages.forEach(img => {
                img.setAttribute('data-observed', 'true');
                if (this.observer) this.observer.observe(img);
            });
        });
        
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ Performance Optimizer attivo');
    }
    
    // ============= GET METRICS =============
    getMetrics() {
        return {
            longTasks: this.performanceMetrics.filter(m => m.type === 'long-task'),
            imageCache: this.imageCache.size,
            timestamp: Date.now()
        };
    }
}

// ============= AUTO-INIT =============
const perfOptimizer = new PerformanceOptimizer();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => perfOptimizer.init());
} else {
    perfOptimizer.init();
}

window.PerformanceOptimizer = perfOptimizer;

console.log('✅ Performance Optimizer loaded');
