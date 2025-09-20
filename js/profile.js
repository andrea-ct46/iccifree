// ======================================================
// ICCI FREE - PROFILE PAGE CONTROLLER
// ======================================================

let currentUser = null;
let profileUser = null;

async function initializeProfilePage() {
    const messageContainer = document.getElementById('messageState');
    const messageText = document.getElementById('messageText');
    const profileContainer = document.getElementById('profileContainer');
    
    try {
        // Get current user
        currentUser = await checkUser();
        
        // Get username from URL
        const params = new URLSearchParams(window.location.search);
        let username = params.get('user');
        
        // If no username, try to use current user's
        if (!username && currentUser) {
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('username')
                .eq('id', currentUser.id)
                .single();
                
            if (profile?.username) {
                window.location.replace(`/profile.html?user=${profile.username}`);
                return;
            }
        }
        
        if (!username) {
            messageText.innerHTML = '<p>Nessun profilo specificato.</p>';
            return;
        }
        
        // Load profile data
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();
            
        if (error || !profile) {
            messageText.innerHTML = `<p>Utente "${username}" non trovato.</p>`;
            return;
        }
        
        profileUser = profile;
        
        // Setup page
        populateProfileData(profile);
        await setupActionButtons(profile);
        await loadProfileContent(profile);
        setupTabs(profile);
        
        // Show profile
        profileContainer.style.display = 'block';
        messageContainer.style.display = 'none';
        
    } catch (err) {
        console.error('Errore caricamento profilo:', err);
        messageText.innerHTML = '<p>Errore nel caricamento del profilo.</p>';
    }
}

// Populate profile information
function populateProfileData(profile) {
    document.title = `${profile.username} - ICCI FREE`;
    
    // Username
    const usernameEl = document.getElementById('profileUsername');
    if (usernameEl) usernameEl.textContent = profile.username;
    
    // Bio
    const bioEl = document.getElementById('profileBio');
    if (bioEl) bioEl.textContent = profile.bio || 'Nessuna biografia impostata.';
    
    // Stats
    updateProfileStats(profile);
    
    // Avatar
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        if (profile.avatar_url) {
            profileAvatar.src = profile.avatar_url;
        } else {
            const initials = profile.username.substring(0, 2).toUpperCase();
            const colors = ['FF5733', '33FF57', '3357FF', 'FF33F5', 'F5FF33', '33FFF5'];
            const colorIndex = profile.username.charCodeAt(0) % colors.length;
            profileAvatar.src = `https://placehold.co/150x150/${colors[colorIndex]}/FFFFFF?text=${initials}`;
        }
    }
}

// Update profile statistics
function updateProfileStats(profile) {
    const followersEl = document.getElementById('followersCount');
    if (followersEl) followersEl.textContent = profile.followers_count || 0;
    
    const followingEl = document.getElementById('followingCount');
    if (followingEl) followingEl.textContent = profile.following_count || 0;
    
    // Update tab labels
    const tabs = document.querySelectorAll('.content-tabs .tab');
    tabs.forEach(tab => {
        if (tab.textContent.includes('Followers')) {
            tab.textContent = `Followers (${profile.followers_count || 0})`;
        } else if (tab.textContent.includes('Following')) {
            tab.textContent = `Following (${profile.following_count || 0})`;
        }
    });
}

// Setup action buttons
async function setupActionButtons(profile) {
    const profileActionsDiv = document.getElementById('profileActions');
    if (!profileActionsDiv) return;
    
    // Check if viewing own profile
    if (currentUser && currentUser.id === profile.id) {
        profileActionsDiv.innerHTML = `
            <a href="/edit-profile.html" class="action-btn edit">✏️ Modifica Profilo</a>
        `;
        return;
    }
    
    // Setup follow button
    if (!currentUser) {
        profileActionsDiv.innerHTML = `
            <a href="/auth.html" class="action-btn follow">+ Follow</a>
        `;
        return;
    }
    
    const isFollowing = await followingSystem.checkIfFollowing(profile.id);
    
    profileActionsDiv.innerHTML = `
        <button class="action-btn ${isFollowing ? 'following' : 'follow'}"
                id="followBtn"
                data-follow-user="${profile.id}">
            ${isFollowing ? '✓ Following' : '+ Follow'}
        </button>
    `;
    
    // Add click handler
    const followBtn = document.getElementById('followBtn');
    if (followBtn) {
        followBtn.onclick = async () => {
            await handleFollowClick(profile.id);
        };
    }
}

