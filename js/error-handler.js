// ============= GLOBAL ERROR HANDLER V2.0 =============

class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.errorCount = 0;
    }
    
    // ============= INIT =============
    init() {
        // Cattura errori JavaScript globali
        window.addEventListener('error', (e) => {
            this.handleError({
                type: 'JavaScript Error',
                message: e.error?.message || e.message,
                stack: e.error?.stack,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno
            });
        });
        
        // Cattura Promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            this.handleError({
                type: 'Promise Rejection',
                message: e.reason?.message || e.reason,
                stack: e.reason?.stack
            });
        });
        
        // Cattura errori di risorse
        window.addEventListener('error', (e) => {
            if (e.target !== window) {
                this.handleError({
                    type: 'Resource Error',
                    message: `Failed to load: ${e.target.src || e.target.href}`,
                    element: e.target.tagName
                });
            }
        }, true);
        
        // Override console.error
        const originalError = console.error;
        console.error = (...args) => {
            this.handleError({
                type: 'Console Error',
                message: args.join(' ')
            });
            originalError.apply(console, args);
        };
        
        console.log('✅ Error Handler attivo');
    }
    
    // ============= HANDLE ERROR =============
    handleError(errorData) {
        this.errorCount++;
        
        const error = {
            ...errorData,
            id: this.errorCount,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            memory: performance.memory ? {
                used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + 'MB',
                total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + 'MB'
            } : null
        };
        
        this.errors.push(error);
        
        // Mantieni solo ultimi N errori
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        // Log nel console per debug
        console.warn('🐛 Error logged:', error.type, '-', error.message);
        
        // Invia a analytics
        this.sendToAnalytics(error);
        
        // Mostra toast solo per errori critici
        if (this.shouldShowToast(error)) {
            this.showErrorToast(error);
        }
        
        // Recovery automatico per alcuni errori
        this.attemptRecovery(error);
    }
    
    // ============= SHOULD SHOW TOAST =============
    shouldShowToast(error) {
        // Non mostrare per errori di risorse o console
        if (error.type === 'Resource Error' || error.type === 'Console Error') {
            return false;
        }
        
        // Mostra solo se è il primo errore dello stesso tipo
        const sameTypeErrors = this.errors.filter(e => 
            e.type === error.type && 
            e.message === error.message
        );
        
        return sameTypeErrors.length === 1;
    }
    
    // ============= SHOW ERROR TOAST =============
    showErrorToast(error) {
        // Rimuovi toast esistenti
        document.querySelectorAll('.error-toast').forEach(t => t.remove());
        
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 10px 30px rgba(255, 68, 68, 0.4);
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
        `;
        
        const userMessage = this.getUserFriendlyMessage(error);
        
        toast.innerHTML = `
            <span style="font-size: 24px;">⚠️</span>
            <div style="flex: 1;">
                <div style="font-weight: 700; margin-bottom: 4px;">Errore Temporaneo</div>
                <div style="font-size: 14px; opacity: 0.9;">${userMessage}</div>
            </div>
            <button onclick="this.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-weight: bold;
            ">×</button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove dopo 7 secondi
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 7000);
    }
    
    // ============= USER FRIENDLY MESSAGE =============
    getUserFriendlyMessage(error) {
        const messages = {
            'JavaScript Error': 'Si è verificato un problema. Aggiornando la pagina dovrebbe risolversi.',
            'Promise Rejection': 'Errore di connessione. Verifica la tua rete.',
            'Resource Error': 'Impossibile caricare alcune risorse. Prova a ricaricare.',
            'Console Error': 'Errore dell\'applicazione. Il team è stato notificato.'
        };
        
        return messages[error.type] || 'Si è verificato un errore imprevisto.';
    }
    
    // ============= SEND TO ANALYTICS =============
    async sendToAnalytics(error) {
        try {
            // Invia a tuo servizio analytics/logging
            // await fetch('/api/log-error', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(error)
            // });
            
            // Per ora solo log
            if (window.Analytics) {
                window.Analytics.track('error_occurred', {
                    errorType: error.type,
                    errorMessage: error.message
                });
            }
        } catch (e) {
            // Silently fail
        }
    }
    
    // ============= ATTEMPT RECOVERY =============
    attemptRecovery(error) {
        // Recovery per errori di rete
        if (error.message?.includes('Failed to fetch') || 
            error.message?.includes('Network') ||
            error.type === 'Promise Rejection') {
            
            // Verifica connessione
            if (!navigator.onLine) {
                this.showOfflineMessage();
            }
        }
        
        // Recovery per errori WebRTC
        if (error.message?.includes('WebRTC') || 
            error.message?.includes('getUserMedia')) {
            
            console.log('🔄 Tentativo recovery WebRTC...');
            // Trigger re-init se esiste
            if (window.webRTCStreaming) {
                setTimeout(() => {
                    window.webRTCStreaming.reconnect?.();
                }, 2000);
            }
        }
    }
    
    // ============= OFFLINE MESSAGE =============
    showOfflineMessage() {
        const offlineToast = document.createElement('div');
        offlineToast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff9800;
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            z-index: 10001;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        offlineToast.textContent = '📡 Connessione persa. Riconnessione automatica...';
        
        document.body.appendChild(offlineToast);
        
        // Rimuovi quando torna online
        window.addEventListener('online', () => {
            offlineToast.remove();
            showNotification('✅ Connessione ripristinata!', 'success');
        }, { once: true });
    }
    
    // ============= GET ERRORS =============
    getErrors() {
        return this.errors;
    }
    
    // ============= GET ERROR REPORT =============
    getErrorReport() {
        const errorsByType = this.errors.reduce((acc, error) => {
            acc[error.type] = (acc[error.type] || 0) + 1;
            return acc;
        }, {});
        
        return {
            totalErrors: this.errors.length,
            errorsByType,
            recentErrors: this.errors.slice(-10),
            timestamp: new Date().toISOString()
        };
    }
    
    // ============= CLEAR ERRORS =============
    clearErrors() {
        this.errors = [];
        this.errorCount = 0;
        console.log('🧹 Error log cleared');
    }
    
    // ============= DOWNLOAD ERROR LOG =============
    downloadErrorLog() {
        const report = this.getErrorReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ============= AUTO-INIT =============
const errorHandler = new ErrorHandler();
errorHandler.init();

// Expose globalmente
window.ErrorHandler = errorHandler;

// Debug helper per console
window.getErrorReport = () => errorHandler.getErrorReport();
window.downloadErrorLog = () => errorHandler.downloadErrorLog();

console.log('✅ Error Handler loaded');
