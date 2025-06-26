// src/pages/VerifyEmail.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verifying...');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axios.get(`https://learnx-ed1w.onrender.com/auth/verify-email?token=${token}`);
        setMessage('✅ Email verified! You can now login.');
      } catch (err) {
        setMessage('❌ Verification link is invalid or expired.');
      }
    };

    if (token) verifyEmail();
    else setMessage('❌ No verification token found.');
  }, [token]);

  return <div style={{ padding: '2rem' }}>{message}</div>;
};

export default VerifyEmail;
