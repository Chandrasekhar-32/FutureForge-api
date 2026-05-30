if (!FF.requireAuth()) throw new Error('auth');
FF.initNav('dashboard');
document.getElementById('sidebar').innerHTML = FF.renderSidebar('dashboard');

const user = FF.getUser();
if (user?.name) {
  document.getElementById('welcomeText').textContent = user?.name
    ? `Welcome back, ${user.name} — here's your career progress`
  : 'Your student career dashboard — track assessment, roadmap, and prep scores';
}

let matchChart, radarChart;

async function load() {
  try {
    const { stats } = await FF.api('/api/dashboard/stats');
    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card"><div class="label">Assessment</div><div class="value">${stats.assessmentScore || '—'}${stats.assessmentScore ? '%' : ''}</div><small style="color:var(--text-muted)">${stats.topCareer || 'Take assessment'}</small></div>
      <div class="stat-card"><div class="label">Resume ATS</div><div class="value">${stats.resumeScore || '—'}${stats.resumeScore ? '' : ''}</div></div>
      <div class="stat-card"><div class="label">Interview</div><div class="value">${stats.interviewScore || '—'}${stats.interviewScore ? '' : ''}</div></div>
      <div class="stat-card"><div class="label">Roadmap</div><div class="value">${stats.roadmapProgress || 0}%</div><div class="progress-bar"><div class="progress-bar-fill" style="width:${stats.roadmapProgress || 0}%"></div></div></div>
    `;
    renderCharts(stats);
  } catch (e) {
    console.error(e);
  }
}

function renderCharts(stats) {
  const matches = stats.careerMatches?.length
    ? stats.careerMatches
    : [
        { title: 'AI Engineer', percent: 94 },
        { title: 'Software Engineer', percent: 91 },
        { title: 'Data Scientist', percent: 88 },
      ];

  const ctx1 = document.getElementById('matchChart');
  if (matchChart) matchChart.destroy();
  matchChart = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: matches.map((m) => m.title),
      datasets: [{
        label: 'Match %',
        data: matches.map((m) => m.percent),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { max: 100, grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8' } },
        x: { ticks: { color: '#94a3b8', maxRotation: 45 } },
      },
    },
  });

  const dims = stats.dimensionScores || {
    analytical: 82,
    creativity: 75,
    leadership: 68,
    communication: 79,
    technical: 88,
    business: 71,
  };
  const ctx2 = document.getElementById('radarChart');
  if (radarChart) radarChart.destroy();
  radarChart = new Chart(ctx2, {
    type: 'radar',
    data: {
      labels: ['Analytical', 'Creativity', 'Leadership', 'Communication', 'Technical', 'Business'],
      datasets: [{
        label: 'You',
        data: Object.values(dims),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.2)',
      }],
    },
    options: {
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false },
          grid: { color: 'rgba(148,163,184,0.15)' },
          pointLabels: { color: '#94a3b8' },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

load();
