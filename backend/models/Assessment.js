const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [{ questionId: Number, score: Number }],
    dimensionScores: {
      analytical: Number,
      creativity: Number,
      leadership: Number,
      communication: Number,
      technical: Number,
      business: Number,
    },
    careerMatches: [{ careerId: String, title: String, percent: Number }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);
