const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const User = require('../models/User');

exports.getStats = async (req, res) => {
  const defaults = {
    assessmentScore: 0,
    topCareer: null,
    careerMatches: [],
    resumeScore: 0,
    interviewScore: 0,
    roadmapProgress: 0,
    applicationsSubmitted: 0,
    dimensionScores: null,
  };

  if (mongoose.connection.readyState !== 1) {
    const stored = global.dashboardCache?.[req.user._id] || {};
    return res.json({ success: true, stats: { ...defaults, ...stored } });
  }

  const [assessment, resume, interviews, user] = await Promise.all([
    Assessment.findOne({ userId: req.user._id }).sort({ createdAt: -1 }),
    Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 }),
    Interview.find({ userId: req.user._id }),
    User.findById(req.user._id),
  ]);

  let interviewScore = 0;
  if (interviews.length) {
    const allAnswers = interviews.flatMap((i) => i.answers || []);
    if (allAnswers.length) {
      interviewScore = Math.round(
        allAnswers.reduce((s, a) => s + (a.score || 0), 0) / allAnswers.length
      );
    }
  }

  const topMatch = assessment?.careerMatches?.[0];
  res.json({
    success: true,
    stats: {
      assessmentScore: topMatch?.percent || 0,
      topCareer: topMatch?.title || null,
      careerMatches: assessment?.careerMatches?.slice(0, 5) || [],
      dimensionScores: assessment?.dimensionScores || null,
      resumeScore: resume?.atsScore || 0,
      interviewScore,
      roadmapProgress: user?.roadmapProgress?.percent || 0,
      applicationsSubmitted: user?.applicationsSubmitted || 0,
    },
  });
};
