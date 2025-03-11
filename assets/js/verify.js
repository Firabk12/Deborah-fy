class EmailVerification {
    constructor() {
        this.timeLeft = 600; // 10 minutes
        this.timerInterval = null;
        this.currentTime = new Date('2025-03-09 17:39:58');
        this.currentUser = 'Firabk12';
        
        this.init();
    }

    init() {
        this.setupTimer();
        this.setupResendButton();
        this.showUserEmail();
        this.checkVerificationStatus();
    }

    setupTimer() {
        const minutesSpan = document.querySelector('.minutes');
        const secondsSpan = document.querySelector('.seconds');

        this.timerInterval = setInterval(() => {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;

            minutesSpan.textContent = String(minutes).padStart(2, '0');
            secondsSpan.textContent = String(seconds).padStart(2, '0');

            if (this.timeLeft === 0) {
                clearInterval(this.timerInterval);
                this.handleExpiredLink();
            }

            this.timeLeft--;
        }, 1000);
    }

    setupResendButton() {
        const resendBtn = document.querySelector('.resend-btn');
        resendBtn.addEventListener('click', () => {
            resendBtn.style.pointerEvents = 'none';
            resendBtn.innerHTML = `
                <span class="material-symbols-rounded">refresh</span>
                Sending...
            `;

            // Simulate email resend
            setTimeout(() => {
                this.timeLeft = 600;
                resendBtn.innerHTML = `
                    <span class="material-symbols-rounded">refresh</span>
                    Resend Email
                `;
                resendBtn.style.pointerEvents = 'all';
                this.showNotification('Verification email resent! 📧');
            }, 2000);
        });
    }

    showUserEmail() {
        const emailElement = document.querySelector('.user-email');
        // In real app, get this from signup data
        emailElement.textContent = 'user@example.com';
    }

    checkVerificationStatus() {
        // Simulate checking verification status
        window.addEventListener('message', (event) => {
            if (event.data === 'email_verified') {
                this.handleVerificationSuccess();
            }
        });
    }

    handleVerificationSuccess() {
        this.showNotification('Email verified successfully! 🎉');
        setTimeout(() => {
            window.location.href = 'profile-setup.html';
        }, 1500);
    }

    handleExpiredLink() {
        const timerElement = document.querySelector('.verify-timer');
        timerElement.innerHTML = `
            <p style="color: #ff4b4b;">Link expired</p>
            <p>Please request a new verification link</p>
        `;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `<p>${message}</p>`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new EmailVerification();
});