// account.js

class AccountManager {
    constructor() {
        // DOM Elements
        this.profileImage = document.getElementById('profileImage');
        this.displayName = document.getElementById('displayName');
        this.username = document.querySelector('.username');
        this.bio = document.querySelector('.bio');
        this.editProfileBtn = document.querySelector('.action-btn.primary');
        this.securityOptions = document.querySelectorAll('.security-option');
        this.modal = document.getElementById('editProfileModal');
        this.profileImageInput = document.getElementById('profileImageInput');
        this.profileImagePreview = document.getElementById('profileImagePreview');
        this.displayNameInput = document.getElementById('displayNameInput');
        this.usernameInput = document.getElementById('usernameInput');
        this.bioInput = document.getElementById('bioInput');
        this.bioCharCount = document.querySelector('.bio-character-count');
        this.cancelBtn = document.getElementById('cancelEditProfile');
        this.saveBtn = document.getElementById('saveProfileChanges');
        
        // User Data (we'll simulate storage)
        this.userData = {
            displayName: 'Deborah Smith',
            username: 'Firabk12',
            bio: 'Music enthusiast | Creating vibes through code 🎵✨',
            profileImage: './assets/images/default-avatar.jpg'
        };

        this.initializeEventListeners();
        this.loadUserData();
    }

    initializeEventListeners() {
        // Edit Profile Button
        this.editProfileBtn.addEventListener('click', () => this.openEditProfileModal());

        // Modal Close Button
        document.querySelector('.close-modal').addEventListener('click', () => this.closeEditProfileModal());

        // Profile Image Upload
        this.profileImageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        document.querySelector('.profile-image-preview').addEventListener('click', () => {
            this.profileImageInput.click();
        });

        // Bio Character Count
        this.bioInput.addEventListener('input', () => this.updateBioCharCount());

        // Cancel and Save Buttons
        this.cancelBtn.addEventListener('click', () => this.closeEditProfileModal());
        this.saveBtn.addEventListener('click', () => this.saveChanges());

        // Security Options
        this.securityOptions.forEach(option => {
            option.addEventListener('click', (e) => this.handleSecurityOption(e));
        });

        // Close modal on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeEditProfileModal();
        });

        // Sign Out Button
        document.querySelector('.btn-danger').addEventListener('click', () => this.handleSignOut());

        // Delete Account Button
        document.querySelector('.btn-text-danger').addEventListener('click', () => this.handleDeleteAccount());
    }

    loadUserData() {
        // Load user data from localStorage or use default
        const savedData = localStorage.getItem('userData');
        if (savedData) {
            this.userData = JSON.parse(savedData);
        }

        this.updateUIWithUserData();
    }

    updateUIWithUserData() {
        this.profileImage.src = this.userData.profileImage;
        this.displayName.textContent = this.userData.displayName;
        this.username.textContent = `@${this.userData.username}`;
        this.bio.textContent = this.userData.bio;
    }

    openEditProfileModal() {
        // Populate modal with current data
        this.profileImagePreview.src = this.userData.profileImage;
        this.displayNameInput.value = this.userData.displayName;
        this.usernameInput.value = this.userData.username;
        this.bioInput.value = this.userData.bio;
        this.updateBioCharCount();

        // Show modal with animation
        this.modal.classList.remove('hidden');
        document.querySelector('.profile-edit-modal').classList.add('modal-slide-in');
    }

    closeEditProfileModal() {
        document.querySelector('.profile-edit-modal').classList.add('modal-slide-out');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            document.querySelector('.profile-edit-modal').classList.remove('modal-slide-in', 'modal-slide-out');
        }, 300);
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                this.showToast('Image size should be less than 5MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.profileImagePreview.src = e.target.result;
                // Add a smooth transition effect
                this.profileImagePreview.style.animation = 'imageUpdate 0.3s ease';
                setTimeout(() => {
                    this.profileImagePreview.style.animation = '';
                }, 300);
            };
            reader.readAsDataURL(file);
        }
    }

    updateBioCharCount() {
        const count = this.bioInput.value.length;
        this.bioCharCount.textContent = `${count}/160`;
        
        // Add color indication when approaching limit
        if (count > 140) {
            this.bioCharCount.classList.add('near-limit');
        } else {
            this.bioCharCount.classList.remove('near-limit');
        }
    }

    async saveChanges() {
        this.saveBtn.disabled = true;
        this.saveBtn.innerHTML = '<span class="material-symbols-rounded rotating">autorenew</span>';

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Update user data
        this.userData = {
            displayName: this.displayNameInput.value,
            username: this.usernameInput.value,
            bio: this.bioInput.value,
            profileImage: this.profileImagePreview.src
        };

        // Save to localStorage
        localStorage.setItem('userData', JSON.stringify(this.userData));

        // Update UI
        this.updateUIWithUserData();

        // Show success message
        this.showToast('Profile updated successfully! 🎉', 'success');

        // Close modal
        this.closeEditProfileModal();

        // Reset button
        this.saveBtn.disabled = false;
        this.saveBtn.textContent = 'Save Changes';
    }

    handleSecurityOption(event) {
        const option = event.currentTarget;
        const action = option.querySelector('.material-symbols-rounded').textContent;

        switch (action) {
            case 'password':
                this.showToast('Password change feature coming soon! 🔒', 'info');
                break;
            case 'two_factor_authentication':
                this.showToast('2FA setup coming soon! 🔐', 'info');
                break;
        }

        // Add click effect
        option.classList.add('clicked');
        setTimeout(() => option.classList.remove('clicked'), 200);
    }

    handleSignOut() {
        // Add shake animation to button
        const signOutBtn = document.querySelector('.btn-danger');
        signOutBtn.classList.add('shake');
        
        setTimeout(() => {
            this.showToast('Signing out...', 'info');
            // Simulate sign out process
            setTimeout(() => {
                window.location.href = '/login'; // Redirect to login page
            }, 1500);
        }, 300);
    }

    handleDeleteAccount() {
        // Show confirmation modal (you can create a separate modal for this)
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            this.showToast('Account deletion initiated...', 'warning');
            // Add your account deletion logic here
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="material-symbols-rounded">${this.getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
        `;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        // Trigger entrance animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getToastIcon(type) {
        switch (type) {
            case 'success': return 'check_circle';
            case 'error': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.accountManager = new AccountManager();
});