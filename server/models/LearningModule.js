import mongoose from 'mongoose';

const learningModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  topic: { type: String, required: true },
  
  // Ownership & Context
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['individual', 'group'], required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  
  // Schedule
  startDate: { type: Date, default: Date.now },
  
  // Quiz plan (AI-generated outline)
  quizzes: [{
    index: { type: Number, required: true },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    description: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'basic', 'intermediate', 'advanced', 'expert'], default: 'easy' },
    questionCount: { type: Number, default: 5 },
    unlockOffsetDays: { type: Number, required: true },
    unlockDate: { type: Date, required: true },
    
    // MCQs are generated on-demand when the first member clicks "Start Quiz"
    mcqs: [{
      question: String,
      options: [{
        text: String,
        isCorrect: Boolean
      }],
      explanation: String
    }],
    mcqsGeneratedAt: Date
  }],
  
  // Progress tracking per member (independent)
  progress: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    completedQuizzes: [{
      quizIndex: Number,
      score: Number,
      total: Number,
      completedAt: Date,
      wasOnTime: Boolean            // completed within 24 hours of the unlockDate
    }],
    overallScore: { type: Number, default: 0 },
    punctualityRate: { type: Number, default: 100 } // % of quizzes done on time
  }],
  
  status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
  totalQuizzes: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Index to quickly query active modules for scheduler or user dashboards
learningModuleSchema.index({ creator: 1 });
learningModuleSchema.index({ group: 1 });

const LearningModule = mongoose.models.LearningModule || mongoose.model('LearningModule', learningModuleSchema);
export default LearningModule;
