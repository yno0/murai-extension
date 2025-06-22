# MURAi Extension Components

This directory contains all the modular components for the MURAi browser extension popup interface.

## Component Structure

### Core Components

- **`Icons.jsx`** - Contains all SVG icons used throughout the application
- **`Header.jsx`** - Main header with logo and account information
- **`ProtectionToggle.jsx`** - Toggle switch for enabling/disabling protection
- **`LanguageSelector.jsx`** - Language selection buttons (Tagalog, English, Mixed)
- **`SensitivitySelector.jsx`** - Sensitivity level selection (Low, Medium, High)
- **`OptionsButtons.jsx`** - Toggle buttons for showing/hiding whitelist and UI options

### Feature Components

- **`WhitelistSection.jsx`** - Complete whitelist management for terms and websites
- **`UICustomization.jsx`** - UI customization options including flag styles and colors
- **`Status.jsx`** - Status display showing current protection settings
- **`SaveButton.jsx`** - Save button that appears when modifications are made
- **`Footer.jsx`** - Footer with website link and version information
- **`ConfirmationModal.jsx`** - Modal dialog for confirming save actions

## Usage

All components are exported from the `index.js` file for easy importing:

```jsx
import {
  Header,
  ProtectionToggle,
  LanguageSelector,
  // ... other components
} from './components';
```

## Component Props

### Header
- `accountName` (string) - User's account name
- `accountStatus` (string) - User's account status (e.g., "Premium")
- `onAccountClick` (function) - Callback for account section clicks

### ProtectionToggle
- `protectionEnabled` (boolean) - Current protection state
- `onProtectionChange` (function) - Callback when protection is toggled

### LanguageSelector
- `language` (string) - Current selected language
- `onLanguageChange` (function) - Callback when language is changed

### SensitivitySelector
- `sensitivity` (string) - Current sensitivity level
- `onSensitivityChange` (function) - Callback when sensitivity is changed

### OptionsButtons
- `whitelistOptions` (boolean) - Whether whitelist section is visible
- `uiOptions` (boolean) - Whether UI customization is visible
- `onWhitelistToggle` (function) - Callback to toggle whitelist section
- `onUiToggle` (function) - Callback to toggle UI customization

### WhitelistSection
- `whitelistTerms` (array) - List of whitelisted terms
- `whitelistWebsites` (array) - List of whitelisted websites
- `newTerm` (string) - Current new term input value
- `newWebsite` (string) - Current new website input value
- `editingTerm` (object|null) - Currently editing term data
- `editingWebsite` (object|null) - Currently editing website data
- Various callback functions for CRUD operations

### UICustomization
- `flagStyle` (string) - Current flag style (asterisk, blur, highlight)
- `showHighlight` (boolean) - Whether to show highlight
- `highlightColor` (string) - Current highlight color
- Various callback functions for UI changes

### Status
- `protectionEnabled` (boolean) - Whether protection is enabled
- `language` (string) - Current language setting
- `sensitivity` (string) - Current sensitivity setting

### SaveButton
- `hasModifications` (boolean) - Whether there are unsaved changes
- `onSaveClick` (function) - Callback when save button is clicked

### ConfirmationModal
- `showModal` (boolean) - Whether modal is visible
- `onConfirm` (function) - Callback when save is confirmed
- `onCancel` (function) - Callback when save is cancelled

## Benefits of This Structure

1. **Modularity** - Each component has a single responsibility
2. **Reusability** - Components can be easily reused in other parts of the app
3. **Maintainability** - Easier to debug and modify individual components
4. **Testability** - Each component can be tested in isolation
5. **Readability** - Code is more organized and easier to understand
6. **Scalability** - Easy to add new features or modify existing ones

## State Management

The main App component manages all state and passes it down to child components as props. This follows a top-down data flow pattern typical in React applications.

## Styling

All components use the existing CSS classes from `App.css`. The styling remains consistent across the refactored components. 