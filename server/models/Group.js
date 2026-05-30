import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    default: '',
    maxlength: 200
  },
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  avatar: {
    type: String,
    default: '📚' // Default emoji avatar
  },
  color: {
    type: String,
    default: '#6C5CE7' // Default theme color
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    username: String,
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['admin', 'member'], default: 'member' }
  }],
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  maxMembers: {
    type: Number,
    default: 50
  },
  // Linked quiz rooms
  rooms: [{
    roomCode: String,
    topic: String,
    description: { type: String, default: '' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postedByName: String,
    postedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
    config: {
      count: { type: Number, default: 5 },
      timeLimit: { type: Number, default: 300 },
      difficulty: { type: String, default: 'easy' }
    }
  }],
  modules: [{
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningModule' },
    addedAt: { type: Date, default: Date.now }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Text index for searching groups by name
groupSchema.index({ name: 'text', description: 'text' });
// Index for looking up groups by member
groupSchema.index({ 'members.user': 1 });

const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);
export default Group;
