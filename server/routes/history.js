// Fetch topic history for a user

import express from 'express';
import Queri from '../models/Query.js';
import QuizResult from '../models/QuizResult.js';

const router = express.Router();
router.get('/:userID', async (req, res) => {
  const { userID } = req.params;

  try {
    const history = await Queri.find({ userID }).sort({ createdAt: -1 }); 
    const topics = history.map(entry => entry.topic);

    res.json({ topics });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

router.get('/:userID/:topic', async (req, res) => {
  const { userID, topic } = req.params;
  try {
    const result = await QuizResult.findOne({ userID, topic }).sort({ createdAt: -1 }); // most recent
    if (!result) return res.status(404).json({ message: 'No result found' });
    res.json({ result: result });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
