import React, { useState } from 'react';

export default function App() {
  const [language, setLanguage] = useState('Tagalog');
  const [sensitivity, setSensitivity] = useState('Medium');
  const [protectionStatus, setProtectionStatus] = useState('Off');

  return (
    <div className="p-4 w-100 flex flex-col gap-4">
      <div id='header'>
        <h1>MURAi</h1>
      </div>
      <div id='language-selector'>
        <p>Language</p>
        <select>
          <option value="en">English</option>
          <option value="es">Tagalog</option>
          <option value="fr">Mixed</option>
        </select>
      </div>
      <div id = 'sensitivity-selector'>
        <p>Sensitivity</p>
        <select>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div id='whitelist-toggle-button'>
        <button>Show Whitelist Options</button>
      </div>

      <div id='ui-toggle-options'> 
        <button> Show UI Customization Options</button>
      </div>
      <footer>
        <div>
          <p>Protection Status: {protectionStatus}</p>
        </div>
        <div>
          <p>Language: {language} | Sensitivity: {sensitivity}</p>
        </div>
      </footer>

    </div>
  );
}