// Handle follow button click
async function handleFollowClick(userId) {
    if (!currentUser) {
        window.location.href = '/auth.html';
        return;
    }
    
    const success = await followingSystem.toggleFollow(userId);
    
    if (success) {
        // Update button
        const isNowFollowing = await followingSystem.checkIfFollowing(userId);
        followingSystem.updateFollowButton(userId, isNowFollowing);
        
        // Update counts
        await refreshProfileStats();
        
        // Refresh content if on followers tab
        const activeTab = document.querySelector('.content-tabs .tab.active');
        if (activeTab && activeTab.textContent.includes('Followers')) {
            await showTab('followers');
        }
    }
}

// Refresh profile statistics
async function refreshProfileStats() {
    if (!profileUser) return;
    
    // Get updated profile data
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('followers_count, following_count')
        .eq('id', profileUser.id)
        .single();
        
    if (profile) {
        profileUser.followers_count = profile.followers_count;
        profileUser.following_count = profile.following_count;
        updateProfileStats(profileUser);
    }
}

// Setup tabs
function setupTabs(profile) {
    const contentTabs = document.querySelector('.content-tabs');
    if (!contentTabs) return;
    
    contentTabs.innerHTML = `
        <button class="tab active" onclick="showTab('streams')">Stream Recenti</button>
        <button class="tab" onclick="showTab('followers')">Followers (${profile.followers_count || 0})</button>
        <button class="tab" onclick="showTab('following')">Following (${profile.following_count || 0})</button>
        <button class="tab" onclick="showTab('clips')">Clips</button>
    `;
}

// Load profile content
async function loadProfileContent(profile) {
    await showTab('streams');
}

// Show tab content
async function showTab(tabName) {
    if (!profileUser) return;
    
    const contentGrid = document.querySelector('.content-grid');
    const tabs = document.querySelectorAll('.content-tabs .tab');
    
    // Update active tab
    tabs.forEach(tab => {
        const isActive = tab.textContent.toLowerCase().includes(tabName);
        tab.classList.toggle('active', isActive);
    });
    
    // Show content based on tab
    switch (tabName) {
        case 'streams':
            await showStreams(contentGrid);
            break;
        case 'followers':
            await showFollowers(contentGrid);
            break;
        case 'following':
            await showFollowing(contentGrid);
            break;
        case 'clips':
            showClips(contentGrid);
            break;
        default:
            contentGrid.innerHTML = '<p id="noContentMessage">Nessun contenuto da mostrare.</p>';
    }
}

// Show streams
async function showStreams(container) {
    try {
        // Get user's recent streams
        const { data: streams } = await supabaseClient
            .from('streams')
            .select('*')
            .eq('user_id', profileUser.id)
            .order('created_at', { ascending: false })
            .limit(20);
            
        if (!streams || streams.length === 0) {
            container.innerHTML = '<p id="noContentMessage">Nessuno stream recente.</p>';
            return;
        }
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 20px;">
                ${streams.map(stream => `
                    <div style="background: #1a1a1a; border-radius: 12px; overflow: hidden; cursor: pointer;">
                        <div style="aspect-ratio: 16/9; background: #0a0a0a; position: relative;">
                            <img src="https://picsum.photos/320/180?random=${stream.id}" 
                                 style="width: 100%; height: 100%; object-fit: cover;">
                            ${stream.status === 'live' ? `
                                <div style="position: absolute; top: 12px; left: 12px; background: #ff3b30; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">
                                    ● LIVE
                                </div>
                            ` : ''}
                        </div>
                        <div style="padding: 12px;">
                            <h4 style="margin: 0 0 8px 0; font-size: 14px;">${stream.title || 'Untitled Stream'}</h4>
                            <p style="margin: 0; color: #888; font-size: 12px;">
                                ${new Date(stream.created_at).toLocaleDateString()} • ${stream.viewer_count || 0} views
                            </p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Errore caricamento streams:', err);
        container.innerHTML = '<p id="noContentMessage">Errore nel caricamento degli stream.</p>';
    }
}

// Show followers
async function showFollowers(container) {
    const followers = await followingSystem.getFollowers(profileUser.id);
    followingSystem.displayFollowers(followers, container);
}

// Show following
async function showFollowing(container) {
    const following = await followingSystem.getFollowing(profileUser.id);
    followingSystem.displayFollowing(following, container);
}

// Show clips
function showClips(container) {
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <p style="font-size: 48px;">🎬</p>
            <h3 style="color: #FFD700;">Clips Coming Soon!</h3>
            <p style="color: #888;">La funzionalità clips sarà disponibile a breve.</p>
        </div>
    `;
}

// Make showTab global
window.showTab = showTab;

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeProfilePage);

console.log('✅ Profile controller loaded successfully');
