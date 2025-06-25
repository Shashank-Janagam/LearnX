import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 5000;

// ✅ Allow frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://getlearnxai.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// ✅ Test MongoDB connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Root route
app.get('/', (req, res) => {
  res.send('✅ Minimal server is running!');
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
