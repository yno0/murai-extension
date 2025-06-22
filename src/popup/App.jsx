/* global chrome */
import React, { useState, useEffect } from 'react';
import {
  Header,
  ProtectionToggle,
  LanguageSelector,
  SensitivitySelector,
  OptionsButtons,
  WhitelistSection,
  UICustomization,
  Status,
  SaveButton,
  Footer,
  ConfirmationModal
} from './components';

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

  // Account state
  const [accountName] = useState('John Doe');
  const [accountStatus] = useState('Premium');

  // Save and modal state
  const [hasModifications, setHasModifications] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Load settings from chrome storage
  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get([
        'language',
        'sensitivity',
        'protectionEnabled',
        'whitelistTerms',
        'whitelistWebsites',
        'flagStyle',
        'showHighlight',
        'highlightColor'
      ]);

      if (result.language) setLanguage(result.language);
      if (result.sensitivity) setSensitivity(result.sensitivity);
      if (result.protectionEnabled !== undefined) setProtectionEnabled(result.protectionEnabled);
      if (result.whitelistTerms) setWhitelistTerms(result.whitelistTerms);
      if (result.whitelistWebsites) setWhitelistWebsites(result.whitelistWebsites);
      if (result.flagStyle) setFlagStyle(result.flagStyle);
      if (result.showHighlight !== undefined) setShowHighlight(result.showHighlight);
      if (result.highlightColor) setHighlightColor(result.highlightColor);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Save settings to chrome storage
  const saveSettings = async (settings) => {
    try {
      await chrome.storage.sync.set(settings);
      
      // Notify content scripts about settings update
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SETTINGS_UPDATED' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Track modifications
  const trackModification = () => {
    if (!hasModifications) {
      setHasModifications(true);
    }
  };

  // Whitelist functions
  const addTerm = () => {
    if (newTerm.trim()) {
      const updatedTerms = [...whitelistTerms, newTerm.trim()];
      setWhitelistTerms(updatedTerms);
      setNewTerm('');
      trackModification();
    }
  };

  const addWebsite = () => {
    if (newWebsite.trim()) {
      const updatedWebsites = [...whitelistWebsites, newWebsite.trim()];
      setWhitelistWebsites(updatedWebsites);
      setNewWebsite('');
      trackModification();
    }
  };

  const removeTerm = (index) => {
    const updatedTerms = whitelistTerms.filter((_, i) => i !== index);
    setWhitelistTerms(updatedTerms);
    trackModification();
  };

  const removeWebsite = (index) => {
    const updatedWebsites = whitelistWebsites.filter((_, i) => i !== index);
    setWhitelistWebsites(updatedWebsites);
    trackModification();
  };

  const startEditTerm = (editData) => {
    setEditingTerm(editData);
  };

  const startEditWebsite = (editData) => {
    setEditingWebsite(editData);
  };

  const saveEditTerm = () => {
    if (editingTerm && editingTerm.value.trim()) {
      const updatedTerms = [...whitelistTerms];
      updatedTerms[editingTerm.index] = editingTerm.value.trim();
      setWhitelistTerms(updatedTerms);
      setEditingTerm(null);
      trackModification();
    }
  };

  const saveEditWebsite = () => {
    if (editingWebsite && editingWebsite.value.trim()) {
      const updatedWebsites = [...whitelistWebsites];
      updatedWebsites[editingWebsite.index] = editingWebsite.value.trim();
      setWhitelistWebsites(updatedWebsites);
      setEditingWebsite(null);
      trackModification();
    }
  };

  const cancelEdit = () => {
    setEditingTerm(null);
    setEditingWebsite(null);
  };

  const handleAccountClick = () => {
    // For now, just log the click - this would typically open account settings
    console.log('Account clicked');
  };

  // Save functions
  const handleSaveClick = () => {
    setShowModal(true);
  };

  const handleConfirmSave = async () => {
    const settings = {
      language,
      sensitivity,
      protectionEnabled,
      whitelistTerms,
      whitelistWebsites,
      flagStyle,
      showHighlight,
      highlightColor
    };

    await saveSettings(settings);
    
    console.log('Settings saved:', settings);
    setHasModifications(false);
    setShowModal(false);
  };

  const handleCancelSave = () => {
    setShowModal(false);
  };

  // Track changes to main settings
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    trackModification();
  };

  const handleSensitivityChange = (newSensitivity) => {
    setSensitivity(newSensitivity);
    trackModification();
  };

  const handleProtectionChange = (newProtection) => {
    setProtectionEnabled(newProtection);
    trackModification();
  };

  const handleFlagStyleChange = (newFlagStyle) => {
    setFlagStyle(newFlagStyle);
    trackModification();
  };

  const handleHighlightChange = (newHighlight) => {
    setShowHighlight(newHighlight);
    trackModification();
  };

  const handleHighlightColorChange = (newColor) => {
    setHighlightColor(newColor);
    trackModification();
  };

  return (
    <div className="app-container">
      <Header 
        accountName={accountName}
        accountStatus={accountStatus}
        onAccountClick={handleAccountClick}
      />

      <ProtectionToggle 
        protectionEnabled={protectionEnabled}
        onProtectionChange={handleProtectionChange}
      />

      <LanguageSelector 
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      <SensitivitySelector 
        sensitivity={sensitivity}
        onSensitivityChange={handleSensitivityChange}
      />

      <OptionsButtons 
        whitelistOptions={whitelistOptions}
        uiOptions={uiOptions}
        onWhitelistToggle={() => setWhitelistOptions(!whitelistOptions)}
        onUiToggle={() => setUiOptions(!uiOptions)}
      />

      {/* Whitelist Section */}
      {whitelistOptions && (
        <WhitelistSection
          whitelistTerms={whitelistTerms}
          whitelistWebsites={whitelistWebsites}
          newTerm={newTerm}
          newWebsite={newWebsite}
          editingTerm={editingTerm}
          editingWebsite={editingWebsite}
          onNewTermChange={setNewTerm}
          onNewWebsiteChange={setNewWebsite}
          onAddTerm={addTerm}
          onAddWebsite={addWebsite}
          onRemoveTerm={removeTerm}
          onRemoveWebsite={removeWebsite}
          onStartEditTerm={startEditTerm}
          onStartEditWebsite={startEditWebsite}
          onSaveEditTerm={saveEditTerm}
          onSaveEditWebsite={saveEditWebsite}
          onCancelEdit={cancelEdit}
        />
      )}

      {/* UI Customization Section */}
      {uiOptions && (
        <UICustomization
          flagStyle={flagStyle}
          showHighlight={showHighlight}
          highlightColor={highlightColor}
          onFlagStyleChange={handleFlagStyleChange}
          onHighlightChange={handleHighlightChange}
          onHighlightColorChange={handleHighlightColorChange}
        />
      )}

      <Status 
        protectionEnabled={protectionEnabled}
        language={language}
        sensitivity={sensitivity}
      />

      <SaveButton 
        hasModifications={hasModifications}
        onSaveClick={handleSaveClick}
      />

      <Footer />

      <ConfirmationModal 
        showModal={showModal}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
      />
    </div>
  );
} 