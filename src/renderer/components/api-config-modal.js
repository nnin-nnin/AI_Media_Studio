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
                        <div class="cfg-group">
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
                        </div>

                        <!-- Group 2: Volcengine Speech (Optional) -->
                        <div class="cfg-group" id="group-volc-speech">
                            <div class="cfg-row-header">
                                <div class="cfg-label-wrap">
                                    <span class="cfg-label">火山语音</span>
                                    <span class="cfg-pill-opt">可选</span>
                                    <span id="badge-volc-speech" class="cfg-badge is-default">
                                        <span class="cfg-dot"></span>本地免密
                                    </span>
                                </div>
                                <a href="https://console.volcengine.com/speech/service/8" target="_blank" rel="noopener noreferrer" class="cfg-link">控制台 ↗</a>
                            </div>
                            <div class="cfg-grid-2">
                                <input type="text" id="input-volc-appid" class="cfg-input" placeholder="AppID" autocomplete="off">
                                <input type="password" id="input-volc-token" class="cfg-input" placeholder="Access Token" autocomplete="off">
                            </div>
                            <div class="cfg-hint">留空时自动启用本地免密高保真语音引擎</div>
                        </div>

                        <!-- Group 3: Optional Extensions (Collapsible) -->
                        <details class="cfg-accordion">
                            <summary class="cfg-accordion-summary">
                                <span>更多服务 (阿里云、Decart、腾讯云 COS)</span>
                                <svg class="cfg-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 4.5l3 3 3-3"></path>
                                </svg>
                            </summary>
                            <div class="cfg-accordion-body">
                                <div class="cfg-group">
                                    <div class="cfg-row-header">
                                        <span class="cfg-label-sm">阿里云百炼 Key</span>
                                        <span id="badge-dashscope-key" class="cfg-badge-sm">未配置</span>
                                    </div>
                                    <input type="password" id="input-dashscope-key" class="cfg-input" placeholder="输入 DashScope API Key" autocomplete="off">
                                </div>

                                <div class="cfg-group">
                                    <div class="cfg-row-header">
                                        <span class="cfg-label-sm">Decart 视觉 Key</span>
                                        <span id="badge-decart-key" class="cfg-badge-sm">未配置</span>
                                    </div>
                                    <input type="password" id="input-decart-key" class="cfg-input" placeholder="输入 Decart API Key" autocomplete="off">
                                </div>

                                <div class="cfg-group">
                                    <div class="cfg-row-header">
                                        <span class="cfg-label-sm">腾讯云 COS 存储 (用于声音复刻)</span>
                                    </div>
                                    <div class="cfg-grid-2">
                                        <input type="password" id="input-cos-id" class="cfg-input" placeholder="Secret ID" autocomplete="off">
                                        <input type="password" id="input-cos-key" class="cfg-input" placeholder="Secret Key" autocomplete="off">
                                        <input type="text" id="input-cos-bucket" class="cfg-input" placeholder="Bucket 名称" autocomplete="off">
                                        <input type="text" id="input-cos-region" class="cfg-input" placeholder="Region (如 ap-beijing)" autocomplete="off">
                                    </div>
                                </div>
                            </div>
                        </details>
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
            const appidInput = document.getElementById('input-volc-appid');
            if (appidInput) setTimeout(() => appidInput.focus(), 150);
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

                // Volcengine Speech
                const speechBadge = document.getElementById('badge-volc-speech');
                const appidInput = document.getElementById('input-volc-appid');
                const tokenInput = document.getElementById('input-volc-token');
                const speechConfigured = !!(data.keys.VOLC_SPEECH_APPID?.configured && data.keys.VOLC_SPEECH_TOKEN?.configured);

                if (speechConfigured) {
                    if (speechBadge) {
                        speechBadge.className = 'cfg-badge is-connected';
                        speechBadge.innerHTML = '<span class="cfg-dot"></span>已连接';
                    }
                    if (tokenInput) {
                        tokenInput.placeholder = `已保存 (${data.keys.VOLC_SPEECH_TOKEN.masked})`;
                    }
                } else {
                    if (speechBadge) {
                        speechBadge.className = 'cfg-badge is-default';
                        speechBadge.innerHTML = '<span class="cfg-dot"></span>本地免密';
                    }
                    if (tokenInput) {
                        tokenInput.placeholder = 'Access Token';
                    }
                }

                if (appidInput && data.keys.VOLC_SPEECH_APPID?.value) {
                    appidInput.value = data.keys.VOLC_SPEECH_APPID.value;
                }

                // Extensions
                const dashBadge = document.getElementById('badge-dashscope-key');
                if (dashBadge) {
                    dashBadge.textContent = data.keys.DASHSCOPE_API_KEY?.configured ? '已配置' : '未配置';
                    dashBadge.className = data.keys.DASHSCOPE_API_KEY?.configured ? 'cfg-badge-sm is-connected' : 'cfg-badge-sm';
                }

                const decartBadge = document.getElementById('badge-decart-key');
                if (decartBadge) {
                    decartBadge.textContent = data.keys.DECART_API_KEY?.configured ? '已配置' : '未配置';
                    decartBadge.className = data.keys.DECART_API_KEY?.configured ? 'cfg-badge-sm is-connected' : 'cfg-badge-sm';
                }

                const bucketInput = document.getElementById('input-cos-bucket');
                const regionInput = document.getElementById('input-cos-region');
                if (bucketInput && data.keys.TENCENT_COS_BUCKET?.value) {
                    bucketInput.value = data.keys.TENCENT_COS_BUCKET.value;
                }
                if (regionInput && data.keys.TENCENT_COS_REGION?.value) {
                    regionInput.value = data.keys.TENCENT_COS_REGION.value;
                }
            }
        } catch (e) {
            console.warn('[ApiConfigModal] Failed to load key status:', e);
        }
    }

    async save() {
        const payload = {
            ARK_API_KEY: document.getElementById('input-ark-key')?.value.trim() || '',
            VOLC_SPEECH_APPID: document.getElementById('input-volc-appid')?.value.trim() || '',
            VOLC_SPEECH_TOKEN: document.getElementById('input-volc-token')?.value.trim() || '',
            DASHSCOPE_API_KEY: document.getElementById('input-dashscope-key')?.value.trim() || '',
            DECART_API_KEY: document.getElementById('input-decart-key')?.value.trim() || '',
            TENCENT_SECRET_ID: document.getElementById('input-cos-id')?.value.trim() || '',
            TENCENT_SECRET_KEY: document.getElementById('input-cos-key')?.value.trim() || '',
            TENCENT_COS_BUCKET: document.getElementById('input-cos-bucket')?.value.trim() || '',
            TENCENT_COS_REGION: document.getElementById('input-cos-region')?.value.trim() || ''
        };

        try {
            const res = await fetch('/api/settings/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.status === 'success') {
                ['input-ark-key', 'input-volc-token', 'input-dashscope-key', 'input-decart-key', 'input-cos-id', 'input-cos-key'].forEach(id => {
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
