import express from 'express';
import User from '../models/Profile.js';

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
    console.log('User found:', user);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/quiz', async (req, res) => {
  const { email, topic, score } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newQuiz = {
      topic,
      score,
      date: new Date().toLocaleDateString('en-IN')
    };

    // Add to recentQuizzes
    user.recentQuizzes.push(newQuiz);

    // Keep only the last 3
    if (user.recentQuizzes.length > 3) {
      user.recentQuizzes = user.recentQuizzes.slice(-3);
    }

    // Update stats
    user.stats.totalQuizzes = (user.stats.totalQuizzes || 0) + 1;
    user.stats.averageScore =
      Math.round(
        user.recentQuizzes.reduce((sum, q) => sum + q.score, 0) / user.recentQuizzes.length
      );
    user.stats.recentTopic = topic;

    await user.save();
    res.status(200).json({ message: 'Quiz saved', recentQuizzes: user.recentQuizzes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while saving quiz' });
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
  const { email, degree, course, institution ,role} = req.body;

  try {
    const updated = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          'education.degree': degree,
          'education.course': course,
          'education.institution': institution,
          'role':role
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
