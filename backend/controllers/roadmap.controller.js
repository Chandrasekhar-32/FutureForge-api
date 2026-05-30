const mongoose = require('mongoose');
const User = require('../models/User');
const { getRoadmap, updateProgress } = require('../services/roadmapGenerator');

function buildRoadmapResponse(req, res) {
  const careerId = req.body?.careerId || req.params?.careerId || req.query?.careerId;
  const title = req.body?.title || req.query?.title || req.query?.customTitle;

  if (!careerId && !title) {
    return res.status(400).json({ success: false, message: 'Provide careerId or title' });
  }

  const roadmap = getRoadmap(careerId || title, title);
  if (!roadmap?.phases?.length) {
    return res.status(500).json({ success: false, message: 'Could not generate roadmap' });
  }
  return res.json({ success: true, roadmap });
}

exports.getRoadmap = buildRoadmapResponse;
exports.generateRoadmap = buildRoadmapResponse;

exports.updateProgress = async (req, res) => {
  try {
    const { careerId, completedTopics, customTitle, title } = req.body;
    const roadmap = getRoadmap(careerId || customTitle || title, customTitle || title);
    const progress = updateProgress(roadmap, completedTopics || []);
    if (mongoose.connection.readyState === 1 && req.user && !req.user.isGuest) {
      await User.findByIdAndUpdate(req.user._id, {
        roadmapProgress: { careerId: roadmap.careerId, ...progress },
        targetCareer: roadmap.careerId,
        targetCareerTitle: roadmap.careerTitle || roadmap.title,
      });
    }
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
