import React from 'react';

const Highlighter = ({ terms, settings, onTermClick }) => {
  if (!terms || terms.length === 0) {
    return null;
  }

  const getFlagSymbol = (style) => {
    switch (style) {
      case 'asterisk': return '*';
      case 'exclamation': return '!';
      case 'warning': return '⚠';
      case 'flag': return '🚩';
      default: return '*';
    }
  };

  const highlightText = (text) => {
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        `<span class="murai-highlight" style="background-color: ${settings.highlightColor} !important; color: #000 !important; font-weight: bold !important; padding: 2px 4px !important; border-radius: 3px !important; position: relative !important; cursor: pointer !important;">
          $1
          <span class="murai-flag" style="position: absolute !important; top: -8px !important; right: -8px !important; background: red !important; color: white !important; border-radius: 50% !important; width: 16px !important; height: 16px !important; font-size: 10px !important; display: flex !important; align-items: center !important; justify-content: center !important;">
            ${getFlagSymbol(settings.flagStyle)}
          </span>
        </span>`
      );
    });
    
    return highlightedText;
  };

  const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  return (
    <div className="murai-highlighter">
      {terms.map((term, index) => (
        <div 
          key={index}
          className="murai-term-badge"
          style={{
            display: 'inline-block',
            background: '#ff4444',
            color: 'white',
            padding: '4px 8px',
            margin: '2px',
            borderRadius: '12px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
          onClick={() => onTermClick && onTermClick(term)}
        >
          {term}
        </div>
      ))}
    </div>
  );
};

export default Highlighter;
