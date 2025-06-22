import React from 'react';

const Status = ({ protectionEnabled, language, sensitivity }) => {
  if (!protectionEnabled) return null;

  return (
    <div className='status'> 
      <p className="status-text"><b>Protection is enabled</b></p>
      <p className="settings-text">Language: {language} | Sensitivity: {sensitivity}</p>
    </div>
  );
};

export default Status; 