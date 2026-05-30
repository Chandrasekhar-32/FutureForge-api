const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: String,
    questions: [String],
    answers: [{ question: String, answer: String, feedback: String, score: Number }],
    overallScore: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Interview || mongoose.model('Interview', interviewSchema);
