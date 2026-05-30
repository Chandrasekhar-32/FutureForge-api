const { getSeedData } = require('../config/dataLoader');
const { resolveCareer } = require('./careerResolver');

const GENERIC_QUESTIONS = (title) => [
  `Why do you want to pursue a career as a ${title}?`,
  `What skills make you a strong candidate for ${title} roles?`,
  `Describe a challenge you overcame related to ${title}.`,
  `How do you stay current with trends in ${title}?`,
  `Where do you see yourself in this field in 3–5 years?`,
  `How do you handle pressure and feedback?`,
  `Tell me about a project or achievement relevant to ${title}.`,
  `What would you do in your first 90 days in this role?`,
];

function getQuestionsForRole(roleId, customTitle) {
  const { interviewQuestions } = getSeedData();
  const career = resolveCareer(roleId, customTitle);
  const pack = interviewQuestions[career.id] || interviewQuestions[career.roadmapId];
  if (pack) {
    return [...(pack.technical || pack.skills || []), ...(pack.behavioral || [])];
  }
  return GENERIC_QUESTIONS(career.title);
}

function generateMockSession(roleId, count = 5, customTitle) {
  const all = getQuestionsForRole(roleId, customTitle);
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

module.exports = { getQuestionsForRole, generateMockSession, GENERIC_QUESTIONS };
