// QuantumNotes Content Script
class QuantumNotesContent {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.voiceButton = null;
        this.init();
    }

    init() {
        this.setupMessageListener();
        this.setupVoiceRecognition();
        this.createVoiceButton();
        this.setupKeyboardShortcuts();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true;
        });
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
                this.handleVoiceInput(transcript);
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

    createVoiceButton() {
        // Create floating voice button
        this.voiceButton = document.createElement('div');
        this.voiceButton.id = 'quantumnotes-voice-btn';
        this.voiceButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 1V5M18 7V11M12 15V19M6 11V7M8 12C8 13.1046 8.89543 14 10 14C11.1046 14 12 13.1046 12 12V6C12 4.89543 11.1046 4 10 4C8.89543 4 8 4.89543 8 6V12Z" stroke="currentColor" stroke-width="1.5"/>
            </svg>
        `;
        this.voiceButton.title = 'QuantumNotes Voice Input (Ctrl+Shift+V)';
        
        // Add styles
        this.voiceButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #B8C3D2 0%, #F7F7F8 100%);
            border: none;
            border-radius: 50%;
            color: #000000;
            cursor: pointer;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 25px rgba(184, 195, 210, 0.3);
            transition: all 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        this.voiceButton.addEventListener('mouseenter', () => {
            this.voiceButton.style.transform = 'translateY(-2px)';
            this.voiceButton.style.boxShadow = '0 12px 35px rgba(184, 195, 210, 0.4)';
        });
        
        this.voiceButton.addEventListener('mouseleave', () => {
            this.voiceButton.style.transform = 'translateY(0)';
            this.voiceButton.style.boxShadow = '0 8px 25px rgba(184, 195, 210, 0.3)';
        });
        
        this.voiceButton.addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });
        
        // Add to page
        document.body.appendChild(this.voiceButton);
    }

    updateVoiceButton(listening) {
        if (!this.voiceButton) return;
        
        if (listening) {
            this.voiceButton.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)';
            this.voiceButton.style.animation = 'quantumnotes-pulse 1.5s ease-in-out infinite';
            this.voiceButton.title = 'Listening... Click to stop';
        } else {
            this.voiceButton.style.background = 'linear-gradient(135deg, #B8C3D2 0%, #F7F7F8 100%)';
            this.voiceButton.style.animation = 'none';
            this.voiceButton.title = 'QuantumNotes Voice Input (Ctrl+Shift+V)';
        }
    }

    toggleVoiceRecognition() {
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

    handleVoiceInput(transcript) {
        // Process voice input based on commands
        const command = this.parseVoiceCommand(transcript);
        
        switch (command.action) {
            case 'save':
                this.saveSelectedText(command.data);
                break;
            case 'search':
                this.searchNotes(command.data);
                break;
            case 'new_note':
                this.createNewNote(command.data);
                break;
            case 'summarize':
                this.summarizeSelectedText();
                break;
            case 'organize':
                this.organizeSelectedText();
                break;
            default:
                this.createVoiceNote(transcript);
        }
    }

    parseVoiceCommand(transcript) {
        const text = transcript.toLowerCase();
        
        if (text.includes('save') || text.includes('save this')) {
            return { action: 'save', data: this.getSelectedText() };
        }
        
        if (text.includes('search') || text.includes('find')) {
            const query = text.replace(/search|find/gi, '').trim();
            return { action: 'search', data: query };
        }
        
        if (text.includes('new note') || text.includes('create note')) {
            const content = text.replace(/new note|create note/gi, '').trim();
            return { action: 'new_note', data: content };
        }
        
        if (text.includes('summarize') || text.includes('summary')) {
            return { action: 'summarize', data: this.getSelectedText() };
        }
        
        if (text.includes('organize') || text.includes('structure')) {
            return { action: 'organize', data: this.getSelectedText() };
        }
        
        return { action: 'note', data: transcript };
    }

    getSelectedText() {
        const selection = window.getSelection();
        return selection.toString().trim();
    }

    async saveSelectedText(text) {
        if (!text) {
            this.showNotification('No text selected');
            return;
        }
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'CREATE_NOTE_FROM_SELECTION',
                data: {
                    title: `Selection from ${document.title}`,
                    tags: ['selection']
                }
            });
            
            if (response.success) {
                this.showNotification('Text saved to QuantumNotes');
            } else {
                this.showNotification('Error saving text: ' + response.error);
            }
        } catch (error) {
            this.showNotification('Error saving text: ' + error.message);
        }
    }

    async searchNotes(query) {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'SEARCH_NOTES',
                data: { query }
            });
            
            if (response.success) {
                this.showSearchResults(response.data);
            } else {
                this.showNotification('Error searching notes: ' + response.error);
            }
        } catch (error) {
            this.showNotification('Error searching notes: ' + error.message);
        }
    }

    async createNewNote(content) {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_NOTE',
                data: {
                    title: 'Voice Note',
                    content: content,
                    tags: ['voice']
                }
            });
            
            if (response.success) {
                this.showNotification('Voice note created');
            } else {
                this.showNotification('Error creating note: ' + response.error);
            }
        } catch (error) {
            this.showNotification('Error creating note: ' + error.message);
        }
    }

    async createVoiceNote(transcript) {
        await this.createNewNote(transcript);
    }

    async summarizeSelectedText() {
        const text = this.getSelectedText();
        if (!text) {
            this.showNotification('No text selected');
            return;
        }
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'CALL_AI',
                data: { action: 'summarize', text }
            });
            
            if (response.success) {
                await this.createNewNote(`Summary:\n\n${response.data}`);
                this.showNotification('Summary created and saved');
            } else {
                this.showNotification('Error creating summary: ' + response.error);
            }
        } catch (error) {
            this.showNotification('Error creating summary: ' + error.message);
        }
    }

    async organizeSelectedText() {
        const text = this.getSelectedText();
        if (!text) {
            this.showNotification('No text selected');
            return;
        }
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'CALL_AI',
                data: { action: 'organize', text }
            });
            
            if (response.success) {
                await this.createNewNote(`Organized Notes:\n\n${response.data}`);
                this.showNotification('Notes organized and saved');
            } else {
                this.showNotification('Error organizing notes: ' + response.error);
            }
        } catch (error) {
            this.showNotification('Error organizing notes: ' + error.message);
        }
    }

    showSearchResults(results) {
        if (results.length === 0) {
            this.showNotification('No notes found');
            return;
        }
        
        // Create a simple results popup
        const popup = document.createElement('div');
        popup.id = 'quantumnotes-search-results';
        popup.innerHTML = `
            <div class="quantumnotes-header">
                <h3>Search Results (${results.length})</h3>
                <button class="quantumnotes-close">×</button>
            </div>
            <div class="quantumnotes-results">
                ${results.slice(0, 5).map(note => `
                    <div class="quantumnotes-result-item">
                        <div class="quantumnotes-title">${this.escapeHtml(note.title)}</div>
                        <div class="quantumnotes-preview">${this.escapeHtml(note.content.substring(0, 100))}...</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            max-height: 500px;
            background: #1a1a1a;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: #FFFFFF;
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        `;
        
        // Add styles for child elements
        const style = document.createElement('style');
        style.textContent = `
            .quantumnotes-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .quantumnotes-header h3 {
                margin: 0;
                color: #B8C3D2;
                font-size: 16px;
            }
            .quantumnotes-close {
                background: none;
                border: none;
                color: #B8C3D2;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .quantumnotes-close:hover {
                color: #F7F7F8;
            }
            .quantumnotes-results {
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            .quantumnotes-result-item {
                padding: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .quantumnotes-result-item:hover {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.2);
            }
            .quantumnotes-title {
                font-weight: 500;
                margin-bottom: 4px;
                color: #F7F7F8;
            }
            .quantumnotes-preview {
                font-size: 12px;
                color: #B8C3D2;
                opacity: 0.8;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(popup);
        
        // Add event listeners
        popup.querySelector('.quantumnotes-close').addEventListener('click', () => {
            document.body.removeChild(popup);
        });
        
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                document.body.removeChild(popup);
            }
        });
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        }, 10000);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+V for voice input
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.toggleVoiceRecognition();
            }
            
            // Ctrl+Shift+S for save selection
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.saveSelectedText(this.getSelectedText());
            }
        });
    }

    handleMessage(message, sender, sendResponse) {
        switch (message.type) {
            case 'START_VOICE_NOTE':
                this.toggleVoiceRecognition();
                sendResponse({ success: true });
                break;
                
            case 'GET_SELECTED_TEXT':
                const selectedText = this.getSelectedText();
                sendResponse({ success: true, data: selectedText });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.id = 'quantumnotes-notification';
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
            z-index: 10002;
            animation: quantumnotes-slideIn 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 8px 25px rgba(184, 195, 210, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'quantumnotes-slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
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
    @keyframes quantumnotes-pulse {
        0% {
            transform: scale(1);
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
        }
        50% {
            transform: scale(1.05);
            box-shadow: 0 12px 35px rgba(255, 107, 107, 0.5);
        }
        100% {
            transform: scale(1);
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
        }
    }
    
    @keyframes quantumnotes-slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes quantumnotes-slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize content script
new QuantumNotesContent(); 