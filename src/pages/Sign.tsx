import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Moon, Sun, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import jwt from 'jsonwebtoken';
import emailjs from '@emailjs/browser';

const Sign = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Set theme and page title on mount
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    document.title = 'LearnX | Sign In';

    // Optional: Check backend status
    fetch('/')
      .then((res) => res.text())
      .then((message) => console.log('Server says:', message))
      .catch((err) => console.error('❌ Could not connect to backend:', err));
  }, []);
  
 const sendVerificationEmail = (email: string, token: string) => {
    const verificationLink = `https://getlearnxai.vercel.app/verify-email?token=${token}`;

    const templateParams = {
      user_email: email,
      verification_link: verificationLink,
    };

    emailjs
      .send('service_x561nxp', 'template_o8fknnz', templateParams, 'HCjaEIZOneTx9xkek')
      .then(() => {
        alert('✅ Verification email sent. Check your inbox.');
      })
      .catch((error) => {
        console.error('❌ EmailJS error:', error);
        alert('❌ Failed to send verification email.');
      });
  };
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
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  if (!email || !password || !confirmPassword || !name) {
    setError('Please enter all required fields');
    setIsLoading(false);
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError('Please enter a valid email address');
    setIsLoading(false);
    return;
  }

  if (confirmPassword !== password) {
    setError('Passwords do not match');
    setIsLoading(false);
    return;
  }

  try {
    const res = await fetch('https://learnx-ed1w.onrender.com/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || 'Signup failed');
      setIsLoading(false);
      return;
    }

    // ✅ Generate email verification token
    const token=data.token;
    // ✅ Send verification email
    sendVerificationEmail(email, token);

    // ✅ Notify user to check their inbox
    alert('✅ Registration successful! Please check your email to verify your account.');

    // 🚫 Don't auto-login; instead, redirect to login or verification page
    navigate('/');
  } catch (err) {
    console.error('Register error:', err);
    setError('Server error');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className={`login-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="login-wrapper">
        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        <div className="login-header">
          <h1 className="main-title">Welcome Back</h1>
          <p className="main-subtitle">Sign Up to continue</p>
        </div>

        <div className="login-card">
          <div className="card-header">
            <div className="logo-container">
              <div className="logo-icon">
                <span className="logo-text">LearnX</span>
              </div>
            </div>
            <h2 className="card-title">Sign Up</h2>
            <p className="card-subtitle">Enter your details to create account</p>
          </div>

          {error && (
            <div className="error-message">
              <p className="error-text">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon h-5 w-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <div className="input-wrapper">
                <User className="input-icon h-5 w-5" />
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon h-5 w-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cpassword" className="form-label">Confirm Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon h-5 w-5" />
                <input
                  id="cpassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="form-input"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <div className="checkbox-wrapper">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="form-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="checkbox-label">Remember me</label>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="login-button">
              {isLoading ? (
                <div className="image-i">
                  <div className="spinner"></div>
                  <p className="loading-text">Signing Up</p>
                </div>
              ) : (
                <span className="button-content">Sign Up</span>
              )}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line">
              <div className="divider-border" />
            </div>
            <div className="divider-content">
              <span className="divider-text">Already have an account?</span>
            </div>
          </div>

          <div className="signup-section">
            <button type="button" className="signup-link" onClick={() => navigate('/Login')}>
              Login
            </button>
          </div>
        </div>

        <div className="login-footer">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default Sign;
