// src/pages/VerifyEmail.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import '../styles/Login.css';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const token = searchParams.get('token');
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

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token found. Please make sure the link is complete.');
        return;
      }

      try {
        await axios.get(`${HOST_SERVER}/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage('Your email address has been verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage('This verification link is invalid, has expired, or has already been used.');
      }
    };

    verifyEmail();
  }, [token]);

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
          <h1 className="main-title">Account Verification</h1>
          <p className="main-subtitle">Confirm your email to unlock LearnX</p>
        </div>

        {/* Card */}
        <div className="login-card" style={{ padding: '3rem 2rem 2.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            {status === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Loader2 className="animate-spin text-indigo-500" style={{ width: '4rem', height: '4rem', marginBottom: '1.5rem' }} />
                <h2 className="card-title" style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Verifying...</h2>
                <p className="card-subtitle" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                  {message}
                </p>
              </div>
            )}

            {status === 'success' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ margin: '0 auto 1.5rem', width: '4.5rem', height: '4.5rem', background: 'rgba(74, 173, 59, 0.1)', border: '2px solid #4aad3b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle className="text-green-500" style={{ width: '2.5rem', height: '2.5rem' }} />
                </div>
                <h2 className="card-title" style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Verification Complete!</h2>
                <p className="card-subtitle" style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                  {message}
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="login-button"
                  style={{ width: '100%' }}
                >
                  <span className="button-content">
                    Continue to Sign In
                    <svg className="button-arrow ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </div>
            )}

            {status === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ margin: '0 auto 1.5rem', width: '4.5rem', height: '4.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle className="text-red-500" style={{ width: '2.5rem', height: '2.5rem' }} />
                </div>
                <h2 className="card-title" style={{ fontSize: '1.4rem', marginBottom: '0.75rem', color: '#f87171' }}>Verification Failed</h2>
                <p className="card-subtitle" style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                  {message}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                  <button
                    onClick={() => navigate('/')}
                    className="login-button"
                    style={{ width: '100%', background: 'linear-gradient(135deg, #475569, #334155)' }}
                  >
                    <span className="button-content">Back to Sign In</span>
                  </button>
                  <button
                    onClick={() => navigate('/Sign')}
                    className="signup-link"
                    style={{ fontSize: '0.875rem', fontWeight: 600, padding: '0.5rem', cursor: 'pointer', background: 'none', border: 'none' }}
                  >
                    Create a new account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="login-footer">
          <p>By using LearnX, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
