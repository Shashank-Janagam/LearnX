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
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export the model and explicitly map to 'Users' collection
const User = mongoose.models.User || mongoose.model('User', userSchema, 'Users');
export default User;
