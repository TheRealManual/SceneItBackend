require('dotenv').config();
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./middleware/google.strategy');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const movieRoutes = require('./routes/movie.routes');
const emailRoutes = require('./routes/email.routes');

// Connect to MongoDB (non-blocking)
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

// Session configuration
// Start with default MemoryStore, will upgrade to MongoStore once DB connects
const sessionConfig = {
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
};

// Try to use MongoStore if MongoDB URI is available
if (process.env.MONGODB_URI) {
  try {
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 24 * 3600,
      crypto: {
        secret: process.env.SESSION_SECRET || 'your_secret_key'
      },
      mongoOptions: {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      }
    });
    console.log('Session store: MongoDB');
  } catch (error) {
    console.warn('Failed to create MongoStore, using MemoryStore:', error.message);
  }
} else {
  console.warn('No MONGODB_URI provided, using MemoryStore for sessions');
}

app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/email', emailRoutes);

app.get('/', (_req, res) => res.json({ 
  message: 'SceneIt Backend API', 
  status: 'running',
  endpoints: {
    health: '/health',
    ping: '/api/ping',
    status: '/api/status'
  }
}));

app.get('/health', (_req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus];
  
  // Return 200 OK even if DB is not connected yet - allows health check to pass
  res.status(200).json({ 
    status: 'ok',
    database: dbStatusText,
    timestamp: new Date().toISOString()
  });
});

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
