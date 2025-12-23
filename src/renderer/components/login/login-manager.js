// src/renderer/components/login/login-manager.js
import { login } from '../../utils/web-api.js';

export class LoginManager {
    constructor(containerId, onUnlock) {
        this.container = document.getElementById(containerId);
        this.onUnlock = onUnlock; // Callback to enable app

        this.form = null;
        this.usernameInput = null;
        this.passwordInput = null;
        this.submitBtn = null;
        this.errorMsg = null;

        this.init();
    }

    init() {
        // Query elements within container
        this.form = this.container.querySelector('#login-form');
        this.usernameInput = this.container.querySelector('#login-username');
        this.passwordInput = this.container.querySelector('#login-password');
        this.submitBtn = this.container.querySelector('#login-submit');
        this.errorMsg = this.container.querySelector('#login-error');

        // Bind events
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Focus first input
        if (this.usernameInput) this.usernameInput.focus();
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.usernameInput || !this.passwordInput) return;

        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (!username || !password) {
            this.showError(window.i18n.t('LOGIN_ERROR_EMPTY') || "Please enter username and password");
            return;
        }

        this.setLoading(true);
        this.showError(''); // Clear error

        try {
            const response = await login(username, password);
            if (response && response.status === 'success') {
                // Success
                this.handleSuccess(response.data);
            } else {
                this.showError(response.message || "Login failed");
            }
        } catch (err) {
            console.error(err);
            this.showError(err.message || "Connection error");
        } finally {
            this.setLoading(false);
        }
    }

    handleSuccess(data) {
        // Find token and save it (normally handled in web-api but good to confirm)
        if (data.token) {
            localStorage.setItem('ai_auth_token', data.token);
        }

        // UI Transition
        this.container.classList.add('fade-out');

        // Reveal App
        setTimeout(() => {
            this.container.style.display = 'none';
            if (this.onUnlock) this.onUnlock();
        }, 500);
    }

    showError(msg) {
        if (this.errorMsg) {
            this.errorMsg.innerText = msg;
            this.errorMsg.classList.add('visible');
            // Auto hide after 3s? Maybe not for errors.
        }
    }

    setLoading(isLoading) {
        if (this.submitBtn) {
            this.submitBtn.disabled = isLoading;
            this.submitBtn.innerText = isLoading ?
                (window.i18n.t('LOGIN_BTN_LOADING') || "Logging in...") :
                (window.i18n.t('LOGIN_BTN') || "Login");
        }

        if (this.usernameInput) this.usernameInput.disabled = isLoading;
        if (this.passwordInput) this.passwordInput.disabled = isLoading;
    }
}
