import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  stats: {
    totalQuizzes: Number,
    averageScore: Number,
    recentTopic: String
  },
  recentQuizzes: [
    {
      topic: String,
      score: Number,
      date: String
    }
  ],
  education: {
    degree: { type: String, default: '' },
    course: { type: String, default: '' },
    institution: { type: String, default: '' },
    role:{type: String,default:''}
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema, 'Users');
export default User;
