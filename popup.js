// QuantumNotes Popup JavaScript
class QuantumNotesPopup {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.notes = [];
        this.settings = {};
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadNotes();
        this.setupEventListeners();
        this.renderRecentNotes();
        this.setupVoiceRecognition();
    }

    setupEventListeners() {
        // Quick action buttons
        document.getElementById('newNoteBtn').addEventListener('click', () => this.createNewNote());
        document.getElementById('voiceNoteBtn').addEventListener('click', () => this.startVoiceNote());
        
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('voiceSearchBtn').addEventListener('click', () => this.startVoiceSearch());
        
        // AI feature buttons
        document.getElementById('summarizeBtn').addEventListener('click', () => this.aiSummarize());
        document.getElementById('organizeBtn').addEventListener('click', () => this.aiOrganize());
        document.getElementById('translateBtn').addEventListener('click', () => this.aiTranslate());
        document.getElementById('expandBtn').addEventListener('click', () => this.aiExpand());
        
        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('cancelSettingsBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = this.settings.voiceLanguage || 'en-US';
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.showVoiceStatus();
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleVoiceInput(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.hideVoiceStatus();
                this.isListening = false;
            };
            
            this.recognition.onend = () => {
                this.hideVoiceStatus();
                this.isListening = false;
            };
        }
    }

    async loadSettings() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_SETTINGS'
            });
            if (response.success) {
                this.settings = {
                    openaiKey: response.data.openaiKey || '',
                    anthropicKey: response.data.anthropicKey || '',
                    defaultModel: response.data.defaultModel || 'gpt-4o',
                    voiceLanguage: response.data.voiceLanguage || 'en-US'
                };
            } else {
                this.settings = {
                    openaiKey: '',
                    anthropicKey: '',
                    defaultModel: 'gpt-4o',
                    voiceLanguage: 'en-US'
                };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = {
                openaiKey: '',
                anthropicKey: '',
                defaultModel: 'gpt-4o',
                voiceLanguage: 'en-US'
            };
        }
    }

    async loadNotes() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_NOTES'
            });
            if (response.success) {
                this.notes = response.data;
            } else {
                this.notes = [];
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
        }
    }

    async saveNotes() {
        try {
            // Save notes through background script
            for (const note of this.notes) {
                await chrome.runtime.sendMessage({
                    type: 'SAVE_NOTE',
                    data: note
                });
            }
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    }

    renderRecentNotes() {
        const notesList = document.getElementById('recentNotesList');
        const recentNotes = this.notes.slice(0, 5);
        
        if (recentNotes.length === 0) {
            notesList.innerHTML = `
                <div class="note-item" style="text-align: center; color: #B8C3D2; opacity: 0.7;">
                    No notes yet. Create your first note!
                </div>
            `;
            return;
        }
        
        notesList.innerHTML = recentNotes.map(note => `
            <div class="note-item" data-note-id="${note.id}">
                <div class="note-icon">📝</div>
                <div class="note-content">
                    <div class="note-title">${this.escapeHtml(note.title)}</div>
                    <div class="note-preview">${this.escapeHtml(note.content.substring(0, 50))}${note.content.length > 50 ? '...' : ''}</div>
                </div>
                <div class="note-date">${this.formatDate(note.createdAt)}</div>
                <button class="delete-note-btn" title="Delete Note" data-note-id="${note.id}">🗑️</button>
            </div>
        `).join('');
        
        // Add click listeners to note items
        notesList.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Prevent click if delete button is clicked
                if (e.target.classList.contains('delete-note-btn')) return;
                const noteId = item.dataset.noteId;
                this.openNote(noteId);
            });
        });
        // Add delete listeners
        notesList.querySelectorAll('.delete-note-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = btn.dataset.noteId;
                this.deleteNote(noteId);
            });
        });
    }

    async createNewNote() {
        const note = {
            id: this.generateId(),
            title: 'New Note',
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: [],
            aiGenerated: false
        };
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_NOTE',
                data: note
            });
            
            if (response.success) {
                this.notes.unshift(response.data);
                this.renderRecentNotes();
                this.openNoteEditor(response.data);
            } else {
                this.showNotification('Error creating note: ' + response.error);
            }
        } catch (error) {
            this.showNotification('Error creating note: ' + error.message);
        }
    }

    startVoiceNote() {
        if (!this.recognition) {
            alert('Voice recognition is not supported in this browser.');
            return;
        }
        
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    startVoiceSearch() {
        if (!this.recognition) {
            alert('Voice recognition is not supported in this browser.');
            return;
        }
        
        this.recognition.start();
    }

    handleVoiceInput(transcript) {
        const searchInput = document.getElementById('searchInput');
        
        if (searchInput === document.activeElement) {
            // Voice search
            searchInput.value = transcript;
            this.handleSearch(transcript);
        } else {
            // Voice note
            this.createVoiceNote(transcript);
        }
    }

    async createVoiceNote(transcript) {
        const note = {
            id: this.generateId(),
            title: `Voice Note - ${new Date().toLocaleString()}`,
            content: transcript,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: ['voice'],
            aiGenerated: false
        };
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_NOTE',
                data: note
            });
            
            if (response.success) {
                this.notes.unshift(response.data);
                this.renderRecentNotes();
                this.showNotification('Voice note created successfully!');
            } else {
                this.showNotification('Error creating voice note: ' + response.error);
            }
        } catch (error) {
            this.showNotification('Error creating voice note: ' + error.message);
        }
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.renderRecentNotes();
            return;
        }
        
        const filteredNotes = this.notes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase()) ||
            note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        this.renderSearchResults(filteredNotes, query);
    }

    renderSearchResults(notes, query) {
        const notesList = document.getElementById('recentNotesList');
        
        if (notes.length === 0) {
            notesList.innerHTML = `
                <div class="note-item" style="text-align: center; color: #B8C3D2; opacity: 0.7;">
                    No notes found for "${query}"
                </div>
            `;
            return;
        }
        
        notesList.innerHTML = notes.map(note => `
            <div class="note-item" data-note-id="${note.id}">
                <div class="note-icon">📝</div>
                <div class="note-content">
                    <div class="note-title">${this.highlightText(note.title, query)}</div>
                    <div class="note-preview">${this.highlightText(note.content.substring(0, 50), query)}${note.content.length > 50 ? '...' : ''}</div>
                </div>
                <div class="note-date">${this.formatDate(note.createdAt)}</div>
                <button class="delete-note-btn" title="Delete Note" data-note-id="${note.id}">🗑️</button>
            </div>
        `).join('');
        
        // Add click listeners
        notesList.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-note-btn')) return;
                const noteId = item.dataset.noteId;
                this.openNote(noteId);
            });
        });
        // Add delete listeners
        notesList.querySelectorAll('.delete-note-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = btn.dataset.noteId;
                this.deleteNote(noteId);
            });
        });
    }

    async aiSummarize() {
        if (!this.settings.openaiKey && !this.settings.anthropicKey) {
            this.openSettings();
            return;
        }
        
        const selectedText = await this.getSelectedText();
        if (!selectedText) {
            this.showNotification('Please select text to summarize');
            return;
        }
        
        try {
            const summary = await this.callAI('summarize', selectedText);
            this.createAINote('Summary', summary, 'summary');
        } catch (error) {
            this.showNotification('Error generating summary: ' + error.message);
        }
    }

    async aiOrganize() {
        if (!this.settings.openaiKey && !this.settings.anthropicKey) {
            this.openSettings();
            return;
        }
        
        const selectedText = await this.getSelectedText();
        if (!selectedText) {
            this.showNotification('Please select text to organize');
            return;
        }
        
        try {
            const organized = await this.callAI('organize', selectedText);
            this.createAINote('Organized Notes', organized, 'organized');
        } catch (error) {
            this.showNotification('Error organizing notes: ' + error.message);
        }
    }

    async aiTranslate() {
        if (!this.settings.openaiKey && !this.settings.anthropicKey) {
            this.openSettings();
            return;
        }
        
        const selectedText = await this.getSelectedText();
        if (!selectedText) {
            this.showNotification('Please select text to translate');
            return;
        }
        
        try {
            const translated = await this.callAI('translate', selectedText);
            this.createAINote('Translation', translated, 'translation');
        } catch (error) {
            this.showNotification('Error translating text: ' + error.message);
        }
    }

    async aiExpand() {
        if (!this.settings.openaiKey && !this.settings.anthropicKey) {
            this.openSettings();
            return;
        }
        
        const selectedText = await this.getSelectedText();
        if (!selectedText) {
            this.showNotification('Please select text to expand');
            return;
        }
        
        try {
            const expanded = await this.callAI('expand', selectedText);
            this.createAINote('Expanded Notes', expanded, 'expanded');
        } catch (error) {
            this.showNotification('Error expanding text: ' + error.message);
        }
    }

    async callAI(action, text) {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'CALL_AI',
                data: {
                    action: action,
                    text: text,
                    model: this.settings.defaultModel
                }
            });
            
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error || 'AI call failed');
            }
        } catch (error) {
            throw new Error('AI call failed: ' + error.message);
        }
    }

    getAIPrompt(action, text) {
        const prompts = {
            summarize: `Please provide a concise summary of the following text:\n\n${text}`,
            organize: `Please organize and structure the following notes in a clear, logical format:\n\n${text}`,
            translate: `Please translate the following text to English (if not already in English, translate to the most appropriate language):\n\n${text}`,
            expand: `Please expand and elaborate on the following text, adding more detail and context:\n\n${text}`
        };
        
        return prompts[action] || text;
    }



    async createAINote(title, content, tag) {
        const note = {
            id: this.generateId(),
            title: title,
            content: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: [tag, 'ai-generated'],
            aiGenerated: true
        };
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_NOTE',
                data: note
            });
            
            if (response.success) {
                this.notes.unshift(response.data);
                this.renderRecentNotes();
                this.showNotification('AI note created successfully!');
            } else {
                this.showNotification('Error creating AI note: ' + response.error);
            }
        } catch (error) {
            this.showNotification('Error creating AI note: ' + error.message);
        }
    }

    async getSelectedText() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.getSelection().toString()
        });
        return result[0].result;
    }

    openNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            this.openNoteEditor(note);
        }
    }

    openNoteEditor(note) {
        // Open note editor in a new tab or sidebar
        chrome.tabs.create({
            url: chrome.runtime.getURL(`note-editor.html?id=${note.id}`)
        });
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        const openaiKey = document.getElementById('openaiKey');
        const anthropicKey = document.getElementById('anthropicKey');
        const defaultModel = document.getElementById('defaultModel');
        const voiceLanguage = document.getElementById('voiceLanguage');
        
        openaiKey.value = this.settings.openaiKey;
        anthropicKey.value = this.settings.anthropicKey;
        defaultModel.value = this.settings.defaultModel;
        voiceLanguage.value = this.settings.voiceLanguage;
        
        modal.classList.add('show');
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('show');
    }

    async saveSettings() {
        const openaiKey = document.getElementById('openaiKey').value;
        const anthropicKey = document.getElementById('anthropicKey').value;
        const defaultModel = document.getElementById('defaultModel').value;
        const voiceLanguage = document.getElementById('voiceLanguage').value;
        
        this.settings = {
            openaiKey,
            anthropicKey,
            defaultModel,
            voiceLanguage
        };
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_SETTINGS',
                data: this.settings
            });
            
            if (response.success) {
                this.closeSettings();
                this.showNotification('Settings saved successfully!');
                
                // Update voice recognition language
                if (this.recognition) {
                    this.recognition.lang = voiceLanguage;
                }
            } else {
                this.showNotification('Error saving settings: ' + response.error);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error saving settings');
        }
    }

    showVoiceStatus() {
        document.getElementById('voiceStatus').style.display = 'flex';
    }

    hideVoiceStatus() {
        document.getElementById('voiceStatus').style.display = 'none';
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(90deg, #B8C3D2 0%, #F7F7F8 100%);
            color: #000000;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    this.createNewNote();
                    break;
                case 'v':
                    e.preventDefault();
                    this.startVoiceNote();
                    break;
                case 'f':
                    e.preventDefault();
                    document.getElementById('searchInput').focus();
                    break;
            }
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    highlightText(text, query) {
        if (!query) return this.escapeHtml(text);
        const regex = new RegExp(`(${query})`, 'gi');
        return this.escapeHtml(text).replace(regex, '<mark style="background: rgba(184, 195, 210, 0.3); color: #F7F7F8;">$1</mark>');
    }

    async deleteNote(noteId) {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'DELETE_NOTE',
                data: { noteId }
            });
            if (response.success) {
                this.notes = this.notes.filter(n => n.id !== noteId);
                this.renderRecentNotes();
                this.showNotification('Note deleted');
            } else {
                this.showNotification('Error deleting note: ' + response.error);
            }
        } catch (error) {
            this.showNotification('Error deleting note: ' + error.message);
        }
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
    new QuantumNotesPopup();
}); 