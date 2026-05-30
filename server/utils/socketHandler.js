import Room from '../models/Room.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import GroupMessage from '../models/GroupMessage.js';
import { generateMCQs } from './generateMCQs.js';
import { generateGroupAIResponse } from './groupChatAI.js';

// In-memory room state for active quizzes
const activeRooms = new Map();

export function initializeSocket(io) {
  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // Join a room
    socket.on('room:join', async ({ roomCode, userID }) => {
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        if (!room) {
          socket.emit('room:error', { message: 'Room not found' });
          return;
        }

        if (room.status !== 'waiting') {
          socket.emit('room:error', { message: 'Quiz already started or completed' });
          return;
        }

        if (room.participants.length >= 10) {
          socket.emit('room:error', { message: 'Room is full (max 10 participants)' });
          return;
        }

        const user = await User.findById(userID);
        if (!user) {
          socket.emit('room:error', { message: 'User not found' });
          return;
        }

        // Check if already in room
        const alreadyJoined = room.participants.some(
          p => p.user.toString() === userID
        );

        if (!alreadyJoined) {
          room.participants.push({
            user: userID,
            name: user.name,
            username: user.username || null,
            score: 0,
            total: 0
          });
          await room.save();
        }

        // Join socket room
        socket.join(roomCode.toUpperCase());
        socket.data = { roomCode: roomCode.toUpperCase(), userID };

        // Notify all in room
        io.to(roomCode.toUpperCase()).emit('room:state', {
          participants: room.participants,
          status: room.status,
          config: room.config,
          topic: room.topic,
          host: room.host.toString(),
          roomCode: room.roomCode
        });

        socket.to(roomCode.toUpperCase()).emit('room:participant-joined', {
          user: {
            _id: userID,
            name: user.name,
            username: user.username
          }
        });

        console.log('👤 ' + user.name + ' joined room ' + roomCode);
      } catch (err) {
        console.error('Room join error:', err);
        socket.emit('room:error', { message: 'Failed to join room' });
      }
    });

    // Host starts the quiz
    socket.on('room:start', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        if (!room) {
          socket.emit('room:error', { message: 'Room not found' });
          return;
        }

        if (room.host.toString() !== socket.data?.userID) {
          socket.emit('room:error', { message: 'Only the host can start the quiz' });
          return;
        }

        if (room.status !== 'waiting') {
          socket.emit('room:error', { message: 'Quiz already started' });
          return;
        }

        // Get profile data for MCQ generation
        const hostUser = await User.findById(room.host);
        const profileData = {
          name: hostUser.name,
          education: hostUser.education,
          stats: hostUser.stats,
          recentQuizzes: hostUser.recentQuizzes
        };

        // Generate MCQs
        console.log('🎯 Generating MCQs for room ' + roomCode + '...');
        const mcqs = await generateMCQs(
          room.topic,
          room.config.count,
          profileData,
          room.config.difficulty
        );

        if (!mcqs || mcqs.length === 0) {
          socket.emit('room:error', { message: 'Failed to generate questions' });
          return;
        }

        // Update room
        room.status = 'active';
        room.mcqs = mcqs;
        room.startedAt = new Date();
        await room.save();

        // Store active room state
        const endTime = new Date(Date.now() + room.config.timeLimit * 1000);
        activeRooms.set(roomCode.toUpperCase(), {
          submittedUsers: new Set(),
          totalParticipants: room.participants.length,
          endTime
        });

        // Start timer to auto-complete
        setTimeout(async () => {
          await completeRoom(io, roomCode.toUpperCase());
        }, room.config.timeLimit * 1000);

        // Send MCQs to all participants
        io.to(roomCode.toUpperCase()).emit('room:started', {
          mcqs,
          startTime: room.startedAt.toISOString(),
          endTime: endTime.toISOString(),
          timeLimit: room.config.timeLimit
        });

        console.log('🚀 Room ' + roomCode + ' started with ' + mcqs.length + ' questions');
      } catch (err) {
        console.error('Room start error:', err);
        socket.emit('room:error', { message: 'Failed to start quiz' });
      }
    });

    // User submits answers
    socket.on('room:submit', async ({ roomCode, answers, userID: submitterID }) => {
      try {
        const code = roomCode.toUpperCase();
        const room = await Room.findOne({ roomCode: code });
        if (!room || room.status !== 'active') return;

        const uid = submitterID || socket.data?.userID;
        const activeRoom = activeRooms.get(code);
        if (!activeRoom || activeRoom.submittedUsers.has(uid)) return;

        // Calculate score
        let score = 0;
        const mcqs = room.mcqs;
        mcqs.forEach((mcq, index) => {
          if (answers[index] !== undefined) {
            const selectedOption = mcq.options[answers[index]];
            if (selectedOption?.isCorrect) score++;
          }
        });

        // Update participant in DB
        const participant = room.participants.find(
          p => p.user.toString() === uid
        );
        if (participant) {
          participant.score = score;
          participant.total = mcqs.length;
          participant.completedAt = new Date();
          await room.save();
        }

        activeRoom.submittedUsers.add(uid);

        // Notify others
        io.to(code).emit('room:participant-submitted', {
          userId: uid,
          name: participant?.name || 'Unknown',
          score,
          total: mcqs.length,
          submittedCount: activeRoom.submittedUsers.size,
          totalParticipants: activeRoom.totalParticipants
        });

        console.log('✅ ' + (participant?.name || uid) + ' submitted in room ' + code + ': ' + score + '/' + mcqs.length);

        // Check if all submitted
        if (activeRoom.submittedUsers.size >= activeRoom.totalParticipants) {
          await completeRoom(io, code);
        }
      } catch (err) {
        console.error('Submit error:', err);
        socket.emit('room:error', { message: 'Failed to submit answers' });
      }
    });

    // Leave room
    socket.on('room:leave', async ({ roomCode }) => {
      const code = roomCode.toUpperCase();
      socket.leave(code);
      io.to(code).emit('room:participant-left', {
        userId: socket.data?.userID
      });
    });

    // ─── GROUP CHAT EVENTS ────────────────────────────────────

    // Join group chat room
    socket.on('group:join-chat', async ({ groupCode, userID }) => {
      try {
        const group = await Group.findOne({ code: groupCode.toUpperCase() });
        if (!group) {
          socket.emit('group:error', { message: 'Group not found' });
          return;
        }

        const isMember = group.members.some(m => m.user.toString() === userID);
        if (!isMember) {
          socket.emit('group:error', { message: 'You are not a member of this group' });
          return;
        }

        const socketRoom = `group:${groupCode.toUpperCase()}`;
        socket.join(socketRoom);
        socket.data = { ...socket.data, groupCode: groupCode.toUpperCase(), userID };

        console.log('💬 User joined group chat:', groupCode);
      } catch (err) {
        console.error('Group join-chat error:', err);
        socket.emit('group:error', { message: 'Failed to join group chat' });
      }
    });

    // Send message in group chat
    socket.on('group:send-message', async ({ groupCode, userID, content }) => {
      try {
        const code = groupCode.toUpperCase();
        const group = await Group.findOne({ code });
        if (!group) return;

        const user = await User.findById(userID);
        if (!user) return;

        // Verify membership
        const isMember = group.members.some(m => m.user.toString() === userID);
        if (!isMember) return;

        // Save user message
        const message = new GroupMessage({
          group: group._id,
          sender: userID,
          senderName: user.name,
          senderUsername: user.username || null,
          isAI: false,
          content: content.trim()
        });
        await message.save();

        // Update group last activity
        group.lastActivity = new Date();
        await group.save();

        // Broadcast to all in group chat
        const socketRoom = `group:${code}`;
        io.to(socketRoom).emit('group:new-message', {
          _id: message._id,
          group: group._id,
          sender: userID,
          senderName: user.name,
          senderUsername: user.username || null,
          isAI: false,
          content: content.trim(),
          createdAt: message.createdAt
        });

        // Check if message triggers AI (@ai prefix)
        const trimmed = content.trim();
        if (trimmed.toLowerCase().startsWith('@ai')) {
          const aiQuery = trimmed.slice(3).trim();
          if (aiQuery.length > 0) {
            // Fetch recent messages for context
            const recentMessages = await GroupMessage.find({ group: group._id })
              .sort({ createdAt: -1 })
              .limit(10)
              .lean();
            recentMessages.reverse();

            // Generate AI response
            const aiResponse = await generateGroupAIResponse(
              aiQuery,
              recentMessages,
              group.name,
              user.name
            );

            // Save AI message
            const aiMessage = new GroupMessage({
              group: group._id,
              sender: null,
              senderName: 'LearnX AI',
              senderUsername: 'learnx-ai',
              isAI: true,
              content: aiResponse
            });
            await aiMessage.save();

            // Broadcast AI response
            io.to(socketRoom).emit('group:new-message', {
              _id: aiMessage._id,
              group: group._id,
              sender: null,
              senderName: 'LearnX AI',
              senderUsername: 'learnx-ai',
              isAI: true,
              content: aiResponse,
              createdAt: aiMessage.createdAt
            });

            console.log('🤖 AI responded in group:', code);
          }
        }

        console.log('💬 Message in group ' + code + ' from ' + user.name);
      } catch (err) {
        console.error('Group send-message error:', err);
        socket.emit('group:error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('group:typing', ({ groupCode, userName }) => {
      const socketRoom = `group:${groupCode.toUpperCase()}`;
      socket.to(socketRoom).emit('group:user-typing', { userName });
    });

    // Leave group chat
    socket.on('group:leave-chat', ({ groupCode }) => {
      const socketRoom = `group:${groupCode.toUpperCase()}`;
      socket.leave(socketRoom);
    });

    // ─── DISCONNECT ───────────────────────────────────────────

    // Disconnect
    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected:', socket.id);
      if (socket.data?.roomCode) {
        io.to(socket.data.roomCode).emit('room:participant-left', {
          userId: socket.data.userID
        });
      }
    });
  });

  console.log('✅ Socket.io initialized');
}

async function completeRoom(io, roomCode) {
  try {
    const room = await Room.findOne({ roomCode });
    if (!room || room.status === 'completed') return;

    room.status = 'completed';
    room.completedAt = new Date();
    await room.save();

    // Build leaderboard
    const leaderboard = room.participants
      .sort((a, b) => {
        const scoreA = a.total > 0 ? (a.score / a.total) * 100 : 0;
        const scoreB = b.total > 0 ? (b.score / b.total) * 100 : 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (a.completedAt && b.completedAt) {
          return new Date(a.completedAt) - new Date(b.completedAt);
        }
        return 0;
      })
      .map((p, index) => ({
        rank: index + 1,
        name: p.name,
        username: p.username,
        userId: p.user.toString(),
        score: p.score,
        total: p.total,
        percentage: p.total > 0 ? Math.round((p.score / p.total) * 100) : 0,
        completedAt: p.completedAt
      }));

    io.to(roomCode).emit('room:completed', { leaderboard, topic: room.topic });

    // Cleanup
    activeRooms.delete(roomCode);
    console.log('🏁 Room ' + roomCode + ' completed');
  } catch (err) {
    console.error('Complete room error:', err);
  }
}
