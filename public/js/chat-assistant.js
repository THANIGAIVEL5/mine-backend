export class ChatAssistantController {
    socket = null;
    geminiApiKey = localStorage.getItem('gemini_api_key') || '';
    windowEl = null;
    inputEl = null;
    messagesEl = null;
    badgeEl = null;
    maxIconEl = null;
    keyModalEl = null;
    keyInputEl = null;
    constructor(socketInstance = null) {
        this.socket = socketInstance;
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
        if (this.socket) {
            this.socket.on('chat_broadcast', (data) => {
                this.appendMessage(data.sender, data.text, data.isAi, data.timestamp, data.source, data.isIntervention);
                if (this.windowEl && this.windowEl.classList.contains('hidden') && this.badgeEl) {
                    this.badgeEl.classList.remove('hidden');
                }
            });
        }
    }
    openWindow() {
        if (!this.windowEl)
            this.initElements();
        if (this.windowEl) {
            this.windowEl.classList.remove('hidden');
            if (this.inputEl)
                setTimeout(() => this.inputEl.focus(), 100);
            if (this.badgeEl)
                this.badgeEl.classList.add('hidden');
        }
    }
    closeWindow() {
        if (this.windowEl) {
            this.windowEl.classList.add('hidden');
        }
    }
    toggleMaximize() {
        if (!this.windowEl)
            return;
        const isMax = this.windowEl.classList.toggle('chat-maximized');
        if (isMax) {
            this.windowEl.classList.remove('w-80', 'sm:w-[430px]', 'h-[540px]');
            this.windowEl.classList.add('w-[92vw]', 'sm:w-[680px]', 'h-[75vh]');
        }
        else {
            this.windowEl.classList.remove('w-[92vw]', 'sm:w-[680px]', 'h-[75vh]');
            this.windowEl.classList.add('w-80', 'sm:w-[430px]', 'h-[540px]');
        }
        if (this.maxIconEl) {
            this.maxIconEl.textContent = isMax ? 'close_fullscreen' : 'open_in_full';
        }
    }
    appendMessage(sender, text, isAi = false, time = '', source = '', isIntervention = false) {
        if (!this.messagesEl)
            this.initElements();
        if (!this.messagesEl)
            return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex flex-col ${isAi ? 'items-start' : 'items-end'} mb-3`;
        const timeStr = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const senderColor = isIntervention ? 'text-amber-400 font-bold' : (isAi ? 'text-white' : 'text-emerald-400');
        let bubbleBg = isAi ? 'bg-[#151922] border border-white/30 text-neutral-100' : 'bg-neutral-900/90 border border-neutral-700 text-neutral-100';
        if (isIntervention) {
            bubbleBg = 'bg-[#220d14] border-2 border-[#ff3366] text-white shadow-[0_0_20px_rgba(255,51,102,0.35)]';
        }
        let badgeHtml = '';
        if (isIntervention) {
            badgeHtml = `<span class="ml-2 px-1.5 py-0.2 rounded text-[8px] bg-red-950/90 border border-red-500/60 text-red-300 font-mono animate-pulse">⚡ OPERATOR OVERRIDE ACTIVE</span>`;
        }
        else if (isAi && source) {
            badgeHtml = `<span class="ml-2 px-1.5 py-0.2 rounded text-[8px] bg-neutral-900 border border-white/30 text-white font-mono">${source}</span>`;
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
        const payload = {
            message: text,
            user: 'Mine Operator',
            geminiApiKey: this.geminiApiKey || undefined
        };
        if (this.socket && this.socket.connected) {
            this.socket.emit('chat_message', payload);
        }
        else {
            this.appendMessage('Mine Operator', text, false);
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text })
            })
                .then(res => res.json())
                .then(data => {
                this.appendMessage('TERRA-SENTINEL MASTER AI', data.reply, true, '', data.source, data.isIntervention);
            })
                .catch(err => {
                this.appendMessage('TERRA-SENTINEL MASTER AI', 'Autonomous interlock notice: ' + err.message, true);
            });
        }
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
        const s = (typeof window.socket !== 'undefined' && window.socket) ? window.socket : null;
        chatControllerInstance = new ChatAssistantController(s);
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
