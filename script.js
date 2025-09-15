// Animazione contatore per gli stats
document.addEventListener('DOMContentLoaded', function() {
    // Simula streamer live
    let liveCount = 0;
    const liveCounter = document.querySelector('.stats .number');
    
    setInterval(() => {
        liveCount = Math.floor(Math.random() * 10);
        if(liveCounter) {
            liveCounter.textContent = liveCount;
        }
    }, 3000);

    // Click handlers
    document.querySelector('.primary-btn').addEventListener('click', () => {
        alert('Coming Soon! Stiamo preparando qualcosa di incredibile...');
    });

    document.querySelector('.secondary-btn').addEventListener('click', () => {
        alert('Nessuna live al momento. Sii il primo!');
    });

    document.querySelector('.login-btn').addEventListener('click', (e) => {
        e.preventDefault();
        alert('Login coming soon!');
    });
});

console.log('ICCI FREE - No censorship
