// ============= SUPABASE CONFIG OTTIMIZZATO V2.0 =============

console.log('🔧 Caricamento Supabase ottimizzato...');

// Configurazione
const SUPABASE_URL = 'https://itfndtgrfjvnavbitfgy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0Zm5kdGdyZmp2bmF2Yml0Zmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4ODc3MjIsImV4cCI6MjA3MzQ2MzcyMn0.73_f6oR5cQWL2Y69EMZ-FciDXkle_85okZ9pOOgmXu4';

// Verifica Supabase library
if (typeof supabase === 'undefined') {
    console.error('❌ Supabase library non caricata!');
    throw new Error('Supabase library mancante');
}

// Crea client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: { eventsPerSecond: 2 }
    }
});

// ============= AUTH HELPERS =============

async function checkUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error) {
            const { data: { session } } = await supabaseClient.auth.getSession();
            return session?.user || null;
        }
        
        return user;
    } catch (error) {
        console.error('❌ checkUser error:', error);
        return null;
    }
}

async function hasCompletedProfile(userId) {
    if (!userId) return false;
    
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('username, date_of_birth')
            .eq('id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Profile check error:', error);
            return false;
        }
        
        return data && data.username && data.date_of_birth;
    } catch (error) {
        console.error('hasCompletedProfile error:', error);
        return false;
    }
}

async function logout() {
    try {
        await supabaseClient.auth.signOut();
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
}

// ============= NOTIFICATIONS =============

function showNotification(message, type = 'info', duration = 4000) {
    const notification = document.createElement('div');
    
    const colors = {
        success: '#00ff00',
        error: '#ff4444',
        warning: '#FFD700',
        info: '#00aaff'
    };
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1a1a1a;
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        border-left: 4px solid ${colors[type]};
        z-index: 10000;
        max-width: 350px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
    `;
    
    notification.innerHTML = `${icons[type]} ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// ============= RETRY HELPER =============

async function retryAsync(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
}

// ============= DATABASE TEST =============

async function testDatabaseConnection() {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('count')
            .limit(1);
        
        if (error) throw error;
        
        console.log('✅ Database OK');
        return true;
    } catch (error) {
        console.error('❌ Database FAILED:', error);
        return false;
    }
}

// ============= AUTH STATE LISTENER =============

supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth:', event);
    
    switch (event) {
        case 'SIGNED_IN':
            console.log('✅ User:', session?.user?.email);
            break;
        case 'SIGNED_OUT':
            console.log('👋 Logged out');
            break;
        case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed');
            break;
    }
});

// ============= EXPORTS =============

window.supabaseClient = supabaseClient;
window.checkUser = checkUser;
// Compat: alcune parti del codice usano getCurrentUser
window.getCurrentUser = checkUser;
window.hasCompletedProfile = hasCompletedProfile;
window.logout = logout;
window.showNotification = showNotification;
window.retryAsync = retryAsync;
window.testDatabaseConnection = testDatabaseConnection;

// ============= ANIMATIONS CSS =============

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ============= INIT TEST =============

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Supabase initialized');
    const connected = await testDatabaseConnection();
    if (!connected) {
        showNotification('Errore connessione database', 'error');
    }
});

console.log('✅ Supabase.js loaded');
