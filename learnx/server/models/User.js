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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the model
const User = mongoose.model('User', userSchema, 'Users'); // 👈 'Users' matches your Compass exactly
export default User;
