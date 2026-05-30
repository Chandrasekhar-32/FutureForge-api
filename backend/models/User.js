const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  jobId: String,
  title: String,
  company: String,
  location: String,
  salary: String,
  url: String,
  savedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: String,
    avatar: String,
    targetCareer: { type: String, default: '' },
    targetCareerTitle: { type: String, default: '' },
    roadmapProgress: {
      careerId: String,
      completedTopics: [String],
      percent: { type: Number, default: 0 },
    },
    savedJobs: [savedJobSchema],
    applicationsSubmitted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
