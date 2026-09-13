"use strict";
class ChatAssistantController {
    geminiApiKey = localStorage.getItem('gemini_api_key') || '';
    windowEl = null;
    inputEl = null;
    messagesEl = null;
    badgeEl = null;
    maxIconEl = null;
    keyModalEl = null;
    keyInputEl = null;
    constructor() {
        this.initElements();
        this.bindEvents();
    }
    el(id) {
        return document.getElementById(id);
    }
    initElements() {
        this.windowEl = this.el('chat-window');
        this.inputEl = this.el('chat-input');
        this.messagesEl = this.el('chat-messages');
        this.badgeEl = this.el('chat-badge');
        this.maxIconEl = this.el('chat-max-icon');
        this.keyModalEl = this.el('gemini-key-modal');
        this.keyInputEl = this.el('gemini-key-input');
        if (this.keyInputEl && this.geminiApiKey) {
            this.keyInputEl.value = this.geminiApiKey;
        }
    }
    bindEvents() {
        if (this.inputEl) {
            this.inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }
    openWindow() {
        if (!this.windowEl)
            this.initElements();
        if (this.windowEl) {
            this.windowEl.classList.remove('hidden');
            this.windowEl.classList.add('flex');
        }
        if (this.badgeEl) {
            this.badgeEl.classList.add('hidden');
        }
        if (this.inputEl) {
            setTimeout(() => this.inputEl?.focus(), 150);
        }
    }
    closeWindow() {
        if (!this.windowEl)
            this.initElements();
        if (this.windowEl) {
            this.windowEl.classList.add('hidden');
            this.windowEl.classList.remove('flex');
        }
    }
    toggleMaximize() {
        if (!this.windowEl)
            this.initElements();
        if (this.windowEl) {
            const isMax = this.windowEl.classList.contains('w-[520px]');
            if (isMax) {
                this.windowEl.classList.remove('w-[520px]', 'h-[640px]');
                this.windowEl.classList.add('w-96', 'h-[480px]');
                if (this.maxIconEl)
                    this.maxIconEl.innerText = 'fullscreen';
            }
            else {
                this.windowEl.classList.remove('w-96', 'h-[480px]');
                this.windowEl.classList.add('w-[520px]', 'h-[640px]');
                if (this.maxIconEl)
                    this.maxIconEl.innerText = 'fullscreen_exit';
            }
        }
    }
    appendMessage(sender, text, isAi, timeStr = '', source = 'DGMS CMR-2017 & FASTAPI NEURAL CORE', isIntervention = false) {
        if (!this.messagesEl)
            this.initElements();
        if (!this.messagesEl)
            return;
        timeStr = timeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex flex-col ${isAi ? 'items-start' : 'items-end'}`;
        const bubbleBg = isAi
            ? (isIntervention ? 'bg-amber-950/60 border border-amber-500/60 text-amber-200' : 'bg-surface-variant/80 border border-white/10 text-on-surface')
            : 'bg-primary/20 border border-primary/40 text-on-surface';
        const senderColor = isAi
            ? (isIntervention ? 'text-amber-400' : 'text-primary')
            : 'text-zinc-400';
        let badgeHtml = '';
        if (isAi) {
            badgeHtml = `<span class="bg-white/5 border border-white/10 text-[9px] px-1.5 py-0.5 rounded text-zinc-400">${source}</span>`;
            if (isIntervention) {
                badgeHtml += `<span class="bg-amber-500/20 border border-amber-500 text-amber-300 text-[9px] px-1.5 py-0.5 rounded animate-pulse">SAFETY INTERVENTION</span>`;
            }
        }
        msgDiv.innerHTML = `
      <div class="flex items-center gap-1.5 text-[10px] uppercase font-mono ${senderColor} mb-1">
        <span>${sender}</span>
        ${badgeHtml}
        <span class="text-slate-500">• ${timeStr}</span>
      </div>
      <div class="max-w-[85%] rounded-lg px-3.5 py-2 text-xs font-sans whitespace-pre-line leading-relaxed shadow-lg ${bubbleBg}">
        ${text}
      </div>
    `;
        this.messagesEl.appendChild(msgDiv);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
    sendMessage(customText = null) {
        if (!this.inputEl)
            this.initElements();
        const text = customText || (this.inputEl ? this.inputEl.value.trim() : '');
        if (!text)
            return;
        if (this.inputEl)
            this.inputEl.value = '';
        this.appendMessage('Mine Operator', text, false);
        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text })
        })
            .then(res => res.json())
            .then(data => {
            this.appendMessage('TERRA-SENTINEL MASTER AI', data.reply || data.text || 'Command processed.', true, '', data.source, data.isIntervention);
        })
            .catch(err => {
            this.appendMessage('TERRA-SENTINEL MASTER AI', 'Autonomous interlock notice: ' + err.message, true);
        });
    }
    sendQuickChat(query) {
        this.openWindow();
        this.sendMessage(query);
    }
    toggleKeyModal() {
        if (!this.keyModalEl)
            this.initElements();
        if (this.keyModalEl)
            this.keyModalEl.classList.toggle('hidden');
    }
    saveKey() {
        if (!this.keyInputEl)
            this.initElements();
        if (this.keyInputEl) {
            this.geminiApiKey = this.keyInputEl.value.trim();
            localStorage.setItem('gemini_api_key', this.geminiApiKey);
            alert(this.geminiApiKey ? 'Cloud Intelligence Key Linked! Master AI enhanced with frontier reasoning.' : 'Cloud Key cleared. Operating via local neural brain & DGMS core.');
            this.toggleKeyModal();
        }
    }
}
let chatControllerInstance = null;
window.getChatAssistant = function () {
    if (!chatControllerInstance) {
        chatControllerInstance = new ChatAssistantController();
    }
    return chatControllerInstance;
};
window.openChatWindow = () => window.getChatAssistant().openWindow();
window.closeChatWindow = () => window.getChatAssistant().closeWindow();
window.toggleChatMaximize = () => window.getChatAssistant().toggleMaximize();
window.sendUserChatMessage = (msg) => window.getChatAssistant().sendMessage(msg);
window.sendQuickChat = (q) => window.getChatAssistant().sendQuickChat(q);
window.toggleApiKeyModal = () => window.getChatAssistant().toggleKeyModal();
window.saveGeminiKey = () => window.getChatAssistant().saveKey();
