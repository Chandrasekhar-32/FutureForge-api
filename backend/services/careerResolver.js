const { getSeedData } = require('../config/dataLoader');

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function findCareer(idOrTitle) {
  const { careers } = getSeedData();
  if (!idOrTitle) return null;
  const key = String(idOrTitle).toLowerCase();
  return (
    careers.find((c) => c.id === key || c.id === idOrTitle) ||
    careers.find((c) => c.title.toLowerCase() === key) ||
    careers.find((c) => c.title.toLowerCase().includes(key))
  );
}

function inferDomain(title) {
  const t = String(title).toLowerCase();
  if (/cricket|football|soccer|basketball|tennis|athlete|coach|umpire|sports|fitness|trainer|olympic|league|player/.test(t)) {
    return 'sports';
  }
  if (/nurse|doctor|physio|medical|health|dental|pharmacy/.test(t)) return 'healthcare';
  if (/design|artist|chef|culinary|writer|journalist|creative/.test(t)) return 'creative';
  if (/engineer|developer|programmer|software|data|cyber|cloud|ai\b/.test(t)) return 'default';
  return 'default';
}

function resolveCareer(idOrTitle, customTitle) {
  const found = findCareer(idOrTitle);
  if (found) return found;

  let title = (customTitle || idOrTitle || 'Your Career').trim();
  if (title.toLowerCase() === 'custom' && customTitle) title = customTitle.trim();
  if (title.toLowerCase() === 'custom' && !customTitle) title = 'Your Career';

  const id = slugify(title) || 'custom-career';
  const domain = inferDomain(title);
  const category = domain === 'sports' ? 'Sports' : domain === 'healthcare' ? 'Healthcare' : 'Custom';
  return {
    id,
    title,
    category,
    domain,
    description: `Personalized guidance for ${title}.`,
    custom: true,
    traitWeights: { analytical: 0.7, creativity: 0.7, leadership: 0.7, communication: 0.8, technical: 0.6, business: 0.6 },
  };
}

function listCategories() {
  const { careers } = getSeedData();
  const counts = {};
  careers.forEach((c) => {
    counts[c.category] = (counts[c.category] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = { slugify, findCareer, resolveCareer, listCategories, inferDomain };
