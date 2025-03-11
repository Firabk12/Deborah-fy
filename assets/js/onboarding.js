class OnboardingFlow {
    constructor() {
        this.currentTime = new Date('2025-03-09 11:47:01');
        this.currentUser = 'Firabk12';
        this.currentSlide = 0;
        this.slides = document.querySelectorAll('.feature-slide');
        this.totalSlides = this.slides.length;
        this.swipeThreshold = 50;
        
        // Initialize
        this.init();
    }
    

    init() {
        // Make sure we're on a page with slides
        if (this.totalSlides > 0) {
            this.setupProgressDots();
            this.setupSwipeDetection();
            this.updateProgressDots();
        }
        
        if (window.location.pathname.includes('auth.html')) {
            this.setupAuthForms();
        }
    }
    
 // Add these methods to the OnboardingFlow class
setupAuthForms() {
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        const forms = document.querySelectorAll('.auth-form');

       toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const formType = btn.dataset.form;
                
                // Toggle buttons
                toggleBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.transform = 'scale(0.95)';
                    setTimeout(() => b.style.transform = '', 150);
                });
                
                btn.classList.add('active');

                // Instantly toggle forms
                forms.forEach(form => {
                    if (form.id === `${formType}Form`) {
                        form.classList.add('active');
                    } else {
                        form.classList.remove('active');
                    }
                });
            });
        });


        // Input validation
        const inputs = document.querySelectorAll('.auth-form input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const formGroup = e.target.closest('.form-group');
                if (e.target.checkValidity()) {
                    formGroup.classList.remove('invalid');
                    formGroup.classList.add('valid');
                } else {
                    formGroup.classList.remove('valid');
                    formGroup.classList.add('invalid');
                }

                // Password strength check
                if (e.target.type === 'password') {
                    this.updatePasswordStrength(e.target.value);
                }
            });
        });

        // Form submission
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const submitBtn = form.querySelector('.auth-btn');
                submitBtn.classList.add('loading');

                // Simulate API call
                setTimeout(() => {
                    submitBtn.classList.remove('loading');
                    this.completeOnboarding();
                    this.navigateTo('index.html');
                }, 1500);
            });
        });
    }


updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text span');
    
    let strength = 0;
    if (password.match(/[a-z]/)) strength += 20;
    if (password.match(/[A-Z]/)) strength += 20;
    if (password.match(/[0-9]/)) strength += 20;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 20;
    if (password.length >= 8) strength += 20;

    strengthBar.style.setProperty('--strength', `${strength}%`);
    
    if (strength < 40) strengthText.textContent = 'weak';
    else if (strength < 80) strengthText.textContent = 'medium';
    else strengthText.textContent = 'strong';
}

    goToNextSlide() {
        if (this.currentSlide >= this.totalSlides - 1) {
            // If we're on the last slide, go to auth page
            this.navigateTo('auth.html');
            return;
        }

        // Hide current slide
        if (this.slides[this.currentSlide]) {
            this.slides[this.currentSlide].classList.remove('active');
        }

        // Show next slide
        this.currentSlide++;
        if (this.slides[this.currentSlide]) {
            this.slides[this.currentSlide].classList.add('active');
        }

        this.updateProgressDots();
    }

    navigateTo(page) {
        window.location.href = page;
    }

    setupProgressDots() {
        const dotsContainer = document.querySelector('.progress-dots');
        if (!dotsContainer) return;

        // Clear existing dots
        dotsContainer.innerHTML = '';

        // Create new dots
        for (let i = 0; i < this.totalSlides; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dotsContainer.appendChild(dot);
        }
    }

    updateProgressDots() {
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    setupSwipeDetection() {
        const container = document.querySelector('.swipe-container');
        if (!container) return;

        let touchStartX = 0;
        let touchEndX = 0;

        container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            const diff = touchEndX - touchStartX;

            if (Math.abs(diff) > 50) { // minimum swipe distance
                if (diff > 0 && this.currentSlide > 0) {
                    // Swipe right - go back
                    this.goToPrevSlide();
                } else if (diff < 0) {
                    // Swipe left - go forward
                    this.goToNextSlide();
                }
            }
        });
    }

    goToPrevSlide() {
        if (this.currentSlide === 0) {
            // If we're on the first slide, go back to welcome
            this.navigateTo('welcome.html');
            return;
        }

        if (this.slides[this.currentSlide]) {
            this.slides[this.currentSlide].classList.remove('active');
        }

        this.currentSlide--;
        if (this.slides[this.currentSlide]) {
            this.slides[this.currentSlide].classList.add('active');
        }

        this.updateProgressDots();
    }
}

// Add this near the top of the file, after the class definition
window.navigateToPage = (page) => {
    if (window.onboardingFlow) {
        window.onboardingFlow.navigateTo(page);
    }
};

// Initialize onboarding flow
document.addEventListener('DOMContentLoaded', () => {
    window.onboardingFlow = new OnboardingFlow();
});