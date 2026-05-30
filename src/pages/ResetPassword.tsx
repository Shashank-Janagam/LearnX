// src/pages/ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

const ResetPassword = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
    document.title = 'LearnX | Reset Password';

    // Parse token from query parameters
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('❌ Invalid or missing password reset token.');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!token) {
      setError('Cannot submit. Token is missing or invalid.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${HOST_SERVER}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Reset failed.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('✅ Password updated successfully! Redirecting...');
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      console.error('Reset failed:', err);
      setError('❌ A connection error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="login-wrapper">
        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* Header */}
        <div className="login-header">
          <h1 className="main-title">Reset Password</h1>
          <p className="main-subtitle">Choose a new secure password for your account</p>
        </div>

        {/* Reset Password Card */}
        <div className="login-card">
          <div className="card-header">
            <div className="logo-container">
              <div className="logo-icon">
                <span className="logo-text">LearnX</span>
              </div>
            </div>
            <h2 className="card-title">New Credentials</h2>
            <p className="card-subtitle">Set your new password to regain access</p>
          </div>

          {error && (
            <div className="error-message">
              <p className="error-text">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="verify-message">
              <p className="verify-text">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleReset} className="login-form">
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">New Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon h-5 w-5" />
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="form-input password-input"
                  required
                  disabled={!!successMessage}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon h-5 w-5" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="form-input password-input"
                  required
                  disabled={!!successMessage}
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading || !!successMessage} className="login-button" style={{ marginTop: '0.5rem' }}>
              {isLoading ? (
                <div className="image-i">
                  <div className="spinner"></div>
                  <p className="loading-text">Updating...</p>
                </div>
              ) : (
                <span className="button-content">
                  Update Password
                  <svg className="button-arrow ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line"><div className="divider-border" /></div>
            <div className="divider-content">
              <span className="divider-text">Remembered your password?</span>
            </div>
          </div>

          <div className="signup-section">
            <button type="button" className="signup-link" onClick={() => navigate('/')}>
              Back to Login
            </button>
          </div>
        </div>

        <div className="login-footer">
          <p>By using LearnX, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
