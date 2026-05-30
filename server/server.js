import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import 'dotenv/config';
import authRoutes from './routes/auth.js';
import queryRoutes from './routes/query.js';
import quizRoutes from './routes/quiz.js';
import historyRoutes from './routes/history.js';
import profileRoutes from './routes/profileRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import { initializeSocket } from './utils/socketHandler.js';
import { startModuleScheduler } from './utils/moduleScheduler.js';

const app = express();
const port = process.env.PORT || 5000;

// Allow frontend origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://getlearnxai.vercel.app',
  process.env.CORS_ORIGIN
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin === 'null') {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked for origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api/queries', queryRoutes);
app.use('/quiz', quizRoutes);
app.use('/history', historyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/modules', moduleRoutes);

// Create HTTP server and attach Socket.io
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Initialize Socket.io handler
initializeSocket(io);

// MongoDB connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
.then(() => {
  console.log('✅ Connected to MongoDB');
  startModuleScheduler();
})
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Root route
app.get('/', (req, res) => {
  res.send('✅ LearnX server is running!');
});

httpServer.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
  console.log('🔌 Socket.io ready for connections');
});
