const mongoose = require('mongoose');
const Interview = require('../models/Interview');
const { generateMockSession } = require('../services/interviewGenerator');
const { gradeInterviewAnswer } = require('../services/gemini');
const { resolveCareer } = require('../services/careerResolver');

exports.generate = (req, res) => {
  const role = req.body.role || req.query.role;
  const customTitle = req.body.customTitle || req.query.title;
  if (!role && !customTitle) {
    return res.status(400).json({ success: false, message: 'Provide role id or custom career title' });
  }
  const career = resolveCareer(role, customTitle);
  const questions = generateMockSession(career.id, Number(req.body.count) || 5, customTitle);
  res.json({ success: true, role: career.id, careerTitle: career.title, questions });
};

exports.submitAnswer = async (req, res) => {
  try {
    const { question, answer, role, customTitle } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer required' });
    }
    const career = resolveCareer(role, customTitle);
    const feedback = await gradeInterviewAnswer(question, answer, career.title);
    if (mongoose.connection.readyState === 1) {
      await Interview.findOneAndUpdate(
        { userId: req.user._id, role: career.id },
        {
          $push: { answers: { question, answer, feedback: feedback.feedback, score: feedback.score } },
          $setOnInsert: { role: career.id, questions: [question] },
        },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, ...feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getHistory = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, sessions: [] });
  }
  const sessions = await Interview.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(10);
  res.json({ success: true, sessions });
};
