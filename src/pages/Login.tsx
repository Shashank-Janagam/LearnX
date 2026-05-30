import React, { useState, useEffect } from 'react';
import { Mail, Eye, EyeOff, Moon, Sun, X, ChevronLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import emailjs from '@emailjs/browser';

const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;
const CLIENT_URL = process.env.REACT_APP_CLIENT_URL || window.location.origin;

type AuthStep = 'email' | 'login' | 'signup' | 'registered';

const Login = () => {
  // Wizard and Form State
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI and Feedback State
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const navigate = useNavigate();

  // Clear feedback states when input changes
  useEffect(() => {
    setError('');
    setResendStatus('');
    setShowResendVerification(false);
  }, [email, password, name, confirmPassword, step]);

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

  // Check if user already logged in
  useEffect(() => {
    const storedUserID = localStorage.getItem('userID');
    if (storedUserID) {
      sessionStorage.setItem('userID', storedUserID);
      const emaill = localStorage.getItem('userEmail');
      sessionStorage.setItem('userEmail', emaill || '');
      const namee = localStorage.getItem('userName');
      sessionStorage.setItem('userName', namee || '');
      const usernamee = localStorage.getItem('username');
      if (usernamee) {
        sessionStorage.setItem('username', usernamee);
      }
      navigate('/home');
    }
  }, [navigate]);

  // Set page title
  useEffect(() => {
    document.title = "LearnX | Authentication";
  }, []);

  // Optional backend connectivity test
  useEffect(() => {
    fetch(`${HOST_SERVER || ''}/`)
      .then((res) => res.text())
      .then((message) => console.log('Server says:', message))
      .catch((err) => console.error('❌ Could not connect to backend:', err));
  }, []);

  const sendVerificationEmail = (userEmail: string, token: string) => {
    const verificationLink = `${CLIENT_URL}/verify-email?token=${token}`;

    const templateParams = {
      user_email: userEmail,
      name: name || 'User',
      verification_link: verificationLink,
    };

    emailjs
      .send('service_x561nxp', 'template_o8fknnz', templateParams, 'HCjaEIZOneTx9xkek')
      .then(() => {
        setResendStatus('✉️ A verification email has been sent! Please check your inbox.');
        setError('');
        setShowResendVerification(false);
      })
      .catch((error) => {
        console.error('❌ EmailJS error:', error);
        setError('❌ Failed to trigger email delivery via EmailJS. Link logged on server console.');
      });
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email to resend verification.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResendStatus('');
    try {
      const res = await fetch(`${HOST_SERVER}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to request verification link.');
      } else {
        sendVerificationEmail(email, data.token);
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('An error occurred while requesting verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordResetEmail = async () => {
    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }
    setIsLoading(true);
    setError('');
    setResendStatus('');
    try {
      const res = await fetch(`${HOST_SERVER}/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Reset request failed.');
        setIsLoading(false);
        return;
      }

      const token = data.token;
      const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;

      const templateParams = {
        user_email: email,
        reset_link: resetLink,
      };

      await emailjs.send(
        'service_x561nxp',
        'template_ghndhr9',
        templateParams,
        'HCjaEIZOneTx9xkek'
      );

      setResendStatus('✅ Password reset email sent. Check your inbox.');
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Failed to send reset email:', error);
      setError('❌ Error sending reset email. Please try again.');
      setIsLoading(false);
    }
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

  // Step 1: Check Email
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${HOST_SERVER}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'An error occurred. Please try again.');
      } else {
        if (data.exists) {
          setStep('login');
        } else {
          setStep('signup');
        }
      }
    } catch (err) {
      console.error('Check email error:', err);
      setError('Could not connect to backend. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowResendVerification(false);

    if (!email || !password) {
      setError('Please enter your password');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${HOST_SERVER}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        if (res.status === 403) {
          setShowResendVerification(true);
        }
        setIsLoading(false);
      } else {
        const { _id, name, email: userEmail, username } = data.user;

        sessionStorage.setItem('userID', _id);
        sessionStorage.setItem('userName', name);
        sessionStorage.setItem('userEmail', userEmail);
        if (username) {
          sessionStorage.setItem('username', username);
        }

        if (rememberMe) {
          localStorage.setItem('userID', _id);
          localStorage.setItem('userName', name);
          localStorage.setItem('userEmail', userEmail);
          if (username) {
            localStorage.setItem('username', username);
          }
        }

        navigate('/home');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };

  // Step 3: Signup / Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!name || !password || !confirmPassword) {
      setError('Please enter all required fields');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${HOST_SERVER}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed');
        setIsLoading(false);
        return;
      }

      sendVerificationEmail(email, data.token);
      setStep('registered');
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResetFlow = () => {
    setStep('email');
    setEmail('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setResendStatus('');
    setShowResendVerification(false);
  };

  return (
    <div className={`auth-page-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="auth-card-modal">
        {/* Left Side: Brand topographic panel */}
        <div className="auth-left-panel">
          <div className="topographic-overlay">
            <svg viewBox="0 0 400 400" className="topo-waves svg-1" xmlns="http://www.w3.org/2000/svg">
              <path d="M 50,150 A 100,100 0 0,0 250,150 A 100,100 0 0,0 50,150 Z" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
              <path d="M 70,150 A 80,80 0 0,0 230,150 A 80,80 0 0,0 70,150 Z" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M 90,150 A 60,60 0 0,0 210,150 A 60,60 0 0,0 90,150 Z" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="1.5" />
              <path d="M 110,150 A 40,40 0 0,0 190,150 A 40,40 0 0,0 110,150 Z" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            </svg>
            <svg viewBox="0 0 400 400" className="topo-waves svg-2" xmlns="http://www.w3.org/2000/svg">
              <path d="M 150,300 A 120,120 0 0,0 390,300 A 120,120 0 0,0 150,300 Z" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
              <path d="M 170,300 A 100,100 0 0,0 370,300 A 100,100 0 0,0 170,300 Z" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M 190,300 A 80,80 0 0,0 350,300 A 80,80 0 0,0 190,300 Z" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="left-panel-content">
            <div className="brand-logo-badge">LearnX</div>
            <div className="showcase-info-group">
              <h2 className="showcase-header">Practice learning.</h2>
              <p className="showcase-detail">
                Generate study modules, run interactive quizzes with AI, and track performance metrics in one unified space.
              </p>
            </div>
            <div className="showcase-footer-dots">
              <span className="dot active"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        </div>

        {/* Right Side: Step-by-step forms */}
        <div className="auth-right-panel">
          {/* Close button X */}
          <button className="auth-close-btn" onClick={handleResetFlow} aria-label="Reset forms">
            <X size={18} />
          </button>

          {/* Theme Switcher inside Form */}
          <button onClick={toggleTheme} className="auth-theme-toggle" aria-label="Toggle theme">
            {isDarkMode ? (
              <Sun size={18} className="text-amber-500" />
            ) : (
              <Moon size={18} className="text-slate-600" />
            )}
          </button>

          <div className="auth-form-wrapper">
            {/* Step 1: Email Entrance */}
            {step === 'email' && (
              <div className="auth-step-slide active">
                <h1 className="auth-title">Welcome to LearnX</h1>
                <p className="auth-subtitle">Enter your email address to continue</p>
                {error && <div className="auth-alert error">{error}</div>}
                <form onSubmit={handleCheckEmail} className="auth-inputs-form">
                  <div className="auth-input-group">
                    <input
                      type="email"
                      className="auth-text-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your Email Address"
                      required
                    />
                  </div>

                  <button type="submit" disabled={isLoading} className="auth-primary-btn">
                    {isLoading ? (
                      <span className="btn-spinner"></span>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Sign In / Login */}
            {step === 'login' && (
              <div className="auth-step-slide active">
                <button className="auth-back-link" onClick={() => setStep('email')}>
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
                
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to your account</p>

                <div className="auth-user-preview-pill">
                  <Mail size={14} className="icon-pill" />
                  <span className="email-lbl">{email}</span>
                  <button className="change-btn" onClick={() => setStep('email')}>Change</button>
                </div>

                {error && (
                  <div className="auth-alert error">
                    <p>{error}</p>
                    {showResendVerification && (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        className="resend-auth-link"
                      >
                        Resend Verification Email
                      </button>
                    )}
                  </div>
                )}

                {resendStatus && <div className="auth-alert success">{resendStatus}</div>}

                <form onSubmit={handleLogin} className="auth-inputs-form">
                  <div className="auth-input-group password-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-text-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="auth-password-eye"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="auth-extra-row">
                    <label className="auth-checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="auth-checkbox-input"
                      />
                      <span>Remember me</span>
                    </label>
                    <button type="button" className="auth-forgot-link" onClick={sendPasswordResetEmail}>
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" disabled={isLoading} className="auth-primary-btn">
                    {isLoading ? <span className="btn-spinner"></span> : <span>Sign In</span>}
                  </button>
                </form>
              </div>
            )}

            {/* Step 3: Sign Up / Register */}
            {step === 'signup' && (
              <div className="auth-step-slide active">
                <button className="auth-back-link" onClick={() => setStep('email')}>
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>

                <h1 className="auth-title">Create your account</h1>
                <p className="auth-subtitle">Join LearnX to start mastering your topics</p>

                <div className="auth-user-preview-pill">
                  <Mail size={14} className="icon-pill" />
                  <span className="email-lbl">{email}</span>
                  <button className="change-btn" onClick={() => setStep('email')}>Change</button>
                </div>

                {error && <div className="auth-alert error">{error}</div>}

                <form onSubmit={handleRegister} className="auth-inputs-form">
                  <div className="auth-input-group">
                    <input
                      type="text"
                      className="auth-text-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      required
                    />
                  </div>

                  <div className="auth-input-group password-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-text-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Choose Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="auth-password-eye"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="auth-input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-text-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      required
                    />
                  </div>

                  <button type="submit" disabled={isLoading} className="auth-primary-btn">
                    {isLoading ? <span className="btn-spinner"></span> : <span>Create Account</span>}
                  </button>
                </form>
              </div>
            )}

            {/* Step 4: Verification Success Link Sent */}
            {step === 'registered' && (
              <div className="auth-step-slide active registered-success-card">
                <div className="success-icon-badge">
                  <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <h1 className="auth-title">Registration Success!</h1>
                <p className="auth-subtitle">
                  We've sent a verification email to <strong>{email}</strong>.
                </p>
                <p className="success-instruction">
                  Please click the link inside the email to activate your account and log in.
                </p>

                {error && <div className="auth-alert error">{error}</div>}
                {resendStatus && <div className="auth-alert success">{resendStatus}</div>}

                <div className="success-action-group">
                  <button 
                    onClick={handleResendVerification} 
                    disabled={isLoading} 
                    className="auth-outline-btn"
                  >
                    {isLoading ? <span className="btn-spinner"></span> : 'Resend Verification Email'}
                  </button>

                  <button onClick={handleResetFlow} className="auth-primary-btn">
                    Go to Sign In
                  </button>
                </div>
              </div>
            )}

            <div className="auth-modal-footer">
              <p>
                By proceeding, I agree to LearnX's <span className="link-span">T&C</span> and <span className="link-span">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
