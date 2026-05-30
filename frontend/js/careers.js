FF.initNav('careers');
document.getElementById('sidebar').innerHTML = FF.renderSidebar('careers');

let allCareers = [];
let activeCategory = '';
let explorerPicker = null;

async function init() {
  await FF.CareerPicker.load();
  explorerPicker = FF.CareerPicker.mount(document.getElementById('explorerPicker'), {
    showCategoryFilter: true,
    careerId: 'professional-athlete',
    value: 'Professional Athlete',
  });

  document.getElementById('explorerRoadmap').addEventListener('click', () => {
    const { careerId, title, customTitle } = explorerPicker.getValue();
    const q = new URLSearchParams();
    if (careerId) q.set('career', careerId);
    q.set('title', customTitle || title);
    window.location.href = `roadmap.html?${q}`;
  });

  document.getElementById('explorerInterview').addEventListener('click', () => {
    const { careerId, title, customTitle } = explorerPicker.getValue();
    const q = new URLSearchParams();
    if (careerId) q.set('career', careerId);
    q.set('title', customTitle || title);
    window.location.href = `interview.html?${q}`;
  });

  const urlCat = new URLSearchParams(location.search).get('category');
  if (urlCat) activeCategory = urlCat;

  await loadCategories();
  if (urlCat) {
    document.querySelectorAll('#categoryPills button').forEach((b) => {
      b.classList.toggle('active', b.dataset.cat === urlCat);
    });
  }
  await loadCareers('', activeCategory);
  renderSportsHighlight();
}

async function loadCareers(q = '', category = activeCategory) {
  try {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    const data = await FF.api(`/api/careers?${params}`);
    allCareers = data.careers;
    document.getElementById('careerCount').textContent = `${data.count} careers shown`;
    renderGrid(allCareers);
    populateCompareSelects();
  } catch (e) {
    document.getElementById('careersGrid').innerHTML =
      `<p class="alert alert-error">Could not load careers. Start the server with <code>npm run dev</code>.</p>`;
  }
}

async function loadCategories() {
  const { categories } = await FF.api('/api/careers/categories/list');
  const pills = document.getElementById('categoryPills');
  pills.innerHTML =
    `<button type="button" class="active" data-cat="">All</button>` +
    categories
      .map((c) => `<button type="button" data-cat="${c.name}">${c.name} (${c.count})</button>`)
      .join('');
  pills.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      pills.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      loadCareers(document.getElementById('searchCareers').value.trim(), activeCategory);
    });
  });
}

function renderSportsHighlight() {
  const sports = FF.CareerPicker.careers.filter((c) => c.category === 'Sports');
  if (!sports.length) return;
  const el = document.getElementById('sportsHighlight');
  el.style.display = 'block';
  el.innerHTML = `
    <h3>⚽ Sports careers</h3>
    <p style="color:var(--text-muted);margin:8px 0 16px">Athlete, coach, trainer, analyst, and more</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      ${sports
        .slice(0, 6)
        .map(
          (c) =>
            `<button type="button" class="btn btn-secondary btn-sm sports-quick" data-id="${c.id}">${c.title}</button>`
        )
        .join('')}
    </div>`;
  el.querySelectorAll('.sports-quick').forEach((btn) => {
    btn.addEventListener('click', () => showDetail(btn.dataset.id));
  });
}

function populateCompareSelects() {
  const opts = allCareers.map((c) => `<option value="${c.id}">${c.title} (${c.category})</option>`).join('');
  document.getElementById('compareA').innerHTML = opts;
  document.getElementById('compareB').innerHTML = opts;
  const athlete = allCareers.find((c) => c.id === 'professional-athlete');
  const coach = allCareers.find((c) => c.id === 'sports-coach');
  const se = allCareers.find((c) => c.id === 'software-engineer');
  const ds = allCareers.find((c) => c.id === 'data-scientist');
  if (activeCategory === 'Sports' && athlete && coach) {
    document.getElementById('compareA').value = athlete.id;
    document.getElementById('compareB').value = coach.id;
  } else if (se && ds) {
    document.getElementById('compareA').value = se.id;
    document.getElementById('compareB').value = ds.id;
  }
}

