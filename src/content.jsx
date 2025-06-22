console.log("=== MURAi content script injected ===");

// Simple detection function
function detectAndHighlight() {
  console.log("MURAi: Starting detection...");
  
  // Get all text content from the page
  const pageText = document.body.innerText || document.body.textContent || '';
  console.log("MURAi: Page text length:", pageText.length);
  console.log("MURAi: First 300 chars:", pageText.substring(0, 300));
  
  // Test terms
  const testTerms = ['gago', 'haop', 'putangina'];
  let foundTerms = [];
  
  // Check if terms exist in page text
  testTerms.forEach(term => {
    if (pageText.toLowerCase().includes(term.toLowerCase())) {
      foundTerms.push(term);
      console.log(`MURAi: Found "${term}" in page text`);
    } else {
      console.log(`MURAi: "${term}" NOT found in page text`);
    }
  });
  
  if (foundTerms.length === 0) {
    console.log("MURAi: No test terms found on page");
    return;
  }
  
  console.log("MURAi: Found terms:", foundTerms);
  
  // Simple highlighting approach - find all elements with text
  const allElements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li, td, th');
  console.log("MURAi: Found", allElements.length, "elements to check");
  
  foundTerms.forEach(term => {
    let highlightedCount = 0;
    
    allElements.forEach(element => {
      const originalText = element.innerHTML;
      const regex = new RegExp(`(${term})`, 'gi');
      
      if (regex.test(originalText)) {
        const highlightedText = originalText.replace(
          regex,
          '<span style="background-color: yellow !important; color: red !important; font-weight: bold !important; padding: 2px 4px !important; border-radius: 3px !important;">$1</span>'
        );
        
        if (highlightedText !== originalText) {
          element.innerHTML = highlightedText;
          highlightedCount++;
          console.log(`MURAi: Highlighted "${term}" in element:`, element.tagName);
        }
      }
    });
    
    console.log(`MURAi: Highlighted "${term}" in ${highlightedCount} elements`);
  });
  
  console.log("MURAi: Detection and highlighting complete");
}

// Run detection immediately
console.log("MURAi: Running immediate detection...");
detectAndHighlight();

// Also run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log("MURAi: DOM loaded, running detection...");
    detectAndHighlight();
  });
}

// Run after page is fully loaded
window.addEventListener('load', () => {
  console.log("MURAi: Page fully loaded, running detection...");
  detectAndHighlight();
});

// Run after a delay to catch any dynamic content
setTimeout(() => {
  console.log("MURAi: Running delayed detection...");
  detectAndHighlight();
}, 1000);

// Set up observer for dynamic content
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
    console.log("MURAi: New content detected, rechecking...");
    setTimeout(detectAndHighlight, 100);
  }
});

// Start observing when body is available
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  console.log("MURAi: Observer set up for dynamic content");
} else {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log("MURAi: Observer set up for dynamic content (delayed)");
  });
}

console.log("MURAi: Content script setup complete");