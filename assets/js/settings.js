// settings.js
class SettingsManager {
    constructor() {
        // First check if we're on the account page
        console.log('SettingsManager initialized');
        this.initializeWhenReady();
    }

    initializeWhenReady() { 
        if (document.readyState === 'loading') { 
        document.addEventListener('DOMContentLoaded', () => { 
        console.log('DOM Content Loaded'); // Debug log 
        this.initialize(); 
        }); 
        } else { 
        this.initialize(); 
        } 
      }

    initialize() {
        // Initialize buttons only if they exist
        console.log('Initializing SettingsManager');
        
        const accountPage = document.querySelector('[data-page="accountPage"]');
        console.log('Account Page:', accountPage);
        if (!accountPage) {
           console.error('Account page not found');
           return; // Exit if not on account page
        }

        this.settingsBtn = accountPage.querySelector('.action-btn:nth-child(2)');
        this.helpBtn = accountPage.querySelector('.action-btn:nth-child(3)');
        
        // Debug logs
        console.log('Settings Modal:', this.settingsModal);
        console.log('Help Center Modal:', this.helpCenterModal);
        
        this.settingsModal = document.getElementById('settingsModal');
        this.helpCenterModal = document.getElementById('helpCenterModal');
        
        // Debug logs
        console.log('Settings Modal:', this.settingsModal);
        console.log('Help Center Modal:', this.helpCenterModal);

        if (!this.settingsModal || !this.helpCenterModal) {
            console.error('Required modal elements not found');
            return;
        }

        this.currentSettings = {
            theme: 'dark',
            accentColor: '#1DB954',
            audioQuality: 'auto',
            crossfade: 0,
            notifications: {
                newMusic: true,
                playlistUpdates: true,
                artistUpdates: false
            },
            privacy: {
                privateSession: false,
                listeningHistory: true
            },
            language: 'en'
        };
        
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', (e) => {
                console.log('Settings button clicked'); // Debug log
                e.preventDefault();
                this.openSettings();
            });
        }

        if (this.helpBtn) {
            this.helpBtn.addEventListener('click', (e) => {
                console.log('Help button clicked'); // Debug log
                e.preventDefault();
                this.openHelpCenter();
            });
        }

        this.initializeEventListeners();
        this.loadSettings();
    }

    initializeEventListeners() {
        // Settings Button
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.openSettings());
        }

        // Help Center Button
        if (this.helpBtn) {
            this.helpBtn.addEventListener('click', () => this.openHelpCenter());
        }

        // Settings Navigation
        const navItems = document.querySelectorAll('.settings-nav-item');
        if (navItems.length) {
            navItems.forEach(item => {
                item.addEventListener('click', (e) => this.switchSettingsSection(e));
            });
        }

        // Theme Selection
        const themeInputs = document.querySelectorAll('input[name="theme"]');
        if (themeInputs.length) {
            themeInputs.forEach(input => {
                input.addEventListener('change', (e) => this.changeTheme(e.target.value));
            });
        }

        // Color Selection
        const colorOptions = document.querySelectorAll('.color-option');
        if (colorOptions.length) {
            colorOptions.forEach(option => {
                option.addEventListener('click', (e) => this.changeAccentColor(e.target));
            });
        }

        // Crossfade Slider
        const crossfadeSlider = document.getElementById('crossfadeSlider');
        if (crossfadeSlider) {
            crossfadeSlider.addEventListener('input', (e) => this.updateCrossfade(e.target.value));
        }

        // Close Modals
        const closeButtons = document.querySelectorAll('.close-modal');
        if (closeButtons.length) {
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => this.closeModals());
            });
        }

        // FAQ Items
        const faqItems = document.querySelectorAll('.faq-item');
        if (faqItems.length) {
            faqItems.forEach(item => {
                item.addEventListener('click', () => this.toggleFAQ(item));
            });
        }

        // Help Search
        const helpSearch = document.querySelector('.help-search input');
        if (helpSearch) {
            helpSearch.addEventListener('input', (e) => this.searchHelp(e.target.value));
        }

        // Settings Changes
        const toggleInputs = document.querySelectorAll('.toggle input');
        if (toggleInputs.length) {
            toggleInputs.forEach(toggle => {
                toggle.addEventListener('change', (e) => this.handleSettingToggle(e));
            });
        }

        // Modal Background Click
        [this.settingsModal, this.helpCenterModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModals();
                    }
                });
            }
        });
    }

    openSettings() {
        console.log('Opening settings modal'); // Debug log
        if (this.settingsModal) {
            this.settingsModal.classList.remove('hidden');
            const modalContent = this.settingsModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.classList.add('modal-slide-in');
            }
        }
    }

    openHelpCenter() {
    console.log('Opening help center modal'); // Debug log
        if (this.helpCenterModal) {
            this.helpCenterModal.classList.remove('hidden');
            const modalContent = this.helpCenterModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.classList.add('modal-slide-in');
            }
        }
    }

    closeModals() {
        [this.settingsModal, this.helpCenterModal].forEach(modal => {
            if (modal && !modal.classList.contains('hidden')) {
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.classList.add('modal-slide-out');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        modalContent.classList.remove('modal-slide-in', 'modal-slide-out');
                    }, 300);
                }
            }
        });
    }

    switchSettingsSection(e) {
        const section = e.currentTarget.dataset.section;
        
        // Update navigation
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Update content
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.toggle('active', section.dataset.section === section);
        });
    }

    changeTheme(theme) {
        this.currentSettings.theme = theme;
        document.body.className = `theme-${theme}`;
        
        // Save the change
        this.saveSettings();
        
        // Show feedback
        this.showToast(`Theme changed to ${theme} mode`, 'success');
    }

    changeAccentColor(colorButton) {
        const color = colorButton.dataset.color;
        this.currentSettings.accentColor = color;
        
        // Update active state
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('active', option === colorButton);
        });

        // Update CSS variables
        document.documentElement.style.setProperty('--primary-color', color);
        
        // Save the change
        this.saveSettings();
        
        // Show feedback
        this.showToast('Accent color updated', 'success');
    }

    updateCrossfade(value) {
        this.currentSettings.crossfade = value;
        const valueDisplay = document.querySelector('.current-value');
        if (valueDisplay) {
            valueDisplay.textContent = `${value}s`;
        }
        
        // Save the change
        this.saveSettings();
    }

    handleSettingToggle(e) {
        const toggle = e.target;
        const settingInfo = toggle.closest('.toggle-option').querySelector('.toggle-info h4');
        if (!settingInfo) return;

        const setting = settingInfo.textContent.toLowerCase();
        
        // Update settings object based on the toggle
        if (this.currentSettings.notifications.hasOwnProperty(setting)) {
            this.currentSettings.notifications[setting] = toggle.checked;
        } else if (this.currentSettings.privacy.hasOwnProperty(setting)) {
            this.currentSettings.privacy[setting] = toggle.checked;
        }
        
        // Save the changes
        this.saveSettings();
        
        // Show feedback
        this.showToast(`${setting} ${toggle.checked ? 'enabled' : 'disabled'}`, 'success');
    }

    toggleFAQ(item) {
        const wasActive = item.classList.contains('active');
        
        // Close all other FAQs
        document.querySelectorAll('.faq-item').forEach(faq => {
            faq.classList.remove('active');
        });
        
        // Toggle the clicked FAQ
        if (!wasActive) {
            item.classList.add('active');
            
            // Add answer content if it doesn't exist
            if (!item.querySelector('.faq-answer')) {
                const question = item.querySelector('.faq-header span')?.textContent;
                if (question) {
                    const answer = document.createElement('div');
                    answer.className = 'faq-answer';
                    answer.innerHTML = this.getFAQAnswer(question);
                    item.appendChild(answer);
                }
            }
        }
    }

    getFAQAnswer(question) {
        // FAQ answers database
        const answers = {
            'How do I create a playlist?': `
                <p>Creating a playlist is easy:</p>
                <ol>
                    <li>Click the "+" button in the sidebar</li>
                    <li>Choose "Create Playlist"</li>
                    <li>Give your playlist a name</li>
                    <li>Start adding songs!</li>
                </ol>
            `,
            'How to download music for offline listening?': `
                <p>To download music for offline listening:</p>
                <ol>
                    <li>Find the song, album, or playlist you want to download</li>
                    <li>Click the download icon</li>
                    <li>Wait for the download to complete</li>
                </ol>
                <p>Note: This feature requires a premium subscription.</p>
            `,
            'How to change my password?': `
                <p>To change your password:</p>
                <ol>
                    <li>Go to Account Settings</li>
                    <li>Click on "Security"</li>
                    <li>Select "Change Password"</li>
                    <li>Follow the prompts to set a new password</li>
                </ol>
            `
        };
        
        return answers[question] || '<p>Answer not found.</p>';
    }

    searchHelp(query) {
        query = query.toLowerCase().trim();
        
        // Search through help cards
        document.querySelectorAll('.help-card').forEach(card => {
            const title = card.querySelector('h5')?.textContent.toLowerCase() || '';
            const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
            card.style.display = title.includes(query) || desc.includes(query) ? 'flex' : 'none';
        });
        
        // Search through FAQs
        document.querySelectorAll('.faq-item').forEach(item => {
            const question = item.querySelector('.faq-header span')?.textContent.toLowerCase() || '';
            item.style.display = question.includes(query) ? 'block' : 'none';
        });
    }

    loadSettings() {
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            try {
                this.currentSettings = JSON.parse(savedSettings);
                this.applySettings();
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
    }

    saveSettings() {
        // Save settings to localStorage
        try {
            localStorage.setItem('appSettings', JSON.stringify(this.currentSettings));
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Error saving settings', 'error');
        }
    }

    applySettings() {
        // Apply theme
        document.body.className = `theme-${this.currentSettings.theme}`;
        const themeInput = document.querySelector(`input[name="theme"][value="${this.currentSettings.theme}"]`);
        if (themeInput) {
            themeInput.checked = true;
        }

        // Apply accent color
        document.documentElement.style.setProperty('--primary-color', this.currentSettings.accentColor);
        const colorButton = document.querySelector(`[data-color="${this.currentSettings.accentColor}"]`);
        if (colorButton) {
            colorButton.classList.add('active');
        }

        // Apply crossfade
        const slider = document.getElementById('crossfadeSlider');
        const sliderValue = document.querySelector('.current-value');
        if (slider && sliderValue) {
            slider.value = this.currentSettings.crossfade;
            sliderValue.textContent = `${this.currentSettings.crossfade}s`;
        }

        // Apply notification settings
        Object.entries(this.currentSettings.notifications).forEach(([key, value]) => {
            const toggle = document.querySelector(`.toggle-option:has(h4:contains('${key}')) input`);
            if (toggle) {
                toggle.checked = value;
            }
        });

        // Apply privacy settings
        Object.entries(this.currentSettings.privacy).forEach(([key, value]) => {
            const toggle = document.querySelector(`.toggle-option:has(h4:contains('${key}')) input`);
            if (toggle) {
                toggle.checked = value;
            }
        });

        // Apply language
        const langSelect = document.querySelector('.settings-section[data-section="language"] select');
        if (langSelect) {
            langSelect.value = this.currentSettings.language;
        }
    }

    showToast(message, type = 'info') {
        // Use the AccountManager's showToast if available
        if (window.accountManager && window.accountManager.showToast) {
            window.accountManager.showToast(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }
}

// Initialize the settings manager
const settingsManager = new SettingsManager();
window.settingsManager = settingsManager;

// Add global modal click handler
document.addEventListener('DOMContentLoaded', () => { 
console.log('Creating SettingsManager instance'); // Debug log 
window.settingsManager = new SettingsManager(); });