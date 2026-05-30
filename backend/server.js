require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Session'],
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/careers', require('./routes/career.routes'));
app.use('/api/assessment', require('./routes/assessment.routes'));
app.use('/api/roadmap', require('./routes/roadmap.routes'));
app.use('/api/resume', require('./routes/resume.routes'));
app.use('/api/interview', require('./routes/interview.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/jobs', require('./routes/jobs.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('/api/health', (_, res) => {
  res.json({
    success: true,
    name: 'FutureForge AI',
    version: '1.0.0',
    gemini: Boolean(process.env.GEMINI_API_KEY),
    mongodb: Boolean(process.env.MONGODB_URI),
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.path}` });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const file = req.path === '/' ? 'index.html' : req.path.replace(/^\//, '');
  const target = path.join(frontendPath, file.endsWith('.html') ? file : `${file}.html`);
  res.sendFile(target, (err) => {
    if (err) res.sendFile(path.join(frontendPath, 'index.html'));
  });
});

async function start() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`FutureForge AI running at http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nPort ${PORT} is already in use.`);
      console.error('Fix: close the other app, or run:  set PORT=3000 && npm run dev\n');
      process.exit(1);
    }
    throw err;
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
