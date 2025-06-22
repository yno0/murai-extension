import React, { useState } from 'react';
import  Logo  from '../assets/Logo.svg';

// Minimal SVG Icons
const Icons = {
  whitelist: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12l2 2 4-4"/>
      <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
      <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"/>
    </svg>
  ),
  ui: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="9" y1="9" x2="15" y2="9"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  ),
  add: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  edit: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  remove: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,6 5,6 21,6"/>
      <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  save: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17,21 17,13 7,13 7,21"/>
      <polyline points="7,3 7,8 15,8"/>
    </svg>
  ),
  cancel: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  flag: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  highlight: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4l-3-3-10 10-3 3z"/>
      <path d="M15 5l3 3"/>
      <path d="M9 11l-3 3"/>
    </svg>
  ),
  color: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2v20"/>
      <path d="M2 12h20"/>
    </svg>
  ),
  terms: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    </svg>
  ),
  website: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  lock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <circle cx="12" cy="16" r="1"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  settings: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
};

export default function App() {
  const [language, setLanguage] = useState('Mixed');
  const [sensitivity, setSensitivity] = useState('High');
  const [protectionEnabled, setProtectionEnabled] = useState(true);
  const [whitelistOptions, setWhitelistOptions] = useState(false);
  const [uiOptions, setUiOptions] = useState(false);
  
  // Whitelist state
  const [whitelistTerms, setWhitelistTerms] = useState([]);
  const [whitelistWebsites, setWhitelistWebsites] = useState([]);
  const [newTerm, setNewTerm] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [editingTerm, setEditingTerm] = useState(null);
  const [editingWebsite, setEditingWebsite] = useState(null);
  
  // UI Customization state
  const [flagStyle, setFlagStyle] = useState('asterisk');
  const [showHighlight, setShowHighlight] = useState(true);
  const [highlightColor, setHighlightColor] = useState('#ffeb3b');

  // Whitelist functions
  const addTerm = () => {
    if (newTerm.trim()) {
      setWhitelistTerms([...whitelistTerms, newTerm.trim()]);
      setNewTerm('');
    }
  };

  const addWebsite = () => {
    if (newWebsite.trim()) {
      setWhitelistWebsites([...whitelistWebsites, newWebsite.trim()]);
      setNewWebsite('');
    }
  };

  const removeTerm = (index) => {
    setWhitelistTerms(whitelistTerms.filter((_, i) => i !== index));
  };

  const removeWebsite = (index) => {
    setWhitelistWebsites(whitelistWebsites.filter((_, i) => i !== index));
  };

  const startEditTerm = (index) => {
    setEditingTerm({ index, value: whitelistTerms[index] });
  };

  const startEditWebsite = (index) => {
    setEditingWebsite({ index, value: whitelistWebsites[index] });
  };

  const saveEditTerm = () => {
    if (editingTerm && editingTerm.value.trim()) {
      const updatedTerms = [...whitelistTerms];
      updatedTerms[editingTerm.index] = editingTerm.value.trim();
      setWhitelistTerms(updatedTerms);
      setEditingTerm(null);
    }
  };

  const saveEditWebsite = () => {
    if (editingWebsite && editingWebsite.value.trim()) {
      const updatedWebsites = [...whitelistWebsites];
      updatedWebsites[editingWebsite.index] = editingWebsite.value.trim();
      setWhitelistWebsites(updatedWebsites);
      setEditingWebsite(null);
    }
  };

  const cancelEdit = () => {
    setEditingTerm(null);
    setEditingWebsite(null);
  };

  return (
    <div className="app-container">
      <div className='header'>
        <img src={Logo} alt="MURAi Logo" />
      </div>

      <div className="protection-section">
        <div className='left-section'>
          <span className="protection-label">Enable Protection</span>
        </div>
        <div className='right-section'>
          <label className="toggle-switch">
            <input type="checkbox" checked={protectionEnabled} onChange={() => setProtectionEnabled(!protectionEnabled)} />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className='language-selector'>
        <p className="section-title">Language</p>
        <div className="button-group">
            <button className={`language-btn ${language === 'Tagalog' ? 'active' : ''}`} onClick={() => setLanguage('Tagalog')}>Tagalog</button>
            <button className={`language-btn ${language === 'English' ? 'active' : ''}`} onClick={() => setLanguage('English')}>English</button>
            <button className={`language-btn ${language === 'Mixed' ? 'active' : ''}`} onClick={() => setLanguage('Mixed')}>Mixed</button>
        </div>
      </div>

      <div className='sensitivity-selector'>
        <p className='section-title'>Sensitivity</p>
        <div className="button-group">
            <button className={`sensitivity-btn ${sensitivity === 'Low' ? 'active' : ''}`} onClick={() => setSensitivity('Low')}>Low</button>
            <button className={`sensitivity-btn ${sensitivity === 'Medium' ? 'active' : ''}`} onClick={() => setSensitivity('Medium')}>Medium</button>
            <button className={`sensitivity-btn ${sensitivity === 'High' ? 'active' : ''}`} onClick={() => setSensitivity('High')}>High</button>
        </div>
      </div>

      <div className="options-buttons">
          <button className="option-btn" onClick={() => setWhitelistOptions(!whitelistOptions)}>
            {Icons.whitelist} {whitelistOptions ? 'Hide' : 'Show'} Whitelist Options
          </button>
          <button className="option-btn" onClick={() => setUiOptions(!uiOptions)}>
            {Icons.ui} {uiOptions ? 'Hide' : 'Show'} UI Customization
          </button>
      </div>

      {/* Whitelist Section */}
      {whitelistOptions && (
        <div className="whitelist-section">
          <p className="section-title">{Icons.lock} Whitelist Management</p>
          
          {/* Terms Whitelist */}
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ fontSize: '12px', marginBottom: '8px', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {Icons.terms} Terms
            </h4>
            <div className="whitelist-input-group">
              <input
                type="text"
                className="whitelist-input"
                placeholder="Enter term to whitelist"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTerm()}
              />
              <button className="add-btn" onClick={addTerm}>
                {Icons.add} Add
              </button>
            </div>
            {whitelistTerms.map((term, index) => (
              <div key={index} className="whitelist-item">
                {editingTerm && editingTerm.index === index ? (
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      className="whitelist-input"
                      value={editingTerm.value}
                      onChange={(e) => setEditingTerm({ ...editingTerm, value: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && saveEditTerm()}
                    />
                    <button className="edit-btn" onClick={saveEditTerm}>{Icons.save}</button>
                    <button className="remove-btn" onClick={cancelEdit}>{Icons.cancel}</button>
                  </div>
                ) : (
                  <>
                    <span className="whitelist-item-text">{term}</span>
                    <div className="whitelist-item-actions">
                      <button className="edit-btn" onClick={() => startEditTerm(index)}>{Icons.edit}</button>
                      <button className="remove-btn" onClick={() => removeTerm(index)}>{Icons.remove}</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Websites Whitelist */}
          <div>
            <h4 style={{ fontSize: '12px', marginBottom: '8px', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {Icons.website} Websites
            </h4>
            <div className="whitelist-input-group">
              <input
                type="text"
                className="whitelist-input"
                placeholder="Enter website URL"
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addWebsite()}
              />
              <button className="add-btn" onClick={addWebsite}>
                {Icons.add} Add
              </button>
            </div>
            {whitelistWebsites.map((website, index) => (
              <div key={index} className="whitelist-item">
                {editingWebsite && editingWebsite.index === index ? (
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      className="whitelist-input"
                      value={editingWebsite.value}
                      onChange={(e) => setEditingWebsite({ ...editingWebsite, value: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && saveEditWebsite()}
                    />
                    <button className="edit-btn" onClick={saveEditWebsite}>{Icons.save}</button>
                    <button className="remove-btn" onClick={cancelEdit}>{Icons.cancel}</button>
                  </div>
                ) : (
                  <>
                    <span className="whitelist-item-text">{website}</span>
                    <div className="whitelist-item-actions">
                      <button className="edit-btn" onClick={() => startEditWebsite(index)}>{Icons.edit}</button>
                      <button className="remove-btn" onClick={() => removeWebsite(index)}>{Icons.remove}</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UI Customization Section */}
      {uiOptions && (
        <div className="ui-section">
          <p className="section-title">{Icons.settings} UI Customization</p>
          
          <div className="ui-option">
            <div className="ui-option-label">
              {Icons.flag} Flag Style
            </div>
            <div className="ui-option-controls">
              <select 
                value={flagStyle} 
                onChange={(e) => setFlagStyle(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="asterisk">Asterisk (*)</option>
                <option value="flag">Flag</option>
                <option value="blur">Blur</option>
                <option value="highlight">Highlight</option>
              </select>
            </div>
          </div>

          <div className="ui-option">
            <div className="ui-option-label">
              {Icons.highlight} Show Highlight
            </div>
            <div className="ui-option-controls">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={showHighlight} 
                  onChange={() => setShowHighlight(!showHighlight)} 
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {showHighlight && (
            <div className="ui-option">
              <div className="ui-option-label">
                {Icons.color} Highlight Color
              </div>
              <div className="ui-option-controls">
                <input
                  type="color"
                  className="color-picker"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                />
                <select 
                  value={highlightColor} 
                  onChange={(e) => setHighlightColor(e.target.value)}
                  style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="#ffeb3b">Yellow</option>
                  <option value="#ffcdd2">Light Red</option>
                  <option value="#c8e6c9">Light Green</option>
                  <option value="#bbdefb">Light Blue</option>
                  <option value="#f3e5f5">Light Purple</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {protectionEnabled && (
        <div className='status'> 
            <p className="status-text"><b>Protection is enabled</b></p>
            <p className="settings-text">Language: {language} | Sensitivity: {sensitivity}</p>
        </div>
      )}

    </div>
  );
}