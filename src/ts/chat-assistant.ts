class ChatAssistantController {
  private geminiApiKey: string = localStorage.getItem('gemini_api_key') || '';
  
  private windowEl: HTMLElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private messagesEl: HTMLElement | null = null;
  private badgeEl: HTMLElement | null = null;
  private maxIconEl: HTMLElement | null = null;
  private keyModalEl: HTMLElement | null = null;
  private keyInputEl: HTMLInputElement | null = null;

  constructor() {
    this.initElements();
    this.bindEvents();
  }

  private el(id: string): HTMLElement | null {
    return document.getElementById(id);
  }

  private initElements() {
    this.windowEl = this.el('chat-window');
    this.inputEl = this.el('chat-input') as HTMLInputElement;
    this.messagesEl = this.el('chat-messages');
    this.badgeEl = this.el('chat-badge');
    this.maxIconEl = this.el('chat-max-icon');
    this.keyModalEl = this.el('gemini-key-modal');
    this.keyInputEl = this.el('gemini-key-input') as HTMLInputElement;

    if (this.keyInputEl && this.geminiApiKey) {
      this.keyInputEl.value = this.geminiApiKey;
    }
  }

  private bindEvents() {
    if (this.inputEl) {
      this.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }
  }

  public openWindow() {
    if (!this.windowEl) this.initElements();
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

  public closeWindow() {
    if (!this.windowEl) this.initElements();
    if (this.windowEl) {
      this.windowEl.classList.add('hidden');
      this.windowEl.classList.remove('flex');
    }
  }

  public toggleMaximize() {
    if (!this.windowEl) this.initElements();
    if (this.windowEl) {
      const isMax = this.windowEl.classList.contains('w-[520px]');
      if (isMax) {
        this.windowEl.classList.remove('w-[520px]', 'h-[640px]');
        this.windowEl.classList.add('w-96', 'h-[480px]');
        if (this.maxIconEl) this.maxIconEl.innerText = 'fullscreen';
      } else {
        this.windowEl.classList.remove('w-96', 'h-[480px]');
        this.windowEl.classList.add('w-[520px]', 'h-[640px]');
        if (this.maxIconEl) this.maxIconEl.innerText = 'fullscreen_exit';
      }
    }
  }

  private appendMessage(sender: string, text: string, isAi: boolean, timeStr: string = '', source: string = 'DGMS CMR-2017 & FASTAPI NEURAL CORE', isIntervention: boolean = false) {
    if (!this.messagesEl) this.initElements();
    if (!this.messagesEl) return;

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

  public sendMessage(customText: string | null = null) {
    if (!this.inputEl) this.initElements();
    const text = customText || (this.inputEl ? this.inputEl.value.trim() : '');
    if (!text) return;
    if (this.inputEl) this.inputEl.value = '';

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

  public sendQuickChat(query: string) {
    this.openWindow();
    this.sendMessage(query);
  }

  public toggleKeyModal() {
    if (!this.keyModalEl) this.initElements();
    if (this.keyModalEl) this.keyModalEl.classList.toggle('hidden');
  }

  public saveKey() {
    if (!this.keyInputEl) this.initElements();
    if (this.keyInputEl) {
      this.geminiApiKey = this.keyInputEl.value.trim();
      localStorage.setItem('gemini_api_key', this.geminiApiKey);
      alert(this.geminiApiKey ? 'Cloud Intelligence Key Linked! Master AI enhanced with frontier reasoning.' : 'Cloud Key cleared. Operating via local neural brain & DGMS core.');
      this.toggleKeyModal();
    }
  }
}

let chatControllerInstance: ChatAssistantController | null = null;

(window as any).getChatAssistant = function(): ChatAssistantController {
  if (!chatControllerInstance) {
    chatControllerInstance = new ChatAssistantController();
  }
  return chatControllerInstance;
};

(window as any).openChatWindow = () => (window as any).getChatAssistant().openWindow();
(window as any).closeChatWindow = () => (window as any).getChatAssistant().closeWindow();
(window as any).toggleChatMaximize = () => (window as any).getChatAssistant().toggleMaximize();
(window as any).sendUserChatMessage = (msg: string) => (window as any).getChatAssistant().sendMessage(msg);
(window as any).sendQuickChat = (q: string) => (window as any).getChatAssistant().sendQuickChat(q);
(window as any).toggleApiKeyModal = () => (window as any).getChatAssistant().toggleKeyModal();
(window as any).saveGeminiKey = () => (window as any).getChatAssistant().saveKey();
