import express from 'express';
import Room from '../models/Room.js';
import User from '../models/User.js';

const router = express.Router();

// Generate a random 6-character room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new room
router.post('/create', async (req, res) => {
  const { userID, topic, config } = req.body;

  try {
    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate unique room code
    let roomCode;
    let exists = true;
    while (exists) {
      roomCode = generateRoomCode();
      exists = await Room.findOne({ roomCode });
    }

    const room = new Room({
      roomCode,
      host: userID,
      topic,
      config: {
        count: config?.count || 5,
        timeLimit: config?.timeLimit || 300,
        difficulty: config?.difficulty || 'easy'
      },
      participants: [{
        user: userID,
        name: user.name,
        username: user.username || null,
        score: 0,
        total: 0
      }],
      status: 'waiting'
    });

    await room.save();

    res.status(201).json({
      roomCode: room.roomCode,
      room: {
        _id: room._id,
        roomCode: room.roomCode,
        host: room.host,
        topic: room.topic,
        config: room.config,
        participants: room.participants,
        status: room.status
      }
    });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room details
router.get('/:roomCode', async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Get leaderboard
router.get('/:roomCode/leaderboard', async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const leaderboard = room.participants
      .filter(p => p.completedAt)
      .sort((a, b) => {
        const scoreA = (a.score / a.total) * 100;
        const scoreB = (b.score / b.total) * 100;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(a.completedAt) - new Date(b.completedAt);
      })
      .map((p, index) => ({
        rank: index + 1,
        name: p.name,
        username: p.username,
        userId: p.user ? p.user.toString() : null,
        score: p.score,
        total: p.total,
        percentage: p.total > 0 ? Math.round((p.score / p.total) * 100) : 0,
        completedAt: p.completedAt
      }));

    res.json({ leaderboard, topic: room.topic, status: room.status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
