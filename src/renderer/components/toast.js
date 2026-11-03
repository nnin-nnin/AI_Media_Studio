// toast.js - Clean, modern, secure notification system
export const Toast = {
    init() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    },

    show(message, type = 'info') {
        this.init();
        const container = document.querySelector('.toast-container');

        const toast = document.createElement('div');
        toast.className = `toast is-${type}`;

        const iconWrap = document.createElement('span');
        iconWrap.className = 'toast-icon-wrap';
        if (type === 'success') {
            iconWrap.innerHTML = `<svg class="toast-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 7.5L5.5 10.5L11.5 3.5"></path></svg>`;
        } else if (type === 'error') {
            iconWrap.innerHTML = `<svg class="toast-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="5.5"></circle><path d="M7 4.5v3M7 9.5h.01"></path></svg>`;
        } else {
            iconWrap.innerHTML = `<svg class="toast-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="5.5"></circle><path d="M7 6.5v3.5M7 4.5h.01"></path></svg>`;
        }

        const textSpan = document.createElement('span');
        textSpan.className = 'toast-text';
        textSpan.textContent = message;

        toast.appendChild(iconWrap);
        toast.appendChild(textSpan);
        container.appendChild(toast);

        // Auto dismiss after 2.8 seconds
        setTimeout(() => {
            toast.classList.add('is-leaving');
            setTimeout(() => toast.remove(), 200);
        }, 2800);
    }
};

export const showError = (msg) => Toast.show(msg, 'error');
export const showSuccess = (msg) => Toast.show(msg, 'success');

// Attach to window for legacy calls
window.Toast = Toast;
