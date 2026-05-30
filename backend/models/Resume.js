const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: String,
    atsScore: Number,
    strengths: [String],
    missing: [String],
    recommendations: [String],
    extractedText: String,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);
