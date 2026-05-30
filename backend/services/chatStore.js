const sessions = new Map();

function getSession(key) {
  if (!sessions.has(key)) {
    sessions.set(key, { messages: [], updatedAt: Date.now() });
  }
  return sessions.get(key);
}

function saveMessages(key, messages) {
  const session = getSession(key);
  session.messages = messages.slice(-40);
  session.updatedAt = Date.now();
  return session;
}

module.exports = { getSession, saveMessages };
