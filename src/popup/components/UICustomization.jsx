import React from 'react';
import Icons from './Icons';
import Tooltip from './Tooltip';

const UICustomization = ({
  flagStyle,
  showHighlight,
  highlightColor,
  onFlagStyleChange,
  onHighlightChange,
  onHighlightColorChange
}) => {
  const colorOptions = [
    { color: '#ffeb3b', title: 'Yellow' },
    { color: '#ffcdd2', title: 'Light Red' },
    { color: '#c8e6c9', title: 'Light Green' },
    { color: '#bbdefb', title: 'Light Blue' },
    { color: '#f3e5f5', title: 'Light Purple' }
  ];

  return (
    <div className="ui-section">
      <p className="section-title">{Icons.settings} UI Customization</p>
      
      {/* Sample Text Preview */}
      <div className="sample-text-section">
        <div className="sample-text-label">Preview:</div>
        <div 
          className={`sample-text ${flagStyle}${showHighlight && flagStyle !== 'highlight' ? ' highlight' : ''}`}
          style={{ '--highlight-color': highlightColor }}
        >
          This is a sample text with some{' '}
          {flagStyle === 'asterisk' ? (
            <>
              <span className="flagged-word">
                {'flagged'.split('').map((letter, index) => (
                  <span key={index} className="letter">{letter}</span>
                ))}
              </span>{' '}
              <span className="flagged-word">
                {'content'.split('').map((letter, index) => (
                  <span key={index} className="letter">{letter}</span>
                ))}
              </span>
            </>
          ) : (
            <span className="flagged">flagged content</span>
          )}
          {' '}to show how the {flagStyle} style will appear. The flagged words will be displayed according to your selected preferences.
        </div>
      </div>
      
      <div className="ui-option">
        <div className="ui-option-label">
          {Icons.flag} Flag Style
        </div>
        <div className="ui-option-controls">
          <div className="ui-btn-group">
            <button 
              className={`ui-btn ${flagStyle === 'asterisk' ? 'active' : ''}`}
              onClick={() => onFlagStyleChange('asterisk')}
            >
              Asterisk
            </button>
            <button 
              className={`ui-btn ${flagStyle === 'blur' ? 'active' : ''}`}
              onClick={() => onFlagStyleChange('blur')}
            >
              Blur
            </button>
            <button 
              className={`ui-btn ${flagStyle === 'highlight' ? 'active' : ''}`}
              onClick={() => onFlagStyleChange('highlight')}
            >
              Highlight
            </button>
          </div>
        </div>
      </div>

      {/* Show highlight toggle for asterisk and blur styles */}
      {(flagStyle === 'blur' || flagStyle === 'asterisk') && (
        <div className="ui-option">
          <div className="ui-option-label">
            {Icons.highlight} Show Highlight
          </div>
          <div className="ui-option-controls">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={showHighlight} 
                onChange={(e) => onHighlightChange(e.target.checked)} 
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      )}

      {/* Show color options if highlight is enabled and flag style is blur or asterisk */}
      {showHighlight && (flagStyle === 'blur' || flagStyle === 'asterisk') && (
        <div className="ui-option">
          <div className="ui-option-label">
            {Icons.color} Highlight Color
          </div>
          <div className="ui-option-controls">
            <div className="ui-btn-group">
              {colorOptions.map(({ color, title }) => (
                <Tooltip key={color} content={title}>
                  <button 
                    className={`color-btn ${highlightColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => onHighlightColorChange(color)}
                  ></button>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Show color options when flag style is 'highlight' */}
      {flagStyle === 'highlight' && (
        <div className="ui-option">
          <div className="ui-option-label">
            {Icons.color} Highlight Color
          </div>
          <div className="ui-option-controls">
            <div className="ui-btn-group">
              {colorOptions.map(({ color, title }) => (
                <Tooltip key={color} content={title}>
                  <button 
                    className={`color-btn ${highlightColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => onHighlightColorChange(color)}
                  ></button>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UICustomization; 