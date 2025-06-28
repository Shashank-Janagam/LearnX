// ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
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

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
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
        setMessage(data.message || 'Reset failed.');
        return;
      }

      setMessage('✅ Password reset successfully!');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      console.error('Reset failed:', err);
      setMessage('❌ Server error');
    }
  };

  return (
    <div className="learnx-reset-container">
      <div className="learnx-reset-card">
        <h2 className="learnx-reset-title">Reset Password</h2>

        {message && (
          <div
            className={`learnx-reset-message ${
              message.startsWith('✅') ? 'success' : 'error'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleReset}>
          <label htmlFor="newPassword" className="learnx-reset-label">
            New Password
          </label>
          <div className="learnx-reset-input-wrapper">
            <Lock className="learnx-reset-icon" />
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="learnx-reset-input"
              required
            />
            <button
              type="button"
              className="learnx-reset-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label htmlFor="confirmPassword" className="learnx-reset-label">
            Confirm Password
          </label>
          <div className="learnx-reset-input-wrapper">
            <Lock className="learnx-reset-icon" />
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="learnx-reset-input"
              required
            />
          </div>

          <button type="submit" className="learnx-reset-button">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
