FF.initNav('resume');
document.getElementById('sidebar').innerHTML = FF.renderSidebar('resume');

let pickerApi = null;

(async () => {
  await FF.CareerPicker.load();
  pickerApi = FF.CareerPicker.mount(document.getElementById('careerPickerMount'), {
    showCategoryFilter: true,
    careerId: 'professional-athlete',
    value: 'Professional Athlete',
  });
})();

document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const alertEl = document.getElementById('alert');
  const file = document.getElementById('resumeFile').files[0];
  const text = document.getElementById('resumeText').value.trim();
  const { careerId, title, customTitle } = pickerApi.getValue();
  const targetRole = careerId || customTitle || title;

  if (!file && !text) {
    FF.showAlert(alertEl, 'Upload a file or paste resume text.');
    return;
  }
  if (!targetRole) {
    FF.showAlert(alertEl, 'Select or type your target career.');
    return;
  }

  if (!FF.getToken()) {
    FF.showAlert(alertEl, 'Please log in to analyze resumes.', 'error');
    setTimeout(() => (window.location.href = 'login.html'), 1500);
    return;
  }

  try {
    document.getElementById('analyzeBtn').disabled = true;
    let data;
    if (file) {
      const fd = new FormData();
      fd.append('resume', file);
      fd.append('targetRole', targetRole);
      fd.append('targetTitle', customTitle || title);
      data = await FF.api('/api/resume/analyze', { method: 'POST', body: fd });
    } else {
      data = await FF.api('/api/resume/analyze', {
        method: 'POST',
        body: JSON.stringify({ text, targetRole, targetTitle: customTitle || title }),
      });
    }
    showResults(data.analysis);
    FF.showAlert(alertEl, 'Analysis complete!', 'success');
  } catch (e) {
    FF.showAlert(alertEl, e.message);
  } finally {
    document.getElementById('analyzeBtn').disabled = false;
  }
});

function showResults(a) {
  document.getElementById('results').style.display = 'block';
  document.getElementById('atsScore').textContent = a.atsScore;
  document.getElementById('strengths').innerHTML = a.strengths.map((s) => `<li>✓ ${s}</li>`).join('');
  document.getElementById('missing').innerHTML = a.missing.map((s) => `<li>✗ ${s}</li>`).join('');
  document.getElementById('recommendations').innerHTML = a.recommendations.map((s) => `<li>${s}</li>`).join('');
}
