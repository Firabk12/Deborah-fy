'use strict';

class MusicApp {
    constructor() {
    // State management
    this.currentPage = 'homePage';
    this.currentTrack = null;
    this.isPlaying = false;
    this.api = new JamendoAPI(CONFIG.JAMENDO_CLIENT_ID);
    this.audioPlayer = new Audio();
    this.shuffleMode = false;
    this.repeatMode = 'none'; // 'none', 'single', 'all'
    
    // Current time and user info
    this.currentTime = new Date('2025-03-08 20:38:12');
    this.currentUser = 'Firabk12';
    
    // Cache timestamps
    this.lastFeaturedUpdate = 0;
    this.lastForYouUpdate = 0;

    // DOM Elements
    this.pages = document.querySelectorAll('.page');
    this.navButtons = document.querySelectorAll('.nav-item');
    this.miniPlayer = document.getElementById('miniPlayer');
    this.miniPlayerPlayBtn = document.getElementById('miniPlayerPlayBtn');
    this.miniPlayerProgress = document.getElementById('miniPlayerProgress');
    
    // Advanced filters
    this.advancedFilters = {
        sort: 'relevance',
        duration: 'any',
        genre: 'all',
        order: 'desc'
    };

    // Setup audio player event listeners
    this.audioPlayer.addEventListener('play', () => {
        this.isPlaying = true;
        this.updatePlayButtonsState();
    });

    this.audioPlayer.addEventListener('pause', () => {
        this.isPlaying = false;
        this.updatePlayButtonsState();
    });

    this.audioPlayer.addEventListener('ended', () => {
        if (this.repeatMode === 'single') {
            this.audioPlayer.currentTime = 0;
            this.audioPlayer.play();
        } else if (this.repeatMode === 'all' || this.shuffleMode) {
            this.playNext();
        } else {
            this.isPlaying = false;
            this.updatePlayButtonsState();
        }
    });

    // Setup track click events
    document.addEventListener('click', (e) => {
        const trackItem = e.target.closest('.track-item');
        if (trackItem && !e.target.closest('.track-actions')) {
            const trackId = trackItem.dataset.trackId;
            if (trackId) {
                const track = this.findTrackById(trackId);
                if (track) {
                    this.playTrack(track);
                }
            }
        }
    });

    // Setup keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;

        switch(e.key.toLowerCase()) {
            case ' ': // Space bar
                e.preventDefault();
                if (this.currentTrack) this.togglePlayPause();
                break;
            case 'arrowright':
                if ((e.ctrlKey || e.metaKey) && this.currentTrack) {
                    e.preventDefault();
                    this.playNext();
                }
                break;
            case 'arrowleft':
                if ((e.ctrlKey || e.metaKey) && this.currentTrack) {
                    e.preventDefault();
                    this.playPrevious();
                }
                break;
            case 'm':
                e.preventDefault();
                this.toggleMute();
                break;
        }
    });

    // Show welcome message
    const hours = this.currentTime.getHours();
    let greeting = '';
    if (hours < 12) greeting = 'Good morning';
    else if (hours < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';
    showNotification(`${greeting}, ${this.currentUser}! 👋`);

    // Setup player events and UI
    this.setupPlayerEvents();
    this.setupDragToExpand();
    this.miniPlayer.classList.remove('active', 'expanded');

    // Restore volume
    const savedVolume = localStorage.getItem('volume');
    if (savedVolume !== null) {
        this.audioPlayer.volume = parseFloat(savedVolume);
    }

    // Initialize
    this.init();
}
    
    initializeSearchPage() {
    this.searchInput = document.getElementById('searchInput');
    this.searchResults = document.getElementById('searchResults');
    this.searchFilters = document.getElementById('searchFilters');
    this.noResults = document.getElementById('noResults');
    this.initialState = document.getElementById('initialState');
    this.recentSearches = document.getElementById('recentSearches');
    
    this.currentFilter = 'all';
    this.searchCache = {};
    
    this.setupSearchEvents();
    this.loadRecentSearches();
    this.setupQuickGenres();
}

    initializePlaylists() {
    this.playlists = this.loadPlaylists();
    this.currentPlaylist = null;
    this.setupPlaylistEvents();
    this.renderPlaylists();
    this.updateDefaultPlaylistCounts();
}


    async init() {
        this.setupEventListeners();
        this.setupAudioEvents();
        await this.loadHomePage();
        this.checkAuthStatus();
        this.restoreLastPlayingTrack();
        this.initializeSearchPage();
        this.setupAdvancedFilters();
        this.initializePlaylists();
        this.setupTrackClickEvents();
    }


    setupEventListeners() {
        // Navigation
        this.navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const pageId = button.dataset.page;
                this.navigateToPage(pageId);
            });
        });


        // Search Input
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', debounce((e) => {
            this.handleSearch(e.target.value);
        }, 500));

        // Action buttons
        this.bindActionButtons();
    }

    setupAudioEvents() {
        this.audioPlayer.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audioPlayer.addEventListener('ended', () => {
            this.playNext();
        });

        this.audioPlayer.addEventListener('play', () => {
            this.miniPlayerPlayBtn.querySelector('span').textContent = 'pause';
            this.isPlaying = true;
        });

        this.audioPlayer.addEventListener('pause', () => {
            this.miniPlayerPlayBtn.querySelector('span').textContent = 'play_arrow';
            this.isPlaying = false;
        });

        this.audioPlayer.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            showNotification('Error playing track. Trying next...');
            this.playNext();
        });
    }

setupSearchEvents() {
    if (this.searchInput) {
        this.searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value.trim();
            console.log('Search input event:', query);
            if (query.length >= 2) {
                this.handleSearch(query);
            } else if (query.length === 0) {
                this.showInitialState();
            }
        }, 500));
    }

    if (this.searchFilters) {
        this.searchFilters.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentFilter = btn.dataset.type;
                this.searchFilters.querySelectorAll('.filter-btn')
                    .forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const query = this.searchInput.value.trim();
                if (query.length >= 2) {
                    this.handleSearch(query);
                }
            });
        });
    }

    // Clear recent searches
    const clearBtn = this.recentSearches?.querySelector('.btn-text');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.RECENT_SEARCHES);
            this.loadRecentSearches();
        });
    }
}

    setupAdvancedFilters() {
    const filterBtn = document.getElementById('searchFilterBtn');
    const advancedFilters = document.getElementById('advancedFilters');
    
    // Toggle advanced filters
    filterBtn.addEventListener('click', () => {
        advancedFilters.classList.toggle('hidden');
        filterBtn.querySelector('span').textContent = 
            advancedFilters.classList.contains('hidden') ? 'tune' : 'close';
    });

    // Handle filter changes
    ['sort', 'duration', 'genre', 'order'].forEach(filterType => {
        const select = document.getElementById(`${filterType}Filter`);
        select.addEventListener('change', () => {
            this.advancedFilters[filterType] = select.value;
            const query = this.searchInput.value.trim();
            if (query.length >= 2) {
                this.handleSearch(query);
            }
        });
    });
}

setupPlaylistEvents() {
    const createButtons = document.querySelectorAll('#createPlaylistBtn, .create-playlist-btn');
    createButtons.forEach(button => {
        button.addEventListener('click', () => {
            this.showCreatePlaylistModal();
        });
    });

    // Create playlist button
    document.getElementById('createPlaylistBtn').addEventListener('click', () => {
        this.showCreatePlaylistModal();
    });

    // Playlist filters
    document.querySelector('.playlist-filters').addEventListener('click', (e) => {
        const filterBtn = e.target.closest('.filter-btn');
        if (filterBtn) {
            document.querySelectorAll('.filter-btn').forEach(btn => 
                btn.classList.remove('active'));
            filterBtn.classList.add('active');
            this.filterPlaylists(filterBtn.dataset.filter);
        }
    });

    // Playlist sort
    document.getElementById('playlistSort').addEventListener('change', (e) => {
        this.sortPlaylists(e.target.value);
    });
}

    setupPlayerEvents() {
    // Initialize DOM elements with null checks
    const elements = {
        miniPlayer: this.miniPlayer,
        miniPlayerProgress: document.getElementById('miniPlayerProgress'),
        miniPlayerPlayBtn: document.getElementById('miniPlayerPlayBtn'),
        playBtn: document.getElementById('playBtn'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        miniPlayerPrevBtn: document.getElementById('miniPlayerPrevBtn'),
        miniPlayerNextBtn: document.getElementById('miniPlayerNextBtn'),
        volumeBtn: document.getElementById('volumeBtn'),
        volumeSlider: document.getElementById('volumeSlider'),
        shuffleBtn: document.getElementById('shuffleBtn'),
        repeatBtn: document.getElementById('repeatBtn'),
        likeBtn: document.getElementById('likeBtn'),
        addToPlaylistBtn: document.getElementById('addToPlaylistBtn'),
        progressContainer: document.querySelector('.progress-container'),
        progressBar: document.getElementById('progressBar'),
        collapseBtn: document.querySelector('.collapse-player'),
        seekBar: document.getElementById('seekBar'),
        currentTimeDisplay: document.getElementById('currentTime'),
        durationDisplay: document.getElementById('duration')
    };

    // Verify essential elements exist
    if (!elements.miniPlayer) {
        console.error('Mini player not found in DOM');
        return;
    }

    // Mini player expand/collapse
    elements.miniPlayer.addEventListener('click', (e) => {
        // Don't expand if clicking controls or if no track is playing
        if (!e.target.closest('.controls') && this.currentTrack) {
            this.toggleExpandedPlayer();
        }
    });

    // Collapse button
    if (elements.collapseBtn) {
        elements.collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleExpandedPlayer();
        });
    }

    // Play/Pause functionality
    const setupPlayButton = (btn) => {
        if (!btn) return;
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.currentTrack) return;

            this.togglePlayPause();
            this.updatePlayButtonsState();
        });
    };

    setupPlayButton(elements.miniPlayerPlayBtn);
    setupPlayButton(elements.playBtn);

    // Previous and Next buttons
    const setupNavigationButton = (btn, action) => {
        if (!btn) return;
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.currentTrack) return;

            if (action === 'next') {
                this.playNext();
            } else {
                this.playPrevious();
            }
        });
    };

    setupNavigationButton(elements.prevBtn, 'previous');
    setupNavigationButton(elements.nextBtn, 'next');
    setupNavigationButton(elements.miniPlayerPrevBtn, 'previous');
    setupNavigationButton(elements.miniPlayerNextBtn, 'next');

    
     // Volume control
