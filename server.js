require('dotenv').config();
const session = require('express-session');
const passport = require('./middleware/google.strategy');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(express.json());
app.use(cors());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
