import React from 'react';

const SensitivitySelector = ({ sensitivity, onSensitivityChange }) => {
  return (
    <div className='sensitivity-selector'>
      <p className='section-title'>Sensitivity</p>
      <div className="button-group">
        <button 
          className={`sensitivity-btn ${sensitivity === 'Low' ? 'active' : ''}`} 
          onClick={() => onSensitivityChange('Low')}
        >
          Low
        </button>
        <button 
          className={`sensitivity-btn ${sensitivity === 'Medium' ? 'active' : ''}`} 
          onClick={() => onSensitivityChange('Medium')}
        >
          Medium
        </button>
        <button 
          className={`sensitivity-btn ${sensitivity === 'High' ? 'active' : ''}`} 
          onClick={() => onSensitivityChange('High')}
        >
          High
        </button>
      </div>
    </div>
  );
};

export default SensitivitySelector; 