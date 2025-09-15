const express = require('express');
const router = express.Router();
const authenticate = require('./authenticate');

// In-memory Note storage. Use a DB for production apps.
const notes = [];

// Create a note
router.post('/', authenticate, (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.userId;
  const tenantId = req.user.tenantId;

  const note = {
    id: notes.length + 1,
    title,
    content,
    userId,
    tenantId,
  };
  notes.push(note);
  res.status(201).json(note);
});

// Get notes for tenant
router.get('/', authenticate, (req, res) => {
  const tenantNotes = notes.filter(note => note.tenantId === req.user.tenantId);
  res.json(tenantNotes);
});

module.exports = router;