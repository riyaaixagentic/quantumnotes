// QuantumNotes Background Service Worker
class QuantumNotesBackground {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupContextMenus();
        this.setupAlarms();
    }

    setupEventListeners() {
        // Extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.onFirstInstall();
            } else if (details.reason === 'update') {
                this.onUpdate(details.previousVersion);
            }
        });

        // Extension startup
        chrome.runtime.onStartup.addListener(() => {
            this.onStartup();
        });

        // Message handling
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.onTabUpdated(tabId, changeInfo, tab);
        });

        // Keyboard shortcuts
        chrome.commands.onCommand.addListener((command) => {
            this.handleCommand(command);
        });
    }

    setupContextMenus() {
        // Create context menu for text selection
        chrome.contextMenus.create({
            id: 'quantumnotes-save-selection',
            title: 'Save to QuantumNotes',
            contexts: ['selection']
        });

        chrome.contextMenus.create({
            id: 'quantumnotes-ai-summarize',
            title: 'AI Summarize Selection',
            contexts: ['selection']
        });

        chrome.contextMenus.create({
            id: 'quantumnotes-ai-organize',
            title: 'AI Organize Selection',
            contexts: ['selection']
        });

        // Handle context menu clicks
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });
    }

    setupAlarms() {
        // Set up auto-save alarm
        chrome.alarms.create('auto-save', {
            delayInMinutes: 1,
            periodInMinutes: 1
        });

        // Handle alarms
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });
    }

    onFirstInstall() {
        console.log('QuantumNotes installed for the first time');
        
        // Set default settings
        chrome.storage.sync.set({
            openaiKey: '',
            anthropicKey: '',
            defaultModel: 'gpt-4o',
            voiceLanguage: 'en-US',
            autoSave: true,
            theme: 'dark',
            fontSize: 'medium'
        });

        // Open welcome page
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html')
        });
    }

    onUpdate(previousVersion) {
        console.log(`QuantumNotes updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
        
        // Handle version-specific updates
        if (previousVersion && previousVersion < '1.0.0') {
            // Migration logic for older versions
            this.migrateFromOldVersion();
        }
    }

    onStartup() {
        console.log('QuantumNotes started');
        this.checkForUpdates();
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'GET_NOTES':
                    const notes = await this.getNotes();
                    sendResponse({ success: true, data: notes });
                    break;

                case 'SAVE_NOTE':
                    const savedNote = await this.saveNote(message.data);
                    sendResponse({ success: true, data: savedNote });
                    break;

                case 'DELETE_NOTE':
                    await this.deleteNote(message.data.noteId);
                    sendResponse({ success: true });
                    break;

                case 'UPDATE_NOTE':
                    const updatedNote = await this.updateNote(message.data);
                    sendResponse({ success: true, data: updatedNote });
                    break;

                case 'SEARCH_NOTES':
                    const searchResults = await this.searchNotes(message.data.query);
                    sendResponse({ success: true, data: searchResults });
                    break;

                case 'GET_SETTINGS':
                    const settings = await this.getSettings();
                    sendResponse({ success: true, data: settings });
                    break;

                case 'SAVE_SETTINGS':
                    await this.saveSettings(message.data);
                    sendResponse({ success: true });
                    break;

                case 'CALL_AI':
                    const aiResponse = await this.callAI(message.data);
                    sendResponse({ success: true, data: aiResponse });
                    break;

                case 'GET_SELECTED_TEXT':
                    const selectedText = await this.getSelectedText(sender.tab.id);
                    sendResponse({ success: true, data: selectedText });
                    break;

                case 'CREATE_NOTE_FROM_SELECTION':
                    const newNote = await this.createNoteFromSelection(message.data, sender.tab);
                    sendResponse({ success: true, data: newNote });
                    break;

                case 'SHOW_NOTIFICATION':
                    this.showNotification(message.data);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async getNotes() {
        const result = await chrome.storage.local.get('notes');
        return result.notes || [];
    }

    async saveNote(noteData) {
        const notes = await this.getNotes();
        const note = {
            id: noteData.id || this.generateId(),
            title: noteData.title,
            content: noteData.content,
            createdAt: noteData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: noteData.tags || [],
            aiGenerated: noteData.aiGenerated || false,
            url: noteData.url || null
        };

        // Update existing note or add new one
        const existingIndex = notes.findIndex(n => n.id === note.id);
        if (existingIndex >= 0) {
            notes[existingIndex] = note;
        } else {
            notes.unshift(note);
        }

        await chrome.storage.local.set({ notes });
        return note;
    }

    async deleteNote(noteId) {
        const notes = await this.getNotes();
        const filteredNotes = notes.filter(note => note.id !== noteId);
        await chrome.storage.local.set({ notes: filteredNotes });
    }

    async updateNote(noteData) {
        return await this.saveNote(noteData);
    }

    async searchNotes(query) {
        const notes = await this.getNotes();
        const searchTerm = query.toLowerCase();
        
        return notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm) ||
            note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    async getSettings() {
        const result = await chrome.storage.sync.get([
            'openaiKey', 'anthropicKey', 'defaultModel', 'voiceLanguage',
            'autoSave', 'theme', 'fontSize'
        ]);
        return result;
    }

    async saveSettings(settings) {
        await chrome.storage.sync.set(settings);
    }

    async callAI(data) {
        const settings = await this.getSettings();
        const { action, text, model } = data;

        if (!settings.openaiKey && !settings.anthropicKey) {
            throw new Error('No API key configured');
        }

        const prompt = this.getAIPrompt(action, text);
        const selectedModel = model || settings.defaultModel;

        if (settings.openaiKey) {
            return await this.callOpenAI(prompt, selectedModel, settings.openaiKey);
        } else if (settings.anthropicKey) {
            return await this.callAnthropic(prompt, settings.anthropicKey);
        }

        throw new Error('No API key configured');
    }

    getAIPrompt(action, text) {
        const prompts = {
            improve: `Please improve the writing quality, clarity, and flow of the following text while maintaining its original meaning:\n\n${text}`,
            summarize: `Please provide a concise summary of the following text:\n\n${text}`,
            expand: `Please expand and elaborate on the following text, adding more detail, examples, and context:\n\n${text}`,
            organize: `Please organize and structure the following notes in a clear, logical format with proper headings and sections:\n\n${text}`,
            translate: `Please translate the following text to English (if not already in English, translate to the most appropriate language):\n\n${text}`,
            suggest: `Based on the following text, please suggest related topics, ideas, or areas for further exploration:\n\n${text}`
        };
        
        return prompts[action] || text;
    }

    async callOpenAI(prompt, model, apiKey) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async callAnthropic(prompt, apiKey) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1500,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async getSelectedText(tabId) {
        try {
            const result = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => window.getSelection().toString()
            });
            return result[0].result;
        } catch (error) {
            console.error('Error getting selected text:', error);
            return '';
        }
    }

    async createNoteFromSelection(selectionData, tab) {
        const selectedText = await this.getSelectedText(tab.id);
        if (!selectedText) {
            throw new Error('No text selected');
        }

        const note = {
            title: selectionData.title || `Selection from ${tab.title}`,
            content: selectedText,
            tags: selectionData.tags || ['selection'],
            url: tab.url,
            aiGenerated: false
        };

        return await this.saveNote(note);
    }

    handleContextMenuClick(info, tab) {
        switch (info.menuItemId) {
            case 'quantumnotes-save-selection':
                this.createNoteFromSelection({
                    title: `Selection from ${tab.title}`,
                    tags: ['selection']
                }, tab);
                break;

            case 'quantumnotes-ai-summarize':
                this.handleAIContextMenu('summarize', tab);
                break;

            case 'quantumnotes-ai-organize':
                this.handleAIContextMenu('organize', tab);
                break;
        }
    }

    async handleAIContextMenu(action, tab) {
        try {
            const selectedText = await this.getSelectedText(tab.id);
            if (!selectedText) {
                this.showNotification('No text selected');
                return;
            }

            const aiResponse = await this.callAI({ action, text: selectedText });
            const note = await this.saveNote({
                title: `AI ${action.charAt(0).toUpperCase() + action.slice(1)} - ${tab.title}`,
                content: aiResponse,
                tags: ['ai-generated', action],
                url: tab.url,
                aiGenerated: true
            });

            this.showNotification(`AI ${action} completed and saved to notes`);
        } catch (error) {
            this.showNotification(`Error: ${error.message}`);
        }
    }

    handleCommand(command) {
        switch (command) {
            case 'new-note':
                chrome.tabs.create({
                    url: chrome.runtime.getURL('note-editor.html')
                });
                break;

            case 'search-notes':
                chrome.action.openPopup();
                break;

            case 'voice-note':
                // Trigger voice note in active tab
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, { type: 'START_VOICE_NOTE' });
                    }
                });
                break;
        }
    }

    onTabUpdated(tabId, changeInfo, tab) {
        // Handle tab updates if needed
        if (changeInfo.status === 'complete' && tab.url) {
            // Could be used for auto-saving notes based on page content
        }
    }

    handleAlarm(alarm) {
        if (alarm.name === 'auto-save') {
            this.performAutoSave();
        }
    }

    async performAutoSave() {
        // Auto-save logic for open note editors
        const settings = await this.getSettings();
        if (settings.autoSave) {
            // Notify all note editors to auto-save
            chrome.tabs.query({ url: chrome.runtime.getURL('note-editor.html') }, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { type: 'AUTO_SAVE' });
                });
            });
        }
    }

    showNotification(message) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: 'QuantumNotes',
            message: message
        });
    }

    checkForUpdates() {
        // Check for extension updates
        chrome.runtime.requestUpdateCheck((status) => {
            if (status === 'update_available') {
                this.showNotification('QuantumNotes update available');
            }
        });
    }

    migrateFromOldVersion() {
        // Migration logic for older versions
        console.log('Migrating from old version');
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Initialize background service worker
new QuantumNotesBackground(); 