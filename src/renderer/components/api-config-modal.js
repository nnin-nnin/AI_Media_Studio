/**
 * API Service Configuration Modal
 * Lightweight, native-styled modal for managing service keys locally.
 */
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
            <div id="api-config-modal" class="api-modal-backdrop" style="display:none;">
                <div class="api-modal-card">
                    <div class="api-modal-header">
                        <div>
                            <h2 class="api-modal-title">服务配置</h2>
                            <p class="api-modal-subtitle">配置火山引擎 Ark API 密钥以使用图像、视频及对话模型。</p>
                        </div>
                        <button id="api-modal-close" class="api-modal-close-btn" title="关闭" aria-label="关闭">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                                <path d="M1 1l12 12M13 1L1 13"></path>
                            </svg>
                        </button>
                    </div>

                    <div class="api-modal-body">
                        <!-- 核心主配置：火山方舟 ARK_API_KEY -->
                        <div class="api-card-primary">
                            <div class="api-field-header">
                                <label for="input-ark-key" class="api-label">火山方舟 API Key</label>
                                <span id="status-ark-key" class="api-status-badge is-empty">
                                    <span class="api-status-dot"></span>检测中
                                </span>
                            </div>
                            <p class="api-field-desc">
                                用于图像生成、视频创作与角色交互。可在 <a href="https://console.volcengine.com/ark" target="_blank" rel="noopener noreferrer" class="api-link">火山方舟控制台</a> 获取。
                            </p>
                            <input type="password" id="input-ark-key" class="api-input" placeholder="粘贴火山方舟 API Key (如 4a8b... 或 f3ea...)" autocomplete="off">
                        </div>

                        <!-- 高级选项（折叠收起） -->
                        <details class="api-advanced-details">
                            <summary class="api-advanced-summary">
                                <span>高级设置 (可选)</span>
                                <svg class="api-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 4.5l3 3 3-3"></path>
                                </svg>
                            </summary>
                            <div class="api-advanced-content">
                                <!-- 阿里云百炼 DASHSCOPE_API_KEY -->
                                <div class="api-subfield">
                                    <div class="api-field-header">
                                        <label for="input-dashscope-key" class="api-label-sub">阿里云百炼 API Key</label>
                                        <span id="status-dashscope-key" class="api-status-badge is-empty">
                                            <span class="api-status-dot"></span>检测中
                                        </span>
                                    </div>
                                    <p class="api-subfield-desc">可选扩展。留空时系统默认使用本地浏览器语音合成。</p>
                                    <input type="password" id="input-dashscope-key" class="api-input" placeholder="粘贴 DashScope API Key (可选)" autocomplete="off">
                                </div>

                                <!-- Decart AI DECART_API_KEY -->
                                <div class="api-subfield">
                                    <div class="api-field-header">
                                        <label for="input-decart-key" class="api-label-sub">Decart 视觉 Key</label>
                                        <span id="status-decart-key" class="api-status-badge is-empty">
                                            <span class="api-status-dot"></span>检测中
                                        </span>
                                    </div>
                                    <p class="api-subfield-desc">可选扩展。留空时系统默认使用火山镜头快照魔镜。</p>
                                    <input type="password" id="input-decart-key" class="api-input" placeholder="粘贴 Decart API Key (可选)" autocomplete="off">
                                </div>

                                <!-- 腾讯云 COS -->
                                <div class="api-cos-block">
                                    <div class="api-label-sub">腾讯云 COS 存储</div>
                                    <p class="api-subfield-desc">仅在需要自定义声音复刻上传音频至云存储时配置。</p>
                                    <div class="api-cos-grid">
                                        <div>
                                            <label class="api-micro-label">Secret ID</label>
                                            <input type="password" id="input-cos-id" class="api-input" placeholder="AKID..." autocomplete="off">
                                        </div>
                                        <div>
                                            <label class="api-micro-label">Secret Key</label>
                                            <input type="password" id="input-cos-key" class="api-input" placeholder="SecretKey..." autocomplete="off">
                                        </div>
                                        <div>
                                            <label class="api-micro-label">Bucket</label>
                                            <input type="text" id="input-cos-bucket" class="api-input" placeholder="bucket-name" autocomplete="off">
                                        </div>
                                        <div>
                                            <label class="api-micro-label">Region</label>
                                            <input type="text" id="input-cos-region" class="api-input" placeholder="ap-beijing" autocomplete="off">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </details>
                    </div>

                    <div class="api-modal-footer">
                        <button id="api-modal-cancel" class="api-btn-cancel">取消</button>
                        <button id="api-modal-save" class="api-btn-save">保存设置</button>
                    </div>
                </div>
            </div>
            <style>
                .api-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 20000;
                    background: rgba(15, 23, 42, 0.45);
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
                .api-modal-card {
                    width: 100%;
                    max-width: 520px;
                    background: #ffffff;
                    color: #0f172a;
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    border-radius: 12px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    animation: apiModalFadeIn 0.15s ease-out;
                }
                @keyframes apiModalFadeIn {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
                [data-theme="dark"] .api-modal-card {
                    background: #18181b;
                    color: #f4f4f5;
                    border-color: #27272a;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
                }
                .api-modal-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 12px;
                }
                [data-theme="dark"] .api-modal-header {
                    border-bottom-color: #27272a;
                }
                .api-modal-title {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: #0f172a;
                    line-height: 1.4;
                }
                [data-theme="dark"] .api-modal-title {
                    color: #f4f4f5;
                }
                .api-modal-subtitle {
                    margin: 2px 0 0 0;
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.4;
                }
                [data-theme="dark"] .api-modal-subtitle {
                    color: #a1a1aa;
                }
                .api-modal-close-btn {
                    background: transparent;
                    border: none;
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 0;
                    transition: all 0.15s ease;
                }
                .api-modal-close-btn:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }
                [data-theme="dark"] .api-modal-close-btn:hover {
                    background: #27272a;
                    color: #f4f4f5;
                }
                .api-modal-body {
                    padding: 18px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    max-height: 72vh;
                    overflow-y: auto;
                }
                .api-card-primary {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 14px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                [data-theme="dark"] .api-card-primary {
                    background: #202024;
                    border-color: #2e2e33;
                }
                .api-field-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                }
                .api-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #0f172a;
                }
                [data-theme="dark"] .api-label {
                    color: #f4f4f5;
                }
                .api-label-sub {
                    font-size: 12px;
                    font-weight: 500;
                    color: #1e293b;
                }
                [data-theme="dark"] .api-label-sub {
                    color: #e4e4e7;
                }
                .api-field-desc {
                    margin: 0;
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.45;
                }
                [data-theme="dark"] .api-field-desc {
                    color: #a1a1aa;
                }
                .api-subfield-desc {
                    margin: 0 0 6px 0;
                    font-size: 11.5px;
                    color: #64748b;
                    line-height: 1.4;
                }
                [data-theme="dark"] .api-subfield-desc {
                    color: #a1a1aa;
                }
                .api-link {
                    color: #2563eb;
                    text-decoration: underline;
                    text-underline-offset: 2px;
                }
                [data-theme="dark"] .api-link {
                    color: #60a5fa;
                }
                .api-status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 11px;
                    font-weight: 500;
                    padding: 2px 7px;
                    border-radius: 9999px;
                    line-height: 1.2;
                }
                .api-status-badge.is-active {
                    background: #ecfdf5;
                    color: #047857;
                    border: 1px solid #d1fae5;
                }
                .api-status-badge.is-active .api-status-dot {
                    background: #10b981;
                }
                .api-status-badge.is-empty {
                    background: #f1f5f9;
                    color: #64748b;
                    border: 1px solid #e2e8f0;
                }
                .api-status-badge.is-empty .api-status-dot {
                    background: #94a3b8;
                }
                [data-theme="dark"] .api-status-badge.is-active {
                    background: rgba(16, 185, 129, 0.12);
                    color: #34d399;
                    border-color: rgba(16, 185, 129, 0.25);
                }
                [data-theme="dark"] .api-status-badge.is-empty {
                    background: rgba(148, 163, 184, 0.1);
                    color: #94a3b8;
                    border-color: rgba(148, 163, 184, 0.2);
                }
                .api-status-dot {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                }
                .api-input {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 7px 11px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    background: #ffffff;
                    color: #0f172a;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
                    font-size: 12.5px;
                    outline: none;
                    transition: all 0.15s ease;
                }
                [data-theme="dark"] .api-input {
                    background: #18181b;
                    border-color: #3f3f46;
                    color: #f4f4f5;
                }
                .api-input:focus {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
                .api-input::placeholder {
                    color: #94a3b8;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .api-advanced-details {
                    border-top: 1px solid #f1f5f9;
                    padding-top: 8px;
                }
                [data-theme="dark"] .api-advanced-details {
                    border-top-color: #27272a;
                }
                .api-advanced-summary {
                    cursor: pointer;
                    user-select: none;
                    font-size: 12px;
                    font-weight: 500;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6px 0;
                    list-style: none;
                }
                .api-advanced-summary::-webkit-details-marker {
                    display: none;
                }
                .api-advanced-summary:hover {
                    color: #0f172a;
                }
                [data-theme="dark"] .api-advanced-summary:hover {
                    color: #f4f4f5;
                }
                .api-chevron {
                    transition: transform 0.2s ease;
                }
                .api-advanced-details[open] .api-chevron {
                    transform: rotate(180deg);
                }
                .api-advanced-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 10px;
                }
                .api-subfield {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .api-cos-block {
                    border-top: 1px dashed #e2e8f0;
                    padding-top: 10px;
                }
                [data-theme="dark"] .api-cos-block {
                    border-top-color: #2e2e33;
                }
                .api-cos-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }
                .api-micro-label {
                    display: block;
                    font-size: 11px;
                    color: #64748b;
                    margin-bottom: 3px;
                }
                [data-theme="dark"] .api-micro-label {
                    color: #a1a1aa;
                }
                .api-modal-footer {
                    padding: 12px 20px;
                    border-top: 1px solid #f1f5f9;
                    background: #fafafa;
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                }
                [data-theme="dark"] .api-modal-footer {
                    border-top-color: #27272a;
                    background: #151518;
                }
                .api-btn-cancel {
                    background: #ffffff;
                    border: 1px solid #d1d5db;
                    color: #374151;
                    padding: 6px 14px;
                    border-radius: 6px;
                    font-size: 12.5px;
                    font-weight: 500;
                    cursor: pointer;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
                    transition: all 0.15s ease;
                }
                .api-btn-cancel:hover {
                    background: #f8fafc;
                    border-color: #94a3b8;
                }
                [data-theme="dark"] .api-btn-cancel {
                    background: #202024;
                    border-color: #3f3f46;
                    color: #e4e4e7;
                }
                [data-theme="dark"] .api-btn-cancel:hover {
                    background: #27272a;
                }
                .api-btn-save {
                    background: #0f172a;
                    border: 1px solid transparent;
                    color: #ffffff;
                    padding: 6px 16px;
                    border-radius: 6px;
                    font-size: 12.5px;
                    font-weight: 500;
                    cursor: pointer;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
                    transition: all 0.15s ease;
                }
                .api-btn-save:hover {
                    background: #1e293b;
                }
                [data-theme="dark"] .api-btn-save {
                    background: #f4f4f5;
                    color: #0f172a;
                }
                [data-theme="dark"] .api-btn-save:hover {
                    background: #e4e4e7;
                }
            </style>
        `;
        document.body.appendChild(wrapper);

        this.modal = document.getElementById('api-config-modal');
        document.getElementById('api-modal-close').onclick = () => this.close();
        document.getElementById('api-modal-cancel').onclick = () => this.close();
        document.getElementById('api-modal-save').onclick = () => this.save();

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    async open() {
        this.init();
        if (this.modal) this.modal.style.display = 'flex';
        await this.refreshStatus();
    }

    close() {
        if (this.modal) this.modal.style.display = 'none';
    }

    setStatusBadge(id, info) {
        const el = document.getElementById(id);
        if (!el) return;
        if (info && info.configured) {
            el.className = 'api-status-badge is-active';
            el.innerHTML = `<span class="api-status-dot"></span>已连接${info.masked ? ` (${info.masked})` : ''}`;
        } else {
            el.className = 'api-status-badge is-empty';
            el.innerHTML = `<span class="api-status-dot"></span>未配置`;
        }
    }

    async refreshStatus() {
        try {
            const res = await fetch('/api/settings/keys');
            const data = await res.json();
            if (data.status === 'success' && data.keys) {
                this.setStatusBadge('status-ark-key', data.keys.ARK_API_KEY);
                this.setStatusBadge('status-dashscope-key', data.keys.DASHSCOPE_API_KEY);
                this.setStatusBadge('status-decart-key', data.keys.DECART_API_KEY);

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
                ['input-ark-key', 'input-dashscope-key', 'input-decart-key', 'input-cos-id', 'input-cos-key'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
                await this.refreshStatus();
                Toast.show('服务配置已更新', 'success');
                setTimeout(() => this.close(), 400);
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

window.ApiConfigModal = new ApiConfigModal();
export default window.ApiConfigModal;
