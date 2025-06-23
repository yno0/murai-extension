// Language-specific inappropriate terms
const TERMS_BY_LANGUAGE = {
  'Tagalog': [
    'gago', 'haop', 'putangina', 'tangina', 'pakyu', 'puta', 'gago ka',
    'bobo', 'tanga', 'ulol', 'gaga', 'gagi', 'gagu', 'gago', 'gagu',
    'tarantado', 'walanghiya', 'bastos', 'kupal', 'ulol', 'gago',
    'tangina mo', 'putang ina', 'putang ina mo', 'gago ka talaga'
  ],
  'English': [
    'stupid', 'idiot', 'moron', 'dumb', 'fool', 'asshole', 'bastard',
    'bitch', 'fuck', 'shit', 'damn', 'hell', 'crap', 'piss', 'dick',
    'cock', 'pussy', 'whore', 'slut', 'cunt', 'motherfucker', 'fucker',
    'dumbass', 'jackass', 'dickhead', 'prick', 'twat', 'wanker'
  ],
  'Mixed': [
    // Tagalog terms
    'gago', 'haop', 'putangina', 'tangina', 'pakyu', 'puta', 'gago ka',
    'bobo', 'tanga', 'ulol', 'gaga', 'gagi', 'gagu', 'gago', 'gagu',
    'tarantado', 'walanghiya', 'bastos', 'kupal', 'ulol', 'gago',
    'tangina mo', 'putang ina', 'putang ina mo', 'gago ka talaga',
    // English terms
    'stupid', 'idiot', 'moron', 'dumb', 'fool', 'asshole', 'bastard',
    'bitch', 'fuck', 'shit', 'damn', 'hell', 'crap', 'piss', 'dick',
    'cock', 'pussy', 'whore', 'slut', 'cunt', 'motherfucker', 'fucker',
    'dumbass', 'jackass', 'dickhead', 'prick', 'twat', 'wanker'
  ]
};

class ContentScript {
  constructor() {
    this.settings = {
      protectionEnabled: true,
      language: 'Mixed',
      sensitivity: 'High',
      whitelistTerms: [],
      whitelistWebsites: [],
      flagStyle: 'asterisk',
      showHighlight: true,
      highlightColor: '#ffeb3b'
    };
    this.detectedTerms = [];
    this.isInitialized = false;
    this.isProcessing = false;
    this.processedElements = new WeakSet(); // Track processed elements
  }

  async init() {
    if (this.isInitialized) return;
    
    console.log('MURAi: Initializing content script...');
    
    // Load settings from storage
    await this.loadSettings();
    
    // Start detection
    this.startDetection();
    
    // Listen for settings updates
    this.setupMessageListener();
    
    this.isInitialized = true;
    console.log('MURAi: Content script initialized');
  }

  async loadSettings() {
    try {
      // eslint-disable-next-line no-undef
      const result = await chrome.storage.sync.get([
        'protectionEnabled',
        'language',
        'sensitivity',
        'whitelistTerms',
        'whitelistWebsites',
        'flagStyle',
        'showHighlight',
        'highlightColor'
      ]);

      console.log('MURAi: Raw settings from storage:', result);
      
      this.settings = { ...this.settings, ...result };
      console.log('MURAi: Final settings loaded:', this.settings);
      console.log('MURAi: Flag style is:', this.settings.flagStyle);
    } catch (error) {
      console.error('MURAi: Error loading settings:', error);
    }
  }

