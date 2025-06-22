import React from 'react';

const LanguageSelector = ({ language, onLanguageChange }) => {
  return (
    <div className='language-selector'>
      <p className="section-title">Language</p>
      <div className="button-group">
        <button 
          className={`language-btn ${language === 'Tagalog' ? 'active' : ''}`} 
          onClick={() => onLanguageChange('Tagalog')}
        >
          Tagalog
        </button>
        <button 
          className={`language-btn ${language === 'English' ? 'active' : ''}`} 
          onClick={() => onLanguageChange('English')}
        >
          English
        </button>
        <button 
          className={`language-btn ${language === 'Mixed' ? 'active' : ''}`} 
          onClick={() => onLanguageChange('Mixed')}
        >
          Mixed
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector; 