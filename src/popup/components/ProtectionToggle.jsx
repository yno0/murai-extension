import React from 'react';

const ProtectionToggle = ({ protectionEnabled, onProtectionChange }) => {
  return (
    <div className="protection-section">
      <div className='left-section'>
        <span className="protection-label">Enable Protection</span>
      </div>
      <div className='right-section'>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={protectionEnabled} 
            onChange={(e) => onProtectionChange(e.target.checked)} 
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
};

export default ProtectionToggle; 