if (elements.volumeBtn && elements.volumeSlider) {
    const volumeContainer = document.querySelector('.volume-container');
    const volumeSliderElement = document.querySelector('.volume-slider');
    
    // Restore saved volume
    const savedVolume = parseFloat(localStorage.getItem('volume')) || 1;
    this.audioPlayer.volume = savedVolume;
    elements.volumeSlider.value = savedVolume * 100;

    // Toggle volume slider
    elements.volumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        volumeSliderElement.classList.toggle('hidden');
    });

    // Handle volume change
    elements.volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        this.audioPlayer.volume = volume;
        localStorage.setItem('volume', volume);
        
        // Update volume icon
        const iconElement = elements.volumeBtn.querySelector('span');
        if (iconElement) {
            iconElement.textContent = 
                volume === 0 ? 'volume_off' : 
                volume < 0.5 ? 'volume_down' : 'volume_up';
        }
    });

    // Close volume slider when clicking outside
    document.addEventListener('click', (e) => {
        if (!volumeContainer.contains(e.target)) {
            volumeSliderElement.classList.add('hidden');
        }
    });
}


    // Shuffle functionality
    if (elements.shuffleBtn) {
        elements.shuffleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = elements.shuffleBtn.classList.toggle('active');
            this.shuffleMode = isActive;
            showNotification(`Shuffle ${isActive ? 'enabled' : 'disabled'}`);
        });
    }

    // Repeat functionality
    if (elements.repeatBtn) {
        elements.repeatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleRepeat();
        });
    }

    // Like button
    if (elements.likeBtn) {
        elements.likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.currentTrack) return;
            this.toggleLike();
        });
    }

    // Add to playlist button
    if (elements.addToPlaylistBtn) {
        elements.addToPlaylistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.currentTrack) return;
            this.showAddToPlaylistModal();
        });
    }

    // Progress bar and seeking
    if (elements.progressContainer) {
        // Click to seek
        elements.progressContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.audioPlayer.duration) return;

            const bounds = elements.progressContainer.getBoundingClientRect();
            const percent = (e.clientX - bounds.left) / bounds.width;
            this.audioPlayer.currentTime = percent * this.audioPlayer.duration;
        });

        // Drag to seek
        if (elements.seekBar) {
            elements.seekBar.addEventListener('input', (e) => {
                if (!this.audioPlayer.duration) return;
                const time = (e.target.value / 100) * this.audioPlayer.duration;
                elements.currentTimeDisplay.textContent = this.formatTime(time);
            });

            elements.seekBar.addEventListener('change', (e) => {
                if (!this.audioPlayer.duration) return;
                const time = (e.target.value / 100) * this.audioPlayer.duration;
                this.audioPlayer.currentTime = time;
            });
        }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;

        switch(e.key.toLowerCase()) {
            case ' ': // Space bar
                e.preventDefault();
                if (this.currentTrack) {
                    this.togglePlayPause();
                }
                break;
            case 'arrowright':
                if ((e.ctrlKey || e.metaKey) && this.currentTrack) {
                    e.preventDefault();
                    this.playNext();
                }
                break;
            case 'arrowleft':
                if ((e.ctrlKey || e.metaKey) && this.currentTrack) {
                    e.preventDefault();
                    this.playPrevious();
                }
                break;
            case 'm':
                if (elements.volumeBtn) {
                    e.preventDefault();
                    elements.volumeBtn.click();
                }
                break;
            case 'l':
                if (this.currentTrack && elements.likeBtn) {
                    e.preventDefault();
                    this.toggleLike();
                }
                break;
        }
    });

    this.audioPlayer.addEventListener('timeupdate', () => {
            if (!this.audioPlayer.duration) return;
            
            const current = this.audioPlayer.currentTime;
            const duration = this.audioPlayer.duration;
            const progress = (current / duration) * 100;
            
            const elements = {
                progressBar: document.getElementById('progressBar'),
                miniPlayerProgress: document.getElementById('miniPlayerProgress'),
                currentTime: document.getElementById('currentTime'),
                duration: document.getElementById('duration')
            };

            // Update elements only if they exist
            if (elements.progressBar) {
                elements.progressBar.style.width = `${progress}%`;
            }
            if (elements.miniPlayerProgress) {
                elements.miniPlayerProgress.style.width = `${progress}%`;
            }
            if (elements.currentTime) {
                elements.currentTime.textContent = this.formatTime(current);
            }
            if (elements.duration) {
                elements.duration.textContent = this.formatTime(duration);
            }
        });
        
    // Handle audio ended event
    this.audioPlayer.addEventListener('ended', () => {
        if (this.repeatMode === 'single') {
            this.audioPlayer.currentTime = 0;
            this.audioPlayer.play();
        } else if (this.repeatMode === 'all' || this.shuffleMode) {
            this.playNext();
        } else {
            this.isPlaying = false;
            this.updatePlayButtonsState();
        }
    });
}


updatePlayButtonsState() {
    const iconName = this.isPlaying ? 'pause' : 'play_arrow';
    const buttons = [
        document.getElementById('playBtn'),
        document.getElementById('miniPlayerPlayBtn')
    ];

    buttons.forEach(btn => {
        if (btn) {
            const iconElement = btn.querySelector('span');
            if (iconElement) {
                iconElement.textContent = iconName;
            }
        }
    });
}

    
    // Add this as a separate method
    setupTrackClickEvents() {
        document.addEventListener('click', (e) => {
            const trackItem = e.target.closest('.track-item');
            if (trackItem && !e.target.closest('.track-actions')) {
                const trackId = trackItem.dataset.trackId;
                if (trackId) {
                    const track = this.findTrackById(trackId);
                    if (track) {
                        this.playTrack(track);
                    }
                }
            }
        });
    }

   findTrackById(trackId) {
    // First check recently played tracks
    if (this.recentlyPlayed) {
        const recentTrack = this.recentlyPlayed.find(track => track.id === trackId);
        if (recentTrack) return recentTrack;
    }

    // Check current playlist if exists
    if (this.currentPlaylist && this.currentPlaylist.tracks) {
        const playlistTrack = this.currentPlaylist.tracks.find(track => track.id === trackId);
        if (playlistTrack) return playlistTrack;
    }

    // Check featured tracks
    if (this.featuredTracks) {
        const featuredTrack = this.featuredTracks.find(track => track.id === trackId);
        if (featuredTrack) return featuredTrack;
    }

    // Check for you tracks
    if (this.forYouTracks) {
        const forYouTrack = this.forYouTracks.find(track => track.id === trackId);
        if (forYouTrack) return forYouTrack;
    }

    // Check search results if exists
    if (this.searchResults && this.searchResults.tracks) {
        const searchTrack = this.searchResults.tracks.find(track => track.id === trackId);
        if (searchTrack) return searchTrack;
    }

    console.log(`Track with ID ${trackId} not found`);
    return null;
}

