require('dotenv').config();
const session = require('express-session');
const passport = require('./middleware/google.strategy');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

// Connect to MongoDB
connectDB();

const app = express();

// Configure CORS to allow credentials - SIMPLIFIED
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://main.d1ur5bc2o4pggx.amplifyapp.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  proxy: true, // Trust the reverse proxy
  name: 'sceneit.sid', // Custom cookie name
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);

app.get('/', (_req, res) => res.json({ 
  message: 'SceneIt Backend API', 
  status: 'running',
  endpoints: {
    health: '/health',
    ping: '/api/ping',
    status: '/api/status'
  }
}));

app.get('/health', (_req, res) => res.status(200).send('ok'));
app.get('/api/ping', (_req, res) => res.json({ ok: true }));
app.get('/api/status', (_req, res) => res.json({ 
  status: 'success',
  message: 'Backend is connected and running!',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'production'
}));

// Error handling middleware - must be AFTER all routes
app.use((err, req, res, next) => {
  console.error('Error middleware caught:', err);
  console.error('Request path:', req.path);
  console.error('Request method:', req.method);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 3000;

// Log startup info
console.log('Starting SceneIt Backend...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', PORT);
console.log('Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:5173');
console.log('Google OAuth configured:', !!process.env.AUTH_GOOGLE_ID);
console.log('MongoDB URI configured:', !!process.env.MONGODB_URI);

app.listen(PORT, () => {
  console.log(`API listening on ${PORT}`);
  console.log('Server is ready!');
});
