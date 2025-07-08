# QuantumNotes - AI-Powered Note Taking Chrome Extension

A sophisticated Chrome extension for AI-powered note-taking with voice commands, intelligent search, and a stunning UI inspired by the IMBX design aesthetic.

## ✨ Features

### 🎯 Core Functionality
- **Smart Note Creation**: Create notes with rich text formatting
- **Voice Commands**: Use voice to create notes, search, and control the extension
- **AI-Powered Search**: Find notes using natural language queries
- **Rich Text Editor**: Full-featured editor with formatting tools
- **Auto-Save**: Automatic saving of your work

### 🤖 AI Integration
- **OpenAI GPT-4o Support**: Advanced AI capabilities
- **Anthropic Claude Support**: Alternative AI model
- **AI Features**:
  - Summarize notes and text
  - Organize and structure content
  - Translate notes to different languages
  - Expand and improve writing
  - Suggest related topics

### 🎨 Design & UX
- **IMBX-Inspired Design**: Modern, dark theme with gradient accents
- **Responsive Interface**: Works seamlessly across different screen sizes
- **Smooth Animations**: Polished interactions and transitions
- **Floating Voice Button**: Easy access to voice commands on any webpage

### 🔧 Advanced Features
- **Context Menu Integration**: Right-click to save selections
- **Keyboard Shortcuts**: Quick access to common actions
- **Multiple AI Models**: Choose between different AI providers
- **Voice Recognition**: Support for multiple languages
- **Note Organization**: Tags, categories, and search

## 🚀 Installation

### From Source
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `QUANTUMNOTES` folder
5. The extension will be installed and ready to use

### Required Setup
1. **API Keys**: Configure your AI provider API keys in the settings
   - OpenAI API Key (for GPT-4o)
   - Anthropic API Key (for Claude)
2. **Voice Recognition**: Grant microphone permissions when prompted

## 🎮 Usage

### Basic Note Taking
1. Click the QuantumNotes extension icon
2. Click "New Note" to create a note
3. Use the rich text editor to write your content
4. Notes are automatically saved

### Voice Commands
- **"New note"** - Create a new note
- **"Save this"** - Save selected text as a note
- **"Search [query]"** - Search your notes
- **"Summarize"** - AI-summarize selected text
- **"Organize"** - AI-organize selected content

### AI Features
1. Select text on any webpage
2. Right-click and choose AI actions:
   - AI Summarize Selection
   - AI Organize Selection
3. Or use the extension popup for AI features

### Keyboard Shortcuts
- `Ctrl+Shift+N` - Create new note
- `Ctrl+Shift+V` - Toggle voice input
- `Ctrl+Shift+S` - Open search
- `Ctrl+S` - Save current note (in editor)

## 🎨 Design Philosophy

The extension features a sophisticated dark theme inspired by the IMBX affiliate website, with:

- **Color Palette**: 
  - Primary: `#B8C3D2` to `#F7F7F8` gradient
  - Background: `#000000` to `#1a1a1a` gradient
  - Accents: Subtle white/gray variations

- **Visual Effects**:
  - Gradient overlays and radial backgrounds
  - Smooth hover animations
  - Shimmer effects on primary buttons
  - Glassmorphism elements

- **Typography**: Clean, modern system fonts with proper hierarchy

## 🔧 Configuration

### Settings
Access settings by clicking the gear icon in the extension popup:

- **API Keys**: Configure OpenAI and Anthropic API keys
- **Default AI Model**: Choose your preferred AI model
- **Voice Language**: Set voice recognition language
- **Auto-Save**: Enable/disable automatic saving
- **Theme**: Dark theme (more themes coming soon)

### Supported AI Models
- **OpenAI**: GPT-4o, GPT-4o Mini
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku

## 🛠️ Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Background processing and API calls
- **Content Scripts**: Web page integration
- **Popup Interface**: Main user interface
- **Note Editor**: Full-featured editing experience

### File Structure
```
QUANTUMNOTES/
├── manifest.json          # Extension configuration
├── popup.html             # Main popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── note-editor.html       # Note editor interface
├── note-editor.css        # Editor styling
├── note-editor.js         # Editor functionality
├── background.js          # Service worker
├── content.js             # Content script
├── styles.css             # Content script styling
├── welcome.html           # Welcome page
├── welcome.css            # Welcome page styling
└── icons/                 # Extension icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

### APIs Used
- **Chrome Extensions API**: Core extension functionality
- **Web Speech API**: Voice recognition
- **OpenAI API**: GPT models
- **Anthropic API**: Claude models
- **Chrome Storage API**: Data persistence

## 🎯 Use Cases

### For Students
- Take lecture notes with voice input
- AI-summarize long readings
- Organize research materials
- Translate study materials

### For Professionals
- Meeting notes and action items
- Project documentation
- Research and analysis
- Content creation assistance

### For Researchers
- Literature review notes
- Data analysis insights
- Research summaries
- Collaborative note-taking

## 🔮 Future Features

- [ ] **Cloud Sync**: Sync notes across devices
- [ ] **Collaboration**: Share and edit notes with others
- [ ] **Templates**: Pre-built note templates
- [ ] **Export Options**: PDF, Markdown, Word export
- [ ] **Advanced AI**: Custom AI prompts and workflows
- [ ] **Mobile App**: Companion mobile application
- [ ] **Offline Mode**: Work without internet connection
- [ ] **Advanced Search**: Semantic search and filters

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **IMBX Design Team**: For the inspiring design aesthetic
- **OpenAI**: For providing the GPT models
- **Anthropic**: For providing the Claude models
- **Chrome Extensions Team**: For the excellent extension platform

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include browser version and extension version

---

**QuantumNotes** - Transform your note-taking experience with AI-powered intelligence and stunning design. 