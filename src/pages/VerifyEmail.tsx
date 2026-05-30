// src/pages/VerifyEmail.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const HOST_SERVER = process.env.REACT_APP_HOST_SERVER;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verifying...');
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await axios.get(`${HOST_SERVER}/auth/verify-email?token=${token}`);
        setMessage('✅ Email verified! You can now login.');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (err) {
        setMessage('❌ Verification link is invalid or expired.');
      }
    };

    if (token) verifyEmail();
    else setMessage('❌ No verification token found.');
  }, [token, navigate]);

  return <div style={{ padding: '2rem' }}>{message}</div>;
};

export default VerifyEmail;
