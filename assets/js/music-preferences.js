class MusicPreferences {
    constructor() {
        this.currentTime = new Date('2025-03-09 18:09:16');
        this.currentUser = 'Firabk12';
        this.selectedGenres = new Set();
        this.selectedArtists = new Set();
        this.form = document.getElementById('preferencesForm');
        
        // Sample artist data (In real app, this would come from an API)
        this.artistDatabase = [
            { id: 1, name: 'Taylor Swift', image: '../assets/images/artists/taylor.jpg' },
            { id: 2, name: 'The Weeknd', image: '../assets/images/artists/weeknd.jpg' },
            { id: 3, name: 'Drake', image: '../assets/images/artists/drake.jpg' },
            { id: 4, name: 'Dua Lipa', image: '../assets/images/artists/dua.jpg' },
            { id: 5, name: 'Ed Sheeran', image: '../assets/images/artists/ed.jpg' },
            { id: 6, name: 'Billie Eilish', image: '../assets/images/artists/billie.jpg' },
            // Add more artists as needed
        ];
        
        this.init();
    }

    init() {
        this.setupGenreSelection();
        this.setupMoodSliders();
        this.setupArtistSearch();
        this.setupFormSubmission();
        this.setupBackButton();
    }
    
    async handlePreferencesSubmission(preferences) {
        try {
            // Simulate API call
            await this.simulateApiCall();

            this.sessionManager.saveOnboardingData({
                musicPreferences: preferences,
                preferencesCompleted: true
            });

            // Complete onboarding
            await this.finalizeOnboarding();
            
            window.location.href = '../index.html';
        } catch (error) {
            this.showNotification('Failed to save preferences! Please try again.', 'error');
        }
    }

    async finalizeOnboarding() {
        const userData = this.sessionManager.getOnboardingData();
        
        // Save everything to backend
        await this.simulateApiCall();

        // Clear onboarding data
        this.sessionManager.clearOnboardingData();

        // Set user as logged in
        localStorage.setItem('theodore_user', JSON.stringify({
            isLoggedIn: true,
            userData: userData
        }));
    }

    setupGenreSelection() {
        const genreCards = document.querySelectorAll('.genre-card');
        
        genreCards.forEach(card => {
            card.addEventListener('click', () => {
                const genre = card.dataset.genre;
                
                if (this.selectedGenres.has(genre)) {
                    this.selectedGenres.delete(genre);
                    card.classList.remove('selected');
                    this.animateGenreCard(card, false);
                } else {
                    if (this.selectedGenres.size < 5) {
                        this.selectedGenres.add(genre);
                        card.classList.add('selected');
                        this.animateGenreCard(card, true);
                    } else {
                        this.showNotification('Maximum 5 genres allowed! 🎵', 'warning');
                    }
                }

                this.validateGenres();
            });
        });
    }

    animateGenreCard(card, isSelecting) {
        if (isSelecting) {
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = 'scale(1.05)';
            }, 150);
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 300);
        } else {
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 150);
        }
    }

    setupMoodSliders() {
        const sliders = document.querySelectorAll('.mood-slider input');
        
        sliders.forEach(slider => {
            // Create gradient background
            const updateSliderBackground = (value) => {
                const percentage = (value - slider.min) / (slider.max - slider.min) * 100;
                slider.style.background = `linear-gradient(to right, 
                    var(--primary-color) 0%, 
                    var(--primary-color) ${percentage}%, 
                    rgba(255, 255, 255, 0.1) ${percentage}%, 
                    rgba(255, 255, 255, 0.1) 100%)`;
            };

            slider.addEventListener('input', (e) => {
                updateSliderBackground(e.target.value);
            });

            // Initialize slider background
            updateSliderBackground(slider.value);
        });
    }

    setupArtistSearch() {
        const searchBox = document.querySelector('.search-box input');
        const selectedArtistsContainer = document.querySelector('.selected-artists');
        let searchResults = null;

        searchBox.addEventListener('input', () => {
            const query = searchBox.value.toLowerCase();
            
            // Remove previous results
            if (searchResults) {
                searchResults.remove();
                searchResults = null;
            }

            if (query.length >= 2) {
                const results = this.artistDatabase.filter(artist => 
                    artist.name.toLowerCase().includes(query) &&
                    !this.selectedArtists.has(artist.id)
                );

                if (results.length > 0) {
                    searchResults = this.createSearchResults(results);
                    searchBox.parentElement.appendChild(searchResults);
                }
            }
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (searchResults && !searchBox.parentElement.contains(e.target)) {
                searchResults.remove();
                searchResults = null;
            }
        });
    }

    createSearchResults(results) {
        const container = document.createElement('div');
        container.className = 'search-results';
        
        results.forEach(artist => {
            const result = document.createElement('div');
            result.className = 'search-result';
            result.innerHTML = `
                <img src="${artist.image}" alt="${artist.name}">
                <span>${artist.name}</span>
            `;

            result.addEventListener('click', () => {
                this.addArtist(artist);
                container.remove();
            });

            container.appendChild(result);
        });

        return container;
    }

    addArtist(artist) {
        if (this.selectedArtists.size >= 5) {
            this.showNotification('Maximum 5 artists allowed! 🎤', 'warning');
            return;
        }

        this.selectedArtists.add(artist.id);
        
        const chip = document.createElement('div');
        chip.className = 'artist-chip';
        chip.innerHTML = `
            <img src="${artist.image}" alt="${artist.name}">
            <span>${artist.name}</span>
            <button class="remove-btn" data-artist-id="${artist.id}">
                <span class="material-symbols-rounded">close</span>
            </button>
        `;

        chip.querySelector('.remove-btn').addEventListener('click', () => {
            this.selectedArtists.delete(artist.id);
            chip.style.transform = 'scale(0.8)';
            chip.style.opacity = '0';
            setTimeout(() => chip.remove(), 200);
        });

        document.querySelector('.selected-artists').appendChild(chip);
    }

    setupFormSubmission() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!this.validateForm()) {
                return;
            }

            const submitBtn = this.form.querySelector('.finish-btn');
            submitBtn.classList.add('loading');
            submitBtn.innerHTML = `
                <span class="material-symbols-rounded">sync</span>
                Setting up...
            `;

            // Collect all preferences
            const preferences = {
                genres: Array.from(this.selectedGenres),
                artists: Array.from(this.selectedArtists),
                moods: Array.from(document.querySelectorAll('.mood-slider input')).map(slider => ({
                    name: slider.previousElementSibling.textContent,
                    value: slider.value
                }))
            };

            // Simulate API call
            setTimeout(() => {
                this.showNotification('Preferences saved! Welcome aboard! 🎉');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            }, 2000);
        });
    }

    setupBackButton() {
        const backBtn = document.querySelector('.back-btn');
        backBtn.addEventListener('click', () => {
            backBtn.style.transform = 'translateX(-10px)';
            setTimeout(() => {
                window.location.href = 'profile-setup.html';
            }, 200);
        });
    }

    validateForm() {
        if (this.selectedGenres.size < 3) {
            this.showNotification('Please select at least 3 genres! 🎸', 'error');
            return false;
        }

        if (this.selectedArtists.size === 0) {
            this.showNotification('Please select at least one artist! 🎤', 'error');
            return false;
        }

        return true;
    }
    
    // Add this inside the MusicPreferences class
