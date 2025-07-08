// QuantumNotes Editor JavaScript
class QuantumNotesEditor {
    constructor() {
        this.currentNote = null;
        this.recognition = null;
        this.isListening = false;
        this.autoSaveInterval = null;
        this.lastSaved = null;
        
        this.init();
    }

    async init() {
        await this.loadNote();
        this.setupEventListeners();
        this.setupVoiceRecognition();
        this.setupAutoSave();
        this.updateWordCount();
    }

    async loadNote() {
        const urlParams = new URLSearchParams(window.location.search);
        const noteId = urlParams.get('id');
        
        if (noteId) {
            try {
                const response = await chrome.runtime.sendMessage({
                    type: 'GET_NOTES'
                });
                
                if (response.success) {
                    this.currentNote = response.data.find(note => note.id === noteId);
                    if (this.currentNote) {
                        this.populateEditor();
                    }
                }
            } catch (error) {
                console.error('Error loading note:', error);
            }
        }
        
        if (!this.currentNote) {
            this.currentNote = {
                id: this.generateId(),
                title: 'New Note',
                content: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                tags: [],
                aiGenerated: false
            };
        }
    }

    populateEditor() {
        document.getElementById('noteTitle').value = this.currentNote.title;
        document.getElementById('editor').innerHTML = this.currentNote.content;
        this.updateNoteMeta();
    }

    updateNoteMeta() {
        const dateElement = document.getElementById('noteDate');
        const tagsElement = document.getElementById('noteTags');
        
        if (dateElement) {
            dateElement.textContent = this.formatDate(this.currentNote.updatedAt);
        }
        
        if (tagsElement && this.currentNote.tags.length > 0) {
            tagsElement.textContent = this.currentNote.tags.join(', ');
        }
    }

    setupEventListeners() {
        // Header buttons
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('aiBtn').addEventListener('click', () => this.toggleAISidebar());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveNote());
        
        // Editor content
        document.getElementById('noteTitle').addEventListener('input', () => this.handleTitleChange());
        document.getElementById('editor').addEventListener('input', () => this.handleContentChange());
        
