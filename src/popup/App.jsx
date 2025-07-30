/* global chrome */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Header,
  ProtectionToggle,
  LanguageSelector,
  SensitivitySelector,
  OptionsButtons,
  WhitelistSection,
  UICustomization,
  SyncSection,
  Status,
  SaveButton,
  Footer,
  ConfirmationModal
} from './components';
import Login from './components/Login.jsx';
import { syncWithMobileApp, getLastSyncTime, setLastSyncTime as setLastSyncTimeService, getUserEmail, saveSettingsToServer } from '../services/syncService.js';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Sync state
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Not synced');
  const [userEmail, setUserEmail] = useState('');

  // Sync handler
  const handleSyncClick = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncStatus('Syncing...');

    try {
      console.log('🔄 Manual sync initiated...');

      const result = await syncWithMobileApp('manual');

      if (result.success) {
        // Update sync status
        const now = new Date();
        setLastSyncTime(now);
        setSyncStatus('Synced');
        setLastSyncTimeService(now); // Also save to localStorage via service

        // If preferences were synced, reload settings
        if (result.preferences) {
          await loadSettings();
          console.log('✅ Settings reloaded after sync');
        }

        console.log('✅ Sync completed successfully');
      } else {
        throw new Error(result.message || 'Sync failed');
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      setSyncStatus('Sync failed');

      // Reset status after 3 seconds
      setTimeout(() => {
        setSyncStatus('Not synced');
      }, 3000);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Initialize sync data when logged in
  const initializeSync = useCallback(async () => {
    try {
      // Get last sync time
      const lastSync = getLastSyncTime();
      if (lastSync) {
        setLastSyncTime(lastSync);
        setSyncStatus('Synced');
      }

      // Get user email
      const email = await getUserEmail();
      if (email) {
        setUserEmail(email);
      }

      // Auto-sync on login if no recent sync (older than 1 hour)
      const now = new Date();
      if (!lastSync || (now - lastSync) > 3600000) { // 1 hour = 3600000ms
        console.log('🔄 Auto-syncing on login...');
        setTimeout(() => handleSyncClick(), 1000); // Delay to avoid UI conflicts
      }
    } catch (error) {
      console.error('Error initializing sync:', error);
    }
  }, [handleSyncClick]);

  // Load settings on component mount
  useEffect(() => {
    // Check localStorage first
    if (localStorage.getItem('murai_logged_in') === 'true') {
      setIsLoggedIn(true);
      loadSettings();
      initializeSync();
      return;
    }
    // Fallback: check chrome.storage.local
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['murai_logged_in'], (result) => {
        if (result.murai_logged_in === 'true') {
          setIsLoggedIn(true);
          initializeSync();
        }
        loadSettings();
      });
    } else {
      loadSettings();
    }
  }, [initializeSync]);

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

    try {
      // Save to Chrome storage first (local)
      await saveSettings(settings);
      console.log('✅ Settings saved to Chrome storage');

      // Save to server if logged in
      if (isLoggedIn) {
        try {
          const serverResult = await saveSettingsToServer(settings);
          console.log('✅ Settings saved to server:', serverResult);
        } catch (serverError) {
          console.warn('⚠️ Failed to save to server, but local save succeeded:', serverError.message);
          // Don't fail the entire save operation if server save fails
        }
      }

      console.log('Settings saved:', settings);
      setHasModifications(false);
      setShowModal(false);
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      // You could show an error message to the user here
    }
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

  if (!isLoggedIn) {
    return <Login />;
  }

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

      {/* Sync Section */}
      <SyncSection
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        syncStatus={syncStatus}
        onSyncClick={handleSyncClick}
        userEmail={userEmail}
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