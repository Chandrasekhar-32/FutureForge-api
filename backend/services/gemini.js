const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getSeedData } = require('../config/dataLoader');
const { getRoadmap } = require('./roadmapGenerator');
const { resolveCareer } = require('./careerResolver');
const {
  detectCareerInMessage,
  shouldUseContextCareer,
  normalizeMessage,
} = require('./careerIntent');

const SYSTEM_PROMPT = `You are FutureForge AI, an AI-powered career operating system for students and professionals.
You can answer any practical question, but your specialty is career guidance, resumes, interviews, learning roadmaps, jobs, skills, assessments, and progress planning.
Use remembered context from the conversation, such as the user's skills, goals, education, target role, resume gaps, and preferred timeline.
Answer the user's actual question directly. Do not say you can only answer career questions. Do not tell them to "try asking" other questions.
When useful, structure the answer with short sections, bullets, and next steps.
If the user asks for a roadmap, include a phased plan. If they ask for resume/interview/jobs, give concrete actions.
If the answer depends on location, budget, school rules, medical/legal/financial facts, or live data, say what to verify and give a safe general answer.`;

const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

const STALE_REPLY_MARKERS = ['Try asking:', 'How can I become an AI Engineer?', 'Roadmap for Java Developer'];

let genAI = null;

function getGenAI() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
}

async function generateWithGemini(prompt) {
  const client = getGenAI();
  if (!client) return null;
  let lastError;
  for (const modelName of MODELS) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response?.text?.();
      if (text) return text;
    } catch (e) {
      lastError = e;
      console.warn(`Gemini model ${modelName} failed:`, e.message);
    }
  }
  if (lastError) throw lastError;
  return null;
}

function isStaleReply(text) {
  if (!text) return true;
  return STALE_REPLY_MARKERS.some((m) => text.includes(m));
}

async function chat(messages, userMessage, careerContext = {}) {
  try {
    const text = await generateWithGemini(buildChatPrompt(messages, userMessage, careerContext));
    if (text && !isStaleReply(text)) return text;
  } catch (e) {
    console.warn('Gemini chat failed, using coach fallback:', e.message);
  }
  return mockCoachReply(userMessage, careerContext);
}

function buildChatPrompt(messages, userMessage, careerContext) {
  const history = messages
    .slice(-12)
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');
  const memory = buildMemorySummary(messages, userMessage);
  const ctx =
    careerContext?.title && shouldUseContextCareer(userMessage, careerContext.title)
      ? `\nUser's selected career in UI: ${careerContext.title}.`
      : '\nAnswer the user\'s question directly. Ignore the UI career selector unless they ask about that specific career.';
  return `${SYSTEM_PROMPT}${ctx}\n\nRemembered user context:\n${memory}\n\nConversation:\n${history}\n\nUser: ${userMessage}\n\nAssistant:`;
}

