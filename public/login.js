// API Configuration
const API_BASE_URL = 'https://murai-server.onrender.com/api';

// DOM Elements
const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('password-toggle');
const loginBtn = document.getElementById('login-btn');
const loginText = document.getElementById('login-text');
const successMsg = document.getElementById('success-message');
const errorMsg = document.getElementById('error-message');
const openPopupBtn = document.getElementById('open-popup-btn');
const registerLink = document.getElementById('register-link');

// Password visibility toggle
passwordToggle.addEventListener('click', function() {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  passwordToggle.textContent = type === 'password' ? '👁️' : '🙈';
});

// Show error message
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
  successMsg.style.display = 'none';
}

// Show success message
function showSuccess(message) {
  successMsg.textContent = message;
  successMsg.style.display = 'block';
  errorMsg.style.display = 'none';
}

// Hide all messages
function hideMessages() {
  errorMsg.style.display = 'none';
  successMsg.style.display = 'none';
}

// Set loading state
function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  if (isLoading) {
    loginText.innerHTML = '<span class="loading"></span>Signing in...';
  } else {
    loginText.textContent = 'Sign In';
  }
}

// Store authentication data
function storeAuthData(token, user) {
  const authData = {
    token,
    user,
    loginTime: new Date().toISOString()
  };

  // Store in localStorage
  localStorage.setItem('murai_auth_token', token);
  localStorage.setItem('murai_user_data', JSON.stringify(user));
  localStorage.setItem('murai_logged_in', 'true');

  // Store in Chrome extension storage if available
  if (window.chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({
      murai_auth_token: token,
      murai_user_data: user,
      murai_logged_in: 'true'
    });
  }
}

// Login form submission
form.addEventListener('submit', async function(e) {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Basic validation
  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }

  if (!isValidEmail(email)) {
    showError('Please enter a valid email address');
    return;
  }

  hideMessages();
  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Login successful
      storeAuthData(data.token, data.user);
      showSuccess(`Welcome back, ${data.user.name}! Login successful.`);

      // Hide form and show success actions
      form.style.display = 'none';
      openPopupBtn.style.display = 'block';

      // Auto-close after 3 seconds if it's an extension popup
      if (window.chrome && chrome.runtime) {
        setTimeout(() => {
          window.close();
        }, 3000);
      }
    } else {
      // Login failed
      showError(data.message || 'Login failed. Please check your credentials.');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Network error. Please check your connection and try again.');
  } finally {
    setLoading(false);
  }
});

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Open popup button
openPopupBtn.addEventListener('click', function() {
  if (window.chrome && chrome.runtime) {
    window.close();
  } else {
    showSuccess('Please open the Murai extension from your browser toolbar.');
  }
});

// Register link (placeholder for now)
registerLink.addEventListener('click', function(e) {
  e.preventDefault();
  showError('Registration feature coming soon! Please contact support for account creation.');
});

// Auto-focus email input
emailInput.focus();