// Helper method to format time
formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

    bindActionButtons() {
    document.querySelectorAll('.btn-text').forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (text === 'see all') {
            btn.addEventListener('click', (e) => {
                const section = e.target.closest('section');
                if (section.classList.contains('featured-section')) {
                    this.showAllFeatured();
                }
            });
        } else if (text === 'clear') {
            btn.addEventListener('click', () => this.clearRecentlyPlayed());
        } else if (text === 'refresh') {
            btn.addEventListener('click', () => this.refreshForYou());
        } else if (text === 'more') {
            btn.addEventListener('click', () => this.showMoreTopCharts());
        }
    });
}

    async loadHomePage() {
        showLoading();
        try {
            await Promise.all([
                this.loadFeaturedArtists(),
                this.loadRecentlyPlayed(),
                this.loadTopCharts(),
                this.loadGenres(),
                this.loadForYou()
            ]);
        } catch (error) {
            console.error('Error loading home page:', error);
            showNotification('Error loading content. Please try again.');
        }
        hideLoading();
    }

    async loadFeaturedArtists(limit = 6) {
        const featuredSection = document.getElementById('featuredArtists');
        
        try {
            const artists = await this.api.getFeaturedArtists(limit);
            this.renderFeaturedArtists(artists, featuredSection);
        } catch (error) {
            console.error('Error loading featured artists:', error);
            featuredSection.innerHTML = '<p class="error-message">Unable to load featured artists</p>';
        }
    }

    async loadTopCharts() {
        const chartsContainer = document.getElementById('topCharts');
        
        try {
            const tracks = await this.api.getPopularTracks(10);
            this.renderTopCharts(tracks, chartsContainer);
        } catch (error) {
            console.error('Error loading top charts:', error);
            chartsContainer.innerHTML = '<p class="error-message">Unable to load top charts</p>';
        }
    }

    loadGenres() {
        const genresGrid = document.getElementById('genresGrid');
        genresGrid.innerHTML = CONFIG.GENRES.map(genre => `
            <div class="genre-card" 
                 style="background-color: ${genre.color}" 
                 data-genre="${genre.name.toLowerCase()}">
                <h3>${genre.name}</h3>
                <span class="material-symbols-rounded genre-icon">${genre.icon}</span>
            </div>
        `).join('');

        genresGrid.querySelectorAll('.genre-card').forEach(card => {
            card.addEventListener('click', () => {
                this.navigateToGenre(card.dataset.genre);
            });
        });
    }

    async loadForYou() {
        const forYouSection = document.getElementById('forYouAlbums');
        
        try {
            const albums = await this.api.getPopularAlbums(8);
            this.renderForYou(albums, forYouSection);
        } catch (error) {
            console.error('Error loading for you section:', error);
            forYouSection.innerHTML = '<p class="error-message">Unable to load recommendations</p>';
        }
    }
    
    async showAllFeatured() {
    showLoading();
    try {
        const artists = await this.api.getFeaturedArtists(20); // Get more artists
        
        const modalContent = `
            <div class="artists-grid">
                ${artists.map(artist => `
                    <div class="featured-artist-card" data-artist-id="${artist.id}">
                        <div class="artist-image-wrapper">
                            <img src="${artist.image || CONFIG.DEFAULT_IMAGES.ARTIST}" 
                                 alt="${artist.name}" 
                                 class="artist-image">
                        </div>
                        <h3>${artist.name}</h3>
                        <p>${artist.trackCount} tracks</p>
                        <button class="btn-play">
                            <span class="material-symbols-rounded">play_circle</span>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        const modal = createModal('Featured Artists', modalContent);

        // Add click events to artist cards in modal
        modal.querySelectorAll('.featured-artist-card').forEach(card => {
            card.addEventListener('click', () => {
                this.handleArtistClick(card.dataset.artistId);
                modal.remove();
            });
        });

    } catch (error) {
        console.error('Error loading all featured artists:', error);
        showNotification('Error loading artists');
    }
    hideLoading();
}

renderTracks(tracks, container) {
    if (!tracks || tracks.length === 0) {
        container.innerHTML = '<p class="empty-message">No tracks available</p>';
        return;
    }

    container.innerHTML = `
        <div class="tracks-grid">
            ${tracks.map(track => `
                <div class="track-card" data-track-id="${track.id}">
                    <div class="track-art">
                        <img src="${track.posterUrl || CONFIG.DEFAULT_IMAGES.TRACK}" 
                             alt="${track.title}">
                        <button class="btn-play">
                            <span class="material-symbols-rounded">play_arrow</span>
                        </button>
                    </div>
                    <div class="track-info">
                        <h3>${track.title}</h3>
                        <p>${track.artist}</p>
                        <span class="track-duration">${formatTime(track.duration)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Add click events to track cards
    container.querySelectorAll('.track-card').forEach(card => {
        card.addEventListener('click', () => {
            const trackId = card.dataset.trackId;
            const track = tracks.find(t => t.id === trackId);
            if (track) this.playTrack(track);
        });
    });
}

// Add handler for "More" button in Top Charts
async showMoreTopCharts() {
    showLoading();
    try {
        const tracks = await this.api.getPopularTracks(30); // Get more tracks
        
        const modalContent = `
            <div class="charts-list">
                ${tracks.map((track, index) => `
                    <div class="chart-item" data-track-id="${track.id}">
                        <span class="chart-rank">${index + 1}</span>
                        <img src="${track.posterUrl || CONFIG.DEFAULT_IMAGES.TRACK}" 
                             alt="${track.title}">
                        <div class="track-info">
                            <h3>${track.title}</h3>
                            <p>${track.artist}</p>
                        </div>
                        <div class="track-stats">
                            <span>${this.formatNumber(track.plays)} plays</span>
                        </div>
                        <button class="btn-play">
                            <span class="material-symbols-rounded">play_arrow</span>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        const modal = createModal('Top Charts', modalContent);

        // Add click events to tracks in modal
        modal.querySelectorAll('.chart-item').forEach(item => {
            item.addEventListener('click', () => {
                const trackId = item.dataset.trackId;
                const track = tracks.find(t => t.id === trackId);
                if (track) {
                    this.playTrack(track);
                    modal.remove();
                }
            });
        });

    } catch (error) {
        console.error('Error loading more tracks:', error);
        showNotification('Error loading more tracks');
    }
    hideLoading();
}

    async playTrack(track) {
        if (!track) return;

        try {
            // Stop current track if playing
            if (this.audioPlayer.src) {
                this.audioPlayer.pause();
                this.audioPlayer.currentTime = 0;
            }

            this.currentTrack = track;
            this.audioPlayer.src = track.musicPath;
            
            // Show the player
            this.miniPlayer.classList.add('active');
            this.updatePlayerDisplay(track);
            this.updateBackgroundBlur();
            
            // Don't automatically play - wait for user interaction
            this.isPlaying = false;
            this.updatePlayButtonsState();
            this.addToRecentlyPlayed(track);
            this.saveCurrentTrack();
        } catch (error) {
            console.error('Error loading track:', error);
            showNotification('Error loading track. Please try another.');
        }
    }
    
    // Add this method to your MusicApp class
async playPrevious() {
    if (!this.currentTrack) return;

    try {
        const tracks = await this.api.getPopularTracks(10);
        const currentIndex = tracks.findIndex(t => t.id === this.currentTrack.id);
        const previousIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
        const previousTrack = tracks[previousIndex];
        await this.playTrack(previousTrack);
    } catch (error) {
        console.error('Error playing previous track:', error);
        showNotification('Error loading previous track');
    }
}

    togglePlayPause() {
        if (!this.currentTrack) return;

        try {
            if (this.isPlaying) {
                this.audioPlayer.pause();
            } else {
                // Only play if there was explicit user interaction
                const playPromise = this.audioPlayer.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error('Playback failed:', error);
                        this.isPlaying = false;
                        this.updatePlayButtonsState();
                    });
                }
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
            showNotification('Error playing track. Please try again.');
        }
    }

    async playNext() {
        if (!this.currentTrack) return;

        try {
            const tracks = await this.api.getPopularTracks(10);
            const currentIndex = tracks.findIndex(t => t.id === this.currentTrack.id);
            const nextTrack = tracks[(currentIndex + 1) % tracks.length];
            await this.playTrack(nextTrack);
        } catch (error) {
            console.error('Error playing next track:', error);
            showNotification('Error loading next track');
        }
    }
    
    async playTrack(track) {
    if (!track) return;

    try {
        // Stop current track if playing
        if (this.audioPlayer.src) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
        }

        this.currentTrack = track;
        this.audioPlayer.src = track.musicPath;
        
        try {
            await this.audioPlayer.play();
            this.updateMiniPlayer(track);
            this.addToRecentlyPlayed(track);
            this.saveCurrentTrack();
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                showNotification('Click play button to start playback');
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error playing track:', error);
        showNotification('Error playing track. Please try another.');
    }
}

     async refreshForYou() {
    showLoading();
    try {
        // Clear cache for "For You" section
        localStorage.removeItem(CONFIG.STORAGE_KEYS.FOR_YOU_CACHE);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.FOR_YOU_CACHE_TIME);

        // Fetch new albums and tracks
        const [albums, tracks] = await Promise.all([
            this.api.getPopularAlbums(8),
            this.api.getPopularTracks(8)
        ]);

        // Mix and shuffle recommendations
        const recommendations = this.mixRecommendations(albums, tracks);

        // Update the UI
        const forYouSection = document.getElementById('forYouAlbums');
        this.renderForYou(recommendations, forYouSection);

        // Show success message
        showNotification('Recommendations refreshed!');
    } catch (error) {
        console.error('Error refreshing recommendations:', error);
        showNotification('Error refreshing recommendations');
    }
    hideLoading();
}

