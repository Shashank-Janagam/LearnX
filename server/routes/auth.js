import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', email, password);

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    // console.log('User found:', user);

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
     if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
    }
    // Only send safe fields
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const newUser = new User({ name, email: email.toLowerCase(), password, isVerified: false });
    await newUser.save();

    // Create verification token here
    const token = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const clientUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
    console.log(`✉️ Verification Link for ${newUser.email}: ${clientUrl}/verify-email?token=${token}`);

    // Send token to frontend
    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username || null,
      }
    });

  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.get('/verify-email', async (req, res) => {
  const token = req.query.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    await User.findOneAndUpdate({ email }, { isVerified: true });

    res.send('✅ Email verified! You can now log in.');
  } catch (err) {
    res.status(400).send('❌ Invalid or expired verification link.');
  }
});

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const clientUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
    console.log(`✉️ Re-sent Verification Link for ${user.email}: ${clientUrl}/verify-email?token=${token}`);

    return res.json({
      success: true,
      message: 'Verification token generated successfully',
      token
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;

  // Check if user exists in DB
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Generate token valid for 15 minutes
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });

  // Send token to frontend
  res.json({ token });
});


router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword; // Plain text — not safe for production
    await user.save();

    res.json({ message: '✅ Password updated' });
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// Check if user exists by email
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    return res.json({ success: true, exists: !!user });
  } catch (err) {
    console.error('Check email error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

