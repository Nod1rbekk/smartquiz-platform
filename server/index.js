const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classes');
const subjectRoutes = require('./routes/subjects');
const quizRoutes = require('./routes/quiz');
const resultRoutes = require('./routes/results');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Local development: serve React build and listen on port
if (process.env.NODE_ENV !== 'production') {
  const clientBuild = require('path').join(__dirname, '../client/dist');
  app.use(require('express').static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(require('path').join(clientBuild, 'index.html'));
  });
}

const PORT = process.env.PORT || 5001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
