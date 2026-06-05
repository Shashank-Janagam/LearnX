import Room from '../models/Room.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import GroupMessage from '../models/GroupMessage.js';
import LearningModule from '../models/LearningModule.js';
import QuizResult from '../models/QuizResult.js';
import { generateGroupMCQs } from './generateMCQs.js';
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

        // Generate challenging MCQs for group competition
        console.log('🎯 Generating group MCQs for room ' + roomCode + '...');
        const mcqs = await generateGroupMCQs(
          room.topic,
          room.config.count,
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

        // Save detailed QuizResult for question-by-question responses
        try {
          const userObj = await User.findById(uid);
          if (userObj) {
            const reportText = `Multiplayer Room ${code} Quiz on ${room.topic}. Score: ${score}/${mcqs.length}`;
            const responses = mcqs.map((mcq, idx) => {
              const selectedIdx = answers[idx];
              const selectedText = selectedIdx !== undefined ? mcq.options[selectedIdx]?.text : "No Answer";
              const correctOptionObj = mcq.options.find(o => o.isCorrect);
              const correctText = correctOptionObj ? correctOptionObj.text : "";
              return {
                question: mcq.question,
                selectedOption: selectedText,
                correctOption: correctText,
                isCorrect: selectedIdx !== undefined ? !!mcq.options[selectedIdx]?.isCorrect : false,
                explanation: mcq.explanation || ""
              };
            });

            const quizResult = new QuizResult({
              userID: uid,
              email: userObj.email,
              topic: room.topic + ' (Group)',
              score: score,
              total: mcqs.length,
              report: reportText,
              responses: responses,
              createdAt: new Date()
            });
            await quizResult.save();
          }
        } catch (saveResErr) {
          console.error('Failed to save QuizResult for room submit:', saveResErr.message);
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

            // Fetch group study context details for the AI (Group level only, no individual personal stats)
            let groupStatsContext = "";
            try {
              const memberIds = group.members.map(m => m.user);
              const users = await User.find({ _id: { $in: memberIds } }).select('name username').lean();
              
              const roomCodes = group.rooms.map(r => r.roomCode);
              const detailedRooms = await Room.find({ roomCode: { $in: roomCodes } }).lean();
              const modules = await LearningModule.find({ group: group._id }).lean();

              groupStatsContext = `Here is the current study progress, quizzes, and modules context for this group:\n\n=== MEMBERS ===\n`;
              if (users.length === 0) {
                groupStatsContext += `No members found.\n`;
              } else {
                users.forEach(u => {
                  groupStatsContext += `- ${u.name} (@${u.username || 'user'})\n`;
                });
              }

              groupStatsContext += `\n=== GROUP QUIZ ROOMS (ATTENDED IN THIS GROUP) ===\n`;
              if (detailedRooms.length === 0) {
                groupStatsContext += `No quiz rooms have been created in this group yet.\n`;
              } else {
                detailedRooms.forEach(rm => {
                  groupStatsContext += `- Room ${rm.roomCode} (Topic: "${rm.topic}", Status: ${rm.status})\n`;
                  if (rm.participants && rm.participants.length > 0) {
                    groupStatsContext += `  * Participants & Scores:\n`;
                    rm.participants.forEach(p => {
                      groupStatsContext += `    - ${p.name} (@${p.username || 'user'}): ${p.score}/${p.total} correct\n`;
                    });
                  } else {
                    groupStatsContext += `  * No participants recorded yet.\n`;
                  }
                });
              }

              groupStatsContext += `\n=== MODULES & PROGRESS ===\n`;
              if (modules.length === 0) {
                groupStatsContext += `No modules created for this group yet.\n`;
              } else {
                modules.forEach(m => {
                  groupStatsContext += `- Module: "${m.title}" (Topic: "${m.topic}", Status: ${m.status || 'active'}, Quizzes: ${m.totalQuizzes})\n`;
                  if (m.progress && m.progress.length > 0) {
                    groupStatsContext += `  * Member Progress:\n`;
                    m.progress.forEach(p => {
                      const completedCount = p.completedQuizzes ? p.completedQuizzes.length : 0;
                      groupStatsContext += `    - ${p.userName}: ${completedCount}/${m.totalQuizzes} quizzes done (Overall score: ${p.overallScore}%, Punctuality: ${p.punctualityRate}%)\n`;
                    });
                  } else {
                    groupStatsContext += `  * No progress registered yet.\n`;
                  }
                });
              }

              // Query recent QuizResults for this group's members on group-relevant topics to extract wrong attempts
              const groupTopics = [
                ...detailedRooms.map(rm => rm.topic + ' (Group)'),
                ...modules.map(m => m.topic)
              ];
              const recentResults = await QuizResult.find({
                userID: { $in: memberIds },
                topic: { $in: groupTopics }
              }).sort({ createdAt: -1 }).limit(10).lean();

              groupStatsContext += `\n=== WRONGLY ATTEMPTED QUESTIONS IN RECENT GROUP QUIZZES ===\n`;
              if (recentResults.length === 0) {
                groupStatsContext += `No recent wrong answers recorded in this group.\n`;
              } else {
                recentResults.forEach(res => {
                  const userName = users.find(u => u._id.toString() === res.userID.toString())?.name || 'A member';
                  const wrongAnswers = res.responses.filter(r => !r.isCorrect);
                  if (wrongAnswers.length > 0) {
                    groupStatsContext += `- Quiz: "${res.topic}", User: ${userName} (Score: ${res.score}/${res.total}):\n`;
                    wrongAnswers.slice(0, 3).forEach((wa, wIdx) => {
                      groupStatsContext += `  * Missed Question ${wIdx+1}: "${wa.question}"\n`;
                      groupStatsContext += `    - Selected/Chosen Answer: "${wa.selectedOption || 'None'}"\n`;
                      groupStatsContext += `    - Correct Answer: "${wa.correctOption}"\n`;
                      if (wa.explanation) {
                        groupStatsContext += `    - Explanation: "${wa.explanation}"\n`;
                      }
                    });
                  }
                });
              }
            } catch (err) {
              console.error('Error compiling group stats context:', err);
              groupStatsContext = "Could not fetch group quiz and module details.";
            }

            // Generate AI response
            const aiResponse = await generateGroupAIResponse(
              aiQuery,
              recentMessages,
              group.name,
              user.name,
              groupStatsContext
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

    // Auto-submit for participants who never submitted (give them 0 score)
    const activeRoom = activeRooms.get(roomCode);
    const submittedUsers = activeRoom?.submittedUsers || new Set();

    for (const participant of room.participants) {
      const uid = participant.user.toString();
      if (!submittedUsers.has(uid)) {
        // Mark them as auto-submitted with 0 score
        participant.score = 0;
        participant.total = room.mcqs?.length || 0;
        participant.completedAt = new Date();

        // Save a QuizResult with no-answer responses
        try {
          const userObj = await User.findById(uid);
          if (userObj && room.mcqs) {
            const reportText = `Multiplayer Room ${roomCode} Quiz on ${room.topic}. Score: 0/${room.mcqs.length} (Auto-submitted on timeout)`;
            const responses = room.mcqs.map((mcq) => {
              const correctOptionObj = mcq.options.find(o => o.isCorrect);
              return {
                question: mcq.question,
                selectedOption: 'No Answer',
                correctOption: correctOptionObj ? correctOptionObj.text : '',
                isCorrect: false,
                explanation: mcq.explanation || ''
              };
            });

            const quizResult = new QuizResult({
              userID: uid,
              email: userObj.email,
              topic: room.topic + ' (Group)',
              score: 0,
              total: room.mcqs.length,
              report: reportText,
              responses: responses,
              createdAt: new Date()
            });
            await quizResult.save();
          }
        } catch (autoSaveErr) {
          console.error('Failed to auto-save QuizResult for timed-out user:', autoSaveErr.message);
        }

        console.log(`⏱️ Auto-submitted (timeout) for user ${uid} in room ${roomCode}`);
      }
    }

    room.status = 'completed';
    room.completedAt = new Date();
    await room.save();

    // Also sync status in the Group subdocument so the rooms tab shows it correctly
    try {
      await Group.updateOne(
        { 'rooms.roomCode': roomCode },
        { $set: { 'rooms.$.status': 'completed' } }
      );
    } catch (syncErr) {
      console.warn('Could not sync group room status:', syncErr.message);
    }

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

    // ── Save group quiz scores to each participant's profile ──
    try {
      const today = new Date().toLocaleDateString('en-IN');
      await Promise.all(
        room.participants.map(async (p) => {
          try {
            const user = await User.findById(p.user);
            if (!user) return;
            const percentage = p.total > 0 ? Math.round((p.score / p.total) * 100) : 0;
            const newQuiz = {
              topic: room.topic + ' (Group)',
              score: percentage,
              date: today
            };
            user.recentQuizzes.push(newQuiz);
            if (user.recentQuizzes.length > 3) {
              user.recentQuizzes = user.recentQuizzes.slice(-3);
            }
            user.stats.totalQuizzes = (user.stats.totalQuizzes || 0) + 1;
            user.stats.averageScore = Math.round(
              user.recentQuizzes.reduce((sum, q) => sum + q.score, 0) / user.recentQuizzes.length
            );
            user.stats.recentTopic = room.topic;
            await user.save();
          } catch (userErr) {
            console.error('Failed to update profile for user', p.user, userErr.message);
          }
        })
      );
      console.log('📊 Updated profiles for', room.participants.length, 'participants in room', roomCode);
    } catch (profileErr) {
      console.error('Profile update batch error:', profileErr.message);
    }

    // Cleanup
    activeRooms.delete(roomCode);
    console.log('🏁 Room ' + roomCode + ' completed');
  } catch (err) {
    console.error('Complete room error:', err);
  }
}
