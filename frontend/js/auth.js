const alertEl = document.getElementById('alert');

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await FF.api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
    });
    FF.setToken(data.token);
    FF.setUser(data.user);
    window.location.href = 'dashboard.html';
  } catch (err) {
    FF.showAlert(alertEl, err.message);
  }
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await FF.api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: fd.get('name'),
        email: fd.get('email'),
        password: fd.get('password'),
      }),
    });
    FF.setToken(data.token);
    FF.setUser(data.user);
    window.location.href = 'dashboard.html';
  } catch (err) {
    FF.showAlert(alertEl, err.message);
  }
});

document.getElementById('googleBtn')?.addEventListener('click', async () => {
  const email = prompt('Demo Google login — enter your email:', 'student@university.edu');
  if (!email) return;
  try {
    const data = await FF.api('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email, name: email.split('@')[0], googleId: 'demo' }),
    });
    FF.setToken(data.token);
    FF.setUser(data.user);
    window.location.href = 'dashboard.html';
  } catch (err) {
    FF.showAlert(alertEl, err.message);
  }
});

if (FF.getToken() && (location.pathname.includes('login') || location.pathname.includes('register'))) {
  window.location.href = 'dashboard.html';
}
