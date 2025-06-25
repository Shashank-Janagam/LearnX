import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config'; // ✅ Load environment variables first

// 🔁 Route imports
import authRoutes from './routes/auth.js';
import queryRoutes from './routes/query.js';
import quizRoutes from './routes/quiz.js';
import history from './routes/history.js';
import profileRoutes from './routes/profileRoutes.js';

const app = express();
const port = process.env.PORT || 5000;

// ✅ MongoDB URI from .env
const mongoURI = process.env.MONGO_URI;

// ✅ Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

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

app.use(cors(corsOptions));

// ✅ Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());
app.use('/api/queries', queryRoutes); // 👈 register query route
app.use('/quiz',quizRoutes);
app.use('/api/profile', profileRoutes);
app.use('/auth', authRoutes); // ✅ Only this for now
app.use('/history', history); // 👈 add this
app.get('/', (req, res) => {
  res.send('API is running...');
});


// ✅ Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// ✅ Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
