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
    this.unmaskedElements = new WeakSet(); // Track elements that have been manually unmasked
    this.unmaskedContent = new Set(); // Track specific unmasked text content
    this.lastUnmaskTime = 0; // Track when last unmask action occurred
  }

  async init() {
    if (this.isInitialized) return;

    console.log('MURAi: Initializing content script...');

    // Track page load time for response time calculation
    if (!window.muraiPageLoadTime) {
      window.muraiPageLoadTime = Date.now();
    }

    // Make this instance globally accessible for event handlers
    window.muraiContentScript = this;

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

        // Clear unmasked tracking to allow fresh detection with new settings
        this.unmaskedContent.clear();
        this.unmaskedElements = new WeakSet();
        this.processedElements = new WeakSet();

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

    // Additional check to prevent immediate re-detection after unmask
    if (this.lastUnmaskTime && (Date.now() - this.lastUnmaskTime) < 3000) {
      console.log('MURAi: Skipping detection - recent unmask action');
      return;
    }

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

      // Automatically log detected terms to server
      this.logDetectedTerms(foundTerms);

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

  // Build regex to capture context around flagged terms
  buildContextRegex(term, contextWords = 12) {
    // Capture 12 words before and after the flagged term for better context
    const beforeContext = `(?:((?:\\S+\\s+){0,${contextWords}}))?`;
    const afterContext = `(?:((?:\\s+\\S+){0,${contextWords}}))?`;
    const termPattern = `(${this.escapeRegex(term)})`;

    const pattern = `${beforeContext}${termPattern}${afterContext}`;
    return new RegExp(pattern, 'gi');
  }

  // Extract phrase with context around flagged word
  extractPhraseWithContext(text, term, contextWords = 12) {
    const regex = this.buildContextRegex(term, contextWords);
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      const beforeContext = match[1] || '';
      const flaggedTerm = match[2];
      const afterContext = match[3] || '';

      const fullPhrase = (beforeContext + flaggedTerm + afterContext).trim();
      const startIndex = match.index + (match[1] ? 0 : match[0].indexOf(flaggedTerm));

      matches.push({
        phrase: fullPhrase,
        flaggedTerm: flaggedTerm,
        startIndex: startIndex,
        endIndex: startIndex + fullPhrase.length,
        beforeContext: beforeContext.trim(),
        afterContext: afterContext.trim()
      });
    }

    return matches;
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

  // Check if content contains unmasked text that should be skipped
  isContentUnmasked(phrases) {
    return phrases.some(phraseData => {
      return this.unmaskedContent.has(phraseData.phrase) ||
             this.unmaskedContent.has(phraseData.flaggedTerm);
    });
  }

  // Apply flag style to the entire phrase based on settings
  applyFlagStyle(phraseData, flaggedTerm) {
    const { phrase } = phraseData;
    const flagStyle = this.settings.flagStyle;

    // Create enhanced actions menu without View button
    const actionsMenu = `
      <span class="murai-actions-menu" style="display:none; position:absolute; left:100%; top:50%; transform:translateY(-50%); margin-left:12px; background:linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 16px rgba(0,0,0,0.12); z-index:10000; padding:6px 8px; white-space:nowrap; backdrop-filter:blur(8px);">
        <button class="murai-unmask-btn" style="font-size:11px; margin-right:8px; padding:4px 8px; background:linear-gradient(135deg, #29CC99 0%, #10b981 100%); color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:500; transition:all 0.2s ease;">👁️ Unmask</button>
        <button class="murai-report-btn" style="font-size:11px; padding:4px 8px; background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:500; transition:all 0.2s ease;">🚨 Report</button>
      </span>`;

    let flaggedPhrase;

    switch (flagStyle) {
      case 'asterisk':
        // Replace entire phrase with asterisks
        flaggedPhrase = '*'.repeat(phrase.length);
        break;

      case 'blur':
        // Apply blur effect to entire phrase
        flaggedPhrase = `<span style="filter: blur(3px); user-select: none;">${phrase}</span>`;
        break;

      case 'underline':
        // Underline entire phrase
        flaggedPhrase = `<span style="text-decoration: underline wavy red; text-decoration-thickness: 2px;">${phrase}</span>`;
        break;

      case 'highlight':
        // Highlight entire phrase
        flaggedPhrase = `<span style="background-color: ${this.settings.highlightColor}; padding: 2px 4px; border-radius: 3px;">${phrase}</span>`;
        break;

      case 'none':
        // Just add the actions menu without visual changes
        flaggedPhrase = phrase;
        break;

      default:
        // Default to asterisk
        flaggedPhrase = '*'.repeat(phrase.length);
    }

    // Wrap in container with actions menu and data attributes
    return `<span class="murai-flagged-phrase" data-original="${phrase}" data-flagged-term="${flaggedTerm}" style="position:relative; cursor: pointer;">${flaggedPhrase}${actionsMenu}</span>`;
  }

  // Automatically log detected terms to server
  async logDetectedTerms(foundTerms) {
    if (!foundTerms || foundTerms.length === 0) return;

    try {
      // Get authentication data
      const authData = await this.getAuthData();
      if (!authData || !authData.token) {
        console.log('MURAi: No auth token, skipping detection logging');
        return;
      }

      // Get page context
      const pageText = document.body.innerText || document.body.textContent || '';
      const url = window.location.href;
      const domain = window.location.hostname;

      // Determine site type based on domain
      const siteType = this.determineSiteType(domain);

      // Log each detected term
      for (const term of foundTerms) {
        // Extract context around the term (up to 200 characters)
        const termIndex = pageText.toLowerCase().indexOf(term.toLowerCase());
        let context = '';

        if (termIndex !== -1) {
          const start = Math.max(0, termIndex - 100);
          const end = Math.min(pageText.length, termIndex + term.length + 100);
          context = pageText.substring(start, end).trim();
        } else {
          context = pageText.substring(0, 200).trim();
        }

        // Determine pattern type and severity
        const patternType = this.determinePatternType(term);
        const severity = this.determineSeverity(term, context);

        // Calculate sentiment score (simple implementation)
        const sentimentScore = this.calculateSentimentScore(term, context);

        // Calculate accuracy (based on confidence in detection)
        const accuracy = this.calculateAccuracy(term, context);

        // Calculate response time (time since page load)
        const responseTime = Date.now() - (window.muraiPageLoadTime || Date.now());

        const detectionData = {
          word: term.toLowerCase().trim(),
          context: context,
          sentimentScore: sentimentScore,
          url: url,
          accuracy: accuracy,
          responseTime: responseTime,
          patternType: patternType,
          language: this.mapLanguageSetting(this.settings.language),
          severity: severity,
          siteType: siteType
        };

        console.log('MURAi: Logging detection to server:', detectionData);

        // Send to server
        const response = await fetch('https://murai-server.onrender.com/api/users/detected-words', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authData.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(detectionData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Detection logged successfully:', result);
        } else {
          const errorText = await response.text();
          console.warn('⚠️ Failed to log detection:', errorText);
        }
      }

    } catch (error) {
      console.error('❌ Error logging detections:', error);
    }
  }

  // Helper method to get authentication data
  async getAuthData() {
    try {
      // Try localStorage first
      const token = localStorage.getItem('murai_auth_token');
      const userData = localStorage.getItem('murai_user_data');

      if (token && userData) {
        return {
          token,
          user: JSON.parse(userData)
        };
      }

      // Fallback to Chrome storage
      if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
        return new Promise((resolve) => {
          window.chrome.storage.local.get(['murai_auth_token', 'murai_user_data'], (result) => {
            if (result.murai_auth_token && result.murai_user_data) {
              resolve({
                token: result.murai_auth_token,
                user: result.murai_user_data
              });
            } else {
              resolve(null);
            }
          });
        });
      }

      return null;
    } catch (error) {
      console.error('Error getting auth data:', error);
      return null;
    }
  }

  // Helper to determine site type
  determineSiteType(domain) {
    const socialMedia = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'tiktok.com', 'youtube.com'];
    const forums = ['reddit.com', 'stackoverflow.com', 'quora.com'];
    const news = ['cnn.com', 'bbc.com', 'reuters.com', 'news.google.com'];

    if (socialMedia.some(site => domain.includes(site))) return 'Social Media';
    if (forums.some(site => domain.includes(site))) return 'Forum';
    if (news.some(site => domain.includes(site))) return 'News';
    return 'Website';
  }

  // Helper to determine pattern type
  determinePatternType(term) {
    // Simple categorization - can be enhanced with ML later
    const profanityWords = ['damn', 'hell', 'crap', 'shit', 'fuck'];
    const hateSpeechWords = ['hate', 'racist', 'nazi'];
    const harassmentWords = ['stupid', 'idiot', 'loser'];

    const lowerTerm = term.toLowerCase();

    if (profanityWords.some(word => lowerTerm.includes(word))) return 'Profanity';
    if (hateSpeechWords.some(word => lowerTerm.includes(word))) return 'Hate Speech';
    if (harassmentWords.some(word => lowerTerm.includes(word))) return 'Harassment';

    return 'Inappropriate Content';
  }

  // Helper to determine severity
  determineSeverity(term, context) {
    const highSeverityWords = ['kill', 'die', 'hate', 'nazi', 'murder', 'suicide', 'terrorist'];
    const lowSeverityWords = ['damn', 'crap', 'darn', 'heck'];

    const lowerTerm = term.toLowerCase();
    const lowerContext = context.toLowerCase();

    if (highSeverityWords.some(word => lowerTerm.includes(word) || lowerContext.includes(word))) {
      return 'high';
    }
    if (lowSeverityWords.some(word => lowerTerm.includes(word))) {
      return 'low';
    }

    return 'medium';
  }

  // Helper to calculate sentiment score (-1 to 1, where -1 is very negative)
  calculateSentimentScore(term, context) {
    const veryNegativeWords = ['hate', 'kill', 'die', 'murder', 'terrorist', 'nazi'];
    const negativeWords = ['bad', 'stupid', 'idiot', 'ugly', 'loser', 'shit', 'fuck'];
    const mildlyNegativeWords = ['damn', 'crap', 'annoying', 'boring'];

    const lowerTerm = term.toLowerCase();
    const lowerContext = context.toLowerCase();
    const combinedText = lowerTerm + ' ' + lowerContext;

    // Count negative indicators
    const veryNegativeCount = veryNegativeWords.filter(word => combinedText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => combinedText.includes(word)).length;
    const mildlyNegativeCount = mildlyNegativeWords.filter(word => combinedText.includes(word)).length;

    // Calculate score (more negative = lower score)
    let score = 0;
    score -= veryNegativeCount * 0.8; // Very negative: -0.8 each
    score -= negativeCount * 0.5;     // Negative: -0.5 each
    score -= mildlyNegativeCount * 0.2; // Mildly negative: -0.2 each

    // Clamp between -1 and 1
    return Math.max(-1, Math.min(1, score));
  }

  // Helper to calculate detection accuracy (0 to 1)
  calculateAccuracy(term, context) {
    // Base accuracy starts at 0.7
    let accuracy = 0.7;

    // Higher accuracy for exact matches in our word lists
    const knownBadWords = ['shit', 'fuck', 'damn', 'hate', 'kill', 'nazi', 'terrorist'];
    const lowerTerm = term.toLowerCase();

    if (knownBadWords.includes(lowerTerm)) {
      accuracy += 0.2; // High confidence for known bad words
    }

    // Higher accuracy if context supports the detection
    const contextIndicators = ['angry', 'mad', 'furious', 'disgusting', 'horrible'];
    const lowerContext = context.toLowerCase();

    if (contextIndicators.some(indicator => lowerContext.includes(indicator))) {
      accuracy += 0.1; // Context supports negative sentiment
    }

    // Lower accuracy for very short terms (might be false positives)
    if (term.length <= 3) {
      accuracy -= 0.1;
    }

    // Higher accuracy for longer, more specific terms
    if (term.length >= 8) {
      accuracy += 0.1;
    }

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, accuracy));
  }

  // Helper to map language settings to database format
  mapLanguageSetting(language) {
    const languageMap = {
      'English': 'English',
      'Tagalog': 'Tagalog',
      'Mixed': 'Mixed',
      'Both': 'Mixed' // Map 'Both' to 'Mixed' for consistency
    };

    return languageMap[language] || 'English'; // Default to English
  }

  processElement(element, terms) {
    // Skip if already processed or contains highlights
    if (this.processedElements.has(element) || element.classList.contains('murai-highlight')) {
      return;
    }
    if (element.closest('.murai-highlight')) {
      return;
    }
    // Skip if this element has been manually unmasked
    if (this.unmaskedElements.has(element)) {
      console.log('MURAi: Skipping element in unmasked set:', element);
      return;
    }
    // Skip if this element contains unmasked content
    if (element.querySelector('.murai-unmasked-word')) {
      console.log('MURAi: Skipping element with unmasked words:', element);
      return;
    }
    // Skip if this element has been marked as user-unmasked
    if (element.classList.contains('murai-user-unmasked') || element.getAttribute('data-murai-unmasked') === 'true') {
      console.log('MURAi: Skipping unmasked element:', element);
      return;
    }
    // Skip if any parent element is marked as unmasked
    if (element.closest('[data-murai-unmasked="true"]') || element.closest('.murai-user-unmasked')) {
      console.log('MURAi: Skipping element with unmasked parent:', element);
      return;
    }
    const elementSize = element.offsetWidth * element.offsetHeight;
    if (elementSize > 50000) {
      return;
    }
    if (element.children.length > 5) {
      return;
    }
    const text = element.textContent || element.innerText || '';
    if (text.length > 500) {
      return;
    }
    if (text.trim().length < 3) {
      return;
    }
    const hasInappropriateContent = terms.some(term => {
      const regex = this.buildTermRegex(term);
      return regex.test(text);
    });
    if (!hasInappropriateContent) {
      return;
    }

    // Extract phrases with context for each flagged term
    let newContent = text;
    const processedRanges = []; // Track processed ranges to avoid overlaps

    terms.forEach(term => {
      const phrases = this.extractPhraseWithContext(text, term, 12);

      // Skip if any of these phrases have been manually unmasked
      if (this.isContentUnmasked(phrases)) {
        return;
      }

      phrases.forEach(phraseData => {
        // Check if this specific phrase has been unmasked
        if (this.unmaskedContent.has(phraseData.phrase) || this.unmaskedContent.has(phraseData.flaggedTerm)) {
          console.log('MURAi: Skipping unmasked phrase:', phraseData.phrase);
          return;
        }

        // Check if this range overlaps with already processed ranges
        const overlaps = processedRanges.some(range =>
          (phraseData.startIndex < range.end && phraseData.endIndex > range.start)
        );

        if (!overlaps) {
          const flaggedPhrase = this.applyFlagStyle(phraseData, term);

          // Use a more precise replacement to avoid replacing similar text
          const phraseRegex = new RegExp(this.escapeRegex(phraseData.phrase), 'g');
          newContent = newContent.replace(phraseRegex, flaggedPhrase);

          // Track this range as processed
          processedRanges.push({
            start: phraseData.startIndex,
            end: phraseData.endIndex
          });
        }
      });
    });
    // Only update if content changed
    if (newContent !== text) {
      element.innerHTML = newContent;

      // Apply highlighting only if showHighlight is enabled
      if (this.settings.showHighlight) {
        element.style.setProperty('background-color', this.settings.highlightColor, 'important');
        element.style.setProperty('padding', '4px', 'important');
        element.style.setProperty('border-radius', '3px', 'important');
      }

      element.classList.add('murai-highlight');
      this.processedElements.add(element);

      if (!window.muraiHoverInjected) {
        this.injectHoverUnmaskScript();
        window.muraiHoverInjected = true;
      }
    }
  }

  injectHoverUnmaskScript() {
    // CSS for actions menu and modern tooltip
    const style = document.createElement('style');
    style.innerHTML = `
      .murai-masked-word { position: relative; cursor: pointer; }
      .murai-flagged-phrase { position: relative; cursor: pointer; }
      .murai-highlight:hover .murai-masked-word .murai-actions-menu { display: inline-block !important; }
      .murai-highlight:hover .murai-flagged-phrase .murai-actions-menu { display: inline-block !important; }
      .murai-actions-menu {
        animation: murai-menu-fadein 0.2s ease-out;
        transition: opacity 0.3s ease-out;
      }
      .murai-actions-menu.murai-menu-visible {
        display: inline-block !important;
        opacity: 1;
      }
      .murai-actions-menu.murai-menu-hiding {
        opacity: 0;
        pointer-events: none;
      }
      .murai-actions-menu button {
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .murai-actions-menu button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }
      .murai-unmask-btn:hover {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
      }
      .murai-report-btn:hover {
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%) !important;
      }
      @keyframes murai-menu-fadein {
        from { opacity: 0; transform: translateY(-50%) scale(0.9); }
        to { opacity: 1; transform: translateY(-50%) scale(1); }
      }
      /* Add styles for unmasked words */
      .murai-unmasked-word { position: relative; }
      .murai-unmasked-word .murai-mask-btn { 
        display: none;
        background: #444;
        color: #fff;
        border: none;
        border-radius: 4px;
        padding: 2px 10px;
        cursor: pointer;
        font-size: 12px;
        margin-left: 8px;
        transition: background 0.2s;
      }
      /* Show mask button on hover */
      .murai-unmasked-word:hover .murai-mask-btn { 
        display: inline-block !important; 
      }
      .murai-unmasked-word .murai-mask-btn:hover {
        background: #222;
      }
      .murai-modern-tooltip {
        position: absolute;
        left: 50%;
        top: -38px;
        transform: translateX(-50%);
        background: #18181b;
        color: #fff;
        padding: 10px 18px;
        border-radius: 8px;
        font-size: 15px;
        white-space: nowrap;
        z-index: 10001;
        pointer-events: none;
        opacity: 0.97;
        box-shadow: 0 6px 32px rgba(0,0,0,0.13);
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'Segoe UI', 'Arial', sans-serif;
        font-weight: 500;
        animation: murai-fadein 0.18s;
        border: 1px solid #232323;
      }
      .murai-modern-tooltip-arrow {
        position: absolute;
        left: 50%;
        top: 100%;
        transform: translateX(-50%);
        width: 18px;
        height: 8px;
        overflow: visible;
        pointer-events: none;
      }
      .murai-modern-tooltip-arrow svg {
        display: block;
      }
      @keyframes murai-fadein {
        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
        to { opacity: 0.97; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
    // Add enhanced CSS for Mask button hover on phrase
    style.innerHTML += `
      .murai-mask-btn {
        display: none;
        animation: murai-button-fadein 0.2s ease-out;
      }
      .murai-highlight:hover .murai-unmasked-word .murai-mask-btn {
        display: inline-block !important;
      }
      .murai-mask-btn:hover {
        background: linear-gradient(135deg, #374151 0%, #1f2937 100%) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
      }
      @keyframes murai-button-fadein {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    // Add menu delay functionality
    let menuHideTimeout;

    // Show menu on hover with delay before hiding
    document.body.addEventListener('mouseenter', function(e) {
      if (e.target.closest('.murai-highlight')) {
        const menu = e.target.closest('.murai-highlight').querySelector('.murai-actions-menu');
        if (menu) {
          clearTimeout(menuHideTimeout);
          menu.classList.add('murai-menu-visible');
          menu.classList.remove('murai-menu-hiding');
        }
      }
    }, true);

    // Hide menu with delay on mouse leave
    document.body.addEventListener('mouseleave', function(e) {
      if (e.target.closest('.murai-highlight')) {
        const menu = e.target.closest('.murai-highlight').querySelector('.murai-actions-menu');
        if (menu) {
          clearTimeout(menuHideTimeout);
          menuHideTimeout = setTimeout(() => {
            menu.classList.add('murai-menu-hiding');
            menu.classList.remove('murai-menu-visible');
            setTimeout(() => {
              if (menu.classList.contains('murai-menu-hiding')) {
                menu.style.display = 'none';
              }
            }, 300); // Match CSS transition duration
          }, 800); // 800ms delay before hiding
        }
      }
    }, true);

    // Keep menu visible when hovering over the menu itself
    document.body.addEventListener('mouseenter', function(e) {
      if (e.target.closest('.murai-actions-menu')) {
        clearTimeout(menuHideTimeout);
        const menu = e.target.closest('.murai-actions-menu');
        menu.classList.add('murai-menu-visible');
        menu.classList.remove('murai-menu-hiding');
      }
    }, true);

    // Event delegation for actions
    document.body.addEventListener('click', function(e) {
      // Unmask
      if (e.target.classList.contains('murai-unmask-btn')) {
        const span = e.target.closest('.murai-masked-word') || e.target.closest('.murai-flagged-phrase');
        if (!span) return;
        const isMasked = !span.classList.contains('murai-unmasked');
        if (isMasked) {
          // Confirmation modal logic
          const doUnmask = () => {
            // Get the parent element to track
            const parent = span.closest('.murai-highlight');
            const original = span.getAttribute('data-original');

            // Track this content as manually unmasked
            if (window.muraiContentScript) {
              console.log('MURAi: Adding to unmasked tracking:', original);
              window.muraiContentScript.unmaskedContent.add(original);
              window.muraiContentScript.lastUnmaskTime = Date.now(); // Set timestamp

              if (parent) {
                window.muraiContentScript.unmaskedElements.add(parent);
                // Also add a data attribute for more reliable tracking
                parent.setAttribute('data-murai-unmasked', 'true');
              }

              // Temporarily disable detection to prevent immediate re-masking
              window.muraiContentScript.isProcessing = true;
              setTimeout(() => {
                if (window.muraiContentScript) {
                  window.muraiContentScript.isProcessing = false;
                }
              }, 3000); // 3 second delay
            }

            // Remove highlight from parent phrase
            if (parent) {
              parent.classList.remove('murai-highlight');
              parent.style.removeProperty('background-color');
              parent.style.removeProperty('padding');
              parent.style.removeProperty('border-radius');
              // Add a marker class to prevent re-processing
              parent.classList.add('murai-user-unmasked');
            }

            // Replace span with plain text and Mask button
            const wrapper = document.createElement('span');
            wrapper.className = 'murai-unmasked-word';
            wrapper.textContent = original;
            wrapper.setAttribute('data-original', original);

            // Add enhanced Mask button
            const maskBtn = document.createElement('button');
            maskBtn.innerHTML = '🔒 Mask';
            maskBtn.className = 'murai-mask-btn';
            maskBtn.style.cssText = `
              font-size: 11px;
              padding: 4px 8px;
              background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
              color: #fff;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              margin-left: 8px;
              transition: all 0.2s ease;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            `;
            
            // Attach click handler for re-masking
            maskBtn.onclick = function(ev) {
              ev.stopPropagation();
              const original = wrapper.getAttribute('data-original');

              // Remove from unmasked tracking
              if (window.muraiContentScript) {
                console.log('MURAi: Removing from unmasked tracking:', original);
                window.muraiContentScript.unmaskedContent.delete(original);
                const highlightParent = wrapper.parentElement;
                if (highlightParent) {
                  window.muraiContentScript.unmaskedElements.delete(highlightParent);
                  highlightParent.classList.remove('murai-user-unmasked');
                  highlightParent.removeAttribute('data-murai-unmasked');
                }
              }
              // Apply current flag style instead of default asterisk
              const currentSettings = window.muraiContentScript?.settings || {};
              const flagStyle = currentSettings.flagStyle || 'asterisk';
              let maskedContent;

              switch (flagStyle) {
                case 'asterisk':
                  maskedContent = '*'.repeat(original.length);
                  break;
                case 'blur':
                  maskedContent = `<span style="filter: blur(3px); user-select: none;">${original}</span>`;
                  break;
                case 'underline':
                  maskedContent = `<span style="text-decoration: underline wavy red; text-decoration-thickness: 2px;">${original}</span>`;
                  break;
                case 'highlight':
                  maskedContent = `<span style="background-color: ${currentSettings.highlightColor || '#29CC99'}; padding: 2px 4px; border-radius: 3px;">${original}</span>`;
                  break;
                case 'none':
                  maskedContent = original;
                  break;
                default:
                  maskedContent = '*'.repeat(original.length);
              }

              const actionsMenu = `
                <span class="murai-actions-menu" style="display:none; position:absolute; left:100%; top:50%; transform:translateY(-50%); margin-left:12px; background:linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 16px rgba(0,0,0,0.12); z-index:10000; padding:6px 8px; white-space:nowrap; backdrop-filter:blur(8px);">
                  <button class="murai-unmask-btn" style="font-size:11px; margin-right:8px; padding:4px 8px; background:linear-gradient(135deg, #29CC99 0%, #10b981 100%); color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:500; transition:all 0.2s ease;">👁️ Unmask</button>
                  <button class="murai-report-btn" style="font-size:11px; padding:4px 8px; background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:500; transition:all 0.2s ease;">🚨 Report</button>
                </span>`;

              const maskedSpan = document.createElement('span');
              maskedSpan.className = flagStyle === 'asterisk' ? 'murai-masked-word' : 'murai-flagged-phrase';
              maskedSpan.setAttribute('data-original', original);
              maskedSpan.style.position = 'relative';
              maskedSpan.innerHTML = maskedContent + actionsMenu;
              
              // Restore highlight to parent with current settings
              const highlightParent = wrapper.parentElement;
              if (highlightParent && currentSettings.showHighlight) {
                highlightParent.classList.add('murai-highlight');
                highlightParent.style.backgroundColor = currentSettings.highlightColor || '#29CC99';
                highlightParent.style.padding = '4px';
                highlightParent.style.borderRadius = '3px';
              }
              
              wrapper.replaceWith(maskedSpan);
            };
            
            wrapper.appendChild(maskBtn);
            span.replaceWith(wrapper);
          };
          if (!localStorage.getItem('muraiDontShowUnmaskConfirm')) {
            injectMuraiModal(doUnmask);
          } else {
            doUnmask();
          }
        }
        e.stopPropagation();
      }
      // Mask (delegated)
      if (e.target.classList.contains('murai-mask-btn')) {
        const wrapper = e.target.closest('.murai-unmasked-word');
        if (!wrapper) return;
        const original = wrapper.textContent.replace('Mask', '').trim();
        const masked = '*'.repeat(original.length);
        const actionsMenu = `
          <span class="murai-actions-menu" style="display:none; position:absolute; left:100%; top:50%; transform:translateY(-50%); margin-left:8px; background:#fff; border:1px solid #ccc; border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,0.15); z-index:10000; padding:2px 4px; white-space:nowrap;">
            <button class="murai-unmask-btn" style="font-size:10px; margin-right:4px;">Unmask</button>
            <button class="murai-view-btn" style="font-size:10px; margin-right:4px;">View</button>
            <button class="murai-report-btn" style="font-size:10px;">Report</button>
          </span>`;
        const maskedSpan = document.createElement('span');
        maskedSpan.className = 'murai-masked-word';
        maskedSpan.setAttribute('data-original', original);
        maskedSpan.style.position = 'relative';
        maskedSpan.innerHTML = masked + actionsMenu;
        // Restore highlight to parent
        const highlightParent = wrapper.parentElement;
        if (highlightParent) {
          highlightParent.classList.add('murai-highlight');
          highlightParent.style.backgroundColor = '#ffeb3b';
          highlightParent.style.padding = '4px';
          highlightParent.style.borderRadius = '3px';
        }
        wrapper.replaceWith(maskedSpan);
        e.stopPropagation();
      }
      // Report - Enhanced with better context handling
      if (e.target.classList.contains('murai-report-btn')) {
        const element = e.target.closest('.murai-masked-word') || e.target.closest('.murai-flagged-phrase');
        const word = element?.getAttribute('data-original') || '';
        const flaggedTerm = element?.getAttribute('data-flagged-term') || word;

        // Enhanced report with more context information
        console.log('MURAi: Reporting content with enhanced context:', {
          originalPhrase: word,
          flaggedTerm: flaggedTerm,
          contextLength: word.split(' ').length
        });

        injectMuraiReportModal(word, flaggedTerm);
        e.stopPropagation();
      }
    });
    // Modern tooltip logic for highlighted phrase
    document.body.addEventListener('mouseenter', function(e) {
      if (e.target.classList.contains('murai-highlight')) {
        // Prevent duplicate tooltips
        if (e.target.querySelector('.murai-modern-tooltip')) return;
        // Tooltip container
        const tooltip = document.createElement('div');
        tooltip.className = 'murai-modern-tooltip';
        tooltip.innerHTML = `
          <span>Sensitive content detected. Actions available.</span>
          <span class="murai-modern-tooltip-arrow">
            <svg width="18" height="8"><polygon points="0,0 9,8 18,0" style="fill:#18181b;" /></svg>
          </span>
        `;
        // Position tooltip absolutely relative to the .murai-highlight
        e.target.style.position = 'relative';
        e.target.appendChild(tooltip);
      }
    }, true);
    document.body.addEventListener('mouseleave', function(e) {
      if (e.target.classList.contains('murai-highlight')) {
        const tooltip = e.target.querySelector('.murai-modern-tooltip');
        if (tooltip) tooltip.remove();
      }
    }, true);
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

// Enhanced Modal HTML injection helper
function injectMuraiModal(onConfirm) {
  if (document.getElementById('murai-confirm-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'murai-confirm-modal';
  modal.innerHTML = `
    <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:100000;display:flex;align-items:center;justify-content:center;animation:murai-overlay-fadein 0.3s ease-out;">
      <div style="background:linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);border:1px solid #e2e8f0;padding:32px 28px;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);min-width:380px;max-width:90vw;animation:murai-modal-slidein 0.3s ease-out;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="display:flex;align-items:center;margin-bottom:16px;">
          <div style="width:48px;height:48px;background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-right:16px;font-size:24px;">👁️</div>
          <div>
            <div style="font-size:20px;font-weight:700;color:#064e3b;margin-bottom:4px;">Unmask sensitive word?</div>
            <div style="font-size:14px;color:#047857;">This action will reveal potentially sensitive content</div>
          </div>
        </div>
        <div style="font-size:15px;margin-bottom:24px;color:#374151;line-height:1.5;background:#f9fafb;padding:16px;border-radius:8px;border-left:4px solid #29CC99;">Are you sure you want to reveal this word? This may expose sensitive content that could be inappropriate.</div>
        <label style="display:flex;align-items:center;font-size:14px;margin-bottom:24px;cursor:pointer;color:#6b7280;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e5e7eb;transition:all 0.2s ease;">
          <input type="checkbox" id="murai-dont-show-again" style="margin-right:12px;accent-color:#29CC99;width:16px;height:16px;" />
          <span style="font-weight:500;">Don't show this confirmation again</span>
        </label>
        <div style="display:flex;gap:12px;justify-content:flex-end;">
          <button id="murai-cancel-btn" style="padding:12px 24px;border-radius:10px;border:1px solid #d1d5db;background:#ffffff;color:#374151;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.05);">Cancel</button>
          <button id="murai-confirm-btn" style="padding:12px 24px;border-radius:10px;border:none;background:linear-gradient(135deg,#29CC99 0%,#10b981 100%);color:#ffffff;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 4px 12px rgba(41,204,153,0.3);">👁️ Unmask</button>
        </div>
      </div>
    </div>
    <style>
      @keyframes murai-overlay-fadein {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes murai-modal-slidein {
        from { opacity: 0; transform: scale(0.9) translateY(-20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      #murai-cancel-btn:hover {
        background: #f3f4f6 !important;
        border-color: #9ca3af !important;
        transform: translateY(-1px);
      }
      #murai-confirm-btn:hover {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(41,204,153,0.4) !important;
      }
    </style>
  `;
  document.body.appendChild(modal);
  document.getElementById('murai-cancel-btn').onclick = () => {
    modal.remove();
  };
  document.getElementById('murai-confirm-btn').onclick = () => {
    const dontShow = document.getElementById('murai-dont-show-again').checked;
    if (dontShow) localStorage.setItem('muraiDontShowUnmaskConfirm', '1');
    modal.remove();
    onConfirm();
  };
}

// Enhanced report modal helper
function injectMuraiReportModal(word, flaggedTerm) {
  if (document.getElementById('murai-report-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'murai-report-modal';
  modal.innerHTML = `
    <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:100000;display:flex;align-items:center;justify-content:center;animation:murai-overlay-fadein 0.3s ease-out;">
      <div style="background:linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);border:1px solid #e2e8f0;padding:32px 28px;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);min-width:420px;max-width:90vw;animation:murai-modal-slidein 0.3s ease-out;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="display:flex;align-items:center;margin-bottom:20px;">
          <div style="width:48px;height:48px;background:linear-gradient(135deg,#fef2f2 0%,#fecaca 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-right:16px;font-size:24px;">🚨</div>
          <div>
            <div style="font-size:20px;font-weight:700;color:#dc2626;margin-bottom:4px;">Report Content</div>
            <div style="font-size:14px;color:#7f1d1d;">Help us improve content detection</div>
          </div>
        </div>

        <div style="background:#fef9f9;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:20px;">
          <div style="font-size:14px;color:#7f1d1d;margin-bottom:8px;font-weight:600;">Flagged Content:</div>
          <div style="font-size:15px;color:#991b1b;background:#ffffff;padding:12px;border-radius:6px;word-break:break-word;border:1px solid #f87171;">${(word || flaggedTerm || 'Content').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>

        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:15px;font-weight:600;color:#374151;margin-bottom:8px;">What's the issue?</label>
          <select id="murai-report-reason" style="width:100%;padding:12px 16px;font-size:15px;border-radius:10px;border:2px solid #e5e7eb;background:#ffffff;color:#374151;transition:border-color 0.2s ease;font-family:inherit;">
            <option value="false-positive">🟢 False positive (not offensive)</option>
            <option value="missed-content">🔴 Missed offensive content</option>
            <option value="context-issue">⚠️ Context misunderstood</option>
            <option value="other">💬 Other issue</option>
          </select>
        </div>

        <div style="margin-bottom:24px;">
          <label style="display:block;font-size:15px;font-weight:600;color:#374151;margin-bottom:8px;">Additional details (optional)</label>
          <textarea id="murai-report-comment" placeholder="Help us understand the issue better..." style="width:100%;min-height:80px;resize:vertical;padding:12px 16px;font-size:15px;border-radius:10px;border:2px solid #e5e7eb;background:#ffffff;color:#374151;font-family:inherit;transition:border-color 0.2s ease;"></textarea>
        </div>

        <div style="display:flex;gap:12px;justify-content:flex-end;">
          <button id="murai-report-cancel-btn" style="padding:12px 24px;border-radius:10px;border:1px solid #d1d5db;background:#ffffff;color:#374151;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.05);">Cancel</button>
          <button id="murai-report-send-btn" style="padding:12px 24px;border-radius:10px;border:none;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:#ffffff;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 4px 12px rgba(239,68,68,0.3);">🚨 Send Report</button>
        </div>
      </div>
    </div>
    <style>
      #murai-report-reason:focus, #murai-report-comment:focus {
        outline: none;
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;
      }
      #murai-report-cancel-btn:hover {
        background: #f3f4f6 !important;
        border-color: #9ca3af !important;
        transform: translateY(-1px);
      }
      #murai-report-send-btn:hover {
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%) !important;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(239,68,68,0.4) !important;
      }
    </style>
  `;
  document.body.appendChild(modal);
  document.getElementById('murai-report-cancel-btn').onclick = () => {
    modal.remove();
  };
  document.getElementById('murai-report-send-btn').onclick = async () => {
    const reason = document.getElementById('murai-report-reason').value;
    const comment = document.getElementById('murai-report-comment').value;

    // Disable button and show loading
    const sendBtn = document.getElementById('murai-report-send-btn');
    const originalText = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid #ffffff;border-radius:50%;border-top-color:transparent;animation:spin 1s linear infinite;margin-right:8px;"></span>Sending...';

    try {
      // Get authentication data
      const authData = await window.muraiContentScript?.getAuthData();
      if (!authData || !authData.token) {
        throw new Error('Please login to submit reports');
      }

      // Map reason to server format
      let reportType = 'false_positive'; // default
      let category = 'general';

      switch (reason) {
        case 'false-positive':
          reportType = 'false_positive';
          category = 'false_positive';
          break;
        case 'missed-content':
          reportType = 'false_negative';
          category = 'missed_content';
          break;
        case 'context-issue':
          reportType = 'false_positive';
          category = 'context_issue';
          break;
        case 'other':
          reportType = 'false_positive';
          category = 'other';
          break;
      }

      const reportData = {
        type: reportType,
        description: comment || `User reported: ${reason}`,
        category: category,
        reportedText: word || flaggedTerm || 'Content from extension'
      };

      console.log('MURAi: Submitting report:', reportData);

      // Send to server
      const response = await fetch('https://murai-server.onrender.com/api/users/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Report submitted successfully:', result);

        // Show enhanced success message with server response data
        const reportNumber = result.meta?.reportNumber || 'N/A';
        const estimatedTime = result.meta?.estimatedReviewTime || '24-48 hours';

        const box = modal.querySelector('div > div');
        box.innerHTML = `
          <div style="display:flex;align-items:center;margin-bottom:20px;">
            <div style="width:48px;height:48px;background:linear-gradient(135deg,#dcfce7 0%,#bbf7d0 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-right:16px;font-size:24px;">✅</div>
            <div>
              <div style="font-size:20px;font-weight:700;color:#16a34a;margin-bottom:4px;">Report Sent Successfully!</div>
              <div style="font-size:14px;color:#15803d;">Report #${reportNumber}</div>
            </div>
          </div>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;">
            <div style="font-size:14px;color:#15803d;margin-bottom:8px;font-weight:600;">What happens next?</div>
            <div style="font-size:13px;color:#166534;line-height:1.4;">
              • Your report will be reviewed by our moderation team<br>
              • Estimated review time: <strong>${estimatedTime}</strong><br>
              • You'll be notified of any updates via the extension
            </div>
          </div>

          <div style="font-size:15px;margin-bottom:24px;color:#374151;text-align:center;">Thank you for helping improve our content detection system!</div>
          <button id="murai-report-close-btn" style="padding:12px 24px;border-radius:10px;border:none;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);color:#ffffff;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 4px 12px rgba(34,197,94,0.3);">Close</button>
        `;
        document.getElementById('murai-report-close-btn').onclick = () => {
          modal.remove();
        };
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to submit report: ${errorText}`);
      }

    } catch (error) {
      console.error('❌ Error submitting report:', error);

      // Show error message
      sendBtn.innerHTML = '❌ Failed to Send';
      sendBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

      // Reset button after 3 seconds
      setTimeout(() => {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalText;
        sendBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      }, 3000);

      alert(`Failed to submit report: ${error.message}`);
    }
  };
}

// --- Custom context menu for reporting selected text ---
document.addEventListener('contextmenu', function(e) {
  // Only show if there is a text selection and not inside a murai highlight
  const selection = window.getSelection();
  const selectedText = selection && selection.toString().trim();
  if (selectedText && !e.target.closest('.murai-highlight')) {
    // Remove any existing custom menu
    const oldMenu = document.getElementById('murai-context-menu');
    if (oldMenu) oldMenu.remove();
    // Create custom menu
    const menu = document.createElement('div');
    menu.id = 'murai-context-menu';
    menu.textContent = 'Report inappropriate text';
    menu.style.position = 'fixed';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.style.background = '#fff';
    menu.style.border = '1px solid #e5e7eb';
    menu.style.borderRadius = '8px';
    menu.style.boxShadow = '0 4px 24px rgba(0,0,0,0.13)';
    menu.style.padding = '10px 18px';
    menu.style.fontSize = '15px';
    menu.style.color = '#18181b';
    menu.style.cursor = 'pointer';
    menu.style.zIndex = 100001;
    menu.onmousedown = (ev) => { ev.preventDefault(); };
    menu.onclick = (ev) => {
      ev.preventDefault();
      menu.remove();
      injectMuraiReportModalForText(selectedText);
    };
    document.body.appendChild(menu);
    // Remove menu on click elsewhere or scroll
    setTimeout(() => {
      document.addEventListener('mousedown', removeMenu, { once: true });
      document.addEventListener('scroll', removeMenu, { once: true });
    }, 0);
    function removeMenu() {
      if (menu) menu.remove();
    }
  }
}, true);

function injectMuraiReportModalForText(text) {
  if (document.getElementById('murai-report-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'murai-report-modal';
  modal.innerHTML = `
    <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(30,30,30,0.45);z-index:100000;display:flex;align-items:center;justify-content:center;">
      <div style="background:#fff;border:1px solid #e5e7eb;padding:28px 22px;border-radius:12px;box-shadow:0 6px 32px rgba(0,0,0,0.13);min-width:340px;max-width:95vw;">
        <div style="font-size:18px;font-weight:600;margin-bottom:10px;color:#18181b;">Report selected text</div>
        <div style="font-size:15px;margin-bottom:10px;color:#52525b;">Selected:</div>
        <div style="font-size:15px;margin-bottom:16px;color:#18181b;background:#f4f4f5;border-radius:6px;padding:8px 10px;word-break:break-word;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <div style="font-size:15px;margin-bottom:16px;color:#52525b;">What is this report about?</div>
        <select id="murai-report-reason" style="width:100%;padding:8px 6px;margin-bottom:12px;font-size:15px;border-radius:6px;border:1px solid #e5e7eb;background:#f4f4f5;color:#18181b;">
          <option value="false-positive">False positive (not offensive)</option>
          <option value="offensive">Offensive content</option>
          <option value="other">Other</option>
        </select>
        <textarea id="murai-report-comment" placeholder="Add a comment (optional)" style="width:100%;min-height:60px;resize:vertical;padding:8px 6px;font-size:15px;border-radius:6px;border:1px solid #e5e7eb;background:#f4f4f5;color:#18181b;margin-bottom:16px;"></textarea>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button id="murai-report-cancel-btn" style="padding:6px 18px;border-radius:6px;border:1px solid #e5e7eb;background:#f4f4f5;color:#18181b;font-size:15px;cursor:pointer;transition:background 0.15s;">Cancel</button>
          <button id="murai-report-send-btn" style="padding:6px 18px;border-radius:6px;border:1px solid #18181b;background:#18181b;color:#fff;font-size:15px;cursor:pointer;transition:background 0.15s;">Send</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('murai-report-cancel-btn').onclick = () => {
    modal.remove();
  };
  document.getElementById('murai-report-send-btn').onclick = () => {
    // Show success message in a modal overlay
    const box = modal.querySelector('div > div');
    box.innerHTML = `
      <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(30,30,30,0.45);z-index:100000;display:flex;align-items:center;justify-content:center;">
        <div style="background:#fff;border:1px solid #e5e7eb;padding:28px 22px;border-radius:12px;box-shadow:0 6px 32px rgba(0,0,0,0.13);min-width:320px;max-width:90vw;display:flex;flex-direction:column;align-items:center;">
          <div style="font-size:18px;font-weight:600;margin-bottom:10px;color:#18181b;">Report sent</div>
          <div style="font-size:15px;margin-bottom:16px;color:#52525b;">Thank you for your feedback!</div>
          <button id="murai-report-close-btn" style="padding:6px 18px;border-radius:6px;border:1px solid #18181b;background:#18181b;color:#fff;font-size:15px;cursor:pointer;transition:background 0.15s;">Close</button>
        </div>
      </div>
    `;
    document.getElementById('murai-report-close-btn').onclick = () => {
      modal.remove();
    };
  };
}

// --- Floating report button for selected text ---
document.addEventListener('mouseup', function(e) {
  setTimeout(() => { // Wait for selection to update
    const selection = window.getSelection();
    const selectedText = selection && selection.toString().trim();
    // Only show if there is a text selection and not inside a murai highlight
    if (selectedText && !e.target.closest('.murai-highlight')) {
      // Remove any existing report button
      const oldBtn = document.getElementById('murai-report-btn-floating');
      if (oldBtn) oldBtn.remove();
      // Get selection position
      let rect;
      try {
        rect = selection.getRangeAt(0).getBoundingClientRect();
      } catch { rect = null; }
      if (!rect || (rect.left === 0 && rect.top === 0)) return;
      // Create floating button
      const btn = document.createElement('button');
      btn.id = 'murai-report-btn-floating';
      btn.textContent = 'Report';
      btn.style.position = 'fixed';
      btn.style.left = (rect.right + 8) + 'px';
      btn.style.top = (rect.top - 8) + 'px';
      btn.style.background = '#fff';
      btn.style.border = '1px solid #e5e7eb';
      btn.style.borderRadius = '8px';
      btn.style.boxShadow = '0 4px 24px rgba(0,0,0,0.13)';
      btn.style.padding = '6px 16px';
      btn.style.fontSize = '15px';
      btn.style.color = '#18181b';
      btn.style.cursor = 'pointer';
      btn.style.zIndex = 100001;
      btn.style.transition = 'background 0.15s';
      btn.style.pointerEvents = 'all';
      btn.onmousedown = (ev) => { ev.preventDefault(); };
      btn.onclick = (ev) => {
        ev.preventDefault();
        btn.remove();
        injectMuraiReportModalForText(selectedText);
        window.getSelection().removeAllRanges();
      };
      document.body.appendChild(btn);
      // Remove button on click elsewhere, scroll, or selection change
      setTimeout(() => {
        document.addEventListener('mousedown', function handler(ev) {
          if (ev.target !== btn) removeBtn();
        }, { once: true });
        document.addEventListener('scroll', removeBtn, { once: true });
        document.addEventListener('selectionchange', removeBtn, { once: true });
      }, 0);
      function removeBtn() {
        if (btn) btn.remove();
      }
    } else {
      // Remove any existing report button if selection is empty
      const oldBtn = document.getElementById('murai-report-btn-floating');
      if (oldBtn) oldBtn.remove();
    }
  }, 0);
}, true);

// Initialize content script
const contentScript = new ContentScript();
contentScript.init();
