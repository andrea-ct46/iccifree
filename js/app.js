// ============= APP.JS - HOMEPAGE LOGIC =============

console.log('🚀 App.js loading...');

// ============= INIT =============
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📋 Homepage init...');
    
    try {
        // Check se utente loggato
        const user = await checkUser();
        
        // Aggiorna bottoni in base allo stato
        updateNavButtons(user);
        
        // Animazioni scroll
        initScrollAnimations();
        
        // Stats counter animation
        initStatsCounter();
        
        console.log('✅ Homepage ready');
        
    } catch (error) {
        console.error('❌ Homepage init error:', error);
    }
});

// ============= UPDATE NAV BUTTONS =============
function updateNavButtons(user) {
    const navLoginBtn = document.getElementById('navLoginBtn');
    const heroCtaBtn = document.getElementById('heroCtaBtn');
    
    if (user) {
        // Utente loggato
        if (navLoginBtn) {
            navLoginBtn.innerHTML = '<span>Dashboard</span>';
            navLoginBtn.href = '/dashboard.html';
        }
        if (heroCtaBtn) {
            heroCtaBtn.innerHTML = '<span class="btn-text">Vai alla Dashboard</span><span class="btn-icon">→</span>';
            heroCtaBtn.href = '/dashboard.html';
        }
    } else {
        // Utente non loggato
        if (navLoginBtn) {
            navLoginBtn.innerHTML = '<span>Login</span>';
            navLoginBtn.href = '/auth.html';
        }
        if (heroCtaBtn) {
            heroCtaBtn.innerHTML = '<span class="btn-text">Inizia a Streammare</span><span class="btn-icon">→</span>';
            heroCtaBtn.href = '/auth.html';
        }
    }
}

// ============= SCROLL ANIMATIONS =============
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Osserva elementi da animare
    document.querySelectorAll('.feature-card, .stat-card').forEach(el => {
        observer.observe(el);
    });
}

// ============= STATS COUNTER ANIMATION =============
function initStatsCounter() {
    const liveCountEl = document.getElementById('liveCount');
    if (!liveCountEl) return;
    
    let count = 0;
    
    const updateCount = () => {
        count = Math.floor(Math.random() * 50) + 10;
        liveCountEl.textContent = count;
    };
    
    // Update iniziale
    updateCount();
    
    // Update ogni 3 secondi
    setInterval(updateCount, 3000);
}

// ============= MOBILE MENU =============
window.toggleMobileMenu = function() {
    const navLinks = document.querySelector('.nav-links');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (navLinks) navLinks.classList.toggle('mobile-active');
    if (toggle) toggle.classList.toggle('active');
};

// ============= SMOOTH SCROLL =============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // Chiudi menu mobile se aperto
            const navLinks = document.querySelector('.nav-links');
            if (navLinks && navLinks.classList.contains('mobile-active')) {
                window.toggleMobileMenu();
            }
        }
    });
});

// ============= PARALLAX EFFECT =============
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.hero-section');
    
    parallaxElements.forEach(el => {
        const speed = 0.5;
        el.style.transform = `translateY(${scrolled * speed}px)`;
    });
}, { passive: true });

// ============= INTERSECTION OBSERVER FOR FEATURES =============
const featureObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.animation = `fadeInUp 0.6s ease-out backwards`;
            }, index * 100);
            featureObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.feature-card').forEach(card => {
    featureObserver.observe(card);
});

// ============= ADD ANIMATION CSS =============
(() => {
	const appAnimationsStyle = document.createElement('style');
	appAnimationsStyle.textContent = `
		@keyframes fadeInUp {
			from {
				opacity: 0;
				transform: translateY(30px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
		
		.animate-in {
			animation: fadeInUp 0.6s ease-out;
		}
	`;
	document.head.appendChild(appAnimationsStyle);
})();

console.log('✅ App.js loaded');
