// API Configuration
const API_BASE_URL = 'https://murai-server.onrender.com/api';

/**
 * Get authentication data from storage
 */
const getAuthData = async () => {
  try {
    // Try localStorage first
    const token = localStorage.getItem('murai_auth_token');
    const userData = localStorage.getItem('murai_user_data');
    
    if (token && userData) {
      return {
        token,
        user: JSON.parse(userData)
      };
    }

    // Fallback to Chrome storage
    if (window.chrome && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['murai_auth_token', 'murai_user_data'], (result) => {
          if (result.murai_auth_token && result.murai_user_data) {
            resolve({
              token: result.murai_auth_token,
              user: result.murai_user_data
            });
          } else {
            resolve(null);
          }
        });
      });
    }

    return null;
  } catch (error) {
    console.error('Error getting auth data:', error);
    return null;
  }
};

/**
 * Convert mobile app preferences to extension format
 */
const convertMobilePreferencesToExtension = (preferences) => {
  if (!preferences) return null;

  return {
    language: preferences.language || 'Mixed',
    sensitivity: preferences.sensitivity || 'High',
    protectionEnabled: preferences.isEnabled !== false,
    whitelistTerms: preferences.whitelistTerms || [],
    whitelistWebsites: preferences.whitelistSite || [],
    flagStyle: preferences.flagStyle || 'asterisk',
    showHighlight: preferences.isHighlighted !== false,
    highlightColor: preferences.color || '#29CC99'
  };
};

/**
 * Save synced settings to Chrome storage
 */
const saveSyncedSettings = async (settings) => {
  try {
    if (window.chrome && chrome.storage && chrome.storage.sync) {
      await chrome.storage.sync.set(settings);
      console.log('✅ Synced settings saved to Chrome storage:', settings);
      
      // Notify content scripts about settings update
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SETTINGS_UPDATED' });
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving synced settings:', error);
    return false;
  }
};

/**
 * Sync settings with mobile app via server
 */
export const syncWithMobileApp = async (syncType = 'manual') => {
  try {
    console.log('🔄 Starting sync with mobile app...');

    // Get authentication data
    const authData = await getAuthData();
    if (!authData || !authData.token) {
      throw new Error('No authentication token found. Please login first.');
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    // Call the extension-sync endpoint
    const response = await fetch(`${API_BASE_URL}/users/extension-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        syncType,
        extensionVersion: chrome?.runtime?.getManifest?.()?.version || '1.0.0',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📡 Sync response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sync failed: ${response.status} - ${errorText}`);
    }

    const syncResult = await response.json();
    console.log('✅ Sync successful:', syncResult);

    // Convert and save preferences if available
    if (syncResult.preferences) {
      const extensionSettings = convertMobilePreferencesToExtension(syncResult.preferences);
      
      if (extensionSettings) {
        const saved = await saveSyncedSettings(extensionSettings);
        if (saved) {
          console.log('💾 Settings synced and applied successfully');
          return {
            success: true,
            message: 'Settings synced successfully from mobile app',
            syncTime: syncResult.syncTime,
            preferences: extensionSettings
          };
        } else {
          throw new Error('Failed to save synced settings');
        }
      } else {
        console.log('⚠️ No valid preferences found to sync');
        return {
          success: true,
          message: 'Sync completed but no settings to apply',
          syncTime: syncResult.syncTime,
          preferences: null
        };
      }
    } else {
      console.log('⚠️ No preferences returned from server');
      return {
        success: true,
        message: 'Sync completed but no preferences found',
        syncTime: syncResult.syncTime,
        preferences: null
      };
    }

  } catch (error) {
    console.error('❌ Sync error:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Sync timeout - please check your connection');
    }
    
    throw error;
  }
};

/**
 * Get last sync time from storage
 */
export const getLastSyncTime = () => {
  try {
    const lastSync = localStorage.getItem('murai_last_sync');
    return lastSync ? new Date(lastSync) : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};

/**
 * Set last sync time in storage
 */
export const setLastSyncTime = (time) => {
  try {
    localStorage.setItem('murai_last_sync', time.toISOString());
  } catch (error) {
    console.error('Error setting last sync time:', error);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  const authData = await getAuthData();
  return authData && authData.token;
};

/**
 * Get user email for display
 */
export const getUserEmail = async () => {
  try {
    const authData = await getAuthData();
    return authData?.user?.email || null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
};

/**
 * Convert extension settings to server format
 */
const convertExtensionSettingsToServer = (settings) => {
  return {
    language: settings.language === 'Mixed' ? 'Both' : settings.language,
    sensitivity: settings.sensitivity.toLowerCase(),
    whitelistSite: settings.whitelistWebsites || [],
    whitelistTerms: settings.whitelistTerms || [],
    flagStyle: settings.flagStyle,
    isHighlighted: settings.showHighlight,
    color: settings.highlightColor,
    extensionEnabled: settings.protectionEnabled
  };
};

/**
 * Save settings to server
 */
export const saveSettingsToServer = async (settings) => {
  try {
    console.log('💾 Saving settings to server...');

    // Get authentication data
    const authData = await getAuthData();
    if (!authData || !authData.token) {
      throw new Error('No authentication token found. Please login first.');
    }

    // Convert extension settings to server format
    const serverSettings = convertExtensionSettingsToServer(settings);
    console.log('📤 Converted settings for server:', serverSettings);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Call the preferences API
    const response = await fetch(`${API_BASE_URL}/users/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serverSettings),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📡 Save response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Save failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Settings saved to server successfully:', result);

    return {
      success: true,
      message: 'Settings saved successfully',
      preferences: result
    };

  } catch (error) {
    console.error('❌ Save error:', error);

    if (error.name === 'AbortError') {
      throw new Error('Save timeout - please check your connection');
    }

    throw error;
  }
};