  setupMessageListener() {
    // eslint-disable-next-line no-undef
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'SETTINGS_UPDATED') {
        console.log('MURAi: Settings updated, reloading...');
        this.loadSettings().then(() => {
          this.clearAllHighlights();
          this.startDetection();
        });
      }
    });
  }

  startDetection() {
    if (!this.settings.protectionEnabled) {
      console.log('MURAi: Protection disabled');
      return;
    }

    console.log('MURAi: Starting detection...');
    
    // Clear any existing highlights first
    this.clearAllHighlights();
    
    // Run detection at different times to catch dynamic content
    this.detectAndHighlight();
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.detectAndHighlight();
      });
    }

    // Run after page is fully loaded
    window.addEventListener('load', () => {
      this.detectAndHighlight();
    });

    // Run after a delay to catch any dynamic content
    setTimeout(() => {
      this.detectAndHighlight();
    }, 1000);

    // Set up observer for dynamic content
    this.setupMutationObserver();
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldRecheck = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            shouldRecheck = true;
          }
        });
      });
      
      if (shouldRecheck) {
        setTimeout(() => this.detectAndHighlight(), 100);
      }
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      });
    }
  }

  detectAndHighlight() {
    if (!this.settings.protectionEnabled || this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Get current page text
      const pageText = document.body.innerText || document.body.textContent || '';
      
      // Get terms to check based on language setting
      const termsToCheck = this.getTermsToCheck();
      
      // Find terms in page text
      const foundTerms = this.findTermsInText(pageText, termsToCheck);
      
      if (foundTerms.length === 0) {
        console.log('MURAi: No inappropriate terms found');
        this.isProcessing = false;
        return;
      }

      console.log('MURAi: Found terms:', foundTerms);
      this.detectedTerms = foundTerms;

      // Highlight found terms
      this.highlightTerms(foundTerms);
    } catch (error) {
      console.error('MURAi: Error in detection:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  clearAllHighlights() {
    // Remove all existing MURAi highlights
    const existingHighlights = document.querySelectorAll('.murai-highlight');
    existingHighlights.forEach(highlight => {
      // Remove the murai-highlight class
      highlight.classList.remove('murai-highlight');
      
      // Reset the styles
      highlight.style.removeProperty('background-color');
      highlight.style.removeProperty('filter');
      highlight.style.removeProperty('padding');
      highlight.style.removeProperty('border-radius');
      highlight.style.removeProperty('border');
      
      // If it was an asterisk replacement, restore original content
      if (highlight.innerHTML && highlight.innerHTML.includes('*'.repeat(3))) {
        // This was an asterisk replacement, we need to restore original text
        // For now, just remove the highlighting
        console.log('MURAi: Restoring asterisk content');
      }
    });
    
    // Clear processed elements tracking
    this.processedElements = new WeakSet();
  }

  getTermsToCheck() {
    // Get base terms for the selected language
    let terms = [...(TERMS_BY_LANGUAGE[this.settings.language] || TERMS_BY_LANGUAGE['Mixed'])];
    
    // Filter out whitelisted terms
    terms = terms.filter(term => 
      !this.settings.whitelistTerms.some(whitelisted => 
        term.toLowerCase().includes(whitelisted.toLowerCase())
      )
    );

    // Adjust based on sensitivity
    if (this.settings.sensitivity === 'Low') {
      // Only the most severe terms
      terms = terms.filter(term => 
        ['fuck', 'shit', 'putangina', 'tangina', 'gago', 'puta'].includes(term.toLowerCase())
      );
    } else if (this.settings.sensitivity === 'Medium') {
      // Filter out milder terms
      terms = terms.filter(term => 
        !['stupid', 'idiot', 'moron', 'dumb', 'fool', 'bobo', 'tanga'].includes(term.toLowerCase())
      );
    }
    // High sensitivity keeps all terms

    console.log(`MURAi: Using ${terms.length} terms for ${this.settings.language} language with ${this.settings.sensitivity} sensitivity`);
    return terms;
  }

  // Helper to build a robust regex for a term
  buildTermRegex(term) {
    // Allow for start/end, whitespace, or punctuation around the term
    // Handles multi-word terms and punctuation
    // Example: (?:^|\s|[.,!?;:()"'])term(?:$|\s|[.,!?;:()"'])
    const pattern = `(?:^|\\s|[.,!?;:()"'])${this.escapeRegex(term)}(?:$|\\s|[.,!?;:()"'])`;
    return new RegExp(pattern, 'gi');
  }

  findTermsInText(text, terms) {
    const foundTerms = [];
    const lowerText = text.toLowerCase();
    
    terms.forEach(term => {
      const regex = this.buildTermRegex(term.toLowerCase());
      if (regex.test(lowerText)) {
        foundTerms.push(term);
      }
    });
    
    return foundTerms;
  }

  highlightTerms(terms) {
    // Only skip processing if showHighlight is off AND we're not using blur style
    if (!this.settings.showHighlight && this.settings.flagStyle !== 'blur') return;

    // Focus on text content elements, not large containers
    const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, li, td, th, .userContent, ._5pbx, ._1dwg, ._1w_m');
    
    console.log('MURAi: Processing', textElements.length, 'text elements');
    
    textElements.forEach(element => {
      this.processElement(element, terms);
    });
  }

  processElement(element, terms) {
    // Skip if already processed or contains highlights
    if (this.processedElements.has(element) || element.classList.contains('murai-highlight')) {
      return;
    }

    // Skip if element is inside another highlighted element
    if (element.closest('.murai-highlight')) {
      return;
    }

    // Skip very large elements that might be containers
    const elementSize = element.offsetWidth * element.offsetHeight;
    if (elementSize > 50000) { // Reduced threshold for more precise targeting
      return;
    }

    // Skip elements with too many child elements (likely containers)
    if (element.children.length > 5) { // Reduced threshold
      return;
    }

    const text = element.textContent || element.innerText || '';
    
    // Skip elements with very long text (likely containers)
    if (text.length > 500) { // Reduced threshold
      return;
    }

    // Skip elements that are mostly whitespace or very short
    if (text.trim().length < 3) {
      return;
    }
    
    // Check if this element contains any inappropriate terms using improved regex
    const hasInappropriateContent = terms.some(term => {
      const regex = this.buildTermRegex(term);
      return regex.test(text);
    });

    if (!hasInappropriateContent) {
      return;
    }

    console.log('MURAi: Found inappropriate content in element:', element.tagName, text.substring(0, 100));

    // Apply different styling based on flag style
    switch (this.settings.flagStyle) {
      case 'asterisk':
        if (this.settings.showHighlight) {
          // Replace inappropriate words with asterisks and highlight the text
          let newContent = text;
          terms.forEach(term => {
            const regex = this.buildTermRegex(term);
            newContent = newContent.replace(regex, (match) => {
              // Only replace the actual term, not the surrounding chars
              const clean = match.trim();
              const replaced = match.replace(clean, '*'.repeat(clean.length));
              return replaced;
            });
          });
          
          element.innerHTML = newContent;
          element.style.setProperty('background-color', this.settings.highlightColor, 'important');
          element.style.setProperty('padding', '4px', 'important');
          element.style.setProperty('border-radius', '3px', 'important');
          element.classList.add('murai-highlight');
        } else {
          // Just replace inappropriate words with asterisks
          let newContent = text;
          terms.forEach(term => {
            const regex = this.buildTermRegex(term);
            newContent = newContent.replace(regex, (match) => {
              const clean = match.trim();
              const replaced = match.replace(clean, '*'.repeat(clean.length));
              return replaced;
            });
          });
          
          element.innerHTML = newContent;
          element.style.setProperty('padding', '4px', 'important');
          element.style.setProperty('border-radius', '3px', 'important');
          element.classList.add('murai-highlight');
        }
        break;
        
      case 'blur':
        if (this.settings.showHighlight) {
          // Apply blur to the text with highlighting
          element.style.setProperty('background-color', this.settings.highlightColor, 'important');
          element.style.setProperty('filter', 'blur(3px)', 'important');
          element.style.setProperty('padding', '4px', 'important');
          element.style.setProperty('border-radius', '3px', 'important');
          element.classList.add('murai-highlight');
        } else {
          // Apply blur to the text without highlighting
          element.style.setProperty('filter', 'blur(3px)', 'important');
          element.style.setProperty('padding', '4px', 'important');
          element.style.setProperty('border-radius', '3px', 'important');
          element.classList.add('murai-highlight');
        }
        break;
        
      case 'highlight':
        // Apply highlighting to the text
        element.style.setProperty('background-color', this.settings.highlightColor, 'important');
        element.style.setProperty('padding', '4px', 'important');
        element.style.setProperty('border-radius', '3px', 'important');
        element.classList.add('murai-highlight');
        break;
        
      default:
        // Default to asterisk replacement with highlighting if enabled
        if (this.settings.showHighlight) {
          let newContent = text;
          terms.forEach(term => {
            const regex = this.buildTermRegex(term);
            newContent = newContent.replace(regex, (match) => {
              const clean = match.trim();
              const replaced = match.replace(clean, '*'.repeat(clean.length));
              return replaced;
            });
          });
          
          element.innerHTML = newContent;
          element.style.setProperty('background-color', this.settings.highlightColor, 'important');
          element.style.setProperty('padding', '4px', 'important');
          element.style.setProperty('border-radius', '3px', 'important');
          element.classList.add('murai-highlight');
        } else {
          let newContent = text;
          terms.forEach(term => {
            const regex = this.buildTermRegex(term);
            newContent = newContent.replace(regex, (match) => {
              const clean = match.trim();
              const replaced = match.replace(clean, '*'.repeat(clean.length));
              return replaced;
            });
          });
          
          element.innerHTML = newContent;
          element.style.setProperty('padding', '4px', 'important');
          element.style.setProperty('border-radius', '3px', 'important');
          element.classList.add('murai-highlight');
        }
    }

    this.processedElements.add(element);
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  getFlagSymbol() {
    console.log('MURAi: Current flag style:', this.settings.flagStyle);
    
    switch (this.settings.flagStyle) {
      case 'asterisk': 
        console.log('MURAi: Using asterisk flag');
        return '*';
      case 'blur': 
        console.log('MURAi: Using blur style (no flag)');
        return '';
      case 'highlight': 
        console.log('MURAi: Using highlight style (no flag)');
        return '';
      default: 
        console.log('MURAi: Using default asterisk flag');
        return '*';
    }
  }
}

// Initialize content script
const contentScript = new ContentScript();
contentScript.init();
