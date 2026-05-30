import express from 'express';
import LearningModule from '../models/LearningModule.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import QuizResult from '../models/QuizResult.js';
import { generateLearningPlan } from '../utils/modulePlanner.js';
import { generateMCQs, generateReport } from '../utils/generateMCQs.js';

const router = express.Router();

// Helper function to update user stats
async function updateUserStats(userID, topic, scorePercentage) {
  try {
    const user = await User.findById(userID);
    if (user) {
      const newQuiz = {
        topic,
        score: scorePercentage,
        date: new Date().toLocaleDateString('en-IN')
      };
      
      user.recentQuizzes.push(newQuiz);
      if (user.recentQuizzes.length > 3) {
        user.recentQuizzes = user.recentQuizzes.slice(-3);
      }
      
      user.stats.totalQuizzes = (user.stats.totalQuizzes || 0) + 1;
      user.stats.averageScore = Math.round(
        user.recentQuizzes.reduce((sum, q) => sum + q.score, 0) / user.recentQuizzes.length
      );
      user.stats.recentTopic = topic;
      
      await user.save();
    }
  } catch (err) {
    console.error('❌ Failed to update user stats:', err);
  }
}

// Create an individual learning module
router.post('/create', async (req, res) => {
  const { topic, userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const plan = await generateLearningPlan(topic, user);
    const startDate = new Date();

    const quizzes = plan.quizzes.map((q) => {
      const unlockDate = new Date(startDate.getTime() + q.unlockOffsetDays * 24 * 60 * 60 * 1000);
      return {
        ...q,
        unlockDate,
        mcqs: []
      };
    });

    const newModule = new LearningModule({
      title: plan.title,
      description: plan.description,
      topic,
      creator: userId,
      type: 'individual',
      startDate,
      quizzes,
      totalQuizzes: quizzes.length,
      progress: [{
        user: userId,
        userName: user.name,
        completedQuizzes: [],
        overallScore: 0,
        punctualityRate: 100
      }]
    });

    const savedModule = await newModule.save();
    user.modules.push(savedModule._id);
    await user.save();

    res.status(201).json({ success: true, module: savedModule });
  } catch (error) {
    console.error('Error creating learning module:', error);
    res.status(500).json({ success: false, message: 'Failed to create learning module', error: error.message });
  }
});

// Create a group learning module
router.post('/create-group', async (req, res) => {
  const { topic, groupId, creatorId } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const creator = await User.findById(creatorId);
    if (!creator) {
      return res.status(404).json({ success: false, message: 'Creator not found' });
    }

    const plan = await generateLearningPlan(topic, creator);
    const startDate = new Date();

    const quizzes = plan.quizzes.map((q) => {
      const unlockDate = new Date(startDate.getTime() + q.unlockOffsetDays * 24 * 60 * 60 * 1000);
      return {
        ...q,
        unlockDate,
        mcqs: []
      };
    });

    const progress = group.members.map((m) => ({
      user: m.user,
      userName: m.name,
      completedQuizzes: [],
      overallScore: 0,
      punctualityRate: 100
    }));

    const newModule = new LearningModule({
      title: plan.title,
      description: plan.description,
      topic,
      creator: creatorId,
      type: 'group',
      group: groupId,
      startDate,
      quizzes,
      totalQuizzes: quizzes.length,
      progress
    });

    const savedModule = await newModule.save();
    group.modules.push({ module: savedModule._id });
    await group.save();

    // Also link it to the creator's individual list if desired
    creator.modules.push(savedModule._id);
    await creator.save();

    res.status(201).json({ success: true, module: savedModule });
  } catch (error) {
    console.error('Error creating group learning module:', error);
    res.status(500).json({ success: false, message: 'Failed to create group learning module', error: error.message });
  }
});

// Fetch all modules for a user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // Find all modules created by or tracking progress for this user
    const modules = await LearningModule.find({
      $or: [
        { creator: userId },
        { 'progress.user': userId }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, modules });
  } catch (error) {
    console.error('Error fetching user modules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch modules' });
  }
});

// Fetch modules assigned to a group
router.get('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    const modules = await LearningModule.find({ group: groupId }).sort({ createdAt: -1 });
    res.json({ success: true, modules });
  } catch (error) {
    console.error('Error fetching group modules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch group modules' });
  }
});

// Fetch a single module
router.get('/:moduleId', async (req, res) => {
  const { moduleId } = req.params;
  try {
    const module = await LearningModule.findById(moduleId).populate('group');
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }
    res.json({ success: true, module });
  } catch (error) {
    console.error('Error fetching single module:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch module' });
  }
});

// Get or generate questions for a specific quiz index in a module on demand
router.get('/:moduleId/quiz/:quizIndex/questions', async (req, res) => {
  const { moduleId, quizIndex } = req.params;
  const { userId } = req.query;

  try {
    const module = await LearningModule.findById(moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const idx = parseInt(quizIndex);
    const quiz = module.quizzes.find((q) => q.index === idx);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz index not found in module' });
    }

    // Check if the quiz is unlocked
    if (new Date() < new Date(quiz.unlockDate)) {
      return res.status(403).json({ success: false, message: 'This quiz is still locked' });
    }

    // If MCQs are already generated, return them immediately
    if (quiz.mcqs && quiz.mcqs.length > 0) {
      return res.json({ success: true, mcqs: quiz.mcqs, topic: quiz.topic, title: quiz.title });
    }

    // Otherwise, generate MCQs on-demand
    const user = await User.findById(userId || module.creator);
    const profileData = user || { name: 'Student', education: {}, stats: {} };

    console.log(`🤖 Generating MCQs on demand for Module "${module.title}", Quiz "${quiz.title}"...`);
    const mcqs = await generateMCQs(quiz.topic, quiz.questionCount, profileData, quiz.difficulty);

    if (!mcqs || mcqs.length === 0) {
      return res.status(500).json({ success: false, message: 'Failed to generate MCQs from AI' });
    }

    // Save the MCQs to the module so subsequent attempts share the same set
    quiz.mcqs = mcqs;
    quiz.mcqsGeneratedAt = new Date();
    await module.save();

    res.json({ success: true, mcqs, topic: quiz.topic, title: quiz.title });
  } catch (error) {
    console.error('Error getting/generating quiz questions:', error);
    res.status(500).json({ success: false, message: 'Failed to get/generate quiz questions', error: error.message });
  }
});

