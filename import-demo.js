// QuantumNotes Demo Notes Importer
// Run this script in the browser console to import demo notes

async function importDemoNotes() {
    try {
        // Fetch the demo notes
        const response = await fetch(chrome.runtime.getURL('demo-notes.json'));
        const demoData = await response.json();
        
        // Get current notes
        const result = await chrome.storage.local.get('notes');
        const currentNotes = result.notes || [];
        
        // Check if demo notes already exist
        const existingDemoIds = currentNotes
            .filter(note => note.id.startsWith('demo-'))
            .map(note => note.id);
        
        // Filter out demo notes that already exist
        const newDemoNotes = demoData.notes.filter(note => 
            !existingDemoIds.includes(note.id)
        );
        
        if (newDemoNotes.length === 0) {
            console.log('Demo notes already imported!');
            return;
        }
        
        // Add demo notes to the beginning of the list
        const updatedNotes = [...newDemoNotes, ...currentNotes];
        
        // Save to storage
        await chrome.storage.local.set({ notes: updatedNotes });
        
        console.log(`✅ Successfully imported ${newDemoNotes.length} demo notes!`);
        console.log('Refresh the extension popup to see the new notes.');
        
        // Show notification
        chrome.runtime.sendMessage({
            type: 'SHOW_NOTIFICATION',
            data: {
                title: 'Demo Notes Imported',
                message: `Successfully imported ${newDemoNotes.length} demo notes!`
            }
        });
        
    } catch (error) {
        console.error('❌ Error importing demo notes:', error);
    }
}

// Auto-run the import function
importDemoNotes(); 