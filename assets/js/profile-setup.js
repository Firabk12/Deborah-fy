class ProfileSetup {
    constructor() {
        this.currentTime = new Date('2025-03-09 17:47:17');
        this.currentUser = 'Firabk12';
        this.form = document.getElementById('profileForm');
        this.profileInput = document.getElementById('profilePic');
        this.profilePreview = document.getElementById('profilePreview');
        
        this.init();
    }

    init() {
        this.setupProfileUpload();
        this.setupFormValidation();
        this.setupBioCounter();
        this.setupUsernameCheck();
    }
    
    
    async handleProfileSubmission(profileData) {
        try {
            // Simulate API call
            await this.simulateApiCall();

            this.sessionManager.saveOnboardingData({
                profileData: {
                    displayName: profileData.displayName,
                    username: profileData.username,
                    bio: profileData.bio,
                    avatar: profileData.avatar
                },
                profileCompleted: true
            });

            window.location.href = 'music-preferences.html';
        } catch (error) {
            this.showNotification('Failed to save profile! Please try again.', 'error');
        }
    }

    setupProfileUpload() {
        const uploadArea = document.querySelector('.profile-preview');
        
        uploadArea.addEventListener('click', () => {
            this.profileInput.click();
        });

        this.profileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    this.profilePreview.src = e.target.result;
                    this.animateProfileUpdate();
                };
                
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    animateProfileUpdate() {
        this.profilePreview.style.transform = 'scale(0.8)';
        setTimeout(() => {
            this.profilePreview.style.transform = 'scale(1.1)';
        }, 150);
        setTimeout(() => {
            this.profilePreview.style.transform = 'scale(1)';
        }, 300);
    }

    setupFormValidation() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = this.form.querySelector('.next-btn');
            submitBtn.innerHTML = `
                <span class="material-symbols-rounded">sync</span>
                Saving...
            `;
            submitBtn.style.pointerEvents = 'none';

            // Simulate API call
            setTimeout(() => {
                this.showNotification('Profile saved successfully! 🎉');
                setTimeout(() => {
                    window.location.href = 'music-preferences.html';
                }, 1000);
            }, 1500);
        });
    }

    setupBioCounter() {
        const textarea = this.form.querySelector('textarea');
        const counter = this.form.querySelector('.char-count');
        
        textarea.addEventListener('input', () => {
            const count = textarea.value.length;
            counter.textContent = `${count}/160`;
            
            if (count > 140) {
                counter.style.color = '#ff4b4b';
            } else {
                counter.style.color = 'var(--text-secondary)';
            }
        });
    }

    setupUsernameCheck() {
        const usernameInput = this.form.querySelector('input[type="text"]:nth-child(2)');
        const statusElement = this.form.querySelector('.username-status');
        let checkTimeout;

        usernameInput.addEventListener('input', () => {
            clearTimeout(checkTimeout);
            
            checkTimeout = setTimeout(() => {
                // Simulate username check
                const username = usernameInput.value;
                if (username.length >= 3) {
                    statusElement.innerHTML = `
                        <span class="material-symbols-rounded" 
                              style="color: var(--success-color)">
                            check_circle
                        </span>
                    `;
                }
            }, 500);
        });
        }
    
 // ... (previous code remains the same until setupUsernameCheck) ...

    setupUsernameCheck() {
        const usernameInput = this.form.querySelector('input[type="text"]:nth-child(2)');
        const statusElement = this.form.querySelector('.username-status');
        let checkTimeout;

        usernameInput.addEventListener('input', () => {
            clearTimeout(checkTimeout);
            statusElement.innerHTML = `
                <span class="material-symbols-rounded" style="color: var(--text-secondary)">
                    sync
                </span>
            `;
            
            checkTimeout = setTimeout(() => {
                const username = usernameInput.value;
                if (username.length >= 3) {
                    // Simulate API check for username availability
                    if (this.isValidUsername(username)) {
                        if (Math.random() > 0.3) { // 70% chance username is available
                            this.showUsernameStatus(statusElement, true, 'Username available');
                        } else {
                            this.showUsernameStatus(statusElement, false, 'Username taken');
                        }
                    } else {
                        this.showUsernameStatus(statusElement, false, 'Invalid username');
                    }
                } else {
                    statusElement.innerHTML = '';
                }
            }, 500);
        });
    }

    isValidUsername(username) {
        return /^[A-Za-z0-9_]{3,20}$/.test(username);
    }

    showUsernameStatus(element, isAvailable, message) {
        element.innerHTML = `
            <span class="material-symbols-rounded" 
                  style="color: var(${isAvailable ? '--success-color' : '--error-color'})">
                ${isAvailable ? 'check_circle' : 'error'}
            </span>
        `;
        
        // Show tooltip with message
        this.showTooltip(element, message);
    }

    showTooltip(element, message) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = message;
        
        element.appendChild(tooltip);
        
        setTimeout(() => tooltip.remove(), 2000);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="material-symbols-rounded">done</span>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after animation
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Handle drag and drop for profile picture
    setupDragAndDrop() {
        const dropArea = document.querySelector('.profile-preview');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        dropArea.addEventListener('dragenter', () => dropArea.classList.add('drag-over'));
        dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
        
        dropArea.addEventListener('drop', (e) => {
            dropArea.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            
            if (file && file.type.startsWith('image/')) {
                this.profileInput.files = e.dataTransfer.files;
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    this.profilePreview.src = e.target.result;
                    this.animateProfileUpdate();
                };
                
                reader.readAsDataURL(file);
            } else {
                this.showNotification('Please upload an image file! 🖼️');
            }
        });
    }
}

// Add these styles to profile-setup.css
const styles = `
    /* Tooltip */
    .tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: var(--text-primary);
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 0.875rem;
        right: 40px;
        top: 50%;
        transform: translateY(-50%);
        animation: fadeIn 0.3s ease;
        white-space: nowrap;
    }

    /* Notification */
    .notification {
        position: fixed;
        top: 32px;
        right: 32px;
        background: var(--primary-color);
        color: var(--dark-color);
        padding: 16px 24px;
        border-radius: 12px;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        z-index: 1000;
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    /* Drag and Drop */
    .profile-preview.drag-over {
        transform: scale(1.05);
        border: 2px dashed var(--primary-color);
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add styles to document
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Initialize ProfileSetup
    const profileSetup = new ProfileSetup();
    profileSetup.setupDragAndDrop(); // Add drag and drop support
});