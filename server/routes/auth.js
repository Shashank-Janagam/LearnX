import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', email, password);

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('User found:', user);

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Only send safe fields
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
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

    const newUser = new User({ name, email: email.toLowerCase(), password });
    await newUser.save();

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('Register Error:', error); // 👈 this will show the actual error in terminal
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
