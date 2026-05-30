const mongoose = require('mongoose');
const User = require('../models/User');

const MOCK_JOBS = [
  {
    id: '1',
    title: 'Software Engineer Intern',
    company: 'Stripe',
    location: 'San Francisco, CA',
    remote: false,
    salary: '$45–55/hr',
    experience: 'Internship',
    skills: ['JavaScript', 'React', 'SQL'],
    url: 'https://stripe.com/jobs',
  },
  {
    id: '2',
    title: 'AI Engineer — New Grad',
    company: 'Microsoft',
    location: 'Redmond, WA',
    remote: false,
    salary: '$120k–145k',
    experience: 'Entry Level',
    skills: ['Python', 'ML', 'Azure'],
    url: 'https://careers.microsoft.com',
  },
  {
    id: '3',
    title: 'Frontend Developer',
    company: 'Vercel',
    location: 'Remote',
    remote: true,
    salary: '$95k–130k',
    experience: '1–3 years',
    skills: ['React', 'TypeScript', 'Next.js'],
    url: 'https://vercel.com/careers',
  },
  {
    id: '4',
    title: 'Data Analyst',
    company: 'Capital One',
    location: 'McLean, VA',
    remote: true,
    salary: '$75k–95k',
    experience: '0–2 years',
    skills: ['SQL', 'Python', 'Tableau'],
    url: 'https://www.capitalone.com/careers',
  },
  {
    id: '5',
    title: 'Java Developer',
    company: 'JPMorgan Chase',
    location: 'New York, NY',
    remote: false,
    salary: '$90k–115k',
    experience: '1–3 years',
    skills: ['Java', 'Spring', 'SQL'],
    url: 'https://careers.jpmorgan.com',
  },
];

async function fetchAdzuna(query, location) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return null;
  const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location || '')}&results_per_page=10`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return (data.results || []).map((j, i) => ({
    id: j.id || `adzuna-${i}`,
    title: j.title,
    company: j.company?.display_name || 'Company',
    location: j.location?.display_name || '',
    remote: (j.description || '').toLowerCase().includes('remote'),
    salary: j.salary_min ? `$${Math.round(j.salary_min)}–${Math.round(j.salary_max || j.salary_min)}` : 'Not listed',
    experience: 'See listing',
    skills: [],
    url: j.redirect_url,
  }));
}

exports.search = async (req, res) => {
  try {
    const { q = 'software engineer', location = '', remote, skill } = req.query;
    let jobs = (await fetchAdzuna(q, location)) || MOCK_JOBS;
    if (remote === 'true') jobs = jobs.filter((j) => j.remote);
    if (skill) {
      const s = skill.toLowerCase();
      jobs = jobs.filter((j) => j.skills.some((sk) => sk.toLowerCase().includes(s)) || j.title.toLowerCase().includes(s));
    }
    res.json({ success: true, source: process.env.ADZUNA_APP_ID ? 'adzuna' : 'demo', jobs });
  } catch (err) {
    res.json({ success: true, source: 'demo', jobs: MOCK_JOBS });
  }
};

exports.saveJob = async (req, res) => {
  try {
    const job = req.body;
    if (mongoose.connection.readyState === 1) {
      await User.findByIdAndUpdate(req.user._id, { $push: { savedJobs: job } });
    }
    res.json({ success: true, message: 'Job saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSaved = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, jobs: [] });
  }
  const user = await User.findById(req.user._id).select('savedJobs');
  res.json({ success: true, jobs: user?.savedJobs || [] });
};