// Add this helper method for mixing recommendations
mixRecommendations(albums, tracks) {
    // Convert tracks to album-like format for consistent rendering
    const trackAlbums = tracks.map(track => ({
        id: track.id,
        name: track.title,
        artistName: track.artist,
        image: track.posterUrl || CONFIG.DEFAULT_IMAGES.TRACK,
        trackCount: 1,
        isTrack: true, // Flag to identify single tracks
        track: track // Store the original track data
    }));

    // Combine albums and tracks
    const combined = [...albums, ...trackAlbums];

    // Shuffle array
    for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    // Take first 8 items
    return combined.slice(0, 8);
}



    updateProgress() {
        if (!this.audioPlayer.duration) return;
        
        const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
        this.miniPlayerProgress.style.width = `${progress}%`;
    }

    updateMiniPlayer(track) {
        this.miniPlayer.classList.add('active');
        document.getElementById('miniPlayerCover').src = track.posterUrl;
        document.getElementById('miniPlayerTitle').textContent = track.title;
        document.getElementById('miniPlayerArtist').textContent = track.artist;
    }

    // Recently Played Management
    loadRecentlyPlayed() {
        const recent = this.getRecentlyPlayed();
        const container = document.getElementById('recentlyPlayed');
        
        if (recent.length === 0) {
            container.innerHTML = '<p class="empty-message">No recently played tracks</p>';
            return;
        }

        this.renderTracks(recent, container);
    }

    getRecentlyPlayed() {
        try {
            return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.RECENTLY_PLAYED) || '[]');
        } catch {
            return [];
        }
    }

    addToRecentlyPlayed(track) {
        const recent = this.getRecentlyPlayed();
        const updated = [track, ...recent.filter(t => t.id !== track.id)].slice(0, 10);
        localStorage.setItem(CONFIG.STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(updated));
        this.loadRecentlyPlayed();
    }

    clearRecentlyPlayed() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.RECENTLY_PLAYED);
        this.loadRecentlyPlayed();
        showNotification('Recently played tracks cleared');
    }

    // Rendering Functions
    renderFeaturedArtists(artists, container) {
        container.innerHTML = artists.map(artist => `
            <div class="featured-artist-card" data-artist-id="${artist.id}">
                <div class="artist-image-wrapper">
                    <img src="${artist.image || './assets/images/default-artist.jpg'}" alt="${artist.name}" class="artist-image">
                </div>
                <h3>${artist.name}</h3>
                <p>${artist.trackCount} tracks</p>
                <button class="btn-play">
                    <span class="material-symbols-rounded">play_circle</span>
                </button>
            </div>
        `).join('');

        container.querySelectorAll('.featured-artist-card').forEach(card => {
            card.addEventListener('click', () => this.handleArtistClick(card.dataset.artistId));
        });
    }

    renderTopCharts(tracks, container) {
        container.innerHTML = tracks.map((track, index) => `
            <div class="chart-item" data-track-id="${track.id}">
                <span class="chart-rank">${index + 1}</span>
                <img src="${track.posterUrl || './assets/images/default-cover.jpg'}" alt="${track.title}">
                <div class="track-info">
                    <h3>${track.title}</h3>
                    <p>${track.artist}</p>
                </div>
                <div class="track-stats">
                    <span>${this.formatNumber(track.plays)} plays</span>
                </div>
                <button class="btn-play">
                    <span class="material-symbols-rounded">play_arrow</span>
                </button>
            </div>
        `).join('');

        container.querySelectorAll('.chart-item').forEach(item => {
            item.addEventListener('click', () => {
                const trackId = item.dataset.trackId;
                const track = tracks.find(t => t.id === trackId);
                if (track) this.playTrack(track);
            });
        });
    }

    renderForYou(items, container) {
    container.innerHTML = items.map(item => `
        <div class="album-card ${item.isTrack ? 'track-card' : ''}" 
             data-${item.isTrack ? 'track' : 'album'}-id="${item.id}">
            <div class="album-art">
                <img src="${item.image || CONFIG.DEFAULT_IMAGES.ALBUM}" 
                     alt="${item.name}">
                <button class="btn-play">
                    <span class="material-symbols-rounded">play_arrow</span>
                </button>
            </div>
            <div class="album-info">
                <h3>${item.name}</h3>
                <p>${item.artistName}</p>
                <span class="album-stats">
                    ${item.isTrack ? 'Single' : `${item.trackCount} tracks`}
                </span>
            </div>
        </div>
    `).join('');

        container.querySelectorAll('.album-card').forEach(card => {
            card.addEventListener('click', () => this.handleAlbumClick(card.dataset.albumId));
        });
    
    
    container.querySelectorAll('.album-card').forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('track-card')) {
                const trackId = card.dataset.trackId;
                const item = items.find(i => i.isTrack && i.id === trackId);
                if (item && item.track) {
                    this.playTrack(item.track);
                }
            } else {
                this.handleAlbumClick(card.dataset.albumId);
            }
        });
    });
} 



    // Event Handlers
    async handleArtistClick(artistId) {
        showLoading();
        try {
            const tracks = await this.api.getArtistTracks(artistId);
            if (tracks.length > 0) {
                await this.playTrack(tracks[0]);
                showNotification(`Playing tracks from ${tracks[0].artist}`);
            }
        } catch (error) {
            console.error('Error loading artist tracks:', error);
            showNotification('Error loading artist tracks');
        }
        hideLoading();
    }

    async handleAlbumClick(albumId) {
        showLoading();
        try {
            const tracks = await this.api.getAlbumTracks(albumId);
            if (tracks.length > 0) {
                await this.playTrack(tracks[0]);
                showNotification(`Playing ${tracks[0].album}`);
            }
        } catch (error) {
            console.error('Error loading album:', error);
            showNotification('Error loading album');
        }
        hideLoading();
    }

    async handleSearch(query) {
    if (!query || query.length < 2) {
        this.showInitialState();
        return;
    }

    this.showLoadingState();
    
    try {
        const cacheKey = `${query}_${this.currentFilter}_${JSON.stringify(this.advancedFilters)}`;
        let results;

        if (this.searchCache[cacheKey]) {
            results = this.searchCache[cacheKey];
            console.log('Using cached results:', results);
        } else {
            results = await this.performSearch(query);
            this.searchCache[cacheKey] = results;
            console.log('New search results:', results);
        }

        // Add the query to recent searches only if we got results
        if (results.tracks.length > 0 || results.artists.length > 0 || results.albums.length > 0) {
            this.addToRecentSearches(query);
        }

        this.renderSearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Error performing search');
        this.showNoResults();
    }
}

async performSearch(query) {
    console.log('Performing search with query:', query);
    console.log('Current filter:', this.currentFilter);
    
    const results = {
        tracks: [],
        artists: [],
        albums: []
    };

    try {
        // Normalize the query
        query = query.trim().toLowerCase();

        if (this.currentFilter === 'all' || this.currentFilter === 'tracks') {
            const tracks = await this.api.searchTracks(query);
            results.tracks = tracks;
            console.log('Tracks found:', tracks.length);
        }
        if (this.currentFilter === 'all' || this.currentFilter === 'artists') {
            const artists = await this.api.searchArtists(query);
            results.artists = artists;
            console.log('Artists found:', artists.length);
        }
        if (this.currentFilter === 'all' || this.currentFilter === 'albums') {
            const albums = await this.api.searchAlbums(query);
            results.albums = albums;
            console.log('Albums found:', albums.length);
        }

    } catch (error) {
        console.error('Search error:', error);
    }

    return results;
}

    // Navigation
    navigateToPage(pageId) {5
        this.pages.forEach(page => page.classList.remove('active'));
        this.navButtons.forEach(button => button.classList.remove('active'));

        document.getElementById(pageId).classList.add('active');
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

        this.currentPage = pageId;
    }

    navigateToGenre(genre) {
        this.navigateToPage('searchPage');
        const searchInput = document.getElementById('searchInput');
        searchInput.value = genre;
        this.handleSearch(genre);
    }
    
    loadRecentSearches() {
    const searches = this.getRecentSearches();
    const container = this.recentSearches.querySelector('.recent-searches-list');

    if (searches.length === 0) {
        this.recentSearches.classList.add('hidden');
        return;
    }

    container.innerHTML = searches.map(search => `
        <div class="recent-search-item" data-query="${search.query}">
            <span class="material-symbols-rounded">history</span>
            <span>${search.query}</span>
        </div>
    `).join('');

    // Add click events
    container.querySelectorAll('.recent-search-item').forEach(item => {
        item.addEventListener('click', () => {
            const query = item.dataset.query;
            this.searchInput.value = query;
            this.handleSearch(query);
        });
    });

    this.recentSearches.classList.remove('hidden');
}

getRecentSearches() {
    try {
        return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.RECENT_SEARCHES) || '[]');
    } catch {
        return [];
    }
}

addToRecentSearches(query) {
    const searches = this.getRecentSearches();
    const updatedSearches = [
        { query, timestamp: Date.now() },
        ...searches.filter(s => s.query !== query)
    ].slice(0, 10);

    localStorage.setItem(CONFIG.STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updatedSearches));
    this.loadRecentSearches();
}

// Quick Genres
setupQuickGenres() {
    const container = document.querySelector('.quick-genres .scroll-container');
    container.innerHTML = CONFIG.GENRES.map(genre => `
        <div class="genre-chip" data-genre="${genre.name.toLowerCase()}">
            ${genre.name}
        </div>
    `).join('');

    container.querySelectorAll('.genre-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const genre = chip.dataset.genre;
            this.searchInput.value = genre;
            this.handleSearch(genre);
        });
    });
}

// UI State Management  
showLoadingState() {
    if (this.searchResults) {
        this.searchResults.innerHTML = `
            <div class="search-skeleton">
                ${this.getLoadingSkeletonHTML()}
            </div>
        `;
        this.searchResults.classList.remove('hidden');
        if (this.noResults) this.noResults.classList.add('hidden');
        if (this.initialState) this.initialState.classList.add('hidden');
    }
}  
    
    // Continue with UI State Management and rendering methods

