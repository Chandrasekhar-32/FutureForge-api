const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const { getSeedData } = require('../config/dataLoader');

const CATEGORY_WEIGHTS = {
  Technology: { technical: 1, analytical: 0.9, creativity: 0.65, leadership: 0.6, communication: 0.65, business: 0.55 },
  Sports: { technical: 0.9, leadership: 0.85, communication: 0.8, analytical: 0.75, creativity: 0.7, business: 0.55 },
  Healthcare: { technical: 0.9, analytical: 0.85, communication: 0.9, leadership: 0.7, creativity: 0.45, business: 0.5 },
  Education: { communication: 1, leadership: 0.9, creativity: 0.85, analytical: 0.7, technical: 0.5, business: 0.5 },
  Business: { business: 1, leadership: 0.9, communication: 0.85, analytical: 0.8, creativity: 0.7, technical: 0.55 },
  Creative: { creativity: 1, technical: 0.7, communication: 0.8, analytical: 0.55, leadership: 0.55, business: 0.6 },
  Design: { creativity: 0.95, technical: 0.8, communication: 0.75, analytical: 0.65, leadership: 0.55, business: 0.55 },
  Engineering: { technical: 1, analytical: 0.95, creativity: 0.65, communication: 0.6, leadership: 0.6, business: 0.6 },
  Hospitality: { creativity: 0.85, technical: 0.8, leadership: 0.8, communication: 0.8, analytical: 0.55, business: 0.7 },
  'Public Service': { leadership: 0.9, communication: 0.85, analytical: 0.8, technical: 0.7, creativity: 0.45, business: 0.5 },
};

const DEFAULT_WEIGHTS = { technical: 0.7, analytical: 0.75, creativity: 0.7, leadership: 0.7, communication: 0.75, business: 0.65 };

function getWeights(career) {
  return career.traitWeights || CATEGORY_WEIGHTS[career.category] || DEFAULT_WEIGHTS;
}

exports.submitAssessment = async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers?.length) {
      return res.status(400).json({ success: false, message: 'Answers required' });
    }
    const dims = { analytical: 0, creativity: 0, leadership: 0, communication: 0, technical: 0, business: 0 };
    const dimKeys = Object.keys(dims);
    answers.forEach((a) => {
      const dim = dimKeys[a.questionId % dimKeys.length];
      dims[dim] += Number(a.score) || 3;
    });
    Object.keys(dims).forEach((k) => {
      dims[k] = Math.round((dims[k] / answers.length) * 20);
    });

    const { careers } = getSeedData();
    const careerMatches = careers
      .map((c) => {
        const w = getWeights(c);
        let score = 0;
        let weight = 0;
        Object.entries(w).forEach(([dim, mult]) => {
          score += (dims[dim] || 50) * mult;
          weight += mult;
        });
        const percent = Math.min(98, Math.round(score / weight));
        return { careerId: c.id, title: c.title, category: c.category, percent };
      })
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 8);

    const payload = { userId: req.user._id, answers, dimensionScores: dims, careerMatches };
    if (mongoose.connection.readyState === 1) {
      await Assessment.create(payload);
    }
    res.json({ success: true, dimensionScores: dims, careerMatches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLatest = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, assessment: null });
  }
  const assessment = await Assessment.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, assessment });
};
