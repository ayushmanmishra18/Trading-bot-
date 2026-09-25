const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const JWT = () => process.env.JWT_SECRET || 'dev-secret';
const PAPER_CASH = parseFloat(process.env.PAPER_CASH || '100000');

async function getUserModel() {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) return require('../models/User');
  return null;
}

// In-memory fallback for demo without Atlas
const memUsers = global.__memUsers || (global.__memUsers = new Map());

router.post('/register',
  body('email').isEmail(), body('password').isLength({ min: 6 }), body('name').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const hash = await bcrypt.hash(password, 10);
    const User = await getUserModel();
    try {
      if (User) {
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ error: 'Email already used' });
        const u = await User.create({ name, email, passwordHash: hash, cash: PAPER_CASH });
        const token = jwt.sign({ id: u._id, email }, JWT(), { expiresIn: '7d' });
        return res.json({ token, user: { id: u._id, name, email, cash: u.cash } });
      }
      if (memUsers.has(email)) return res.status(400).json({ error: 'Email already used' });
      const u = { id: email, name, email, cash: PAPER_CASH };
      memUsers.set(email, { ...u, passwordHash: hash });
      const token = jwt.sign({ id: email, email }, JWT(), { expiresIn: '7d' });
      return res.json({ token, user: u });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  });

router.post('/login',
  body('email').isEmail(), body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    const User = await getUserModel();
    try {
      if (User) {
        const u = await User.findOne({ email });
        if (!u || !(await bcrypt.compare(password, u.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: u._id, email }, JWT(), { expiresIn: '7d' });
        return res.json({ token, user: { id: u._id, name: u.name, email, cash: u.cash } });
      }
      const u = memUsers.get(email);
      if (!u || !(await bcrypt.compare(password, u.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: u.id, email }, JWT(), { expiresIn: '7d' });
      return res.json({ token, user: { id: u.id, name: u.name, email, cash: u.cash } });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  });

module.exports = router;
