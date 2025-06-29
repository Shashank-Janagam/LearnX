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
  createdAt: {
    type: Date,
    default: Date.now
  },
  education: {
  degree: { type: String, default: '' },
  course: { type: String, default: '' },
  institution: { type: String, default: '' },
  role:{type:String,default:'Not Mentioned'}
}

});
userSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60, partialFilterExpression: { isVerified: false } }
);
// Export the model and explicitly map to 'Users' collection
const User = mongoose.models.User || mongoose.model('User', userSchema, 'Users');
export default User;
