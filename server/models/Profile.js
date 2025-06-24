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
  ]
});

const User = mongoose.models.User || mongoose.model('User', userSchema, 'Users'); 
export default User;