validateGenres() {
    const genreCount = this.selectedGenres.size;
    const finishBtn = document.querySelector('.finish-btn');
    
    // Update visual feedback
    document.querySelectorAll('.genre-card').forEach(card => {
        if (genreCount >= 5 && !this.selectedGenres.has(card.dataset.genre)) {
            card.style.opacity = '0.5';
            card.style.pointerEvents = 'none';
        } else {
            card.style.opacity = '1';
            card.style.pointerEvents = 'all';
        }
    });

    // Show selection count
    const genreSection = document.querySelector('.genres-section');
    let countDisplay = genreSection.querySelector('.genre-count');
    
    if (!countDisplay) {
        countDisplay = document.createElement('p');
        countDisplay.className = 'genre-count';
        genreSection.querySelector('.section-desc').appendChild(countDisplay);
    }

    countDisplay.textContent = ` (${genreCount}/5 selected)`;
    countDisplay.style.color = genreCount >= 3 ? 'var(--primary-color)' : 'var(--text-secondary)';

    // Update progress indicator
    if (genreCount >= 3) {
        finishBtn.classList.add('genres-ready');
    } else {
        finishBtn.classList.remove('genres-ready');
    }
}

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="material-symbols-rounded">
                    ${type === 'success' ? 'check_circle' : type === 'warning' ? 'warning' : 'error'}
                </span>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add these styles for search results and notifications
const extraStyles = `
    .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        margin-top: 8px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 100;
        animation: slideDown 0.3s ease;
    }

    .search-result {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .search-result:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .search-result img {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
    }

    .notification {
        position: fixed;
        top: 32px;
        right: 32px;
        padding: 16px 24px;
        border-radius: 12px;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        z-index: 1000;
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification.success {
        background: var(--primary-color);
        color: var(--dark-color);
    }

    .notification.warning {
        background: #ffd700;
        color: #000;
    }

    .notification.error {
        background: #ff4b4b;
        color: #fff;
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .genre-count {
        display: inline-block;
        margin-left: 8px;
        font-size: 0.875rem;
        transition: color 0.3s ease;
    }

    .genres-ready {
        position: relative;
    }

    .genres-ready::after {
        content: '';
        position: absolute;
        width: 8px;
        height: 8px;
        background: var(--primary-color);
        border-radius: 50%;
        top: 8px;
        right: 8px;
        animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.5; }
        100% { transform: scale(1); opacity: 1; }
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add extra styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = extraStyles;
    document.head.appendChild(styleSheet);

    // Initialize preferences
    new MusicPreferences();
});