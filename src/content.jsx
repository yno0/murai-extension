console.log("MURAi content script injected.");

const flaggedWords = ["badword1", "badword2"];

function scanAndHighlight() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    flaggedWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      if (regex.test(node.nodeValue)) {
        console.warn(`⚠️ MURAi flagged: ${word}`);
        node.parentNode.style.backgroundColor = "yellow";
      }
    });
  }
}

scanAndHighlight();