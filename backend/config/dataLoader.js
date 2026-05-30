const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database');

function loadJson(filename) {
  const file = path.join(dbPath, filename);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let cache = null;

function getSeedData() {
  if (!cache) {
    cache = {
      careers: loadJson('careers.json'),
      roadmaps: loadJson('roadmaps.json'),
      skills: loadJson('skills.json'),
      interviewQuestions: loadJson('interviewQuestions.json'),
    };
  }
  return cache;
}

module.exports = { getSeedData, loadJson };
