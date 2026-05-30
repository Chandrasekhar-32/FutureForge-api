const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { signToken, memoryUsers } = require('../middleware/auth');

function memId() {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required' });
    }
    if (mongoose.connection.readyState === 1) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
      const hash = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hash });
      const token = signToken(user);
      return res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    }
    const id = memId();
    const user = { _id: id, id, name, email, password: await bcrypt.hash(password, 10) };
    memoryUsers.set(id, user);
    const token = signToken(user);
    res.status(201).json({ success: true, token, user: { id, name, email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const token = signToken(user);
      return res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, targetCareer: user.targetCareer, targetCareerTitle: user.targetCareerTitle },
      });
    }
    const user = [...memoryUsers.values()].find((u) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signToken(user);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  const u = req.user;
  res.json({
    success: true,
    user: {
      id: u._id,
      name: u.name,
      email: u.email,
      targetCareer: u.targetCareer,
      targetCareerTitle: u.targetCareerTitle,
      roadmapProgress: u.roadmapProgress,
      applicationsSubmitted: u.applicationsSubmitted || 0,
    },
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, targetCareer, targetCareerTitle } = req.body;
    if (mongoose.connection.readyState === 1) {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          ...(name && { name }),
          ...(targetCareer !== undefined && { targetCareer }),
          ...(targetCareerTitle !== undefined && { targetCareerTitle }),
        },
        { new: true }
      );
      return res.json({ success: true, user });
    }
    const mem = memoryUsers.get(req.user._id);
    if (name) mem.name = name;
    if (targetCareer !== undefined) mem.targetCareer = targetCareer;
    if (targetCareerTitle !== undefined) mem.targetCareerTitle = targetCareerTitle;
    res.json({ success: true, user: mem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  const { name, email, googleId } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });
  if (mongoose.connection.readyState === 1) {
    let user = await User.findOne({ email });
    if (!user) user = await User.create({ name: name || email.split('@')[0], email, googleId });
    const token = signToken(user);
    return res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  }
  let user = [...memoryUsers.values()].find((u) => u.email === email);
  if (!user) {
    const id = memId();
    user = { _id: id, id, name: name || 'User', email, googleId };
    memoryUsers.set(id, user);
  }
  res.json({ success: true, token: signToken(user), user: { id: user._id, name: user.name, email: user.email } });
};
