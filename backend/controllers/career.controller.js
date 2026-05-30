const { getSeedData } = require('../config/dataLoader');
const { resolveCareer, listCategories } = require('../services/careerResolver');

exports.listCareers = (req, res) => {
  const { careers } = getSeedData();
  const q = (req.query.q || '').toLowerCase();
  const category = (req.query.category || '').toLowerCase();
  let list = careers;
  if (category) {
    list = list.filter((c) => c.category.toLowerCase() === category);
  }
  if (q) {
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.domain && c.domain.includes(q)) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
    );
  }
  res.json({ success: true, count: list.length, careers: list });
};

exports.getCategories = (_, res) => {
  res.json({ success: true, categories: listCategories() });
};

exports.getCareer = (req, res) => {
  const { careers } = getSeedData();
  const exact = careers.find((c) => c.id === req.params.id);
  if (exact) return res.json({ success: true, career: exact });
  const career = resolveCareer(req.params.id, req.query.title);
  res.json({ success: true, career });
};

exports.compareCareers = (req, res) => {
  const { a, b } = req.query;
  const careerA = resolveCareer(a);
  const careerB = resolveCareer(b);
  if (!careerA || !careerB) {
    return res.status(400).json({ success: false, message: 'Provide valid career ids or titles as a and b' });
  }
  res.json({ success: true, comparison: { a: careerA, b: careerB } });
};