getLoadingSkeletonHTML() {
    return `
        <div class="results-section">
            <div class="skeleton-header" style="width: 120px; height: 24px; margin-bottom: 16px;"></div>
            <div class="results-grid">
                ${Array(6).fill().map(() => `
                    <div class="skeleton-card">
                        <div class="skeleton-image"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text-short"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

showNoResults() {
    if (this.searchResults) this.searchResults.classList.add('hidden');
    if (this.initialState) this.initialState.classList.add('hidden');
    if (this.noResults) {
        this.noResults.classList.remove('hidden');
        this.noResults.innerHTML = `
            <div class="no-results-content">
                <span class="material-symbols-rounded">search_off</span>
                <h3>No results found</h3>
                <p>Try different keywords or check your spelling</p>
            </div>
        `;
    }
}

showInitialState() {
    this.searchResults.classList.add('hidden');
    this.noResults.classList.add('hidden');
    this.initialState.classList.remove('hidden');
    this.loadRecentSearches();
}

// Render section methods
renderTracksSection(tracks) {
    return `
        <div class="results-section">
            <h2>Songs</h2>
            <div class="results-grid">
                ${tracks.map(track => `
                    <div class="track-card" data-track-id="${track.id}">
                        <div class="track-art">
                            <img src="${track.posterUrl || CONFIG.DEFAULT_IMAGES.TRACK}" 
                                 alt="${track.title}">
                            <button class="btn-play">
                                <span class="material-symbols-rounded">play_arrow</span>
                            </button>
                        </div>
                        <div class="track-info">
                            <h3>${track.title}</h3>
                            <p>${track.artist}</p>
                            <span class="track-duration">${formatTime(track.duration)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

renderArtistsSection(artists) {
    return `
        <div class="results-section">
            <h2>Artists</h2>
            <div class="results-grid">
                ${artists.map(artist => `
                    <div class="artist-card" data-artist-id="${artist.id}">
                        <div class="artist-image-wrapper">
                            <img src="${artist.image || CONFIG.DEFAULT_IMAGES.ARTIST}" 
                                 alt="${artist.name}">
                        </div>
                        <div class="artist-info">
                            <h3>${artist.name}</h3>
                            <p>${artist.trackCount} tracks</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

renderAlbumsSection(albums) {
    return `
        <div class="results-section">
            <h2>Albums</h2>
            <div class="results-grid">
                ${albums.map(album => `
                    <div class="album-card" data-album-id="${album.id}">
                        <div class="album-art">
                            <img src="${album.image || CONFIG.DEFAULT_IMAGES.ALBUM}" 
                                 alt="${album.name}">
                            <button class="btn-play">
                                <span class="material-symbols-rounded">play_arrow</span>
                            </button>
                        </div>
                        <div class="album-info">
                            <h3>${album.name}</h3>
                            <p>${album.artistName}</p>
                            <span class="album-stats">${album.trackCount} tracks</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Update or add this method to your MusicApp class
renderSearchResults(results) {
    const hasResults = results.tracks.length > 0 || 
                      results.artists.length > 0 || 
                      results.albums.length > 0;

    if (!hasResults) {
        this.showNoResults();
        return;
    }

    let html = '';

    // Render based on filter
    if (this.currentFilter === 'all') {
        if (results.tracks.length) {
            html += `
                <div class="results-section">
                    <div class="section-header">
                        <h2>Songs</h2>
                        ${results.tracks.length > 6 ? 
                            `<button class="btn-text" data-type="tracks">See all</button>` : ''}
                    </div>
                    <div class="tracks-grid">
                        ${results.tracks.slice(0, 6).map(track => `
                            <div class="track-card" data-track-id="${track.id}">
                                <div class="track-art">
                                    <img src="${track.posterUrl || CONFIG.DEFAULT_IMAGES.TRACK}" 
                                         alt="${track.title}">
                                    <button class="btn-play">
                                        <span class="material-symbols-rounded">play_arrow</span>
                                    </button>
                                </div>
                                <div class="track-info">
                                    <h3>${track.title}</h3>
                                    <p>${track.artist}</p>
                                    <span class="track-duration">${formatTime(track.duration)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (results.artists.length) {
            html += `
                <div class="results-section">
                    <div class="section-header">
                        <h2>Artists</h2>
                        ${results.artists.length > 6 ? 
                            `<button class="btn-text" data-type="artists">See all</button>` : ''}
                    </div>
                    <div class="artists-grid">
                        ${results.artists.slice(0, 6).map(artist => `
                            <div class="artist-card" data-artist-id="${artist.id}">
                                <div class="artist-image-wrapper">
                                    <img src="${artist.image || CONFIG.DEFAULT_IMAGES.ARTIST}" 
                                         alt="${artist.name}">
                                </div>
                                <div class="artist-info">
                                    <h3>${artist.name}</h3>
                                    <p>${artist.trackCount} tracks</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (results.albums.length) {
            html += `
                <div class="results-section">
                    <div class="section-header">
                        <h2>Albums</h2>
                        ${results.albums.length > 6 ? 
                            `<button class="btn-text" data-type="albums">See all</button>` : ''}
                    </div>
                    <div class="albums-grid">
                        ${results.albums.slice(0, 6).map(album => `
                            <div class="album-card" data-album-id="${album.id}">
                                <div class="album-art">
                                    <img src="${album.image || CONFIG.DEFAULT_IMAGES.ALBUM}" 
                                         alt="${album.name}">
                                    <button class="btn-play">
                                        <span class="material-symbols-rounded">play_arrow</span>
                                    </button>
                                </div>
                                <div class="album-info">
                                    <h3>${album.name}</h3>
                                    <p>${album.artistName}</p>
                                    <span class="album-stats">${album.trackCount} tracks</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    } else {
        // Render specific filter results
        const sectionTitle = {
            tracks: 'Songs',
            artists: 'Artists',
            albums: 'Albums'
        }[this.currentFilter];

        const items = results[this.currentFilter];
        
        if (items.length) {
            html = `
                <div class="results-section">
                    <h2>${sectionTitle}</h2>
                    <div class="${this.currentFilter}-grid">
                        ${items.map(item => {
                            if (this.currentFilter === 'tracks') {
                                return `
                                    <div class="track-card" data-track-id="${item.id}">
                                        <div class="track-art">
                                            <img src="${item.posterUrl || CONFIG.DEFAULT_IMAGES.TRACK}" 
                                                 alt="${item.title}">
                                            <button class="btn-play">
                                                <span class="material-symbols-rounded">play_arrow</span>
                                            </button>
                                        </div>
                                        <div class="track-info">
                                            <h3>${item.title}</h3>
                                            <p>${item.artist}</p>
                                            <span class="track-duration">${formatTime(item.duration)}</span>
                                        </div>
                                    </div>
                                `;
                            } else if (this.currentFilter === 'artists') {
                                return `
                                    <div class="artist-card" data-artist-id="${item.id}">
                                        <div class="artist-image-wrapper">
                                            <img src="${item.image || CONFIG.DEFAULT_IMAGES.ARTIST}" 
                                                 alt="${item.name}">
                                        </div>
                                        <div class="artist-info">
                                            <h3>${item.name}</h3>
                                            <p>${item.trackCount} tracks</p>
                                        </div>
                                    </div>
                                `;
                            } else {
                                return `
                                    <div class="album-card" data-album-id="${item.id}">
                                        <div class="album-art">
                                            <img src="${item.image || CONFIG.DEFAULT_IMAGES.ALBUM}" 
                                                 alt="${item.name}">
                                            <button class="btn-play">
                                                <span class="material-symbols-rounded">play_arrow</span>
                                            </button>
                                        </div>
                                        <div class="album-info">
                                            <h3>${item.name}</h3>
                                            <p>${item.artistName}</p>
                                            <span class="album-stats">${item.trackCount} tracks</span>
                                        </div>
                                    </div>
                                `;
                            }
                        }).join('')}
                    </div>
                </div>
            `;
        }
    }

    this.searchResults.innerHTML = html;
    this.searchResults.classList.remove('hidden');
    this.noResults.classList.add('hidden');
    this.initialState.classList.add('hidden');

    // Add click events to results
    this.addSearchResultsEventListeners();

    // Add "See all" button events
    this.searchResults.querySelectorAll('.btn-text').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            this.currentFilter = type;
            this.searchFilters.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.type === type);
            });
            this.renderSearchResults(results);
        });
    });
}

// Add event listeners to search results
addSearchResultsEventListeners() {
    // Track click events
    this.searchResults.querySelectorAll('.track-card').forEach(card => {
        card.addEventListener('click', () => {
            const trackId = card.dataset.trackId;
            this.playTrackById(trackId);
        });
    });

    // Artist click events
    this.searchResults.querySelectorAll('.artist-card').forEach(card => {
        card.addEventListener('click', () => {
            const artistId = card.dataset.artistId;
            this.handleArtistClick(artistId);
        });
    });

    // Album click events
    this.searchResults.querySelectorAll('.album-card').forEach(card => {
        card.addEventListener('click', () => {
            const albumId = card.dataset.albumId;
            this.handleAlbumClick(albumId);
        });
    });
}

loadPlaylists() {
    try {
        return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.PLAYLISTS) || '[]');
    } catch {
        return [];
    }
}

savePlaylists() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.PLAYLISTS, JSON.stringify(this.playlists));
}

renderPlaylists() {
    const playlistsGrid = document.getElementById('playlistsGrid');
    const customPlaylists = this.playlists.map(playlist => `
        <div class="playlist-card" data-playlist-id="${playlist.id}">
            <div class="playlist-art">
                <img src="${playlist.coverUrl || 'assets/images/default-playlist.jpg'}" 
                     alt="${playlist.name}">
                <button class="btn-play">
                    <span class="material-symbols-rounded">play_arrow</span>
                </button>
            </div>
            <div class="playlist-info">
                <h3>${playlist.name}</h3>
                <p>${playlist.tracks.length} tracks</p>
            </div>
        </div>
    `).join('');

    // Append custom playlists after default playlists
    const defaultPlaylists = playlistsGrid.querySelectorAll('.default-playlist');
    if (defaultPlaylists.length) {
        defaultPlaylists[defaultPlaylists.length - 1].insertAdjacentHTML('afterend', customPlaylists);
    }

    // Show/hide empty state
    document.getElementById('emptyPlaylists').classList.toggle('hidden', 
        this.playlists.length > 0);

    // Add click events
    playlistsGrid.querySelectorAll('.playlist-card').forEach(card => {
        card.addEventListener('click', () => {
            this.openPlaylist(card.dataset.playlistId);
        });
    });
}

