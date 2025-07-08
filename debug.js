// QuantumNotes Debug Script
// Run this in the browser console to test extension functionality

class QuantumNotesDebug {
    constructor() {
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Starting QuantumNotes Debug Tests...\n');
        
        await this.testBackgroundScript();
        await this.testStorage();
        await this.testAIFeatures();
        await this.testNoteOperations();
        
        this.printResults();
    }

    async testBackgroundScript() {
        console.log('📋 Testing Background Script...');
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_NOTES'
            });
            
            if (response && response.success) {
                this.addResult('Background Script', '✅ Working', 'Message handling is functional');
            } else {
                this.addResult('Background Script', '❌ Failed', 'Message handling failed');
            }
        } catch (error) {
            this.addResult('Background Script', '❌ Error', error.message);
        }
    }

    async testStorage() {
        console.log('💾 Testing Storage...');
        
        try {
            // Test sync storage
            await chrome.storage.sync.set({ testKey: 'testValue' });
            const syncResult = await chrome.storage.sync.get('testKey');
            
            if (syncResult.testKey === 'testValue') {
                this.addResult('Sync Storage', '✅ Working', 'Settings storage is functional');
            } else {
                this.addResult('Sync Storage', '❌ Failed', 'Settings storage failed');
            }
            
            // Test local storage
            await chrome.storage.local.set({ testKey: 'testValue' });
            const localResult = await chrome.storage.local.get('testKey');
            
            if (localResult.testKey === 'testValue') {
                this.addResult('Local Storage', '✅ Working', 'Notes storage is functional');
            } else {
                this.addResult('Local Storage', '❌ Failed', 'Notes storage failed');
            }
            
            // Cleanup
            await chrome.storage.sync.remove('testKey');
            await chrome.storage.local.remove('testKey');
            
        } catch (error) {
            this.addResult('Storage', '❌ Error', error.message);
        }
    }

    async testAIFeatures() {
        console.log('🤖 Testing AI Features...');
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'CALL_AI',
                data: {
                    action: 'summarize',
                    text: 'This is a test text for AI functionality.',
                    model: 'gpt-4o'
                }
            });
            
            if (response && response.success) {
                this.addResult('AI Features', '✅ Working', 'AI integration is functional');
            } else if (response && !response.success && response.error.includes('No API key')) {
                this.addResult('AI Features', '⚠️ No API Key', 'AI features need API key configuration');
            } else {
                this.addResult('AI Features', '❌ Failed', response?.error || 'Unknown error');
            }
        } catch (error) {
            this.addResult('AI Features', '❌ Error', error.message);
        }
    }

    async testNoteOperations() {
        console.log('📝 Testing Note Operations...');
        
        try {
            // Test creating a note
            const testNote = {
                id: 'test-' + Date.now(),
                title: 'Debug Test Note',
                content: 'This is a test note for debugging.',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                tags: ['debug', 'test'],
                aiGenerated: false
            };
            
            const createResponse = await chrome.runtime.sendMessage({
                type: 'SAVE_NOTE',
                data: testNote
            });
            
            if (createResponse && createResponse.success) {
                this.addResult('Note Creation', '✅ Working', 'Note creation is functional');
                
                // Test getting notes
                const getResponse = await chrome.runtime.sendMessage({
                    type: 'GET_NOTES'
                });
                
                if (getResponse && getResponse.success) {
                    const foundNote = getResponse.data.find(note => note.id === testNote.id);
                    if (foundNote) {
                        this.addResult('Note Retrieval', '✅ Working', 'Note retrieval is functional');
                    } else {
                        this.addResult('Note Retrieval', '❌ Failed', 'Created note not found');
                    }
                } else {
                    this.addResult('Note Retrieval', '❌ Failed', 'Failed to retrieve notes');
                }
                
                // Cleanup - delete test note
                await chrome.runtime.sendMessage({
                    type: 'DELETE_NOTE',
                    data: { noteId: testNote.id }
                });
                
            } else {
                this.addResult('Note Creation', '❌ Failed', createResponse?.error || 'Unknown error');
            }
            
        } catch (error) {
            this.addResult('Note Operations', '❌ Error', error.message);
        }
    }

    addResult(category, status, message) {
        this.testResults.push({ category, status, message });
    }

    printResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        
        this.testResults.forEach(result => {
            console.log(`${result.status} ${result.category}: ${result.message}`);
        });
        
        const passed = this.testResults.filter(r => r.status.includes('✅')).length;
        const total = this.testResults.length;
        
        console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 All tests passed! The extension should be working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Check the results above for issues.');
        }
    }
}

// Auto-run debug tests
const debug = new QuantumNotesDebug();
debug.runAllTests(); 