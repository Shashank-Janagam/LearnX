import mongoose from 'mongoose';

const groupMessageSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for AI messages
  },
  senderName: {
    type: String,
    required: true
  },
  senderUsername: {
    type: String,
    default: null
  },
  isAI: {
    type: Boolean,
    default: false
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient paginated queries
groupMessageSchema.index({ group: 1, createdAt: -1 });

const GroupMessage = mongoose.models.GroupMessage || mongoose.model('GroupMessage', groupMessageSchema);
export default GroupMessage;
