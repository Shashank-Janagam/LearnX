import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config'; // ✅ LOAD THIS FIRST!

import authRoutes from './routes/auth.js'; // ✅ Your working auth routes
import queryRoutes from './routes/query.js'; // 👈 add this
import quizRoutes from './routes/quiz.js';
import history from './routes/history.js'; // 👈 add this
import profileRoutes from './routes/profileRoutes.js';
const app = express();
const port = process.env.PORT ||5000;

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.use(cors({
  origin: 'https://getlearnxai.vercel.app/', // 🔁 update with your actual Vercel domain
  credentials: true
}));app.use(express.json());
app.use('/api/queries', queryRoutes); // 👈 register query route
app.use('/quiz',quizRoutes);
app.use('/api/profile', profileRoutes);
app.use('/auth', authRoutes); // ✅ Only this for now
app.use('/history', history); // 👈 add this
app.get('/', (req, res) => {
  res.send('API is running...');
});




app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
