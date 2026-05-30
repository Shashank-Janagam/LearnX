import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Search users by name or username
router.get('/search', async (req, res) => {
  const { q, userID } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json([]);
  }

  try {
    const regex = new RegExp(q.trim(), 'i');
    const users = await User.find({
      isVerified: true,
      $or: [
        { name: regex },
        { username: regex }
      ],
      _id: { $ne: userID }
    })
    .select('_id name username followers')
    .limit(20);

    const results = users.map(u => ({
      _id: u._id,
      name: u.name,
      username: u.username || null,
      isFollowing: userID ? u.followers.some(f => f.toString() === userID) : false
    }));

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Follow a user
router.post('/follow/:targetId', async (req, res) => {
  const { userID } = req.body;
  const { targetId } = req.params;

  if (userID === targetId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  try {
    await User.findByIdAndUpdate(userID, {
      $addToSet: { following: targetId }
    });

    await User.findByIdAndUpdate(targetId, {
      $addToSet: { followers: userID }
    });

    res.json({ message: 'Followed successfully' });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ error: 'Follow failed' });
  }
});

// Unfollow a user
router.post('/unfollow/:targetId', async (req, res) => {
  const { userID } = req.body;
  const { targetId } = req.params;

  try {
    await User.findByIdAndUpdate(userID, {
      $pull: { following: targetId }
    });

    await User.findByIdAndUpdate(targetId, {
      $pull: { followers: userID }
    });

    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    console.error('Unfollow error:', err);
    res.status(500).json({ error: 'Unfollow failed' });
  }
});

// Get followers
router.get('/followers/:userId', async (req, res) => {
  const { viewerID } = req.query;
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', '_id name username followers');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const results = user.followers.map(f => ({
      _id: f._id,
      name: f.name,
      username: f.username,
      isFollowing: viewerID ? f.followers.some(id => id.toString() === viewerID) : false
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// Get following
router.get('/following/:userId', async (req, res) => {
  const { viewerID } = req.query;
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', '_id name username followers');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const results = user.following.map(f => ({
      _id: f._id,
      name: f.name,
      username: f.username,
      isFollowing: viewerID ? f.followers.some(id => id.toString() === viewerID) : true
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// Get friends (mutual followers)
router.get('/friends/:userId', async (req, res) => {
  const { viewerID } = req.query;
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', '_id name username followers')
      .populate('following', '_id name username followers');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const followerIds = new Set(user.followers.map(f => f._id.toString()));
    const friendsList = user.following.filter(f => followerIds.has(f._id.toString()));

    const results = friendsList.map(f => ({
      _id: f._id,
      name: f.name,
      username: f.username,
      isFollowing: viewerID ? f.followers.some(id => id.toString() === viewerID) : true
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

export default router;
