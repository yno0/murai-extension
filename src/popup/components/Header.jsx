import React from 'react';
import Logo from '../../assets/Logo.svg';

const Header = ({ accountName, accountStatus, onAccountClick }) => {
  return (
    <div className='header'>
      <img src={Logo} alt="MURAi Logo" />
      
      {/* Account Section */}
      <div className="account-section" onClick={onAccountClick}>
        <div className="account-info">
          <div className="account-avatar">
            {accountName.charAt(0)}
          </div>
          <div className="account-details">
            <div className="account-name">{accountName}</div>
            <div className="account-status">{accountStatus}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 