// Submit user answers for a quiz
router.post('/:moduleId/quiz/:quizIndex/submit', async (req, res) => {
  const { moduleId, quizIndex } = req.params;
  const { userId, responses, score, total, timeTaken } = req.body;

  try {
    const module = await LearningModule.findById(moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const idx = parseInt(quizIndex);
    const quiz = module.quizzes.find((q) => q.index === idx);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found in module' });
    }

    // Find the user's progress record or create one (in case they joined the group late)
    let userProgress = module.progress.find((p) => p.user && p.user.toString() === userId.toString());
    if (!userProgress) {
      userProgress = {
        user: userId,
        userName: user.name,
        completedQuizzes: [],
        overallScore: 0,
        punctualityRate: 100
      };
      module.progress.push(userProgress);
      // Re-query to get reference
      userProgress = module.progress[module.progress.length - 1];
    }

    // Check if the user already completed this quiz
    const alreadyDone = userProgress.completedQuizzes.find((cq) => cq.quizIndex === idx);
    if (alreadyDone) {
      return res.status(400).json({ success: false, message: 'You have already completed this quiz' });
    }

    // Check punctuality (was completed within 24 hours of unlockDate)
    const timeLimitForPunctuality = new Date(quiz.unlockDate).getTime() + 24 * 60 * 60 * 1000;
    const wasOnTime = Date.now() <= timeLimitForPunctuality;

    // Add completed quiz entry
    userProgress.completedQuizzes.push({
      quizIndex: idx,
      score,
      total,
      completedAt: new Date(),
      wasOnTime
    });

    // Update member's overall statistics for this module
    const completedCount = userProgress.completedQuizzes.length;
    const totalQuizScorePercentage = userProgress.completedQuizzes.reduce((sum, q) => sum + (q.score / q.total) * 100, 0);
    userProgress.overallScore = Math.round(totalQuizScorePercentage / completedCount);

    const onTimeCount = userProgress.completedQuizzes.filter((q) => q.wasOnTime).length;
    userProgress.punctualityRate = Math.round((onTimeCount / completedCount) * 100);

    // Save module changes
    await module.save();

    // 1. Generate an AI Report for the attempt
    const report = await generateReport(
      responses, 
      quiz.topic, 
      score, 
      total, 
      timeTaken || 300, 
      0, 
      user
    );

    // 2. Save result to general QuizHistory so it populates their general profile
    const qResult = new QuizResult({
      userID: userId,
      email: user.email,
      topic: `${module.title} - ${quiz.title}`,
      score,
      total,
      responses,
      report,
      createdAt: new Date()
    });
    await qResult.save();

    // 3. Atomically update the user's global statistics
    const scorePercentage = Math.floor((score / total) * 100);
    await updateUserStats(userId, quiz.topic, scorePercentage);

    res.json({
      success: true,
      score,
      total,
      wasOnTime,
      report,
      progress: {
        completedCount,
        totalQuizzes: module.totalQuizzes,
        overallScore: userProgress.overallScore,
        punctualityRate: userProgress.punctualityRate
      }
    });

  } catch (error) {
    console.error('Error submitting quiz answers:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quiz answers', error: error.message });
  }
});

// Unlock a quiz index early (for group/individual modules)
router.post('/:moduleId/quiz/:quizIndex/unlock-early', async (req, res) => {
  const { moduleId, quizIndex } = req.params;
  const userId = req.body.userId || req.body.userID;

  try {
    const module = await LearningModule.findById(moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const idx = parseInt(quizIndex);
    const quiz = module.quizzes.find((q) => q.index === idx);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found in module' });
    }

    // Permission check: if this is a group module, user must be group admin/creator
    if (module.type === 'group') {
      const group = await Group.findById(module.group);
      if (!group) {
        return res.status(404).json({ success: false, message: 'Associated group not found' });
      }

      const isCreator = group.creator && userId && group.creator.toString() === userId.toString();
      const isAdminInMembers = group.members && userId && group.members.some(
        (m) => m.user && m.user.toString() === userId.toString() && m.role === 'admin'
      );

      if (!isCreator && !isAdminInMembers) {
        return res.status(403).json({ success: false, message: 'Only group admins can unlock quizzes early' });
      }
    } else {
      // For individual modules, the creator can unlock it
      if (!module.creator || !userId || module.creator.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'Only the module creator can unlock quizzes early' });
      }
    }

    // Unlock early: set the unlockDate to now
    quiz.unlockDate = new Date();
    await module.save();

    res.json({ success: true, message: 'Quiz unlocked early successfully', unlockDate: quiz.unlockDate });
  } catch (error) {
    console.error('Error unlocking quiz early:', error);
    res.status(500).json({ success: false, message: 'Failed to unlock quiz early', error: error.message });
  }
});

export default router;
