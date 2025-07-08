# QuantumNotes Troubleshooting Guide

## 🔧 Common Issues and Solutions

### Notes Not Saving

**Symptoms**: Notes disappear after creating them or don't persist between sessions.

**Solutions**:
1. **Check Extension Permissions**:
   - Go to `chrome://extensions/`
   - Find QuantumNotes and click "Details"
   - Ensure all permissions are granted

2. **Test Storage**:
   - Open the extension popup
   - Open browser console (F12)
   - Run the debug script: `copy(await chrome.storage.local.get('notes'))`
   - Check if notes are in storage

3. **Reinstall Extension**:
   - Remove the extension completely
   - Reload the QUANTUMNOTES folder
   - Install again

### AI Features Not Working

**Symptoms**: AI buttons don't respond or show errors.

**Solutions**:
1. **Check API Keys**:
   - Open extension settings
   - Verify OpenAI or Anthropic API key is entered
   - Ensure the key is valid and has credits

2. **Test API Connection**:
   - Open browser console
   - Run: `chrome.runtime.sendMessage({type: 'CALL_AI', data: {action: 'summarize', text: 'test'}})`
   - Check for error messages

3. **Check Network**:
   - Ensure internet connection is stable
   - Try accessing OpenAI/Anthropic websites directly

### Voice Commands Not Working

**Symptoms**: Voice button doesn't respond or shows errors.

**Solutions**:
1. **Grant Microphone Permission**:
   - Click the microphone icon in browser address bar
   - Allow microphone access
   - Refresh the page

2. **Check Browser Support**:
   - Voice recognition requires HTTPS
   - Ensure you're on a secure website
   - Try on Chrome (best support)

3. **Test Voice Recognition**:
   - Go to any website
   - Look for the floating voice button
   - Click it and try speaking

### Extension Not Loading

**Symptoms**: Extension doesn't appear in toolbar or shows errors.

**Solutions**:
1. **Check Manifest**:
   - Ensure `manifest.json` is valid JSON
   - Check all required files are present
   - Verify file paths are correct

2. **Developer Mode**:
   - Enable Developer mode in `chrome://extensions/`
   - Click "Load unpacked" and select the QUANTUMNOTES folder

3. **Check Console Errors**:
   - Open browser console
   - Look for extension-related errors
   - Check for missing files or syntax errors

### Popup Not Opening

**Symptoms**: Clicking extension icon doesn't open popup.

**Solutions**:
1. **Check Popup Files**:
   - Ensure `popup.html`, `popup.css`, and `popup.js` exist
   - Check for syntax errors in these files

2. **Test Popup**:
   - Right-click extension icon
   - Select "Inspect popup"
   - Check console for errors

3. **Reload Extension**:
   - Go to `chrome://extensions/`
   - Click the refresh icon on QuantumNotes

## 🧪 Debug Tools

### Run Debug Tests
1. Open the extension popup
2. Open browser console (F12)
3. Run the debug script:
```javascript
// Copy and paste the debug.js content here
```

### Manual Testing
Test each feature individually:

**Note Creation**:
```javascript
chrome.runtime.sendMessage({
    type: 'SAVE_NOTE',
    data: {
        id: 'test-' + Date.now(),
        title: 'Test Note',
        content: 'Test content',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['test'],
        aiGenerated: false
    }
});
```

**AI Features**:
```javascript
chrome.runtime.sendMessage({
    type: 'CALL_AI',
    data: {
        action: 'summarize',
        text: 'This is a test text for AI functionality.',
        model: 'gpt-4o'
    }
});
```

**Settings**:
```javascript
chrome.runtime.sendMessage({
    type: 'SAVE_SETTINGS',
    data: {
        openaiKey: 'your-api-key-here',
        defaultModel: 'gpt-4o',
        voiceLanguage: 'en-US'
    }
});
```

## 📋 Checklist

Before reporting an issue, check:

- [ ] Extension is properly installed
- [ ] All permissions are granted
- [ ] API keys are configured (for AI features)
- [ ] Microphone permission is granted (for voice)
- [ ] Browser console shows no errors
- [ ] All files are present in the QUANTUMNOTES folder
- [ ] Using Chrome browser (recommended)
- [ ] Internet connection is stable

## 🐛 Reporting Issues

When reporting issues, include:

1. **Browser Version**: Chrome version number
2. **Extension Version**: Current version (1.0.0)
3. **Error Messages**: Copy any console errors
4. **Steps to Reproduce**: Detailed steps
5. **Expected vs Actual Behavior**: What should happen vs what happens
6. **Debug Test Results**: Output from debug script

## 🔄 Reset Extension

If all else fails:

1. **Backup Notes** (if any):
```javascript
// In console, export your notes
copy(JSON.stringify(await chrome.storage.local.get('notes')));
```

2. **Remove Extension**:
   - Go to `chrome://extensions/`
   - Remove QuantumNotes completely

3. **Clear Data**:
   - Go to `chrome://settings/clearBrowserData`
   - Clear extension data

4. **Reinstall**:
   - Load the extension again
   - Restore API keys and settings
   - Import notes if you backed them up

---

**Need more help?** Check the main README.md for detailed documentation or create an issue with the information above. 