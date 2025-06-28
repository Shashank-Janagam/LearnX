import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setMessage('❌ Invalid or missing token');
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setMessage('⚠️ Password must be at least 6 characters');
      setIsSuccess(false);
      return;
    }

    if (newPassword !== confirmedPassword) {
      setMessage('⚠️ Passwords do not match');
      setIsSuccess(false);
      return;
    }

    try {
      const res = await fetch('https://learnx-ed1w.onrender.com/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || '❌ Reset failed');
        setIsSuccess(false);
        return;
      }

      setMessage('✅ Password reset successfully!');
      setIsSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      console.error('Reset failed:', err);
      setMessage('❌ Server error');
      setIsSuccess(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-box">
        <h2>Reset Password</h2>
        {message && (
          <div className={isSuccess ? 'success-message' : 'error-message'}>
            {message}
          </div>
        )}
        <form onSubmit={handleReset}>
          <label htmlFor="new-password">New Password</label>
          <div className="input-wrapper">
            <Lock className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
              aria-label="Toggle Password"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <label htmlFor="confirm-password">Confirm Password</label>
          <div className="input-wrapper">
            <Lock className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirm-password"
              value={confirmedPassword}
              onChange={(e) => setConfirmedPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          <button type="submit">Update Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
