const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const { chat } = require('../services/gemini');
const { getSession, saveMessages } = require('../services/chatStore');

exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId, messages: clientMessages, careerContext } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message required' });
    }

    const userKey = String(req.user._id);
    let history = Array.isArray(clientMessages) ? clientMessages : [];

    if (!history.length && mongoose.connection.readyState === 1 && sessionId && !req.user.isGuest) {
      const session = await Chat.findOne({ _id: sessionId, userId: req.user._id });
      if (session?.messages?.length) history = session.messages;
    }

    if (!history.length) {
      const mem = getSession(userKey);
      history = mem.messages || [];
    }

    const reply = await chat(history, message.trim(), careerContext);
    const userMsg = { role: 'user', content: message.trim() };
    const assistantMsg = { role: 'assistant', content: reply };
    const updatedMessages = [...history, userMsg, assistantMsg];

    let outSessionId = sessionId;

    if (mongoose.connection.readyState === 1 && !req.user.isGuest) {
      let session;
      if (sessionId) {
        session = await Chat.findOne({ _id: sessionId, userId: req.user._id });
      }
      if (!session) {
        session = await Chat.create({ userId: req.user._id, messages: [] });
      }
      session.messages = updatedMessages;
      await session.save();
      outSessionId = session._id;
    } else {
      saveMessages(userKey, updatedMessages);
      outSessionId = outSessionId || userKey;
    }

    res.json({
      success: true,
      reply,
      sessionId: outSessionId,
      messages: updatedMessages,
      mode: process.env.GEMINI_API_KEY ? 'ai' : 'coach',
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ success: false, message: err.message || 'Chat failed' });
  }
};

exports.getSessions = async (req, res) => {
  if (mongoose.connection.readyState !== 1 || req.user.isGuest) {
    return res.json({ success: true, sessions: [] });
  }
  const sessions = await Chat.find({ userId: req.user._id })
    .select('title updatedAt messages')
    .sort({ updatedAt: -1 })
    .limit(20);
  res.json({ success: true, sessions });
};
