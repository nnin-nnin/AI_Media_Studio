// toast.js - Clean, modern, secure notification system
// toast.js - Clean, modern, secure notification system

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export const Toast = {
    init() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    },

    show(message, type = 'info', duration = null) {
        this.init();
        const container = document.querySelector('.toast-container');

        const isMultiLine = typeof message === 'string' && (message.includes('\n') || message.length > 80);
        const isKeyError = typeof message === 'string' && (/API_KEY|API Key|百炼|火山方舟|密钥|Token/i.test(message));

        const toast = document.createElement('div');
        toast.className = `toast is-${type} ${isMultiLine ? 'is-multiline' : ''}`;

        const iconWrap = document.createElement('span');
        iconWrap.className = 'toast-icon-wrap';
        if (type === 'success') {
            iconWrap.innerHTML = `<svg class="toast-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 7.5L5.5 10.5L11.5 3.5"></path></svg>`;
        } else if (type === 'error') {
            iconWrap.innerHTML = `<svg class="toast-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="5.5"></circle><path d="M7 4.5v3M7 9.5h.01"></path></svg>`;
        } else {
            iconWrap.innerHTML = `<svg class="toast-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="5.5"></circle><path d="M7 6.5v3.5M7 4.5h.01"></path></svg>`;
        }

        toast.appendChild(iconWrap);

        if (isMultiLine) {
            const content = document.createElement('div');
            content.className = 'toast-content';

            const textSpan = document.createElement('span');
            textSpan.className = 'toast-text';
            
            // XSS-safe HTML formatting: escape first, then turn safe URLs into links
            const safeMsg = escapeHTML(message);
            const formatted = safeMsg.replace(
                /(https?:\/\/[^\s]+)/g,
                '<a href="$1" target="_blank" rel="noopener noreferrer" class="toast-link">$1</a>'
            );
            textSpan.innerHTML = formatted;
            content.appendChild(textSpan);

            if (isKeyError) {
                const actions = document.createElement('div');
                actions.className = 'toast-actions';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'toast-action-btn';
                btn.innerHTML = '⚙️ 立即配置 API 密钥';
                btn.onclick = () => {
                    if (window.ApiConfigModal) window.ApiConfigModal.open();
                    toast.classList.add('is-leaving');
                    setTimeout(() => toast.remove(), 200);
                };
                actions.appendChild(btn);
                content.appendChild(actions);
            }

            toast.appendChild(content);

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'toast-close-btn';
            closeBtn.title = '关闭';
            closeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13"></path></svg>`;
            closeBtn.onclick = () => {
                toast.classList.add('is-leaving');
                setTimeout(() => toast.remove(), 200);
            };
            toast.appendChild(closeBtn);
        } else {
            const textSpan = document.createElement('span');
            textSpan.className = 'toast-text';
            textSpan.textContent = message;
            toast.appendChild(textSpan);
        }

        container.appendChild(toast);

        // Auto dismiss: 8s for multiline/guides, 2.8s for short notices
        const autoDismissMs = duration || (isMultiLine ? 8000 : 2800);
        setTimeout(() => {
            if (toast.isConnected && !toast.classList.contains('is-leaving')) {
                toast.classList.add('is-leaving');
                setTimeout(() => toast.remove(), 200);
            }
        }, autoDismissMs);
    }
};

export const showError = (msg) => Toast.show(msg, 'error');
export const showSuccess = (msg) => Toast.show(msg, 'success');

// Attach to window for legacy calls
window.Toast = Toast;
