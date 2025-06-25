import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config';

// Import routes
import authRoutes from './routes/auth.js';
import queryRoutes from './routes/query.js';
import quizRoutes from './routes/quiz.js';
import historyRoutes from './routes/history.js';
import profileRoutes from './routes/profileRoutes.js';

const app = express();
const port = process.env.PORT || 5000;

// ✅ Define allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://getlearnxai.vercel.app'
];

// ✅ Full CORS config
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// ✅ Apply middleware
app.use(cors(corsOptions));
app.use(express.json());
app.options('*', cors(corsOptions)); // preflight

// ✅ Connect to MongoDB Atlas
// const mongoURI = process.env.MONGO_URI;
// mongoose.connect(mongoURI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
//   .then(() => console.log('✅ Connected to MongoDB'))
//   .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Register all routes
app.use('/auth', authRoutes);
app.use('/api/queries', queryRoutes);
app.use('/quiz', quizRoutes);
app.use('/history', historyRoutes);
app.use('/api/profile', profileRoutes);

// ✅ Root route
app.get('/', (req, res) => {
  res.send('✅ API is running...');
});

// ✅ Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
