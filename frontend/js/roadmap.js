FF.initNav('roadmap');
document.getElementById('sidebar').innerHTML = FF.renderSidebar('roadmap');

const params = new URLSearchParams(location.search);
const completed = new Set(JSON.parse(localStorage.getItem('ff_roadmap_done') || '[]'));
let pickerApi = null;
let currentRoadmap = null;

const QUICK_IDS = [
  'cricketer',
  'professional-athlete',
  'sports-coach',
  'software-engineer',
  'ai-engineer',
  'registered-nurse',
];

async function init() {
  await FF.CareerPicker.load();
  const initial = params.get('career') || '';
  const titleParam = params.get('title') || '';
  const c = FF.CareerPicker.careers.find((x) => x.id === initial);

  pickerApi = FF.CareerPicker.mount(document.getElementById('careerPickerMount'), {
    showCategoryFilter: true,
    careerId: initial,
    value: titleParam || c?.title || '',
  });

  const quickEl = document.getElementById('quickCareers');
  quickEl.innerHTML = QUICK_IDS.map((id) => {
    const career = FF.CareerPicker.careers.find((x) => x.id === id);
    if (!career) return '';
    return `<button type="button" class="btn btn-secondary btn-sm quick-career" data-id="${id}">${career.title}</button>`;
  }).join('');

  quickEl.querySelectorAll('.quick-career').forEach((btn) => {
    btn.addEventListener('click', () => {
      const career = FF.CareerPicker.careers.find((x) => x.id === btn.dataset.id);
      pickerApi.setValue(career.id, career.title);
      loadRoadmap();
    });
  });

  if (initial || titleParam) loadRoadmap();
}

async function loadRoadmap() {
  const alertEl = document.getElementById('alert');
  alertEl.hidden = true;
  const btn = document.getElementById('loadRoadmapBtn');
  btn.disabled = true;
  btn.textContent = 'Loading...';

  try {
    const { careerId, title, customTitle } = pickerApi.getValue();
    const id = careerId || customTitle || title;
    if (!id) {
      FF.showAlert(alertEl, 'Select or type a career first.');
      return;
    }

    const titleForApi = customTitle || title;
    let roadmap;

    try {
      const res = await FF.api('/api/roadmap/generate', {
        method: 'POST',
        body: JSON.stringify({ careerId: careerId || undefined, title: titleForApi }),
      });
      roadmap = res.roadmap;
    } catch (postErr) {
      const q = new URLSearchParams();
      if (careerId) q.set('careerId', careerId);
      if (titleForApi) q.set('title', titleForApi);
      const pathId = careerId || 'custom';
      const res = await FF.api(`/api/roadmap/${encodeURIComponent(pathId)}?${q}`);
      roadmap = res.roadmap;
    }
    currentRoadmap = roadmap;

    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('saveProgress').style.display = 'inline-flex';

    const generated = roadmap.generated
      ? ' <span class="tag">Personalized plan</span>'
      : ' <span class="tag">Curated plan</span>';

    document.getElementById('roadmapTimeline').innerHTML =
      `<h2 style="margin-bottom:16px">${roadmap.careerTitle || roadmap.title}${generated}</h2>
      <p style="color:var(--text-muted);margin-bottom:20px">${roadmap.totalMonths} month plan · check off topics as you complete them</p>` +
      roadmap.phases
        .map(
          (phase) => `
      <div class="card" style="margin-bottom:16px">
        <h3>Month ${phase.month}</h3>
        <ul style="margin:12px 0 16px 20px;color:var(--text-muted)">
          ${phase.topics.map((t) => `<li>${t}</li>`).join('')}
        </ul>
        <p><strong>Projects:</strong> ${phase.projects.join(', ')}</p>
        <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px">
          ${phase.topics
            .map(
              (t) => `
            <label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;cursor:pointer">
              <input type="checkbox" data-topic="${t.replace(/"/g, '&quot;')}" ${completed.has(t) ? 'checked' : ''} /> ${t}
            </label>`
            )
            .join('')}
        </div>
      </div>`
        )
        .join('');

    document.querySelectorAll('[data-topic]').forEach((cb) => {
      cb.addEventListener('change', () => {
        if (cb.checked) completed.add(cb.dataset.topic);
        else completed.delete(cb.dataset.topic);
        updateLocalProgress(roadmap);
      });
    });
    updateLocalProgress(roadmap);
  } catch (e) {
    FF.showAlert(alertEl, e.message || 'Failed to load roadmap. Is the server running?');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate roadmap';
  }
}

function updateLocalProgress(roadmap) {
  const all = roadmap.phases.flatMap((p) => p.topics);
  const done = [...completed].filter((t) => all.includes(t));
  const pct = all.length ? Math.round((done.length / all.length) * 100) : 0;
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('progressBar').style.width = `${pct}%`;
  localStorage.setItem('ff_roadmap_done', JSON.stringify([...completed]));
}

document.getElementById('loadRoadmapBtn').addEventListener('click', loadRoadmap);

document.getElementById('saveProgress').addEventListener('click', async () => {
  if (!currentRoadmap) return;
  const alertEl = document.getElementById('alert');
  const { careerId, customTitle, title } = pickerApi.getValue();
  if (!FF.getToken()) {
    FF.showAlert(alertEl, 'Progress saved on this device. Log in to sync to your account.', 'success');
    return;
  }
  try {
    await FF.api('/api/roadmap/progress', {
      method: 'POST',
      body: JSON.stringify({
        careerId: careerId || currentRoadmap.careerId,
        customTitle: customTitle || title,
        completedTopics: [...completed],
      }),
    });
    FF.showAlert(alertEl, 'Progress saved!', 'success');
  } catch (e) {
    FF.showAlert(alertEl, e.message);
  }
});

init();
