FF.initNav('chat');

const messagesEl = document.getElementById('messages');
const input = document.getElementById('chatInput');
const typing = document.getElementById('typing');
const sendBtn = document.getElementById('sendBtn');
let sessionId = localStorage.getItem('ff_chat_session') || null;
let messages = [];
let careerContext = {};
let pickerApi = null;

function isStaleMessage(content) {
  return FF.isStaleCoachReply?.(content);
}

function getStoredMessages() {
  try {
    const msgs = JSON.parse(sessionStorage.getItem('ff_chat_messages') || '[]');
    if (msgs.some((m) => isStaleMessage(m.content))) {
      sessionStorage.removeItem('ff_chat_messages');
      return [];
    }
    return msgs;
  } catch {
    return [];
  }
}

function saveStoredMessages(msgs) {
  sessionStorage.setItem('ff_chat_messages', JSON.stringify(msgs.slice(-40)));
}

function renderMessages(msgs) {
  messagesEl.innerHTML = '';
  msgs.forEach((m) => appendMsgDom(m.role, m.content, false));
  messages = msgs;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMarkdown(content) {
  const escaped = escapeHtml(content || '');
  const lines = escaped.split('\n');
  let inList = false;
  let html = '';

  const closeList = () => {
    if (inList) {
      html += '</ul>';
      inList = false;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      html += '<br>';
      return;
    }

    const heading = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (heading) {
      closeList();
      html += `<h3>${heading[1]}</h3>`;
      return;
    }

    const bullet = trimmed.match(/^(?:[-*•]|\d+\.)\s+(.+)$/);
    if (bullet) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${inlineMarkdown(bullet[1])}</li>`;
      return;
    }

    closeList();
    html += `<p>${inlineMarkdown(trimmed)}</p>`;
  });

  closeList();
  return html;
}

function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function appendMsgDom(role, content, push = true) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  if (role === 'assistant') {
    div.innerHTML = formatMarkdown(content);
  } else {
    div.textContent = content;
  }
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  if (push) messages.push({ role, content });
}

async function initCoach() {
  const fromHome = sessionStorage.getItem('ff_coach_question');

  const mount = document.getElementById('careerContextMount');
  if (mount) {
    await FF.CareerPicker.load();
    pickerApi = FF.CareerPicker.mount(mount, {
      showCategoryFilter: true,
      placeholder: 'Optional — only if asking about one career (leave empty for free questions)',
      careerId: '',
      value: '',
    });
    mount.querySelector('input')?.addEventListener('input', updateCareerContext);
    mount.querySelector('input')?.addEventListener('change', updateCareerContext);
    updateCareerContext();
  }

  const stored = getStoredMessages();
  if (stored.length) {
    renderMessages(stored);
  } else {
    appendMsgDom(
      'assistant',
      "Hi! I'm your FutureForge AI coach. I can help with careers, roadmaps, resumes, interviews, jobs, skills, projects, and general learning questions. Tell me your goal and what you already know.",
      true
    );
  }

  try {
    const health = await fetch('/api/health');
    const h = await health.json();
    const modeEl = document.getElementById('chatMode');
    if (modeEl) modeEl.textContent = h.gemini ? 'AI: Gemini connected' : 'Coach: smart guidance (add GEMINI_API_KEY for full AI)';
  } catch {
    const modeEl = document.getElementById('chatMode');
    if (modeEl) modeEl.textContent = 'Start server: npm run dev';
  }

  if (fromHome) {
    sessionStorage.removeItem('ff_coach_question');
    send(fromHome);
  }
}

function updateCareerContext() {
  if (!pickerApi) return;
  const v = pickerApi.getValue();
  const title = (v.title || v.customTitle || '').trim();
  if (!title) {
    careerContext = {};
    return;
  }
  const c = FF.CareerPicker.careers.find((x) => x.id === v.careerId);
  careerContext = {
    title,
    category: c?.category || '',
    careerId: v.careerId,
  };
}

async function send(text) {
  const msg = text?.trim();
  if (!msg) return;

  appendMsgDom('user', msg, true);
  input.value = '';
  sendBtn.disabled = true;
  typing.hidden = false;
  updateCareerContext();

  const payload = {
    message: msg,
    sessionId,
    messages: messages.slice(0, -1),
    guestSessionId: FF.getGuestSession(),
    careerContext,
  };

  try {
    let data = await FF.api('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    sessionId = data.sessionId;
    localStorage.setItem('ff_chat_session', sessionId || '');
    let reply = data.reply;
    if (FF.isStaleCoachReply?.(reply)) {
      reply = FF.coachFallback(msg, careerContext);
    }
    if (data.messages?.length) {
      const fixed = data.messages.map((m, i, arr) =>
        m.role === 'assistant' && i === arr.length - 1 ? { ...m, content: reply } : m
      );
      renderMessages(fixed);
      saveStoredMessages(fixed);
    } else {
      appendMsgDom('assistant', reply, true);
      saveStoredMessages(messages);
    }
  } catch (e) {
    if (e.status === 401) {
      try {
        const data = await FF.api('/api/chat/message', {
          method: 'POST',
          body: JSON.stringify(payload),
          skipAuth: true,
        });
        appendMsgDom('assistant', data.reply, true);
        saveStoredMessages(messages);
      } catch {
        appendMsgDom('assistant', FF.coachFallback(msg, careerContext), true);
        saveStoredMessages(messages);
      }
    } else {
      appendMsgDom('assistant', FF.coachFallback(msg, careerContext), true);
      saveStoredMessages(messages);
    }
  } finally {
    typing.hidden = true;
    sendBtn.disabled = false;
    input.focus();
  }
}

sendBtn.addEventListener('click', () => send(input.value));
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send(input.value);
  }
});

document.querySelectorAll('#suggestions button').forEach((btn) => {
  btn.addEventListener('click', () => send(btn.textContent));
});

document.getElementById('clearChat')?.addEventListener('click', () => {
  messages = [];
  sessionId = null;
  sessionStorage.removeItem('ff_chat_messages');
  localStorage.removeItem('ff_chat_session');
  messagesEl.innerHTML = '';
  appendMsgDom('assistant', 'Chat cleared. Ask me about any career!', true);
});

initCoach();