function buildMemorySummary(messages, latestMessage) {
  const userText = [...messages, { role: 'user', content: latestMessage }]
    .filter((m) => m.role === 'user')
    .slice(-20)
    .map((m) => m.content)
    .join(' ');
  const skills = [];
  const skillPatterns = [
    ['JavaScript', /\bjavascript|js\b/i],
    ['TypeScript', /\btypescript|ts\b/i],
    ['React', /\breact\b/i],
    ['Node.js', /\bnode(?:\.js)?\b/i],
    ['Python', /\bpython\b/i],
    ['Java', /\bjava\b/i],
    ['DSA', /\bdsa|data structures?|algorithms?\b/i],
    ['SQL', /\bsql\b/i],
    ['Cloud', /\baws|azure|gcp|cloud\b/i],
    ['Machine Learning', /\bmachine learning|ml\b/i],
  ];
  skillPatterns.forEach(([label, pattern]) => {
    if (pattern.test(userText)) skills.push(label);
  });

  const goals = [];
  const goalMatch = userText.match(/\b(?:become|be a|career in|roadmap for|target role is|want to be)\s+(?:a|an)?\s*([a-z][a-z0-9 +#.-]{2,60})/i);
  if (goalMatch) goals.push(goalMatch[1].replace(/[?.!,].*$/, '').trim());

  const parts = [];
  if (skills.length) parts.push(`Known skills/interests: ${[...new Set(skills)].join(', ')}.`);
  if (goals.length) parts.push(`Possible goal: ${goals[0]}.`);
  return parts.length ? parts.join('\n') : 'No stable user profile yet. Infer only from the current conversation.';
}

function findRoadmapSnippet(careerIdOrTitle) {
  try {
    const career = resolveCareer(careerIdOrTitle, careerIdOrTitle);
    const roadmap = getRoadmap(career.id, career.title);
    if (!roadmap?.phases?.length) return '';
    return roadmap.phases
      .map((p) => `Month ${p.month}: ${p.topics.join(', ')}`)
      .join('\n');
  } catch {
    return '';
  }
}

function replyForCareer(career) {
  const snippet = findRoadmapSnippet(career.id);
  const salary = career.salary
    ? `$${Math.round(career.salary.min / 1000)}k–$${Math.round(career.salary.max / 1000)}k`
    : 'Varies';
  let text = `**${career.title}** (${career.category || 'Career'})\n\n${career.description || ''}\n\n`;
  text += `**Key skills:** ${(career.skills || []).slice(0, 6).join(', ')}\n`;
  text += `**Salary range:** ${salary}\n**Growth:** ${career.growth || 'See industry trends'}\n\n`;
  if (snippet) {
    text += `**Learning roadmap:**\n${snippet}\n\n`;
  }
  text += `→ Open **Roadmap** and search "${career.title}" to track progress.\n`;
  text += `→ Use **Interview Coach** to practice role questions.`;
  return text;
}

function mockCoachReply(message, careerContext = {}) {
  const q = normalizeMessage(message);
  const { careers } = getSeedData();

  const askedCareer = detectCareerInMessage(message);
  if (askedCareer) {
    return replyForCareer(askedCareer);
  }

  if (careerContext?.title && shouldUseContextCareer(message, careerContext.title)) {
    const c = resolveCareer(careerContext.careerId, careerContext.title);
    return replyForCareer(c);
  }

  if (q.includes('cricket') || q.includes('cricketer')) {
    return replyForCareer(careers.find((c) => c.id === 'cricketer') || resolveCareer('cricketer', 'Cricketer'));
  }

  if (q.includes('ai engineer') || q.includes('artificial intelligence engineer')) {
    return replyForCareer(careers.find((c) => c.id === 'ai-engineer') || resolveCareer('ai-engineer', 'AI Engineer'));
  }

  if (q.includes('java developer') || (q.includes('java') && q.includes('developer'))) {
    return replyForCareer(careers.find((c) => c.id === 'java-developer') || resolveCareer('java-developer', 'Java Developer'));
  }

  if (q.includes('software') && (q.includes('engineer') || q.includes('developer') || q.includes('program'))) {
    return replyForCareer(careers.find((c) => c.id === 'software-engineer') || resolveCareer('software-engineer', 'Software Engineer'));
  }

  if (q.includes('data scientist')) {
    return replyForCareer(careers.find((c) => c.id === 'data-scientist') || resolveCareer('data-scientist', 'Data Scientist'));
  }

  if (q.includes('sports coach') || (q.includes('coach') && q.includes('sport'))) {
    return replyForCareer(careers.find((c) => c.id === 'sports-coach') || resolveCareer('sports-coach', 'Sports Coach'));
  }

  if (q.includes('athlete') || q.includes('professional sport')) {
    return replyForCareer(careers.find((c) => c.id === 'professional-athlete') || resolveCareer('professional-athlete', 'Professional Athlete'));
  }

  if (q.includes('football') || q.includes('basketball') || q.includes('soccer')) {
    const sport = q.includes('football') ? 'Football' : q.includes('basketball') ? 'Basketball' : 'Soccer';
    return `**${sport} career path:**\n\n1. Join club/academy with certified coaching\n2. Daily skill + fitness training\n3. Compete in leagues; track stats and video\n4. Build highlight reel for trials\n5. Research pro pathways in your country\n6. Keep education/backup plan\n\nUse **Roadmap** → type "${sport} Player" for a custom plan.`;
  }

  if (q.includes('react') && q.includes('angular')) {
    return `**React vs Angular (2026):**\n\n• **React** — more jobs for startups, web apps, and full-stack roles; learn with TypeScript.\n• **Angular** — common in enterprise and Java-backed teams.\n\nPick one, build 2 projects, then learn the other later if needed.`;
  }

  if (q.includes('2026') || q.includes('skills')) {
    return `**Top skills in 2026:**\n\n• **Tech:** AI/ML basics, Python, cloud (AWS), TypeScript, SQL\n• **Sports:** Fitness science, video analysis, communication, mental coaching\n• **Healthcare:** Digital tools, patient communication, certifications\n• **All fields:** Portfolio projects, networking, adaptability\n\nTell me a specific career (e.g. "cricketer" or "nurse") for a tailored list.`;
  }

  if ((q.includes('java') || q.includes('dsa')) && (q.includes('learn') || q.includes('next'))) {
    return `**Since you know Java and DSA, learn this next:**\n\n1. **SQL + databases** — CRUD, joins, indexes, transactions\n2. **Spring Boot** — REST APIs, validation, authentication, error handling\n3. **Git + GitHub** — clean commits, branches, pull requests\n4. **One frontend basics set** — HTML, CSS, JavaScript, React fundamentals\n5. **Projects** — build a job-ready Java backend project with login, database, and deployment\n\n**Best project:** Student/job portal API using Java, Spring Boot, MongoDB or MySQL, JWT auth, and deployed backend.\n\nThen use **Resume Analyzer** to check if your Java, DSA, SQL, Spring Boot, and project bullets are visible.`;
  }

  if (q.includes('resume') || q.includes('cv')) {
    return `**Resume tips:**\n\n1. Match your headline to the exact job title\n2. Use metrics (%, revenue, users, wins, wickets)\n3. List skills + certifications for your field\n4. Add projects, internships, or competition results\n5. Run **Resume Analyzer** in FutureForge for ATS score`;
  }

  if (q.includes('interview')) {
    return `**Interview prep:**\n\n1. Research the role and organization\n2. Prepare 3 STAR stories (Situation, Task, Action, Result)\n3. Practice in **Interview Coach** — pick your career or type a custom one\n4. Sports roles: expect teamwork, pressure, and training discipline questions`;
  }

  const matched = careers.find(
    (c) => q.includes(c.title.toLowerCase()) || q.includes(c.id.replace(/-/g, ' '))
  );
  if (matched) return replyForCareer(matched);

  return generalCoachReply(message, careerContext);
}

function extractTopic(message) {
  const cleaned = String(message)
    .replace(/[?!]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const patterns = [
    /(?:explain|what is|what are|tell me about|meaning of)\s+(.+)/i,
    /(?:how (?:can|do|to) i (?:learn|start|improve|prepare for))\s+(.+)/i,
    /(?:roadmap|plan|guide)\s+(?:for|to)?\s*(.+)/i,
  ];
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return cleaned.slice(0, 80);
}

function generalCoachReply(message, careerContext = {}) {
  const q = normalizeMessage(message);
  const topic = extractTopic(message);

  if (/^(what is|what are|explain|define|meaning of)\b/i.test(message.trim())) {
    return `**${topic}:**\n\n${topic} is easiest to understand by breaking it into purpose, parts, and example usage.\n\n• **Purpose:** What problem it solves\n• **Parts:** The main terms or tools involved\n• **Example:** A real situation where it is used\n• **Practice:** One small task you can try to make it clear\n\nIf you want the career angle, I can also explain how **${topic}** is used in jobs, interviews, and projects.`;
  }

  if (q.includes('job') || q.includes('internship') || q.includes('placement')) {
    return `**Job search plan:**\n\n1. Pick 2 target roles and collect 20 job descriptions\n2. Match your resume headline, skills, and projects to those roles\n3. Apply daily with a small tracker: company, role, date, status, follow-up\n4. Send 5 networking messages per week to alumni, recruiters, or team members\n5. Practice interview questions for the exact role in **Interview Coach**\n\nShare your target role and current skills, and I will make this more specific.`;
  }

  if (q.includes('study') || q.includes('learn') || q.includes('course')) {
    return `**Learning plan for ${topic}:**\n\n• Start with fundamentals: key terms, tools, and beginner exercises\n• Build one small project in week 1 so learning becomes practical\n• Practice daily for 45–90 minutes and keep notes in a portfolio\n• After basics, solve real tasks from job descriptions or college projects\n• Review weekly: what you learned, what is still weak, and the next milestone\n\nTell me your level (beginner/intermediate) and timeline, and I will turn this into a month-wise roadmap.`;
  }

  if (q.includes('compare') || q.includes(' vs ') || q.includes('versus')) {
    return `**Comparison framework:**\n\n• **Career value:** Which option has stronger demand for your location and goals?\n• **Learning curve:** Which one can you build proof-of-work for faster?\n• **Fit:** Which matches your strengths: technical, creative, leadership, analytical, or communication?\n• **Portfolio:** Which option lets you create projects, certifications, or results employers can verify?\n\nIf you send the two options, I will compare salary, skills, roadmap, and job strategy side by side.`;
  }

  if (careerContext?.title) {
    return `**For ${careerContext.title}:**\n\n• Clarify your target level: student, fresher, internship, or job switch\n• Build the core skills employers or selectors expect for this field\n• Create proof: projects, resume bullets, certifications, competition results, or a portfolio\n• Practice interviews and track progress weekly in FutureForge\n\nYour question was: "${message}". A good next step is to ask for a roadmap, resume checklist, interview practice, or skill gap plan for **${careerContext.title}**.`;
  }

  return `**Quick answer:** ${topic} can be handled with a simple plan: understand the basics, identify the required skills, practice with real examples, create proof of work, and get feedback.\n\n**Next steps:**\n\n1. Tell me your goal or role\n2. Share your current skills or education level\n3. Choose a timeline, like 30 days, 3 months, or 6 months\n\nThen I can build a precise roadmap, resume plan, interview plan, or job strategy for you.`;
}

async function analyzeResumeText(text, targetRole = 'software-engineer') {
  try {
    const prompt = `${SYSTEM_PROMPT}
Analyze this resume for a ${targetRole} role. Return JSON only: {"atsScore":number,"strengths":[],"missing":[],"recommendations":[]}
Resume:
${text.slice(0, 8000)}`;
    const raw = await generateWithGemini(prompt);
    if (raw) {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Gemini resume failed:', e.message);
  }
  const { analyzeATS } = require('./ats');
  return analyzeATS(text, targetRole);
}

async function gradeInterviewAnswer(question, answer, role) {
  try {
    const prompt = `Rate this ${role} interview answer 0-100. Return JSON only: {"score":number,"feedback":"string"}
Question: ${question}
Answer: ${answer}`;
    const raw = await generateWithGemini(prompt);
    if (raw) {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
  } catch (_) {}
  const len = answer.trim().length;
  return {
    score: Math.min(95, 40 + Math.floor(len / 8)),
    feedback:
      len < 50
        ? 'Expand with a concrete example (STAR method).'
        : 'Good structure. Add metrics or specific outcomes.',
  };
}

module.exports = { chat, analyzeResumeText, gradeInterviewAnswer, SYSTEM_PROMPT, mockCoachReply, isStaleReply };
