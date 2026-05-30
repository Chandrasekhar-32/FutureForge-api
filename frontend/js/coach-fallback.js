/** Client-side coach when API fails - broad enough to keep the chat useful offline. */
FF.coachFallback = function coachFallback(message, careerContext = {}) {
  const q = (message || '').toLowerCase();
  const topic = extractTopic(message);

  if (q.includes('software') && (q.includes('engineer') || q.includes('enginner') || q.includes('developer'))) {
    return `**How to become a Software Engineer:**

1. Learn programming basics (Python or JavaScript)
2. Study data structures & algorithms
3. Build 2–3 projects (web app, API, portfolio on GitHub)
4. Learn Git, SQL, and one framework (React or Node.js)
5. Apply for internships / entry-level roles

Open **Roadmap** → "Software Engineer" → **Generate roadmap**`;
  }

  if (q.includes('ai engineer')) {
    return `**How to become an AI Engineer:**

1. Learn Python, math (linear algebra, stats), and Git
2. Study ML with scikit-learn; build classification projects
3. Learn deep learning (PyTorch) and one NLP or vision project
4. Deploy a model API (Docker + cloud)
5. Follow the **AI Engineer** roadmap in FutureForge (6-month plan)

**Skills:** Python, TensorFlow/PyTorch, SQL, cloud, MLOps basics`;
  }

  if (q.includes('data analyst') || q.includes('data analytics')) {
    return `**Data Analyst roadmap:**

1. Month 1: Excel/Sheets, statistics basics, business metrics
2. Month 2: SQL joins, aggregations, dashboards
3. Month 3: Python basics, pandas, data cleaning
4. Month 4: Power BI/Tableau and 2 portfolio projects
5. Month 5-6: Case studies, resume, interview practice, job applications

**Projects:** sales dashboard, student performance analysis, customer churn report`;
  }

  if ((q.includes('java') || q.includes('dsa')) && (q.includes('learn') || q.includes('next'))) {
    return `**Since you know Java and DSA, learn this next:**

1. SQL and databases
2. Spring Boot for REST APIs
3. Git/GitHub workflow
4. Basic frontend: HTML, CSS, JavaScript, React
5. One deployed Java project with login, database, and API docs

Best project: student/job portal backend using Java, Spring Boot, MySQL or MongoDB, and JWT auth.`;
  }

  if (q.includes('java developer') || q.includes('roadmap for java')) {
    return `**Java Developer roadmap:**

• Month 1–2: Core Java, OOP, Maven
• Month 3: Spring Boot, REST APIs, SQL
• Month 4: Microservices, testing, Docker
• Month 5: System design + interview prep

Open **Roadmap** → "Java Developer" → **Generate roadmap**`;
  }

  if (q.includes('cricket') || q.includes('cricketer')) {
    return `**Cricketer career path:**

1. Club/academy + qualified coach
2. Daily nets, fitness, match play
3. Stats + highlight video for trials
4. Pathway: district → state → national / leagues (IPL, etc.)
5. Backup education plan

**Roadmap** → type "Cricketer" → **Generate roadmap** (5-month plan)`;
  }

  if (q.includes('2026') || q.includes('skills')) {
    return `**Best skills in 2026:**

• Tech: AI/ML, Python, cloud, TypeScript, SQL
• Sports: Video analysis, fitness, mental performance
• Healthcare: Certifications + digital health literacy
• Everyone: Communication, projects, adaptability`;
  }

  if (q.includes('resume') || q.includes('cv') || q.includes('ats')) {
    return `**Resume improvement plan:**

1. Match the resume title to your target role
2. Add 3-5 role-specific skills from job descriptions
3. Rewrite project bullets with action + tool + measurable result
4. Add links: GitHub, portfolio, LinkedIn, certifications
5. Use **Resume Analyzer** to get ATS score and missing skills

For freshers, projects and internships matter more than long summaries.`;
  }

  if (q.includes('interview') || q.includes('mock')) {
    return `**Interview practice plan:**

1. Prepare a 60-second introduction
2. Practice role basics, projects, and problem-solving questions
3. Use STAR format for behavior answers
4. Add examples with numbers or clear outcomes
5. Open **Interview Coach** and choose your target role for feedback`;
  }

  if (q.includes('job') || q.includes('internship') || q.includes('placement')) {
    return `**Job search plan:**

1. Pick one target role and collect 20 job descriptions
2. Build a matching resume and 2 proof-of-work projects
3. Apply daily and track company, date, role, and status
4. Message alumni/recruiters with a short portfolio link
5. Practice interviews twice a week

Tell me your target role and current skills for a custom plan.`;
  }

  if (q.includes('learn') || q.includes('study') || q.includes('course')) {
    return `**Learning plan for ${topic}:**

1. Learn the basic terms and tools first
2. Practice daily for 45-90 minutes
3. Build one small project in the first week
4. Turn notes into portfolio proof: screenshots, GitHub, reports, or certificates
5. Review progress every Sunday and adjust the roadmap

Share your current level and timeline, and I can make this month-wise.`;
  }

  if (/^(what is|what are|explain|define|meaning of)\b/i.test(String(message || '').trim())) {
    return `**${topic}:**

Think of it in four parts:

1. Purpose: what problem it solves
2. Parts: the main terms or tools
3. Example: where it appears in real work
4. Practice: one small task to make it clear

If you want, ask "explain ${topic} for interviews" and I will answer in interview style.`;
  }

  if (careerContext?.title) {
    return `**For ${careerContext.title}:**

1. Build the core skills required for the role
2. Create proof: projects, certifications, portfolio, results, or competition records
3. Analyze your resume gaps
4. Practice role-specific interviews
5. Track progress weekly in the dashboard

Ask "roadmap for ${careerContext.title}" and I will make it step-by-step.`;
  }

  return `**Quick answer:** I can help with "${topic}" using a practical career-style plan.

1. Define the goal clearly
2. List what you already know
3. Identify missing skills or information
4. Make a 30-day action plan
5. Review progress and improve

For the strongest answer, tell me your target career, current skills, and timeline.`;
};

function extractTopic(message) {
  const text = String(message || '').replace(/[?!]+$/g, '').trim();
  const match = text.match(/(?:explain|what is|what are|tell me about|learn|study|roadmap for|plan for)\s+(.+)/i);
  return (match?.[1] || text || 'this').slice(0, 80);
}

FF.isStaleCoachReply = function (text) {
  return (
    text &&
    (text.includes('Try asking:') ||
      text.includes("I'm your FutureForge AI career coach. I can help you pick"))
  );
};