function renderGrid(careers) {
  if (!careers.length) {
    document.getElementById('careersGrid').innerHTML =
      '<p style="color:var(--text-muted)">No matches. Try another search or type a custom career in the box above.</p>';
    return;
  }
  document.getElementById('careersGrid').innerHTML = careers
    .map(
      (c) => `
    <article class="feature-card career-card" data-id="${c.id}">
      <span class="tag">${c.category}</span>
      <h3 style="margin:12px 0 8px">${c.title}</h3>
      <p>${c.description.slice(0, 100)}...</p>
      <p style="margin-top:12px;color:var(--accent-2);font-weight:600">${FF.formatSalary(c.salary)}</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px">
        <button type="button" class="btn btn-primary btn-sm" data-action="detail" data-id="${c.id}">Details</button>
        <button type="button" class="btn btn-ghost btn-sm" data-action="roadmap" data-id="${c.id}">Roadmap</button>
        <button type="button" class="btn btn-ghost btn-sm" data-action="interview" data-id="${c.id}">Interview</button>
      </div>
    </article>`
    )
    .join('');

  document.querySelectorAll('.career-card [data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const career = allCareers.find((c) => c.id === id);
      if (btn.dataset.action === 'detail') showDetail(id);
      if (btn.dataset.action === 'roadmap')
        window.location.href = `roadmap.html?career=${id}&title=${encodeURIComponent(career?.title || '')}`;
      if (btn.dataset.action === 'interview')
        window.location.href = `interview.html?career=${id}&title=${encodeURIComponent(career?.title || '')}`;
    });
  });
}

async function showDetail(id) {
  const { career } = await FF.api(`/api/careers/${id}`);
  const el = document.getElementById('careerDetail');
  el.style.display = 'block';
  el.innerHTML = `
    <span class="tag">${career.category}</span>
    <h2 style="margin-top:12px">${career.title}</h2>
    <p style="color:var(--text-muted);margin:12px 0">${career.description}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin:20px 0">
      <div><strong>Salary</strong><br>${FF.formatSalary(career.salary)}</div>
      <div><strong>Growth</strong><br>${career.growth}</div>
      <div><strong>Demand</strong><br>${career.demand}</div>
      <div><strong>Education</strong><br>${career.education}</div>
    </div>
    <p><strong>Skills:</strong> ${career.skills.join(', ')}</p>
    <p style="margin-top:12px"><strong>Companies / organizations:</strong> ${career.companies.join(', ')}</p>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:20px">
      <a href="roadmap.html?career=${career.id}&title=${encodeURIComponent(career.title)}" class="btn btn-primary btn-sm">View Roadmap</a>
      <a href="interview.html?career=${career.id}&title=${encodeURIComponent(career.title)}" class="btn btn-secondary btn-sm">Interview Coach</a>
      <a href="chat.html" class="btn btn-secondary btn-sm" onclick="sessionStorage.setItem('ff_coach_career','${career.title}')">Ask AI Coach</a>
    </div>`;
  el.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('searchCareers')?.addEventListener('input', (e) => {
  loadCareers(e.target.value.trim(), activeCategory);
});

document.getElementById('compareBtn')?.addEventListener('click', async () => {
  const a = document.getElementById('compareA').value;
  const b = document.getElementById('compareB').value;
  const { comparison } = await FF.api(`/api/careers/compare?a=${a}&b=${b}`);
  const row = (label, va, vb) => `<tr><td>${label}</td><td>${va}</td><td>${vb}</td></tr>`;
  document.getElementById('compareResult').innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
      <thead><tr><th></th><th>${comparison.a.title}</th><th>${comparison.b.title}</th></tr></thead>
      <tbody>
        ${row('Category', comparison.a.category, comparison.b.category)}
        ${row('Median salary', FF.formatSalary(comparison.a.salary), FF.formatSalary(comparison.b.salary))}
        ${row('Growth', comparison.a.growth, comparison.b.growth)}
        ${row('Demand', comparison.a.demand, comparison.b.demand)}
        ${row('Top skills', comparison.a.skills.slice(0, 4).join(', '), comparison.b.skills.slice(0, 4).join(', '))}
      </tbody>
    </table>`;
});

init();
