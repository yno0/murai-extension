import React, { useState } from 'react';
import Logo from '../../assets/Logo.svg';

const Header = ({ accountName, accountStatus, onAccountClick }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleProfileClick = () => {
    setShowMenu((prev) => !prev);
    if (onAccountClick) onAccountClick();
  };

  const handleLogout = () => {
    localStorage.removeItem('murai_logged_in');
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove('murai_logged_in', () => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  return (
    <div className='header' style={{ position: 'relative' }}>
      <img src={Logo} alt="MURAi Logo" className='logo'/>
      {/* Account Section */}
      <div className="account-section" onClick={handleProfileClick} tabIndex={0} role="button" aria-label="Account menu" style={{ outline: 'none' }}>
        <div className="account-info">
          <div className="account-avatar">
            {accountName.charAt(0)}
          </div>
          <div className="account-details">
            <div className="account-name">{accountName}</div>
            <div className="account-status">{accountStatus}</div>
          </div>
        </div>
        {showMenu && (
          <div className="account-menu" style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', borderRadius: 6, zIndex: 10, minWidth: 120 }}>
            <button onClick={handleLogout} style={{ width: '100%', padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500, color: '#d32f2f' }}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header; 