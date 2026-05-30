const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { memoryUsers } = require('./auth');

function setGuest(req) {
  const guestId =
    req.headers['x-guest-session'] || req.body?.guestSessionId || `guest_${Date.now()}`;
  req.user = { _id: guestId, isGuest: true };
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    setGuest(req);
    return next();
  }

  try {
    const decoded = jwt.verify(
      header.split(' ')[1],
      process.env.JWT_SECRET || 'dev-secret-change-in-production'
    );
    if (mongoose.connection.readyState === 1) {
      User.findById(decoded.id)
        .select('-password')
        .then((user) => {
          req.user = user || { _id: decoded.id, email: decoded.email, isGuest: false };
          next();
        })
        .catch(() => {
          setGuest(req);
          next();
        });
    } else {
      req.user = memoryUsers.get(decoded.id) || { _id: decoded.id, email: decoded.email };
      next();
    }
  } catch {
    setGuest(req);
    next();
  }
}

module.exports = { optionalAuth };
