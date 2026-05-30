FF.initNav('interview');
document.getElementById('sidebar').innerHTML = FF.renderSidebar('interview');

let questions = [];
let index = 0;
let pickerApi = null;
let sessionRole = '';
let sessionCustomTitle = '';
let sessionTitle = '';

async function init() {
  await FF.CareerPicker.load();
  const params = new URLSearchParams(location.search);
  const initial = params.get('career') || '';
  const titleParam = params.get('title') || '';
  const c = FF.CareerPicker.careers.find((x) => x.id === initial);
  pickerApi = FF.CareerPicker.mount(document.getElementById('careerPickerMount'), {
    showCategoryFilter: true,
    careerId: initial,
    value: titleParam || c?.title || 'Professional Athlete',
  });
}

document.getElementById('startInterview').addEventListener('click', async () => {
  if (!FF.getToken()) {
    alert('Please log in to use the interview coach.');
    window.location.href = 'login.html';
    return;
  }
  const { careerId, title, customTitle } = pickerApi.getValue();
  if (!careerId && !title) {
    alert('Select or type a career first.');
    return;
  }
  sessionRole = careerId || 'custom';
  sessionCustomTitle = customTitle || (!careerId ? title : '');
  sessionTitle = title;

  const data = await FF.api('/api/interview/generate', {
    method: 'POST',
    body: JSON.stringify({ role: sessionRole, customTitle: sessionCustomTitle }),
  });
  questions = data.questions;
  index = 0;
  document.getElementById('interviewPanel').style.display = 'block';
  document.querySelector('#interviewPanel .tag').textContent = data.careerTitle || sessionTitle;
  showQuestion();
});

function showQuestion() {
  document.getElementById('feedback').style.display = 'none';
  document.getElementById('nextQ').style.display = 'none';
  document.getElementById('answerInput').value = '';
  document.getElementById('qNum').textContent = `Question ${index + 1} of ${questions.length}`;
  document.getElementById('currentQ').textContent = questions[index];
}

document.getElementById('submitAnswer').addEventListener('click', async () => {
  const answer = document.getElementById('answerInput').value.trim();
  if (!answer) return;
  const data = await FF.api('/api/interview/answer', {
    method: 'POST',
    body: JSON.stringify({
      question: questions[index],
      answer,
      role: sessionRole,
      customTitle: sessionCustomTitle,
    }),
  });
  const fb = document.getElementById('feedback');
  fb.style.display = 'block';
  fb.innerHTML = `<strong>Score: ${data.score}/100</strong><p style="margin-top:8px;color:var(--text-muted)">${data.feedback}</p>`;
  document.getElementById('nextQ').style.display = 'inline-flex';
});

document.getElementById('nextQ').addEventListener('click', () => {
  index++;
  if (index < questions.length) showQuestion();
  else {
    document.getElementById('interviewPanel').innerHTML =
      '<h2>Session complete!</h2><p style="color:var(--text-muted)">Review your scores on the dashboard.</p><a href="dashboard.html" class="btn btn-primary" style="margin-top:16px">Go to Dashboard</a>';
  }
});

init();
