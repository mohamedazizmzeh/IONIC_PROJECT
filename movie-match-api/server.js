require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));    // pour les photos base64

// DB
connectDB();

// Routes
app.use('/api/auth',   require('./routes/auth.routes'));
app.use('/api/users',  require('./routes/user.routes'));
app.use('/api/movies', require('./routes/movie.routes'));
app.use('/api/matches', require('./routes/match.routes'));

// Health check
app.get('/', (req, res) => res.json({ ok: true, message: 'Movie Match API' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API sur http://localhost:${PORT}`));