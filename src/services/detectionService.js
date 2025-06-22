/* global chrome */
// Detection service for MURAi extension
class DetectionService {
  constructor() {
    // Default Filipino terms to detect
    this.defaultTerms = ['gago', 'haop', 'putangina'];
    
    // Load settings from storage
    this.settings = {
      language: 'Mixed',
      sensitivity: 'High',
      protectionEnabled: true,
      whitelistTerms: [],
      whitelistWebsites: [],
      flagStyle: 'asterisk',
      showHighlight: true,
      highlightColor: '#ffeb3b'
    };
    
    this.loadSettings();
  }

  // Load settings from chrome storage
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'language',
        'sensitivity',
        'protectionEnabled',
        'whitelistTerms',
        'whitelistWebsites',
        'flagStyle',
        'showHighlight',
        'highlightColor'
      ]);
      
      this.settings = { ...this.settings, ...result };
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  // Get detection terms based on language setting
  getDetectionTerms() {
    const baseTerms = [...this.defaultTerms];
    
    // Add language-specific terms based on settings
    switch (this.settings.language) {
      case 'Tagalog':
        return [...baseTerms, 'tangina', 'puta', 'gago', 'bobo', 'tanga'];
      case 'English':
        return [...baseTerms, 'fuck', 'shit', 'damn', 'bitch', 'ass'];
      case 'Mixed':
      default:
        return [...baseTerms, 'tangina', 'puta', 'gago', 'bobo', 'tanga', 'fuck', 'shit', 'damn', 'bitch', 'ass'];
    }
  }

  // Check if a term should be detected based on sensitivity
  shouldDetectTerm(term) {
    const detectionTerms = this.getDetectionTerms();
    
    // Check if term is in whitelist
    if (this.settings.whitelistTerms.includes(term.toLowerCase())) {
      return false;
    }
    
    // Check if current website is whitelisted
    const currentUrl = window.location.hostname;
    if (this.settings.whitelistWebsites.some(site => currentUrl.includes(site))) {
      return false;
    }
    
    // Apply sensitivity filtering
    const termIndex = detectionTerms.indexOf(term.toLowerCase());
    if (termIndex === -1) return false;
    
    switch (this.settings.sensitivity) {
      case 'Low':
        return termIndex < 3; // Only detect first 3 terms
      case 'Medium':
        return termIndex < 6; // Detect first 6 terms
      case 'High':
      default:
        return true; // Detect all terms
    }
  }

  // Detect terms in text
  detectTerms(text) {
    if (!this.settings.protectionEnabled) {
      return [];
    }

    const detectionTerms = this.getDetectionTerms();
    const detectedTerms = [];
    
    detectionTerms.forEach(term => {
      if (this.shouldDetectTerm(term)) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          detectedTerms.push({
            term: term,
            count: matches.length,
            matches: matches
          });
        }
      }
    });
    
    return detectedTerms;
  }

  // Apply flagging to detected text
  applyFlagging(text, detectedTerms) {
    if (!detectedTerms.length) return text;
    
    let flaggedText = text;
    
    detectedTerms.forEach(({ term }) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      
      switch (this.settings.flagStyle) {
        case 'asterisk':
          flaggedText = flaggedText.replace(regex, (match) => {
            return match.split('').map(letter => `<span class="murai-letter">${letter}</span>`).join('');
          });
          break;
        case 'blur':
          flaggedText = flaggedText.replace(regex, (match) => {
            return `<span class="murai-blur">${match}</span>`;
          });
          break;
        case 'highlight':
        default:
          flaggedText = flaggedText.replace(regex, (match) => {
            return `<span class="murai-highlight">${match}</span>`;
          });
          break;
      }
    });
    
    return flaggedText;
  }

  // Update settings
  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    try {
      await chrome.storage.sync.set(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Get current settings
  getSettings() {
    return { ...this.settings };
  }
}

// Create singleton instance
const detectionService = new DetectionService();

export default detectionService; 