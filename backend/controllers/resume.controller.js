const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const pdfParse = require('pdf-parse');
const Resume = require('../models/Resume');
const { analyzeResumeText } = require('../services/gemini');

exports.analyze = async (req, res) => {
  try {
    let text = req.body.text || '';
    const targetRole = req.body.targetRole || req.body.targetTitle || 'general';

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === '.pdf') {
        const buffer = fs.readFileSync(req.file.path);
        const parsed = await pdfParse(buffer);
        text = parsed.text;
        fs.unlinkSync(req.file.path);
      } else if (ext === '.txt') {
        text = fs.readFileSync(req.file.path, 'utf8');
        fs.unlinkSync(req.file.path);
      }
    }

    if (!text.trim()) {
      return res.status(400).json({ success: false, message: 'Upload PDF/TXT or paste resume text' });
    }

    const analysis = await analyzeResumeText(text, targetRole);
    const result = {
      atsScore: analysis.atsScore,
      strengths: analysis.strengths,
      missing: analysis.missing,
      recommendations: analysis.recommendations,
    };

    if (mongoose.connection.readyState === 1) {
      await Resume.create({
        userId: req.user._id,
        filename: req.file?.originalname,
        ...result,
        extractedText: text.slice(0, 5000),
      });
    }
    res.json({ success: true, analysis: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLatest = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, resume: null });
  }
  const resume = await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, resume });
};
