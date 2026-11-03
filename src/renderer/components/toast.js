// toast.js
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
        toast.className = `toast ${type}`;

        const span = document.createElement('span');
        span.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'background:none;border:none;color:inherit;cursor:pointer;opacity:0.7;margin-left:8px;';
        closeBtn.onclick = () => toast.remove();

        toast.appendChild(span);
        toast.appendChild(closeBtn);
        container.appendChild(toast);

        // Auto remove after 5s
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
};

export const showError = (msg) => Toast.show(msg, 'error');
export const showSuccess = (msg) => Toast.show(msg, 'success');

// Attach to window for legacy calls
window.Toast = Toast;
