// Load libraries
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

dotenv.config(); // Load .env secrets

const app = express();
app.use(cors()); // Allow all origins
app.use(express.json()); // Parse JSON in request bodies

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User model schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['Admin', 'Member'], default: 'Member' },
  tenantId: String // Simple string for tenant identifier
});

const User = mongoose.model('User', userSchema);

// Register user API (for testing, creates users)
app.post('/register', async (req, res) => {
  const { email, password, role, tenantId } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashedPassword, role, tenantId });
    res.json({ message: 'User created successfully' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Login API - verifies user and returns JWT token
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const correctPass = await bcrypt.compare(password, user.password);
    if (!correctPass) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { userId: user._id, tenantId: user.tenantId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check API
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Import routes
const notesRoutes = require('./notes');
app.use('/notes', notesRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));