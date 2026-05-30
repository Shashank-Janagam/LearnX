import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true, index: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  config: {
    count: { type: Number, default: 5 },
    timeLimit: { type: Number, default: 300 },
    difficulty: { type: String, default: 'easy' }
  },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    username: String,
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    completedAt: Date
  }],
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting'
  },
  mcqs: [{ type: mongoose.Schema.Types.Mixed }],
  startedAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
export default Room;