        // Toolbar
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleToolbarClick(e));
        });
        
        // AI sidebar
        document.getElementById('closeSidebarBtn').addEventListener('click', () => this.toggleAISidebar());
        document.querySelectorAll('.ai-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAIAction(e));
        });
        
        // Voice input
        document.getElementById('voiceBtn').addEventListener('click', () => this.toggleVoiceInput());
        
        // Link dialog
        document.getElementById('cancelLink').addEventListener('click', () => this.closeLinkDialog());
        document.getElementById('insertLink').addEventListener('click', () => this.insertLink());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Before unload
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
    }

    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceButton(true);
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.insertVoiceText(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.updateVoiceButton(false);
                this.isListening = false;
            };
            
            this.recognition.onend = () => {
                this.updateVoiceButton(false);
                this.isListening = false;
            };
        }
    }

    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, 30000); // Auto-save every 30 seconds
    }

    handleTitleChange() {
        this.currentNote.title = document.getElementById('noteTitle').value;
        this.markAsModified();
    }

    handleContentChange() {
        this.currentNote.content = document.getElementById('editor').innerHTML;
        this.currentNote.updatedAt = new Date().toISOString();
        this.markAsModified();
        this.updateWordCount();
    }

    markAsModified() {
        this.currentNote.updatedAt = new Date().toISOString();
        document.getElementById('lastSaved').textContent = 'Modified';
        document.getElementById('lastSaved').style.color = '#ff6b6b';
    }

    async saveNote() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_NOTE',
                data: this.currentNote
            });
            
            if (response.success) {
                this.currentNote = response.data;
                this.updateNoteMeta();
                this.updateLastSaved();
                this.showNotification('Note saved successfully!');
            } else {
                this.showNotification('Error saving note: ' + response.error);
            }
        } catch (error) {
            this.showNotification('Error saving note: ' + error.message);
        }
    }

    async autoSave() {
        if (this.currentNote.content.trim() !== '') {
            await this.saveNote();
        }
    }

    updateLastSaved() {
        const now = new Date();
        document.getElementById('lastSaved').textContent = `Saved at ${now.toLocaleTimeString()}`;
        document.getElementById('lastSaved').style.color = '#B8C3D2';
        this.lastSaved = now;
    }

    handleToolbarClick(e) {
        e.preventDefault();
        const btn = e.currentTarget;
        const command = btn.dataset.command;
        const value = btn.dataset.value;
        
        if (command === 'createLink') {
            this.openLinkDialog();
        } else {
            document.execCommand(command, false, value);
        }
        
        this.updateToolbarState();
    }

    updateToolbarState() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            const command = btn.dataset.command;
            if (command) {
                if (document.queryCommandState(command)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    }

    openLinkDialog() {
        const dialog = document.getElementById('linkDialog');
        const urlInput = document.getElementById('linkUrl');
        const textInput = document.getElementById('linkText');
        
        // Get selected text
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        if (selectedText) {
            textInput.value = selectedText;
        }
        
        dialog.style.display = 'flex';
        urlInput.focus();
    }

    closeLinkDialog() {
        document.getElementById('linkDialog').style.display = 'none';
        document.getElementById('editor').focus();
    }

    insertLink() {
        const url = document.getElementById('linkUrl').value.trim();
        const text = document.getElementById('linkText').value.trim();
        
        if (url) {
            const linkText = text || url;
            document.execCommand('createLink', false, url);
            
            // Replace the selected text with the link text
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(linkText));
            }
        }
        
        this.closeLinkDialog();
    }

    toggleAISidebar() {
        const sidebar = document.getElementById('aiSidebar');
        sidebar.classList.toggle('open');
    }

    async handleAIAction(e) {
        const action = e.currentTarget.dataset.action;
        const editor = document.getElementById('editor');
        const content = editor.innerText || editor.textContent;
        
        if (!content.trim()) {
            this.showNotification('Please add some content to use AI features');
            return;
        }
        
        this.showAILoading();
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'CALL_AI',
                data: { action, text: content }
            });
            
            if (response.success) {
                this.displayAIOutput(action, response.data);
            } else {
                this.showNotification('AI Error: ' + response.error);
            }
        } catch (error) {
            this.showNotification('AI Error: ' + error.message);
        } finally {
            this.hideAILoading();
        }
    }

    displayAIOutput(action, output) {
        const aiOutput = document.getElementById('aiOutput');
        const actionNames = {
            improve: 'Improved Writing',
            summarize: 'Summary',
            expand: 'Expanded Ideas',
            organize: 'Organized Structure',
            translate: 'Translation',
            suggest: 'Suggested Topics'
        };
        
        aiOutput.innerHTML = `
            <div class="ai-output-content">
                <h4>${actionNames[action] || 'AI Output'}</h4>
                <div class="ai-content">${this.formatAIOutput(output)}</div>
                <div class="ai-actions">
                    <button class="ai-action-btn-small" onclick="quantumNotesEditor.replaceContent('${this.escapeHtml(output)}')">
                        Replace Content
                    </button>
                    <button class="ai-action-btn-small" onclick="quantumNotesEditor.appendContent('${this.escapeHtml(output)}')">
                        Append to Note
                    </button>
                </div>
            </div>
        `;
    }

    formatAIOutput(output) {
        return output.replace(/\n/g, '<br>');
    }

    replaceContent(content) {
        document.getElementById('editor').innerHTML = content;
        this.handleContentChange();
        this.showNotification('Content replaced with AI output');
    }

    appendContent(content) {
        const editor = document.getElementById('editor');
        editor.innerHTML += '<br><br>' + content;
        this.handleContentChange();
        this.showNotification('AI output appended to note');
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.showNotification('Voice recognition is not supported in this browser.');
            return;
        }
        
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    updateVoiceButton(listening) {
        const voiceBtn = document.getElementById('voiceBtn');
        
        if (listening) {
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1V5M18 7V11M12 15V19M6 11V7M8 12C8 13.1046 8.89543 14 10 14C11.1046 14 12 13.1046 12 12V6C12 4.89543 11.1046 4 10 4C8.89543 4 8 4.89543 8 6V12Z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                Listening...
            `;
        } else {
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1V5M18 7V11M12 15V19M6 11V7M8 12C8 13.1046 8.89543 14 10 14C11.1046 14 12 13.1046 12 12V6C12 4.89543 11.1046 4 10 4C8.89543 4 8 4.89543 8 6V12Z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                Voice Input
            `;
        }
    }

    insertVoiceText(text) {
        const editor = document.getElementById('editor');
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text + ' '));
        } else {
            editor.innerHTML += text + ' ';
        }
        
        this.handleContentChange();
        this.showNotification('Voice input added');
    }

    updateWordCount() {
        const editor = document.getElementById('editor');
        const text = editor.innerText || editor.textContent;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        
        document.getElementById('wordCount').textContent = `${words} words`;
        document.getElementById('charCount').textContent = `${chars} characters`;
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveNote();
                    break;
                case 'b':
                    e.preventDefault();
                    document.execCommand('bold', false);
                    break;
                case 'i':
                    e.preventDefault();
                    document.execCommand('italic', false);
                    break;
                case 'u':
                    e.preventDefault();
                    document.execCommand('underline', false);
                    break;
                case 'k':
                    e.preventDefault();
                    this.openLinkDialog();
                    break;
            }
        }
        
        if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            this.toggleVoiceInput();
        }
        
        if (e.key === 'Escape') {
            this.closeLinkDialog();
        }
    }

    handleBeforeUnload(e) {
        if (this.currentNote.content.trim() !== '' && this.lastSaved !== this.currentNote.updatedAt) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }

    goBack() {
        if (this.currentNote.content.trim() !== '' && this.lastSaved !== this.currentNote.updatedAt) {
            if (confirm('You have unsaved changes. Do you want to save before leaving?')) {
                this.saveNote().then(() => {
                    window.close();
                });
            } else {
                window.close();
            }
        } else {
            window.close();
        }
    }

    showAILoading() {
        document.getElementById('aiLoading').style.display = 'flex';
    }

    hideAILoading() {
        document.getElementById('aiLoading').style.display = 'none';
    }

    showNotification(message) {
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
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
    
    .ai-action-btn-small {
        background: rgba(184, 195, 210, 0.1);
        border: 1px solid rgba(184, 195, 210, 0.2);
        border-radius: 6px;
        padding: 8px 12px;
        color: #B8C3D2;
        cursor: pointer;
        font-size: 12px;
        margin-right: 8px;
        transition: all 0.3s ease;
    }
    
    .ai-action-btn-small:hover {
        background: rgba(184, 195, 210, 0.2);
        border-color: rgba(184, 195, 210, 0.3);
        color: #F7F7F8;
    }
    
    .ai-content {
        margin-bottom: 16px;
        line-height: 1.6;
    }
    
    .ai-actions {
        display: flex;
        gap: 8px;
    }
`;
document.head.appendChild(style);

// Initialize editor
const quantumNotesEditor = new QuantumNotesEditor(); 