# MURAi Browser Extension

A browser extension that detects and flags inappropriate content in Filipino and English languages.

## Features

### 🔍 Content Detection
- **Term-based detection** using predefined lists of inappropriate words
- **Multi-language support**: Tagalog, English, and Mixed modes
- **Configurable sensitivity levels**: Low, Medium, High
- **Real-time scanning** of web page content
- **Dynamic content support** with MutationObserver

### 🎨 Visual Flagging
- **Asterisk style**: Individual letters are highlighted with red color and pulse animation
- **Blur style**: Text is blurred and becomes clear on hover
- **Highlight style**: Text is highlighted with customizable colors
- **Customizable colors**: Yellow, Light Red, Light Green, Light Blue, Light Purple

### ⚙️ Configuration
- **Language selection**: Tagalog, English, Mixed
- **Sensitivity control**: Adjust detection aggressiveness
- **Whitelist management**: Exclude specific terms or websites
- **UI customization**: Choose flagging style and colors
- **Protection toggle**: Enable/disable detection

## Detection Terms

### Default Filipino Terms
- `gago` - Fool/idiot
- `haop` - Stupid
- `putangina` - Motherfucker

### Additional Terms by Language

**Tagalog Mode:**
- `tangina`, `puta`, `gago`, `bobo`, `tanga`

**English Mode:**
- `fuck`, `shit`, `damn`, `bitch`, `ass`

**Mixed Mode:**
- All terms from both Tagalog and English modes

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project folder
5. The MURAi extension should now appear in your extensions list

## Usage

### Basic Usage
1. Click the MURAi extension icon in your browser toolbar
2. Configure your preferred settings in the popup
3. Browse the web - inappropriate content will be automatically flagged

### Testing
1. Open the `test-page.html` file in your browser
2. This page contains various test cases for the detection system
3. Try different settings in the extension popup to see how detection changes

### Settings Configuration

#### Language Settings
- **Tagalog**: Detects Filipino/Tagalog terms only
- **English**: Detects English terms only  
- **Mixed**: Detects both Filipino and English terms

#### Sensitivity Levels
- **Low**: Detects only the first 3 most offensive terms
- **Medium**: Detects the first 6 terms
- **High**: Detects all terms in the list

#### Flag Styles
- **Asterisk**: Individual letters are highlighted in red with pulse animation
- **Blur**: Text is blurred and becomes clear on hover
- **Highlight**: Text is highlighted with background color

#### Whitelist Management
- **Terms**: Add specific words to ignore during detection
- **Websites**: Add entire websites to whitelist

## Technical Architecture

### File Structure
```
src/
├── popup/                 # Extension popup interface
│   ├── components/        # React components
│   ├── App.jsx           # Main popup component
│   ├── App.css           # Popup styles
│   └── main.jsx          # Popup entry point
├── services/
│   └── detectionService.js # Core detection logic
├── content.jsx           # Content script for web pages
├── background.jsx        # Background service worker
└── assets/               # Images and icons
```

### Key Components

#### DetectionService
- Manages detection terms and settings
- Handles chrome storage integration
- Applies flagging styles to detected content
- Supports sensitivity filtering and whitelist management

#### ContentScanner
- Scans web page content for inappropriate terms
- Uses TreeWalker for efficient text node traversal
- Implements MutationObserver for dynamic content
- Injects CSS styles for flagged content

#### React Components
- Modular component architecture
- Settings management with chrome storage
- Real-time UI updates
- Comprehensive configuration options

## Development

### Prerequisites
- Node.js and npm
- Modern browser with extension support

### Building
1. Install dependencies: `npm install`
2. Build the extension: `npm run build`
3. Load the built extension in Chrome

### Testing
- Use the provided `test-page.html` for manual testing
- Check browser console for detection logs
- Test different settings combinations

## Browser Support
- Chrome (recommended)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License
This project is licensed under the MIT License.

## Support
For issues and feature requests, please create an issue in the repository.