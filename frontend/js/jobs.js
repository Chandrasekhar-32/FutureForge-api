FF.initNav('jobs');
document.getElementById('sidebar').innerHTML = FF.renderSidebar('jobs');

async function search() {
  const q = document.getElementById('jobQ').value;
  const location = document.getElementById('jobLoc').value;
  const skill = document.getElementById('jobSkill').value;
  const remote = document.getElementById('jobRemote').checked;
  const params = new URLSearchParams({ q, location, skill, remote });
  const data = await FF.api(`/api/jobs/search?${params}`);
  document.getElementById('jobSource').textContent = `Source: ${data.source}`;
  document.getElementById('jobsList').innerHTML = data.jobs
    .map(
      (j) => `
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h3>${j.title}</h3>
          <p style="color:var(--text-muted)">${j.company} · ${j.location} ${j.remote ? '· Remote' : ''}</p>
          <p style="margin-top:8px;font-size:0.9rem">${j.salary} · ${j.experience}</p>
          ${j.skills?.length ? `<p style="margin-top:8px;font-size:0.85rem">Skills: ${j.skills.join(', ')}</p>` : ''}
        </div>
        <div style="display:flex;gap:8px;align-items:start">
          <a href="${j.url}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Apply</a>
          <button class="btn btn-ghost btn-sm save-job" data-job='${JSON.stringify(j).replace(/'/g, '&#39;')}'>Save</button>
        </div>
      </div>
    </div>`
    )
    .join('');

  document.querySelectorAll('.save-job').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!FF.getToken()) {
        alert('Log in to save jobs');
        return;
      }
      const job = JSON.parse(btn.dataset.job);
      await FF.api('/api/jobs/save', { method: 'POST', body: JSON.stringify(job) });
      loadSaved();
    });
  });
}

async function loadSaved() {
  if (!FF.getToken()) {
    document.getElementById('savedJobs').innerHTML = '<p style="color:var(--text-muted)">Log in to see saved jobs.</p>';
    return;
  }
  try {
    const { jobs } = await FF.api('/api/jobs/saved');
    document.getElementById('savedJobs').innerHTML = jobs.length
      ? jobs
          .map(
            (j) => `<div class="feature-card"><h3>${j.title}</h3><p>${j.company}</p></div>`
          )
          .join('')
      : '<p style="color:var(--text-muted)">No saved jobs yet.</p>';
  } catch {
    document.getElementById('savedJobs').innerHTML = '';
  }
}

document.getElementById('searchJobs').addEventListener('click', search);
search();
loadSaved();
