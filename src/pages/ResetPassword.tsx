// ResetPassword.tsx
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
      setMessage('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmedPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const res = await fetch('https://learnx-ed1w.onrender.com/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Reset failed');
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
    <div className="reset-container">
      <div className="reset-card">
        <h2>Reset Your Password</h2>
        {message && <div className="reset-message">{message}</div>}
        <form onSubmit={handleReset}>
          <div className="input-group">
            <Lock />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <div className="input-group">
            <Lock />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmedPassword}
              onChange={(e) => setConfirmedPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="reset-btn">Reset Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
