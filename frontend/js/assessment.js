FF.initNav('assessment');
document.getElementById('sidebar').innerHTML = FF.renderSidebar('assessment');

const QUESTIONS = [
  'I enjoy solving complex logical problems.',
  'I prefer building things people can see and use.',
  'I like leading group projects.',
  'I communicate ideas clearly in writing and speech.',
  'I stay up to date with new programming tools.',
  'I think about how products make money.',
  'I analyze data to find patterns.',
  'I enjoy creative design and aesthetics.',
  'I mentor others when they struggle.',
  'I present confidently to an audience.',
  'I debug code until it works perfectly.',
  'I understand business metrics and KPIs.',
  'I break big problems into smaller steps.',
  'I brainstorm unconventional solutions.',
  'I delegate tasks effectively on a team.',
  'I write documentation others understand.',
  'I learn new frameworks quickly.',
  'I evaluate trade-offs between cost and quality.',
  'I use math/statistics in decision making.',
  'I sketch wireframes or visual ideas.',
  'I resolve conflicts between teammates.',
  'I explain technical topics to non-technical people.',
  'I contribute to open source or side projects.',
  'I prioritize features based on user impact.',
  'I am excited about AI and automation trends.',
];

const LIKERT = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
let current = 0;
const answers = [];

function renderQuestion() {
  document.getElementById('progressText').textContent = `Question ${current + 1} of ${QUESTIONS.length}`;
  document.getElementById('quizProgress').style.width = `${((current + 1) / QUESTIONS.length) * 100}%`;
  document.getElementById('questionText').textContent = QUESTIONS[current];
  document.getElementById('options').innerHTML = LIKERT.map(
    (label, i) =>
      `<button type="button" class="btn btn-secondary" data-score="${i + 1}" style="text-align:left">${label}</button>`
  ).join('');
  document.querySelectorAll('#options button').forEach((btn) => {
    btn.addEventListener('click', () => {
      answers.push({ questionId: current, score: Number(btn.dataset.score) });
      current++;
      if (current < QUESTIONS.length) renderQuestion();
      else submit();
    });
  });
}

async function submit() {
  document.getElementById('quizCard').innerHTML = '<p>Analyzing your profile with AI...</p>';
  try {
    const token = FF.getToken();
    let data;
    if (token) {
      data = await FF.api('/api/assessment/submit', {
        method: 'POST',
        body: JSON.stringify({ answers }),
      });
    } else {
      data = await mockSubmit();
    }
    showResults(data);
  } catch (e) {
    showResults(await mockSubmit());
  }
}

async function mockSubmit() {
  const res = await fetch('/api/careers');
  const careers = (await res.json()).careers.slice(0, 5);
  return {
    careerMatches: careers.map((c, i) => ({
      careerId: c.id,
      title: c.title,
      percent: 95 - i * 3,
    })),
    dimensionScores: {
      analytical: 85,
      creativity: 78,
      leadership: 72,
      communication: 80,
      technical: 90,
      business: 74,
    },
  };
}

function showResults(data) {
  document.getElementById('quizCard').style.display = 'none';
  const card = document.getElementById('resultsCard');
  card.style.display = 'block';
  document.getElementById('matchList').innerHTML = data.careerMatches
    .map((m) => `<li><span>${m.title}</span><span class="match-pct">${m.percent}%</span></li>`)
    .join('');

  new Chart(document.getElementById('resultRadar'), {
    type: 'radar',
    data: {
      labels: ['Analytical', 'Creativity', 'Leadership', 'Communication', 'Technical', 'Business'],
      datasets: [{
        data: Object.values(data.dimensionScores),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.25)',
      }],
    },
    options: {
      scales: { r: { min: 0, max: 100, pointLabels: { color: '#94a3b8' } } },
      plugins: { legend: { display: false } },
    },
  });
}

renderQuestion();
