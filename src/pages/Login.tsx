import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Moon, Sun, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Home from './Home.tsx';
import Sign from './Sign.tsx';


import './Login.css';

const Login = () => {
  // const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  // const [userName,setUserName]=useState('');
  const [rememberMe, setRememberMe] = useState(false);


  const navigate = useNavigate();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    fetch('/')
      .then((res) => res.text())
      .then((message) => {
        console.log('Server says:', message); // Optional: show it in UI
      })
      .catch((err) => {
        console.error('❌ Could not connect to backend:', err);
      });
  }, []);

  useEffect(() => {
  document.title = "LearnX | Login";
}, []);

useEffect(() => {
  const storedUserID = localStorage.getItem('userID');
  if (storedUserID) {
    navigate('/home');
  }
}, []);


  // Toggle theme function

  

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    
      const data = await res.json();
    
            if (!res.ok) {
                setTimeout(() => {
                  setError(data.message || 'Login failed');
                  setIsLoading(false);
                }, 500);
              } else {
                const { _id, name, email } = data.user;

                // Always store in sessionStorage
                sessionStorage.setItem('userID', _id);
                sessionStorage.setItem('userName', name);
                sessionStorage.setItem('userEmail', email);

                // If rememberMe is true, also store in localStorage
              
                if (rememberMe) {
                  localStorage.setItem('userID', _id);
                  localStorage.setItem('userName', name);
                  localStorage.setItem('userEmail', email);


                }

                setTimeout(() => {
                  navigate('/home');
                }, 1000);
              }

      

    } catch (err) {
      console.error('Frontend error:', err);
      setError('Server error');
    } 


  };

  return (
    <div className={`login-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="login-wrapper">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* Logo and Header */}
        <div className="login-header">

          <h1 className="main-title">Welcome Back</h1>
          <p className="main-subtitle">Sign in to your account to continue</p>
        </div>

        {/* Login Card */}
        <div className="login-card">

          <div className="card-header">     
                 {/* <div className="logo-container">
            <img src="image.png" alt="" className="imagelogo"/>

          </div> */}

        <div className="logo-container">
          <div className="logo-icon">
            <span className="logo-text">LearnX</span>
          </div>
        </div>

            <h2 className="card-title">Sign In</h2>
            <p className="card-subtitle">Enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="error-message">
              <p className="error-text">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
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

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon h-5 w-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input password-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <div className="checkbox-wrapper">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="form-checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />

                <label htmlFor="remember-me" className="checkbox-label">
                  Remember me
                </label>
              </div>
              <button type="button" className="forgot-password">
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="login-button"
                >
                  {isLoading ? (
                    <div className="image-i">
                      <div className="spinner"></div>
                      <p className="loading-text">Signing In...</p>
                      </div>
                  ) : (
                    <span className="button-content">
                      Login
                      <svg
                        className="button-arrow ml-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                  )}
                </button>

          </form>

          {/* Divider */}
          <div className="divider">
            <div className="divider-line">
              <div className="divider-border" />
            </div>
            <div className="divider-content">
              <span className="divider-text">Don't have an account?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="signup-section">
            <button type="button" className="signup-link" onClick={() => navigate('/Sign')}>
              Create a new account
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default Login;