showCreatePlaylistModal() {
    const modal = createModal('Create Playlist', `
        <form class="playlist-form" id="createPlaylistForm">
            <div class="form-group">
                <label for="playlistName">Playlist Name</label>
                <input type="text" id="playlistName" required 
                       placeholder="Enter playlist name">
            </div>
            <div class="form-group">
                <label>Playlist Cover</label>
                <div class="playlist-cover-upload">
                    <div class="cover-preview">
                        <img src="assets/images/default-playlist.jpg" 
                             id="coverPreview" alt="Cover Preview">
                    </div>
                    <div class="upload-buttons">
                        <button type="button" class="btn-secondary" id="uploadCover">
                            Upload Image
                        </button>
                        <button type="button" class="btn-text" id="removeCover">
                            Remove
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-secondary" data-close-modal>
                    Cancel
                </button>
                <button type="submit" class="btn-primary">
                    Create Playlist
                </button>
            </div>
        </form>
    `);

    // Handle form submission
    const form = modal.querySelector('#createPlaylistForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = form.querySelector('#playlistName').value;
        const coverUrl = form.querySelector('#coverPreview').src;
        this.createPlaylist(name, coverUrl);
        modal.remove();
    });

    // Handle cover upload
    const uploadBtn = modal.querySelector('#uploadCover');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', this.handleCoverUpload.bind(this));

    // Handle cover removal
    modal.querySelector('#removeCover').addEventListener('click', () => {
        modal.querySelector('#coverPreview').src = 'assets/images/default-playlist.jpg';
    });
}

async handleCoverUpload(e) {
    const file = e.target.files[0];
    if (file) {
        try {
            const coverUrl = await this.processImage(file);
            document.getElementById('coverPreview').src = coverUrl;
        } catch (error) {
            console.error('Error processing image:', error);
            showNotification('Error uploading image');
        }
    }
}

async processImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

createPlaylist(name, coverUrl) {
    const playlist = {
        id: Date.now().toString(),
        name,
        coverUrl,
        tracks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    this.playlists.push(playlist);
    this.savePlaylists();
    this.renderPlaylists();
    showNotification('Playlist created successfully');
}

// Add these methods to your MusicApp class

filterPlaylists(filter) {
    const playlistsGrid = document.getElementById('playlistsGrid');
    const allPlaylists = playlistsGrid.querySelectorAll('.playlist-card');

    allPlaylists.forEach(card => {
        switch (filter) {
            case 'all':
                card.classList.remove('hidden');
                break;
            case 'recent':
                const isRecent = card.dataset.playlistId === 'recent' || 
                    this.wasRecentlyUpdated(card.dataset.playlistId);
                card.classList.toggle('hidden', !isRecent);
                break;
            case 'favorite':
                const isFavorite = card.dataset.playlistId === 'liked';
                card.classList.toggle('hidden', !isFavorite);
                break;
            case 'custom':
                const isCustom = !card.classList.contains('default-playlist');
                card.classList.toggle('hidden', !isCustom);
                break;
        }
    });
}

wasRecentlyUpdated(playlistId) {
    const playlist = this.playlists.find(p => p.id === playlistId);
    if (!playlist) return false;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(playlist.updatedAt) > oneWeekAgo;
}

sortPlaylists(sortBy) {
    const playlistsGrid = document.getElementById('playlistsGrid');
    const defaultPlaylists = Array.from(playlistsGrid.querySelectorAll('.default-playlist'));
    const customPlaylists = Array.from(playlistsGrid.querySelectorAll('.playlist-card:not(.default-playlist)'));

    // Sort custom playlists
    customPlaylists.sort((a, b) => {
        const playlistA = this.playlists.find(p => p.id === a.dataset.playlistId);
        const playlistB = this.playlists.find(p => p.id === b.dataset.playlistId);

        switch (sortBy) {
            case 'name':
                return playlistA.name.localeCompare(playlistB.name);
            case 'tracks':
                return playlistB.tracks.length - playlistA.tracks.length;
            case 'created':
                return new Date(playlistB.createdAt) - new Date(playlistA.createdAt);
            default: // recent
                return new Date(playlistB.updatedAt) - new Date(playlistA.updatedAt);
        }
    });

    // Clear and reappend playlists
    playlistsGrid.innerHTML = '';
    defaultPlaylists.forEach(playlist => playlistsGrid.appendChild(playlist));
    customPlaylists.forEach(playlist => playlistsGrid.appendChild(playlist));
}

updateDefaultPlaylistCounts() {
    // Update Liked Songs count
    const likedTracks = this.getLikedTracks();
    const likedPlaylist = document.querySelector('[data-playlist-id="liked"]');
    if (likedPlaylist) {
        likedPlaylist.querySelector('p').textContent = `${likedTracks.length} tracks`;
    }

    // Update Recently Played count
    const recentTracks = this.getRecentlyPlayed();
    const recentPlaylist = document.querySelector('[data-playlist-id="recent"]');
    if (recentPlaylist) {
        recentPlaylist.querySelector('p').textContent = `${recentTracks.length} tracks`;
    }
}

async openPlaylist(playlistId) {
    showLoading();
    try {
        let playlist;
        let tracks;

        if (playlistId === 'liked') {
            tracks = this.getLikedTracks();
            playlist = {
                id: 'liked',
                name: 'Liked Songs',
                coverUrl: 'assets/images/liked-songs.jpg',
                tracks
            };
        } else if (playlistId === 'recent') {
            tracks = this.getRecentlyPlayed();
            playlist = {
                id: 'recent',
                name: 'Recently Played',
                coverUrl: 'assets/images/recently-played.jpg',
                tracks
            };
        } else {
            playlist = this.playlists.find(p => p.id === playlistId);
            tracks = playlist.tracks;
        }

        this.currentPlaylist = playlist;
        this.showPlaylistDetails(playlist, tracks);
    } catch (error) {
        console.error('Error opening playlist:', error);
        showNotification('Error opening playlist');
    }
    hideLoading();
}

showPlaylistDetails(playlist, tracks) {
    const modal = createModal(playlist.name, `
        <div class="playlist-details">
            <div class="playlist-header">
                <!-- ... previous header content ... -->
                ${playlist.id !== 'liked' && playlist.id !== 'recent' ? `
                    <div class="playlist-actions">
                        <button class="btn-primary add-local-music">
                            <span class="material-symbols-rounded">upload</span>
                            Add Local Music
                        </button>
                        <button class="btn-secondary edit-playlist" data-playlist-id="${playlist.id}">
                            <span class="material-symbols-rounded">edit</span>
                            Edit
                        </button>
                        <button class="btn-danger delete-playlist" data-playlist-id="${playlist.id}">
                            <span class="material-symbols-rounded">delete</span>
                            Delete
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="playlist-tracks">
                ${tracks.length > 0 ? `
                    <div class="tracks-list">
                        ${tracks.map((track, index) => `
                            <div class="track-item" data-track-id="${track.id}">
                                <span class="track-number">${index + 1}</span>
                                <img src="${track.posterUrl || CONFIG.DEFAULT_IMAGES.TRACK}" 
                                     alt="${track.title}">
                                <div class="track-info">
                                    <h3>${track.title}</h3>
                                    <p>${track.artist}</p>
                                </div>
                                <span class="track-duration">${formatTime(track.duration)}</span>
                                <button class="btn-icon remove-track" data-track-id="${track.id}">
                                    <span class="material-symbols-rounded">remove</span>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="empty-playlist">
                        <span class="material-symbols-rounded">music_off</span>
                        <h3>No tracks in this playlist</h3>
                        <p>Start adding your favorite tracks</p>
                    </div>
                `}
            </div>
        </div>
    `);
    
    const addLocalMusicBtn = modal.querySelector('.add-local-music');
    if (addLocalMusicBtn) {
        addLocalMusicBtn.addEventListener('click', () => {
            this.addLocalMusicToPlaylist(playlist.id);
        });
    }

    // Add event listeners
    if (playlist.id !== 'liked' && playlist.id !== 'recent') {
        const editBtn = modal.querySelector('.edit-playlist');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editPlaylist(playlist);
                modal.remove();
            });
        }

        const deleteBtn = modal.querySelector('.delete-playlist');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this playlist?')) {
                    this.deletePlaylist(playlist.id);
                    modal.remove();
                }
            });
        }
    }

    // Track click events
    modal.querySelectorAll('.track-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-track')) {
                const trackId = item.dataset.trackId;
                const track = tracks.find(t => t.id === trackId);
                if (track) this.playTrack(track);
            }
        });
    });

    // Remove track events
    modal.querySelectorAll('.remove-track').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const trackId = btn.dataset.trackId;
            this.removeTrackFromPlaylist(playlist.id, trackId);
            btn.closest('.track-item').remove();
            this.updatePlaylistCount(playlist.id);
        });
    });
}

