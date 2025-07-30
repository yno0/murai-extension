import React from "react";
import Logo from '../../assets/Logo.svg';

const Login = () => {
  const handleLogin = () => {
    if (window.chrome && chrome.runtime && chrome.runtime.getURL) {
      const url = chrome.runtime.getURL('login.html');
      window.open(url, '_blank');
    } else {
      window.open('/login.html', '_blank');
    }
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 32px',
    minWidth: 320,
    minHeight: 400,
    background: 'linear-gradient(135deg, #f0fdf9 0%, #ecfdf5 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const logoStyle = {
    width: 96,
    height: 96,
    marginBottom: 32,
    filter: 'drop-shadow(0 4px 12px rgba(41, 204, 153, 0.2))',
    transition: 'transform 0.2s ease'
  };

  const headingStyle = {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: '#064e3b',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: '-0.025em'
  };

  const descriptionStyle = {
    margin: 0,
    color: '#047857',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 1.5,
    marginBottom: 36,
    maxWidth: 280
  };

  const buttonStyle = {
    padding: '14px 40px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #29CC99 0%, #10b981 100%)',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(41, 204, 153, 0.3)',
    transition: 'all 0.2s ease',
    minWidth: 140,
    position: 'relative',
    overflow: 'hidden'
  };

  const buttonHoverStyle = {
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 20px rgba(41, 204, 153, 0.4)'
  };

  return (
    <main
      style={containerStyle}
      role="main"
      aria-label="Login section"
    >
      <div style={{ textAlign: 'center' }}>
        <img
          src={Logo}
          alt="Murai Extension Logo"
          style={logoStyle}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        />

        <h2 style={headingStyle} id="login-header">
          Please login
        </h2>

        <p style={descriptionStyle} id="login-desc">
          Sign in to access your settings and features.
        </p>

        <button
          onClick={handleLogin}
          style={buttonStyle}
          aria-label="Login to Murai Extension"
          aria-describedby="login-header login-desc"
          autoFocus
          onMouseEnter={(e) => {
            Object.assign(e.target.style, buttonHoverStyle);
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 16px rgba(41, 204, 153, 0.3)';
          }}
          onMouseDown={(e) => {
            e.target.style.transform = 'translateY(0) scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.target.style.transform = 'translateY(-1px) scale(1)';
          }}
        >
          Login
        </button>
      </div>
    </main>
  );
};

export default Login;