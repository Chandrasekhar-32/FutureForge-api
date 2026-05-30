const { getSeedData } = require('../config/dataLoader');
const { resolveCareer } = require('./careerResolver');

/** Fix common typos before matching */
function normalizeMessage(text) {
  return String(text)
    .toLowerCase()
    .replace(/enginner/g, 'engineer')
    .replace(/engeneer/g, 'engineer')
    .replace(/softwere/g, 'software')
    .replace(/develope/g, 'develop')
    .replace(/\bbecom\b/g, 'become')
    .replace(/\bdevloper\b/g, 'developer')
    .replace(/\s+/g, ' ')
    .trim();
}

const CAREER_ALIASES = [
  { id: 'software-engineer', terms: ['software engineer', 'software developer', 'swe', 'programmer', 'coding job', 'web developer', 'full stack'] },
  { id: 'ai-engineer', terms: ['ai engineer', 'machine learning engineer', 'ml engineer', 'artificial intelligence'] },
  { id: 'data-scientist', terms: ['data scientist', 'data science'] },
  { id: 'java-developer', terms: ['java developer', 'java dev', 'spring developer'] },
  { id: 'frontend-developer', title: 'Frontend Developer', terms: ['frontend developer', 'front end developer', 'frontend interview', 'front end interview', 'react developer'] },
  { id: 'cricketer', terms: ['cricketer', 'cricket player', 'professional cricket'] },
  { id: 'professional-athlete', terms: ['professional athlete', 'pro athlete', 'sports player'] },
  { id: 'sports-coach', terms: ['sports coach', 'sport coach', 'athletic coach'] },
  { id: 'registered-nurse', terms: ['registered nurse', 'nurse', ' rn '] },
  { id: 'data-analyst', terms: ['data analyst', 'business analyst'] },
  { id: 'fitness-trainer', terms: ['fitness trainer', 'personal trainer', 'gym trainer'] },
];

function matchAlias(normalized) {
  for (const { id, title, terms } of CAREER_ALIASES) {
    if (terms.some((t) => normalized.includes(t))) {
      const { careers } = getSeedData();
      return careers.find((c) => c.id === id) || resolveCareer(title || id, title || id);
    }
  }
  return null;
}

function extractFromBecomePhrase(normalized, careers) {
  const m = normalized.match(
    /(?:how\s+(?:can|do|to)\s+)?becom(?:e)?\s+(?:a|an|the)?\s*(.+?)(?:\?|$)/
  );
  if (!m) return null;
  const phrase = m[1].trim();
  if (!phrase || phrase.length < 3) return null;

  const alias = matchAlias(phrase);
  if (alias) return alias;

  const byTitle = careers.find(
    (c) =>
      phrase.includes(c.title.toLowerCase()) ||
      c.title.toLowerCase().includes(phrase) ||
      phrase.includes(c.id.replace(/-/g, ' '))
  );
  if (byTitle) return byTitle;

  return resolveCareer(phrase, phrase);
}

function detectCareerInMessage(message) {
  const normalized = normalizeMessage(message);
  const { careers } = getSeedData();

  const fromBecome = extractFromBecomePhrase(normalized, careers);
  if (fromBecome) return fromBecome;

  const roadmapM = normalized.match(/roadmap\s+for\s+(.+?)(?:\?|$)/);
  if (roadmapM) {
    const phrase = normalizeMessage(roadmapM[1]);
    return matchAlias(phrase) || resolveCareer(phrase, phrase);
  }

  return matchAlias(normalized);
}

/** True if user is clearly asking about a different field than UI selection */
function messageOverridesContext(message, contextTitle) {
  if (!contextTitle) return false;
  const detected = detectCareerInMessage(message);
  if (!detected) return false;
  const ctx = contextTitle.toLowerCase();
  const det = detected.title.toLowerCase();
  return !ctx.includes(det) && !det.includes(ctx) && detected.id !== 'custom-career';
}

function shouldUseContextCareer(message, contextTitle) {
  if (!contextTitle) return false;
  if (messageOverridesContext(message, contextTitle)) return false;

  const q = normalizeMessage(message);
  const ctx = contextTitle.toLowerCase();

  return (
    q.includes(ctx) ||
    q.includes('my career') ||
    q.includes('this career') ||
    q.includes('selected career') ||
    (q.includes('roadmap') && !q.includes('roadmap for'))
  );
}

module.exports = {
  normalizeMessage,
  detectCareerInMessage,
  messageOverridesContext,
  shouldUseContextCareer,
};
