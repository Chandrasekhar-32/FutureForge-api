const { getSeedData } = require('../config/dataLoader');
const { resolveCareer, inferDomain } = require('./careerResolver');

const GENERIC_BY_DOMAIN = {
  sports: [
    { month: 1, topics: ['Sport fundamentals & rules', 'Fitness baseline & injury prevention', 'Nutrition basics'], projects: ['Training log'] },
    { month: 2, topics: ['Skill drills & technique', 'Strength & conditioning', 'Video self-review'], projects: ['Skill progression plan'] },
    { month: 3, topics: ['Competition strategy', 'Mental performance', 'Recovery & sleep'], projects: ['Match/event preparation'] },
    { month: 4, topics: ['Team communication / coaching feedback', 'Scouting & performance metrics', 'Networking in your sport'], projects: ['Highlight portfolio or certification step'] },
    { month: 5, topics: ['Trials, internships, or league pathways', 'Personal brand & social presence', 'Career backup plan'], projects: ['Application or trial package'] },
  ],
  healthcare: [
    { month: 1, topics: ['Core sciences refresh', 'Certifications research', 'Clinical observation'], projects: ['Study plan'] },
    { month: 2, topics: ['Hands-on skills practice', 'Ethics & patient communication', 'Exam prep'], projects: ['Case study journal'] },
    { month: 3, topics: ['Specialization depth', 'Supervised hours', 'Portfolio'], projects: ['Practicum milestone'] },
    { month: 4, topics: ['Licensing steps', 'Job applications', 'Interview prep'], projects: ['License checklist'] },
  ],
  creative: [
    { month: 1, topics: ['Fundamentals & tools', 'Daily practice habit', 'Inspiration research'], projects: ['Mini portfolio piece'] },
    { month: 2, topics: ['Style development', 'Collaboration', 'Critique & iteration'], projects: ['Series of 3 works'] },
    { month: 3, topics: ['Client/studio workflow', 'Business basics', 'Online presence'], projects: ['Published portfolio'] },
    { month: 4, topics: ['Freelance or job search', 'Contracts & pricing', 'Networking'], projects: ['Pitch deck or showreel'] },
  ],
  default: [
    { month: 1, topics: ['Industry overview', 'Core skills audit', 'Goal setting'], projects: ['Career research doc'] },
    { month: 2, topics: ['Foundational training', 'Mentor or community', 'Practice projects'], projects: ['First portfolio item'] },
    { month: 3, topics: ['Intermediate skills', 'Certifications or courses', 'Feedback loop'], projects: ['Capstone draft'] },
    { month: 4, topics: ['Job market research', 'Applications & networking', 'Interview prep'], projects: ['Application tracker'] },
    { month: 5, topics: ['Refine portfolio', 'Negotiation & offers', 'Continuous learning plan'], projects: ['90-day growth plan'] },
  ],
};

function buildCricketPhases() {
  return [
    { month: 1, topics: ['Cricket rules & formats', 'Batting/bowling/fielding basics', 'Fitness & injury prevention'], projects: ['Training diary'] },
    { month: 2, topics: ['Net practice routines', 'Strength & agility program', 'Video analysis of technique'], projects: ['30-day skill plan'] },
    { month: 3, topics: ['Match awareness', 'Mental game & pressure handling', 'Nutrition for athletes'], projects: ['Match performance log'] },
    { month: 4, topics: ['Club/academy trials', 'Highlight reel editing', 'Networking with coaches'], projects: ['5-min highlight video'] },
    { month: 5, topics: ['District/state pathway research', 'Personal brand & social media', 'Backup education/career plan'], projects: ['Trial application packet'] },
  ];
}

function getRoadmap(careerId, customTitle) {
  const { roadmaps } = getSeedData();
  const career = resolveCareer(careerId, customTitle);
  const predefined = roadmaps[career.id] || roadmaps[career.roadmapId];
  if (predefined) {
    return { careerId: career.id, careerTitle: career.title, ...predefined, custom: false };
  }

  const titleLower = career.title.toLowerCase();
  let phases;
  if (titleLower.includes('cricket') || titleLower.includes('cricketer')) {
    phases = buildCricketPhases();
  } else {
    const domain = career.domain || inferDomain(career.title);
    phases = GENERIC_BY_DOMAIN[domain] || GENERIC_BY_DOMAIN.default;
  }

  return {
    careerId: career.id,
    careerTitle: career.title,
    title: career.title,
    totalMonths: phases.length,
    phases,
    custom: true,
    generated: true,
  };
}

function updateProgress(roadmap, completedTopics = []) {
  const allTopics = roadmap.phases.flatMap((p) => p.topics);
  const done = completedTopics.filter((t) => allTopics.includes(t));
  const percent = allTopics.length ? Math.round((done.length / allTopics.length) * 100) : 0;
  return { completedTopics: done, percent, totalTopics: allTopics.length };
}

module.exports = { getRoadmap, updateProgress, GENERIC_BY_DOMAIN };
