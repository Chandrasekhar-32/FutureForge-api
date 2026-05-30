const SKILL_KEYWORDS = {
  'software-engineer': ['javascript', 'python', 'java', 'react', 'node', 'git', 'sql', 'api', 'project', 'dsa', 'algorithm'],
  'ai-engineer': ['python', 'machine learning', 'tensorflow', 'pytorch', 'nlp', 'deep learning', 'pandas', 'numpy', 'ml', 'ai'],
  'data-scientist': ['python', 'sql', 'pandas', 'statistics', 'machine learning', 'visualization', 'tableau', 'jupyter'],
  'frontend-developer': ['react', 'javascript', 'css', 'html', 'typescript', 'responsive', 'accessibility', 'webpack'],
  'java-developer': ['java', 'spring', 'sql', 'microservices', 'rest', 'junit', 'maven', 'kafka'],
  'data-analyst': ['sql', 'excel', 'power bi', 'tableau', 'python', 'statistics', 'dashboard'],
};

const COMMON_MISSING = {
  'software-engineer': ['Cloud (AWS/GCP)', 'CI/CD', 'System design keywords', 'Internship experience'],
  'ai-engineer': ['MLOps', 'Cloud deployment', 'Published projects', 'LLM/RAG experience'],
  default: ['Quantified achievements', 'Cloud skills', 'Certifications'],
};

function analyzeATS(text, targetRole = 'software-engineer') {
  const lower = (text || '').toLowerCase();
  const roleKey = SKILL_KEYWORDS[targetRole] ? targetRole : null;
  const keywords = roleKey
    ? SKILL_KEYWORDS[targetRole]
  : [
      ...String(targetRole).toLowerCase().split(/[\s-/]+/).filter((w) => w.length > 2),
      'experience',
      'skills',
      'project',
      'team',
      'leadership',
      'communication',
    ];
  const found = [];
  const missingKw = [];
  keywords.forEach((kw) => {
    if (lower.includes(kw)) found.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    else missingKw.push(kw);
  });
  const wordCount = lower.split(/\s+/).filter(Boolean).length;
  let score = 50 + found.length * 5 + Math.min(15, Math.floor(wordCount / 50));
  score = Math.min(98, Math.max(45, score));
  const strengths = found.length
    ? found.slice(0, 6).map((s) => `Strong mention of ${s}`)
    : ['Clear structure detected'];
  if (lower.includes('project')) strengths.push('Projects section present');
  if (lower.includes('experience') || lower.includes('intern')) strengths.push('Experience section present');

  const missing = (COMMON_MISSING[targetRole] || COMMON_MISSING.default).slice(0, 4);
  if (missingKw.length) missing.push(...missingKw.slice(0, 2).map((k) => `Add keyword: ${k}`));

  const recommendations = [
    'Tailor summary to target role with 2–3 role-specific keywords.',
    'Add metrics to bullet points (%, $, users, latency).',
    'Include a Projects section with tech stack and GitHub links.',
    'Keep resume to one page for internships/new grad roles.',
  ];

  return { atsScore: score, strengths, missing: [...new Set(missing)].slice(0, 5), recommendations };
}

module.exports = { analyzeATS };
