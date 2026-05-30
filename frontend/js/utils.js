const API_BASE = '';

function getToken() {
  return localStorage.getItem('ff_token');
}

function setToken(token) {
  if (token) localStorage.setItem('ff_token', token);
  else localStorage.removeItem('ff_token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('ff_user') || 'null');
  } catch {
    return null;
  }
}

function setUser(user) {
  if (user) localStorage.setItem('ff_user', JSON.stringify(user));
  else localStorage.removeItem('ff_user');
}

function getGuestSession() {
  let id = localStorage.getItem('ff_guest_session');
  if (!id) {
    id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('ff_guest_session', id);
  }
  return id;
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  const token = options.skipAuth ? null : getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  else headers['X-Guest-Session'] = getGuestSession();

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || res.statusText || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function formatSalary(salary) {
  if (!salary) return 'N/A';
  if (typeof salary === 'object') {
    return `$${(salary.min / 1000).toFixed(0)}k – $${(salary.max / 1000).toFixed(0)}k`;
  }
  return salary;
}

function showAlert(el, message, type = 'error') {
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = message;
  el.hidden = !message;
}

function renderNav(active = '') {
  const user = getUser();
  const authLinks = user
    ? `<a href="dashboard.html" class="${active === 'dashboard' ? 'active' : ''}">Dashboard</a>
       <a href="profile.html" class="${active === 'profile' ? 'active' : ''}">Profile</a>
       <button class="btn btn-ghost btn-sm" id="logoutBtn">Logout</button>`
    : `<a href="login.html">Login</a>
       <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>`;

  return `
    <nav class="nav">
      <div class="nav-inner">
        <a href="index.html" class="logo">
          <span class="logo-icon">⚡</span>
          FutureForge AI
        </a>
        <ul class="nav-links">
          <a href="careers.html">Careers</a>
          <a href="assessment.html">Assessment</a>
          <a href="chat.html">AI Coach</a>
          <a href="jobs.html">Jobs</a>
          ${authLinks}
        </ul>
      </div>
    </nav>`;
}

function initNav(active) {
  const mount = document.getElementById('nav-root');
  if (mount) mount.innerHTML = renderNav(active);
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    setToken(null);
    setUser(null);
    window.location.href = 'index.html';
  });
}

function renderSidebar(active) {
  const links = [
    ['dashboard.html', 'Dashboard', 'dashboard'],
    ['assessment.html', 'Assessment', 'assessment'],
    ['careers.html', 'Career Explorer', 'careers'],
    ['roadmap.html', 'Roadmap', 'roadmap'],
    ['resume.html', 'Resume Analyzer', 'resume'],
    ['interview.html', 'Interview Coach', 'interview'],
    ['chat.html', 'AI Coach', 'chat'],
    ['jobs.html', 'Job Search', 'jobs'],
    ['profile.html', 'Profile', 'profile'],
  ];
  return links
    .map(
      ([href, label, key]) =>
        `<a href="${href}" class="${active === key ? 'active' : ''}">${label}</a>`
    )
    .join('');
}

window.FF = {
  api,
  getToken,
  setToken,
  getUser,
  setUser,
  getGuestSession,
  requireAuth,
  formatSalary,
  showAlert,
  initNav,
  renderSidebar,
};
