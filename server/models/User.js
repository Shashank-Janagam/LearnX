import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

// 🔐 Auto-hash password before saving if it has been modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🧼 Remove password when returning JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.models.User || mongoose.model('User', userSchema, 'Users');
export default User;
