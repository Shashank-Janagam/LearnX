import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET user profile by email
router.get('/email/:email', async (req, res) => {
  try {
    console.log('Received email:', req.params.email);
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      console.log('User not found in DB');
      return res.status(404).json({ error: 'User not found' });
    }
    // console.log('User found:', user);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT: Update username
router.put('/update-username', async (req, res) => {
  const { email, username } = req.body;

  if (!username || !/^[a-z0-9_]{3,20}$/.test(username.toLowerCase())) {
    return res.status(400).json({
      error: 'Username must be 3-20 characters, lowercase alphanumeric and underscores only'
    });
  }

  try {
    // Check if username is taken
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing && existing.email !== email) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { username: username.toLowerCase() },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Username updated', username: user.username });
  } catch (err) {
    console.error('Username update error:', err);
    res.status(500).json({ error: 'Failed to update username' });
  }
});

// PUT: Change password
router.put('/update-password', async (req, res) => {
  const { email, newPassword } = req.body;
  console.log("hit");
  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword; // You should ideally hash it
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/update-education', async (req, res) => {
  const { email, education } = req.body;

  try {
    const updated = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          education // sets entire education object (including role)
        }
      },
      { new: true }
    );

    res.json({ message: 'Education updated successfully', user: updated });
  } catch (err) {
    console.error('Error updating education:', err);
    res.status(500).json({ message: 'Server error' });
  }
});




export default router;
