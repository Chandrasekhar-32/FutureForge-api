/**
 * Searchable career picker — loads ALL careers from API.
 * Supports custom career title (not limited to fixed list).
 */
FF.CareerPicker = {
  careers: [],
  categories: [],

  async load() {
    const [careersRes, catRes] = await Promise.all([
      FF.api('/api/careers'),
      FF.api('/api/careers/categories/list').catch(() => ({ categories: [] })),
    ]);
    this.careers = careersRes.careers || [];
    this.categories = catRes.categories || [];
    return this;
  },

  mount(container, options = {}) {
    const {
      inputId = 'careerPickerInput',
      hiddenId = 'careerPickerId',
      customId = 'careerPickerCustom',
      placeholder = 'Search any career (e.g. Cricketer, Nurse, Chef)...',
      allowCustom = true,
      value = '',
      careerId = '',
    } = options;

    const datalistId = `${inputId}-list`;
    container.innerHTML = `
      <div class="career-picker">
        ${options.showCategoryFilter ? `<select id="${inputId}-cat" class="career-picker-cat"><option value="">All fields</option></select>` : ''}
        <input type="text" id="${inputId}" list="${datalistId}" placeholder="${placeholder}" autocomplete="off" value="${value ? FF.escapeHtml(value) : ''}" />
        <datalist id="${datalistId}"></datalist>
        <input type="hidden" id="${hiddenId}" value="${careerId || ''}" />
        ${allowCustom ? `<p class="career-picker-hint">Can't find yours? Type your exact career — we'll build a personalized plan.</p><input type="hidden" id="${customId}" value="" />` : ''}
      </div>
    `;

    if (options.showCategoryFilter && this.categories.length) {
      const catSel = document.getElementById(`${inputId}-cat`);
      catSel.innerHTML =
        '<option value="">All fields</option>' +
        this.categories.map((c) => `<option value="${c.name}">${c.name} (${c.count})</option>`).join('');
      catSel.addEventListener('change', () => this.fillDatalist(inputId, datalistId, catSel.value));
    }

    const input = document.getElementById(inputId);
    const hidden = document.getElementById(hiddenId);
    const customHidden = allowCustom ? document.getElementById(customId) : null;

    this.fillDatalist(inputId, datalistId, '');

    input.addEventListener('input', () => {
      const val = input.value.trim();
      const match = this.careers.find((c) => c.title.toLowerCase() === val.toLowerCase());
      if (match) {
        hidden.value = match.id;
        if (customHidden) customHidden.value = '';
      } else {
        hidden.value = '';
        if (customHidden) customHidden.value = val;
      }
    });

    input.addEventListener('change', () => input.dispatchEvent(new Event('input')));

    if (careerId) {
      const c = this.careers.find((x) => x.id === careerId);
      if (c) {
        hidden.value = c.id;
        input.value = c.title;
        if (customHidden) customHidden.value = '';
      } else if (value) {
        input.value = value;
        hidden.value = careerId;
      }
    } else if (value && !careerId) {
      input.dispatchEvent(new Event('input'));
    }

    return {
      getValue() {
        const title = input.value.trim();
        const id = hidden.value;
        const custom = customHidden?.value || '';
        if (id) {
          const c = FF.CareerPicker.careers.find((x) => x.id === id);
          return { careerId: id, title: c?.title || title, customTitle: '' };
        }
        return { careerId: '', title, customTitle: title || custom };
      },
      setValue(careerId, title) {
        hidden.value = careerId || '';
        input.value = title || '';
        if (customHidden) customHidden.value = careerId ? '' : title || '';
      },
    };
  },

  fillDatalist(inputId, datalistId, category) {
    const list = document.getElementById(datalistId);
    let items = this.careers;
    if (category) items = items.filter((c) => c.category === category);
    list.innerHTML = items.map((c) => `<option value="${FF.escapeHtml(c.title)}">${c.category}</option>`).join('');
  },
};

FF.escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
