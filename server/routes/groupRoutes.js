import express from 'express';
import Group from '../models/Group.js';
import GroupMessage from '../models/GroupMessage.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import QuizResult from '../models/QuizResult.js';

export default function createGroupRouter(io) {
  const router = express.Router();

// Generate a random 8-character group code
function generateGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ─── CREATE GROUP ───────────────────────────────────────────
router.post('/create', async (req, res) => {
  const { userID, name, description, visibility, avatar, color } = req.body;

  try {
    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate unique group code
    let code;
    let exists = true;
    while (exists) {
      code = generateGroupCode();
      exists = await Group.findOne({ code });
    }

    const group = new Group({
      name,
      description: description || '',
      code,
      avatar: avatar || '📚',
      color: color || '#6C5CE7',
      creator: userID,
      admins: [userID],
      members: [{
        user: userID,
        name: user.name,
        username: user.username || null,
        role: 'admin',
        joinedAt: new Date()
      }],
      visibility: visibility || 'public',
      lastActivity: new Date()
    });

    await group.save();

    // Add group to user's groups list
    await User.findByIdAndUpdate(userID, {
      $addToSet: { groups: group._id }
    });

    res.status(201).json({
      code: group.code,
      group: {
        _id: group._id,
        name: group.name,
        description: group.description,
        code: group.code,
        avatar: group.avatar,
        color: group.color,
        creator: group.creator,
        members: group.members,
        visibility: group.visibility,
        memberCount: group.members.length,
        createdAt: group.createdAt
      }
    });
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// ─── GET MY GROUPS ──────────────────────────────────────────
router.get('/my-groups/:userId', async (req, res) => {
  try {
    const groups = await Group.find({ 'members.user': req.params.userId })
      .select('name description code avatar color members rooms lastActivity createdAt visibility')
      .sort({ lastActivity: -1 });

    const result = groups.map(g => ({
      _id: g._id,
      name: g.name,
      description: g.description,
      code: g.code,
      avatar: g.avatar,
      color: g.color,
      visibility: g.visibility,
      memberCount: g.members.length,
      roomCount: g.rooms.length,
      lastActivity: g.lastActivity,
      createdAt: g.createdAt
    }));

    res.json(result);
  } catch (err) {
    console.error('Get my groups error:', err);
    res.status(500).json({ error: 'Failed to fetch groups', details: err.message });
  }
});

// ─── SEARCH PUBLIC GROUPS ───────────────────────────────────
router.get('/search/public', async (req, res) => {
  const { q, userID } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json([]);
  }

  try {
    const regex = new RegExp(q.trim(), 'i');
    const groups = await Group.find({
      visibility: 'public',
      $or: [
        { name: regex },
        { description: regex }
      ]
    })
      .select('name description code avatar color members lastActivity')
      .limit(20);

    const results = groups.map(g => ({
      _id: g._id,
      name: g.name,
      description: g.description,
      code: g.code,
      avatar: g.avatar,
      color: g.color,
      memberCount: g.members.length,
      lastActivity: g.lastActivity,
      isMember: userID ? g.members.some(m => m.user.toString() === userID) : false
    }));

    res.json(results);
  } catch (err) {
    console.error('Search groups error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ─── JOIN GROUP ─────────────────────────────────────────────
router.post('/join', async (req, res) => {
  const { userID, code } = req.body;

  try {
    const group = await Group.findOne({ code: code.toUpperCase() });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if already a member
    const alreadyMember = group.members.some(m => m.user.toString() === userID);
    if (alreadyMember) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    // Check member limit
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ error: 'Group is full' });
    }

    group.members.push({
      user: userID,
      name: user.name,
      username: user.username || null,
      role: 'member',
      joinedAt: new Date()
    });
    group.lastActivity = new Date();
    await group.save();

    // Add group to user's groups list
    await User.findByIdAndUpdate(userID, {
      $addToSet: { groups: group._id }
    });

    res.json({
      message: 'Joined group successfully',
      group: {
        _id: group._id,
        name: group.name,
        code: group.code,
        avatar: group.avatar,
        color: group.color,
        memberCount: group.members.length
      }
    });
  } catch (err) {
    console.error('Join group error:', err);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// ─── LEAVE GROUP ────────────────────────────────────────────
router.post('/leave', async (req, res) => {
  const { userID, code } = req.body;

  try {
    const group = await Group.findOne({ code: code.toUpperCase() });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Creator cannot leave (must delete group)
    if (group.creator.toString() === userID) {
      return res.status(400).json({ error: 'Creator cannot leave the group. Transfer ownership or delete the group.' });
    }

    group.members = group.members.filter(m => m.user.toString() !== userID);
    group.admins = group.admins.filter(a => a.toString() !== userID);
    await group.save();

    // Remove group from user's groups list
    await User.findByIdAndUpdate(userID, {
      $pull: { groups: group._id }
    });

    res.json({ message: 'Left group successfully' });
  } catch (err) {
    console.error('Leave group error:', err);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

// ─── GET GROUP MEMBERS ──────────────────────────────────────
router.get('/:code/members', async (req, res) => {
  try {
    const group = await Group.findOne({ code: req.params.code.toUpperCase() });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const members = group.members.map(m => ({
      _id: m.user,
      name: m.name,
      username: m.username,
      role: m.role,
      joinedAt: m.joinedAt,
      isCreator: group.creator.toString() === m.user.toString()
    }));

    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// ─── POST QUIZ ROOM TO GROUP ────────────────────────────────
router.post('/:code/post-room', async (req, res) => {
  const { userID, topic, description, config } = req.body;

  try {
    const group = await Group.findOne({ code: req.params.code.toUpperCase() });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Verify user is a member
    const isMember = group.members.some(m => m.user.toString() === userID);
    if (!isMember) {
      return res.status(403).json({ error: 'You must be a member to post rooms' });
    }

    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate unique room code (reuse room logic)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let roomCode;
    let exists = true;
    while (exists) {
      roomCode = '';
      for (let i = 0; i < 6; i++) {
        roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      exists = await Room.findOne({ roomCode });
    }

    // Create the Room document
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

    // Add room to group
    group.rooms.push({
      roomCode,
      topic,
      description: description?.trim() || '',
      postedBy: userID,
      postedByName: user.name,
      status: 'waiting',
      config: room.config,
      postedAt: new Date()
    });
    group.lastActivity = new Date();
    await group.save();

    res.status(201).json({
      roomCode,
      room: {
        _id: room._id,
        roomCode: room.roomCode,
        host: room.host,
        topic: room.topic,
        config: room.config,
        participants: room.participants,
        status: room.status
      },
      postedByName: user.name
    });

    // Emit real-time event so all group members see the new room instantly
    const newRoomPayload = {
      roomCode,
      topic,
      description: description?.trim() || '',
      postedBy: userID,
      postedByName: user.name,
      postedAt: new Date(),
      config: room.config,
      status: 'waiting',
      participantCount: 1
    };
    if (io) {
      io.to(`group:${req.params.code.toUpperCase()}`).emit('group:room-posted', newRoomPayload);
    }
  } catch (err) {
    console.error('Post room error:', err);
    res.status(500).json({ error: 'Failed to post room to group' });
  }
});

// ─── GET GROUP ROOMS ────────────────────────────────────────
router.get('/:code/rooms', async (req, res) => {
  try {
    const group = await Group.findOne({ code: req.params.code.toUpperCase() });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Enrich with current room status from Room collection
    const roomCodes = group.rooms.map(r => r.roomCode);
    const liveRooms = await Room.find({ roomCode: { $in: roomCodes } })
      .select('roomCode status participants');

    const statusMap = {};
    liveRooms.forEach(r => {
      statusMap[r.roomCode] = {
        status: r.status,
        participantCount: r.participants.length
      };
    });

    const rooms = group.rooms.map(r => ({
      roomCode: r.roomCode,
      topic: r.topic,
      description: r.description || '',
      postedBy: r.postedBy,
      postedByName: r.postedByName,
      postedAt: r.postedAt,
      config: r.config,
      status: statusMap[r.roomCode]?.status || r.status,
      participantCount: statusMap[r.roomCode]?.participantCount || 0
    }));

    // Sort: waiting/active first (newest-first), then completed (newest-first)
    const order = { waiting: 0, active: 1, completed: 2 };
    rooms.sort((a, b) => {
      const statusDiff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
      if (statusDiff !== 0) return statusDiff;
      // Within same status: newest first (handle missing postedAt gracefully)
      const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
      const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
      return dateB - dateA;
    });

    res.json(rooms);
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// ─── GET COMPLETED ROOM RESULTS (leaderboard + questions) ───
router.get('/:code/rooms/:roomCode/results', async (req, res) => {
  const { userID } = req.query;
  try {
    const group = await Group.findOne({ code: req.params.code.toUpperCase() });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const leaderboard = room.participants
      .slice()
      .sort((a, b) => {
        const scoreA = a.total > 0 ? (a.score / a.total) * 100 : 0;
        const scoreB = b.total > 0 ? (b.score / b.total) * 100 : 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (a.completedAt && b.completedAt) return new Date(a.completedAt) - new Date(b.completedAt);
        return 0;
      })
      .map((p, index) => ({
        rank: index + 1,
        name: p.name,
        username: p.username,
        userId: p.user.toString(),
        score: p.score,
        total: p.total,
        percentage: p.total > 0 ? Math.round((p.score / p.total) * 100) : 0
      }));

    // Try to fetch the requesting user's per-question answers from QuizResult
    let userAnswersMap = {}; // questionIndex (0-based) -> { selectedOption, isCorrect }
    if (userID) {
      try {
        const topicPattern = new RegExp('^' + room.topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\(Group\\)$', 'i');
        const quizResult = await QuizResult.findOne({
          userID,
          topic: topicPattern
        }).sort({ createdAt: -1 });
        if (quizResult && quizResult.responses) {
          quizResult.responses.forEach((r, idx) => {
            userAnswersMap[idx] = {
              selectedOption: r.selectedOption,
              isCorrect: r.isCorrect
            };
          });
        }
      } catch (qrErr) {
        console.warn('Could not fetch user QuizResult:', qrErr.message);
      }
    }

    // Return questions with correct answers revealed + user's selected answers
    const questions = (room.mcqs || []).map((q, i) => ({
      index: i + 1,
      question: q.question,
      options: q.options,          // includes isCorrect
      explanation: q.explanation,
      userSelectedOption: userAnswersMap[i]?.selectedOption || null,
      userIsCorrect: userAnswersMap[i]?.isCorrect ?? null
    }));

    res.json({
      topic: room.topic,
      status: room.status,
      completedAt: room.completedAt,
      config: room.config,
      leaderboard,
      questions
    });
  } catch (err) {
    console.error('Room results error:', err);
    res.status(500).json({ error: 'Failed to fetch room results', details: err.message });
  }
});

// ─── GET GROUP MESSAGES (paginated) ─────────────────────────
router.get('/:code/messages', async (req, res) => {
  const { before } = req.query; // cursor-based pagination

  try {
    const group = await Group.findOne({ code: req.params.code.toUpperCase() });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const query = { group: group._id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await GroupMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Reverse so oldest is first
    messages.reverse();

    res.json({
      messages,
      hasMore: messages.length === 50
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ─── GET GROUP DETAILS — wildcard, must be LAST among GET /:code/* routes ─
router.get('/:code', async (req, res) => {
  try {
    const group = await Group.findOne({ code: req.params.code.toUpperCase() });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// ─── REMOVE MEMBER (admin only) ─────────────────────────────
router.delete('/:code/remove-member', async (req, res) => {
  const { adminID, targetUserID } = req.body;

  try {
    const group = await Group.findOne({ code: req.params.code.toUpperCase() });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Check if requester is admin
    const isAdmin = group.admins.some(a => a.toString() === adminID);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    // Cannot remove creator
    if (group.creator.toString() === targetUserID) {
      return res.status(400).json({ error: 'Cannot remove the group creator' });
    }

    group.members = group.members.filter(m => m.user.toString() !== targetUserID);
    group.admins = group.admins.filter(a => a.toString() !== targetUserID);
    await group.save();

    // Remove group from user's groups list
    await User.findByIdAndUpdate(targetUserID, {
      $pull: { groups: group._id }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

  return router;
}
