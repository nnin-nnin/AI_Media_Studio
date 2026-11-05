/**
 * api-config-modal.js
 * Clean, layout-first service credentials modal.
 */
import './api-config-modal.css';
import { Toast } from './toast.js';

class ApiConfigModal {
    constructor() {
        this.modal = null;
        this.init();
    }

    init() {
        if (document.getElementById('api-config-modal')) return;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div id="api-config-modal" class="cfg-backdrop" style="display:none;">
                <div class="cfg-dialog" role="dialog" aria-modal="true" aria-labelledby="cfg-title">
                    <div class="cfg-header">
                        <div class="cfg-title" id="cfg-title">服务凭证</div>
                        <button id="api-modal-close" class="cfg-close-btn" title="关闭" aria-label="关闭">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                                <path d="M1 1l12 12M13 1L1 13"></path>
                            </svg>
                        </button>
                    </div>

                    <div class="cfg-body">
                        <!-- Group 1: Volcengine Ark Core -->
                        <div class="cfg-group" id="group-ark-core">
                            <div class="cfg-row-header">
                                <div class="cfg-label-wrap">
                                    <span class="cfg-label">火山方舟</span>
                                    <span id="badge-ark-key" class="cfg-badge is-empty">
                                        <span class="cfg-dot"></span>未配置
                                    </span>
                                </div>
                                <a href="https://console.volcengine.com/ark" target="_blank" rel="noopener noreferrer" class="cfg-link">获取密钥 ↗</a>
                            </div>
                            <input type="password" id="input-ark-key" class="cfg-input" placeholder="输入 API Key (sk-...)" autocomplete="off">
                            <div class="cfg-hint">驱动豆包大模型：AI 换脸、文生图与视频生成</div>
                        </div>

                        <!-- Group 2: DashScope Speech & Voice Cloning -->
                        <div class="cfg-group" id="group-dashscope-speech">
                            <div class="cfg-row-header">
                                <div class="cfg-label-wrap">
                                    <span class="cfg-label">阿里云百炼</span>
                                    <span id="badge-dashscope-key" class="cfg-badge is-empty">
                                        <span class="cfg-dot"></span>未配置
                                    </span>
                                </div>
                                <a href="https://bailian.console.aliyun.com/" target="_blank" rel="noopener noreferrer" class="cfg-link">获取密钥 ↗</a>
                            </div>
                            <input type="password" id="input-dashscope-key" class="cfg-input" placeholder="输入 DashScope API Key (sk-...)" autocomplete="off">
                            <div class="cfg-hint">驱动 CosyVoice-v2：声音克隆、音色复刻与角色语音合成</div>
                        </div>

                        <!-- Group 3: Decart Realtime Vision Core -->
                        <div class="cfg-group" id="group-decart-vision">
                            <div class="cfg-row-header">
                                <div class="cfg-label-wrap">
                                    <span class="cfg-label">Decart 视觉</span>
                                    <span id="badge-decart-key" class="cfg-badge is-empty">
                                        <span class="cfg-dot"></span>未配置
                                    </span>
                                </div>
                                <a href="https://platform.decart.ai/" target="_blank" rel="noopener noreferrer" class="cfg-link">获取密钥 ↗</a>
                            </div>
                            <input type="password" id="input-decart-key" class="cfg-input" placeholder="输入 Decart API Key" autocomplete="off">
                            <div class="cfg-hint">驱动 Mirage V2：实时视觉工作室与 AI 镜像</div>
                        </div>
                    </div>

                    <div class="cfg-footer">
                        <span class="cfg-secure-note">凭据仅保存在本机</span>
                        <div class="cfg-actions">
                            <button id="api-modal-cancel" class="cfg-btn-ghost">取消</button>
                            <button id="api-modal-save" class="cfg-btn-primary">保存配置</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(wrapper);

        this.modal = document.getElementById('api-config-modal');
        document.getElementById('api-modal-close').onclick = () => this.close();
        document.getElementById('api-modal-cancel').onclick = () => this.close();
        document.getElementById('api-modal-save').onclick = () => this.save();

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.style.display !== 'none') {
                this.close();
            }
        });
    }

    async open(focusSection = null) {
        this.init();
        if (this.modal) this.modal.style.display = 'flex';
        await this.refreshStatus();

        if (focusSection === 'speech') {
            const dashInput = document.getElementById('input-dashscope-key');
            if (dashInput) setTimeout(() => dashInput.focus(), 150);
        } else if (focusSection === 'vision') {
            const decartInput = document.getElementById('input-decart-key');
            if (decartInput) setTimeout(() => decartInput.focus(), 150);
        } else {
            const arkInput = document.getElementById('input-ark-key');
            if (arkInput && !arkInput.value) setTimeout(() => arkInput.focus(), 150);
        }
    }

    close() {
        if (this.modal) this.modal.style.display = 'none';
    }

    async refreshStatus() {
        try {
            const res = await fetch('/api/settings/keys');
            const data = await res.json();
            if (data.status === 'success' && data.keys) {
                // Ark API Key
                const arkBadge = document.getElementById('badge-ark-key');
                const arkInput = document.getElementById('input-ark-key');
                if (data.keys.ARK_API_KEY?.configured) {
                    if (arkBadge) {
                        arkBadge.className = 'cfg-badge is-connected';
                        arkBadge.innerHTML = '<span class="cfg-dot"></span>已连接';
                    }
                    if (arkInput) {
                        arkInput.placeholder = `已保存 (${data.keys.ARK_API_KEY.masked})，输入以覆盖`;
                    }
                } else {
                    if (arkBadge) {
                        arkBadge.className = 'cfg-badge is-empty';
                        arkBadge.innerHTML = '<span class="cfg-dot"></span>未配置';
                    }
                    if (arkInput) {
                        arkInput.placeholder = '输入 API Key (sk-...)';
                    }
                }

                // DashScope Speech & Voice Cloning
                const dashBadge = document.getElementById('badge-dashscope-key');
                const dashInput = document.getElementById('input-dashscope-key');
                if (data.keys.DASHSCOPE_API_KEY?.configured) {
                    if (dashBadge) {
                        dashBadge.className = 'cfg-badge is-connected';
                        dashBadge.innerHTML = '<span class="cfg-dot"></span>已连接';
                    }
                    if (dashInput) {
                        dashInput.placeholder = `已保存 (${data.keys.DASHSCOPE_API_KEY.masked})，输入以覆盖`;
                    }
                } else {
                    if (dashBadge) {
                        dashBadge.className = 'cfg-badge is-empty';
                        dashBadge.innerHTML = '<span class="cfg-dot"></span>未配置';
                    }
                    if (dashInput) {
                        dashInput.placeholder = '输入 DashScope API Key (sk-...)';
                    }
                }

                // Decart Vision
                const decartBadge = document.getElementById('badge-decart-key');
                const decartInput = document.getElementById('input-decart-key');
                if (data.keys.DECART_API_KEY?.configured) {
                    if (decartBadge) {
                        decartBadge.className = 'cfg-badge is-connected';
                        decartBadge.innerHTML = '<span class="cfg-dot"></span>已连接';
                    }
                    if (decartInput) {
                        decartInput.placeholder = `已保存 (${data.keys.DECART_API_KEY.masked})，输入以覆盖`;
                    }
                } else {
                    if (decartBadge) {
                        decartBadge.className = 'cfg-badge is-empty';
                        decartBadge.innerHTML = '<span class="cfg-dot"></span>未配置';
                    }
                    if (decartInput) {
                        decartInput.placeholder = '输入 Decart API Key';
                    }
                }
            }
        } catch (e) {
            console.warn('[ApiConfigModal] Failed to load key status:', e);
        }
    }

    async save() {
        const payload = {
            ARK_API_KEY: document.getElementById('input-ark-key')?.value.trim() || '',
            DASHSCOPE_API_KEY: document.getElementById('input-dashscope-key')?.value.trim() || '',
            DECART_API_KEY: document.getElementById('input-decart-key')?.value.trim() || ''
        };

        try {
            const res = await fetch('/api/settings/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.status === 'success') {
                ['input-ark-key', 'input-volc-token', 'input-dashscope-key', 'input-decart-key'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
                await this.refreshStatus();
                window.dispatchEvent(new CustomEvent('settings-updated', { detail: payload }));
                Toast.show('凭据已保存', 'success');
                setTimeout(() => this.close(), 250);
            } else {
                Toast.show(data.message || '保存失败', 'error');
            }
        } catch (e) {
            Toast.show('保存失败: ' + e.message, 'error');
        }
    }

    async checkFirstRun() {
        try {
            const res = await fetch('/api/config');
            const cfg = await res.json();
            if (cfg && cfg.hasArkKey === false) {
                this.open();
            }
        } catch (e) {
            // Ignore network error on initial check
        }
    }
}

export const apiConfigModal = new ApiConfigModal();
window.ApiConfigModal = apiConfigModal;
