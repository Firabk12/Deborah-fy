class Auth {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        // Check if user is already logged in
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                await this.validateToken(token);
            } catch (error) {
                this.logout();
            }
        }
        this.updateUI();
    }
    
    async handleSignup(formData) {
        try {
            // Simulate API call
            await this.simulateApiCall();

            // Save signup data
            

            // Redirect to email verification
            window.location.href = 'onboarding/verify-email.html';
        } catch (error) {
            this.showNotification('Signup failed! Please try again.', 'error');
        }
    }

    async login(email, password) {
        try {
            // Simulate API call
            const response = await new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        token: 'sample_token',
                        user: {
                            id: 1,
                            name: 'User Name',
                            email: email,
                            avatar: 'path/to/avatar.jpg'
                        }
                    });
                }, 1000);
            });

            
            this.updateUI();
            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw new Error('Invalid credentials');
        }
    }

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        this.user = null;
        this.isAuthenticated = false;
        this.updateUI();
    }

    async validateToken(token) {
        // Simulate token validation
        const userData = localStorage.getItem('user_data');
        if (userData) {
            this.user = JSON.parse(userData);
            this.isAuthenticated = true;
        }
    }

    updateUI() {
        const accountPage = document.getElementById('accountPage');
        if (!accountPage) return;

        if (this.isAuthenticated) {
            accountPage.innerHTML = this.getAuthenticatedHTML();
        } else {
            accountPage.innerHTML = this.getLoginHTML();
            this.setupAuthForms();
        }
    }

    getAuthenticatedHTML() {
        return `
            <div class="account-container">
                <div class="user-profile">
                    <img src="${this.user.avatar}" alt="${this.user.name}" class="user-avatar">
                    <h2>${this.user.name}</h2>
                    <p>${this.user.email}</p>
                </div>
                <div class="account-actions">
                    <button class="btn-primary" id="editProfileBtn">Edit Profile</button>
                    <button class="btn-secondary" id="logoutBtn">Logout</button>
                </div>
            </div>
        `;
    }

    getLoginHTML() {
        return `
            <div class="auth-container">
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Login</button>
                    <button class="auth-tab" data-tab="signup">Sign Up</button>
                </div>
                
                <form id="loginForm" class="auth-form active">
                    <h2>Welcome Back</h2>
                    <div class="form-group">
                        <input type="email" placeholder="Email" required>
                    </div>
                    <div class="form-group">
                        <input type="password" placeholder="Password" required>
                    </div>
                    <button type="submit" class="btn-primary">Login</button>
                </form>

                <form id="signupForm" class="auth-form">
                    <h2>Create Account</h2>
                    <div class="form-group">
                        <input type="text" placeholder="Full Name" required>
                    </div>
                    <div class="form-group">
                        <input type="email" placeholder="Email" required>
                    </div>
                    <div class="form-group">
                        <input type="password" placeholder="Password" required>
                    </div>
                    <button type="submit" class="btn-primary">Sign Up</button>
                </form>
            </div>
        `;
    }

    setupAuthForms() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const authTabs = document.querySelectorAll('.auth-tab');

        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const formToShow = tab.dataset.tab === 'login' ? loginForm : signupForm;
                const formToHide = tab.dataset.tab === 'login' ? signupForm : loginForm;

                formToShow.classList.add('active');
                formToHide.classList.remove('active');
            });
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;

            try {
                await this.login(email, password);
                showNotification('Successfully logged in!');
            } catch (error) {
                showNotification('Login failed. Please try again.');
            }
        });

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Handle signup logic here
            showNotification('Sign up feature coming soon!');
        });
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});
