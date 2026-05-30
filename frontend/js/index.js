FF.initNav('');

(async function initHome() {
  await FF.CareerPicker.load();

  const picker = FF.CareerPicker.mount(document.getElementById('homeCareerPicker'), {
    showCategoryFilter: true,
    placeholder: 'e.g. Software Engineer, Cricketer, Doctor, Fashion Designer...',
    careerId: '',
    value: '',
  });

  function goRoadmap() {
    const { careerId, title, customTitle } = picker.getValue();
    const t = customTitle || title;
    if (!t) {
      alert('Type the career you want to develop first.');
      return;
    }
    const q = new URLSearchParams();
    if (careerId) q.set('career', careerId);
    q.set('title', t);
    window.location.href = `roadmap.html?${q}`;
  }

  function goCoach() {
    const { title, customTitle } = picker.getValue();
    const t = customTitle || title;
    if (t) sessionStorage.setItem('ff_coach_question', `How can I become a ${t}?`);
    window.location.href = 'chat.html';
  }

  document.getElementById('btnRoadmap').addEventListener('click', goRoadmap);
  document.getElementById('btnCoach').addEventListener('click', goCoach);

  const row = document.getElementById('fieldsRow');
  if (row && FF.CareerPicker.categories.length) {
    row.innerHTML = FF.CareerPicker.categories
      .map(
        (c) =>
          `<a href="careers.html?category=${encodeURIComponent(c.name)}" class="field-pill">${c.name} <span>${c.count}</span></a>`
      )
      .join('');
  }
})();
