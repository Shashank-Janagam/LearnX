import mongoose from 'mongoose';

// Define the User schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9_]{3,20}$/
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    default: 'Student'
  },
  stats: {
    totalQuizzes: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    recentTopic: {
      type: String,
      default: ''
    }
  },
  recentQuizzes: [
    {
      topic: String,
      score: Number,
      date: String
    }
  ],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LearningModule' }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  education: {
    degree: { type: String, default: '' },
    course: { type: String, default: '' },
    institution: { type: String, default: '' },
    role: { type: String, default: 'Not Mentioned' }
  }
});

// Text index for user search
userSchema.index({ name: 'text', username: 'text' });

userSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 3600, partialFilterExpression: { isVerified: false } }
);

// Export the model and explicitly map to 'Users' collection
const User = mongoose.models.User || mongoose.model('User', userSchema, 'Users');
export default User;
