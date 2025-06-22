import React from 'react';
import Icons from './Icons';

const OptionsButtons = ({ whitelistOptions, uiOptions, onWhitelistToggle, onUiToggle }) => {
  return (
    <div className="options-buttons">
      <button className="option-btn" onClick={onWhitelistToggle}>
        {Icons.whitelist} {whitelistOptions ? 'Hide' : 'Show'} Whitelist Options
      </button>
      <button className="option-btn" onClick={onUiToggle}>
        {Icons.ui} {uiOptions ? 'Hide' : 'Show'} UI Customization
      </button>
    </div>
  );
};

export default OptionsButtons; 