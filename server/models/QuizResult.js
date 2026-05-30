// models/QuizResult.js
import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  topic: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  report: { type: String, required: true }, // JSON string of the report
  responses: [
    {
      question: String,
      selectedOption: String,
      correctOption: String,
      isCorrect: Boolean,
    explanation: String // Optional field for question explanation
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('QuizResult', quizResultSchema);
