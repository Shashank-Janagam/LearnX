import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/auth.js'; // ✅ Your working auth routes

const app = express();
const port = 5000;

const mongoURI = 'mongodb://127.0.0.1:27017/learnx'; // ⚠️ Case-sensitive! Use `learnx`, not `LearnX`

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes); // ✅ Only this for now

app.get('/', (req, res) => {
  res.send('API is running...');
});




app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