editPlaylist(playlist) {
    const modal = createModal('Edit Playlist', `
        <form class="playlist-form" id="editPlaylistForm">
            <div class="form-group">
                <label for="playlistName">Playlist Name</label>
                <input type="text" id="playlistName" required 
                       value="${playlist.name}"
                       placeholder="Enter playlist name">
            </div>
            <div class="form-group">
                <label>Playlist Cover</label>
                <div class="playlist-cover-upload">
                    <div class="cover-preview">
                        <img src="${playlist.coverUrl}" 
                             id="coverPreview" alt="Cover Preview">
                    </div>
                    <div class="upload-buttons">
                        <button type="button" class="btn-secondary" id="uploadCover">
                            Upload Image
                        </button>
                        <button type="button" class="btn-text" id="removeCover">
                            Remove
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-secondary" data-close-modal>
                    Cancel
                </button>
                <button type="submit" class="btn-primary">
                    Save Changes
                </button>
            </div>
        </form>
    `);

    // Handle form submission
    const form = modal.querySelector('#editPlaylistForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = form.querySelector('#playlistName').value;
        const coverUrl = form.querySelector('#coverPreview').src;
        this.updatePlaylist(playlist.id, { name, coverUrl });
        modal.remove();
    });

    // Handle cover upload
    const uploadBtn = modal.querySelector('#uploadCover');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', this.handleCoverUpload.bind(this));

    // Handle cover removal
    modal.querySelector('#removeCover').addEventListener('click', () => {
        modal.querySelector('#coverPreview').src = 'assets/images/default-playlist.jpg';
    });
}

updatePlaylist(playlistId, updates) {
    const index = this.playlists.findIndex(p => p.id === playlistId);
    if (index !== -1) {
        this.playlists[index] = {
            ...this.playlists[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.savePlaylists();
        this.renderPlaylists();
        showNotification('Playlist updated successfully');
    }
}

deletePlaylist(playlistId) {
    this.playlists = this.playlists.filter(p => p.id !== playlistId);
    this.savePlaylists();
    
    // Remove the playlist card from DOM
    const playlistCard = document.querySelector(`[data-playlist-id="${playlistId}"]`);
    if (playlistCard) {
        playlistCard.remove();
    }

    // Check if we need to show empty state
    const customPlaylists = document.querySelectorAll('.playlist-card:not(.default-playlist)');
    document.getElementById('emptyPlaylists').classList.toggle('hidden', 
        customPlaylists.length > 0);

    showNotification('Playlist deleted successfully');
}

removeTrackFromPlaylist(playlistId, trackId) {
    if (playlistId === 'liked') {
        this.unlikeTrack(trackId);
    } else if (playlistId === 'recent') {
        // Cannot remove from recent playlist
        return;
    } else {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (playlist) {
            playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
            playlist.updatedAt = new Date().toISOString();
            this.savePlaylists();
        }
    }
    this.updateDefaultPlaylistCounts();
}

getLikedTracks() {
    try {
        return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.LIKED_TRACKS) || '[]');
    } catch {
        return [];
    }
}

unlikeTrack(trackId) {
    const likedTracks = this.getLikedTracks();
    const updatedTracks = likedTracks.filter(t => t.id !== trackId);
    localStorage.setItem(CONFIG.STORAGE_KEYS.LIKED_TRACKS, JSON.stringify(updatedTracks));
    this.updateDefaultPlaylistCounts();
}

updatePlaylistCount(playlistId) {
    const card = document.querySelector(`[data-playlist-id="${playlistId}"]`);
    if (card) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (playlist) {
            card.querySelector('p').textContent = `${playlist.tracks.length} tracks`;
        }
    }
}

// Add these methods to your MusicApp class

addLocalMusicToPlaylist(playlistId) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.multiple = true;

    fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        showLoading();

        try {
            const tracks = await Promise.all(files.map(this.processLocalAudioFile.bind(this)));
            await this.addTracksToPlaylist(playlistId, tracks);
            showNotification(`Added ${tracks.length} tracks to playlist`);
        } catch (error) {
            console.error('Error processing local files:', error);
            showNotification('Error adding local tracks');
        }

        hideLoading();
    });

    fileInput.click();
}

async processLocalAudioFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                // Create audio element to get duration
                const audio = new Audio(e.target.result);
                await new Promise(resolve => audio.addEventListener('loadedmetadata', resolve));

                // Create blob URL for storage
                const blob = new Blob([file], { type: file.type });
                const musicPath = URL.createObjectURL(blob);

                // Get metadata using music-metadata-browser library
                const metadata = await this.extractAudioMetadata(file);

                resolve({
                    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
                    artist: metadata.artist || 'Unknown Artist',
                    duration: audio.duration,
                    musicPath,
                    posterUrl: metadata.picture || CONFIG.DEFAULT_IMAGES.TRACK,
                    local: true,
                    originalFile: file
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async extractAudioMetadata(file) {
    // Note: You'll need to include the music-metadata-browser library
    try {
        const metadata = await window.musicMetadata.parseBlob(file);
        let picture = CONFIG.DEFAULT_IMAGES.TRACK;

        if (metadata.common.picture && metadata.common.picture.length > 0) {
            const pictureTags = metadata.common.picture[0];
            const blob = new Blob([pictureTags.data], { type: pictureTags.format });
            picture = URL.createObjectURL(blob);
        }

        return {
            title: metadata.common.title,
            artist: metadata.common.artist,
            album: metadata.common.album,
            picture
        };
    } catch (error) {
        console.error('Error extracting metadata:', error);
        return {};
    }
}

async addTracksToPlaylist(playlistId, tracks) {
    const playlist = this.playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    // Add tracks and remove duplicates
    const existingIds = new Set(playlist.tracks.map(t => t.id));
    const newTracks = tracks.filter(track => !existingIds.has(track.id));
    
    playlist.tracks.push(...newTracks);
    playlist.updatedAt = new Date().toISOString();
    
    this.savePlaylists();
    this.updatePlaylistCount(playlistId);

    // If playlist details are open, refresh the view
    if (this.currentPlaylist && this.currentPlaylist.id === playlistId) {
        this.openPlaylist(playlistId);
    }
}

// Helper method to play track by ID
async playTrackById(trackId) {
    showLoading();
    try {
        const track = await this.api.getTrackById(trackId);
        if (track) {
            await this.playTrack(track);
        }
    } catch (error) {
        console.error('Error playing track:', error);
        showNotification('Error playing track');
    }
    hideLoading();
}

showExpandedPlayer() {
    this.miniPlayer.classList.add('active');
    if (!this.miniPlayer.querySelector('.background-blur')) {
        const blur = document.createElement('div');
        blur.className = 'background-blur';
        this.miniPlayer.prepend(blur);
    }
    this.updateBackgroundBlur();
    
    // Ensure proper height and scroll position
    if (this.miniPlayer.classList.contains('expanded')) {
        document.body.style.overflow = 'hidden';
        window.scrollTo(0, 0);
    }
}

updateBackgroundBlur() {
    // Remove existing background blur
    const existingBlur = this.miniPlayer.querySelector('.background-blur');
    if (existingBlur) existingBlur.remove();

    // Create new background blur from current track image
    const blur = document.createElement('div');
    blur.className = 'background-blur';
    blur.style.backgroundImage = `url(${this.currentTrack.posterUrl || CONFIG.DEFAULT_IMAGES.TRACK})`;
    this.miniPlayer.insertBefore(blur, this.miniPlayer.firstChild);
}

toggleExpandedPlayer() {
    if (!this.currentTrack) return;
    
    const isExpanding = !this.miniPlayer.classList.contains('expanded');
    this.miniPlayer.classList.toggle('expanded');
    document.body.style.overflow = isExpanding ? 'hidden' : '';
    
    if (isExpanding) {
        window.scrollTo(0, 0);
    }
    
    this.updateBackgroundBlur();
}

updatePlayerDisplay(track) {
        if (!track) return;

        // Update mini player elements with null checks
        const elements = {
            miniPlayerCover: document.getElementById('miniPlayerCover'),
            miniPlayerTitle: document.getElementById('miniPlayerTitle'),
            miniPlayerArtist: document.getElementById('miniPlayerArtist'),
            expandedPlayerCover: document.getElementById('expandedPlayerCover'),
            expandedPlayerTitle: document.getElementById('expandedPlayerTitle'),
            expandedPlayerArtist: document.getElementById('expandedPlayerArtist'),
            progressBar: document.getElementById('progressBar'),
            miniPlayerProgress: document.getElementById('miniPlayerProgress')
        };

        // Update each element only if it exists
        if (elements.miniPlayerCover) {
            elements.miniPlayerCover.src = track.posterUrl || CONFIG.DEFAULT_IMAGES.TRACK;
        }
        if (elements.miniPlayerTitle) {
            elements.miniPlayerTitle.textContent = track.title;
        }
        if (elements.miniPlayerArtist) {
            elements.miniPlayerArtist.textContent = track.artist;
        }
        if (elements.expandedPlayerCover) {
            elements.expandedPlayerCover.src = track.posterUrl || CONFIG.DEFAULT_IMAGES.TRACK;
        }
        if (elements.expandedPlayerTitle) {
            elements.expandedPlayerTitle.textContent = track.title;
        }
        if (elements.expandedPlayerArtist) {
            elements.expandedPlayerArtist.textContent = track.artist;
        }

        // Reset progress bars if they exist
        if (elements.progressBar) {
            elements.progressBar.style.width = '0%';
        }
        if (elements.miniPlayerProgress) {
            elements.miniPlayerProgress.style.width = '0%';
        }
    }

toggleLike() {
    if (!this.currentTrack) return;

    const isLiked = this.isTrackLiked(this.currentTrack.id);
    if (isLiked) {
        this.unlikeTrack(this.currentTrack.id);
    } else {
        this.likeTrack(this.currentTrack);
    }

    // Update like button state
    const likeBtn = document.getElementById('likeBtn');
    likeBtn.querySelector('span').textContent = !isLiked ? 'favorite' : 'favorite_border';
    likeBtn.classList.toggle('active', !isLiked);
}

showAddToPlaylistModal() {
    if (!this.currentTrack) return;

    const modal = createModal('Add to Playlist', `
        <div class="add-to-playlist-modal">
            <div class="current-track">
                <img src="${this.currentTrack.posterUrl || CONFIG.DEFAULT_IMAGES.TRACK}" 
                     alt="${this.currentTrack.title}">
                <div class="track-info">
                    <h4>${this.currentTrack.title}</h4>
                    <p>${this.currentTrack.artist}</p>
                </div>
            </div>
            <div class="playlists-list">
                ${this.playlists.map(playlist => `
                    <div class="playlist-item" data-playlist-id="${playlist.id}">
                        <img src="${playlist.coverUrl || CONFIG.DEFAULT_IMAGES.TRACK}" 
                             alt="${playlist.name}">
                        <div class="playlist-info">
                            <h4>${playlist.name}</h4>
                            <p>${playlist.tracks.length} tracks</p>
                        </div>
                        <button class="btn-icon ${this.isTrackInPlaylist(playlist.id, this.currentTrack.id) ? 'added' : ''}">
                            <span class="material-symbols-rounded">
                                ${this.isTrackInPlaylist(playlist.id, this.currentTrack.id) ? 'playlist_add_check' : 'playlist_add'}
                            </span>
                        </button>
                    </div>
                `).join('')}
            </div>
            <button class="btn-primary create-new-playlist">
                <span class="material-symbols-rounded">add</span>
                Create New Playlist
            </button>
        </div>
    `);

    // Add event listeners
    modal.querySelectorAll('.playlist-item').forEach(item => {
        item.addEventListener('click', () => {
            const playlistId = item.dataset.playlistId;
            this.toggleTrackInPlaylist(playlistId, this.currentTrack);
            
            // Update button state
            const btn = item.querySelector('.btn-icon');
            const isAdded = btn.classList.toggle('added');
            btn.querySelector('span').textContent = 
                isAdded ? 'playlist_add_check' : 'playlist_add';
        });
    });

    modal.querySelector('.create-new-playlist').addEventListener('click', () => {
        modal.remove();
        this.showCreatePlaylistModal(this.currentTrack);
    });
}

isTrackInPlaylist(playlistId, trackId) {
    const playlist = this.playlists.find(p => p.id === playlistId);
    return playlist ? playlist.tracks.some(t => t.id === trackId) : false;
}

toggleTrackInPlaylist(playlistId, track) {
    const playlist = this.playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const trackIndex = playlist.tracks.findIndex(t => t.id === track.id);
    if (trackIndex === -1) {
        // Add track
        playlist.tracks.push(track);
        showNotification(`Added to ${playlist.name}`);
    } else {
        // Remove track
        playlist.tracks.splice(trackIndex, 1);
        showNotification(`Removed from ${playlist.name}`);
    }

    playlist.updatedAt = new Date().toISOString();
    this.savePlaylists();
    this.updatePlaylistCount(playlistId);
}

likeTrack(track) {
    const likedTracks = this.getLikedTracks();
    if (!likedTracks.some(t => t.id === track.id)) {
        likedTracks.push(track);
        localStorage.setItem(CONFIG.STORAGE_KEYS.LIKED_TRACKS, JSON.stringify(likedTracks));
        this.updateDefaultPlaylistCounts();
        showNotification('Added to Liked Songs');
    }
}

isTrackLiked(trackId) {
    const likedTracks = this.getLikedTracks();
    return likedTracks.some(track => track.id === trackId);
}

// Add shuffle functionality
shufflePlaylist() {
    if (!this.currentPlaylist) return;
    
    const tracks = [...this.currentPlaylist.tracks];
    for (let i = tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
    }
    
    this.currentPlaylist.tracks = tracks;
    showNotification('Playlist shuffled');
}

// Handle repeat modes (none, single, all)
handleRepeat() {
    const repeatBtn = document.getElementById('repeatBtn');
    const currentMode = repeatBtn.getAttribute('data-mode') || 'none';
    
    const modes = {
        'none': { next: 'single', icon: 'repeat_one' },
        'single': { next: 'all', icon: 'repeat' },
        'all': { next: 'none', icon: 'repeat' }
    };
    
    const newMode = modes[currentMode].next;
    repeatBtn.setAttribute('data-mode', newMode);
    repeatBtn.querySelector('span').textContent = modes[newMode].icon;
    repeatBtn.classList.toggle('active', newMode !== 'none');
    
    this.repeatMode = newMode;
    showNotification(`Repeat: ${newMode}`);
}

// Add drag functionality to mini player
setupDragToExpand() {
    let startY = 0;
    let startHeight = 0;
    const minHeight = 72; // Mini player height
    const maxHeight = window.innerHeight;
    
    const handleTouchStart = (e) => {
        if (e.target.closest('.controls')) return;
        startY = e.touches[0].clientY;
        startHeight = this.miniPlayer.offsetHeight;
        this.miniPlayer.style.transition = 'none';
    };
    
    const handleTouchMove = (e) => {
        if (!startY) return;
        
        const deltaY = startY - e.touches[0].clientY;
        let newHeight = startHeight + deltaY;
        
        // Constrain height between min and max
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        
        this.miniPlayer.style.height = `${newHeight}px`;
        
        // Toggle expanded class based on height
        const expanded = newHeight > (minHeight + maxHeight) / 2;
        this.miniPlayer.classList.toggle('expanded', expanded);
    };
    
    const handleTouchEnd = () => {
        startY = 0;
        this.miniPlayer.style.transition = '';
        
        // Snap to either expanded or collapsed state
        const expanded = this.miniPlayer.classList.contains('expanded');
        this.miniPlayer.style.height = expanded ? '100vh' : '72px';
        document.body.style.overflow = expanded ? 'hidden' : '';
    };
    
    this.miniPlayer.addEventListener('touchstart', handleTouchStart);
    this.miniPlayer.addEventListener('touchmove', handleTouchMove);
    this.miniPlayer.addEventListener('touchend', handleTouchEnd);
}

    // Utility Functions
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    saveCurrentTrack() {
        if (this.currentTrack) {
            localStorage.setItem('currentTrack', JSON.stringify(this.currentTrack));
        }
    }

    restoreLastPlayingTrack() {
        const savedTrack = localStorage.getItem('currentTrack');
        if (savedTrack) {
            try {
                const track = JSON.parse(savedTrack);
                this.updateMiniPlayer(track);
                this.currentTrack = track;
            } catch (error) {
                console.error('Error restoring last track:', error);
            }
        }
    }

    checkAuthStatus() {
        // Check if user is logged in
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
            document.body.classList.add('user-logged-in');
        } else {
            document.body.classList.remove('user-logged-in');
        }
    }
}

// Helper Functions
function showLoading() {
    const loader = document.getElementById('loadingSpinner');
    if (loader) loader.classList.remove('hidden');
}

function hideLoading() {
    const loader = document.getElementById('loadingSpinner');
    if (loader) loader.classList.add('hidden');
}

// ... (previous code remains the same until showNotification)

function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    // Add animation class after a small delay to trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove notification after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

function debounce(func, wait) {
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



// Modal Functions
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="btn-icon close-modal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;

    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });

    // Close modal on close button click
    modal.querySelector('.close-modal').addEventListener('click', () => {
        closeModal(modal);
    });

    document.body.appendChild(modal);
    return modal;
}

function closeModal(modal) {
    modal.classList.add('fade-out');
    setTimeout(() => modal.remove(), 300);
}

function addRefreshAnimation(button) {
    button.classList.add('rotating');
    setTimeout(() => button.classList.remove('rotating'), 1000);
}

// Format time duration
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create instance of MusicApp
    window.app = new MusicApp();

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return; // Don't handle if user is typing in an input

        switch(e.key.toLowerCase()) {
            case ' ':
                e.preventDefault();
                window.app.togglePlayPause();
                break;
            case 'arrowright':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    window.app.playNext();
                }
                break;
            case 'f':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    document.getElementById('searchInput').focus();
                }
                break;
        }
    });

    // Handle visibility change for better audio control
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && window.app.isPlaying) {
            // Optionally pause when switching tabs
            // window.app.audioPlayer.pause();
        }
    });

    // Handle network status
    window.addEventListener('online', () => {
        showNotification('Back online! Full features restored.');
    });

    window.addEventListener('offline', () => {
        showNotification('You are offline. Some features may be limited.');
    });

    // Add touch gesture support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    });

    function handleSwipeGesture() {
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // Swipe right - Previous track
                window.app.playPrevious();
            } else {
                // Swipe left - Next track
                window.app.playNext();
            }
        }
    }
});

// Add these styles to handle notifications
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: -100px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--surface-color);
        color: var(--text-primary);
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transition: all 0.3s ease;
        opacity: 0;
    }

    .notification.show {
        bottom: 20px;
        opacity: 1;
    }

    .loading-spinner {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
    }

    .loading-spinner span {
        animation: spin 1s linear infinite;
        font-size: 48px;
        color: var(--primary-color);
    }

    .hidden {
        display: none;
    }

    @keyframes spin {
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
