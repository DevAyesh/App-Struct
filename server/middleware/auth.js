const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

const getCookieValue = (cookieHeader, key) => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(part => part.trim());
  const match = cookies.find(cookie => cookie.startsWith(`${key}=`));
  return match ? decodeURIComponent(match.slice(key.length + 1)) : null;
};

const auth = async (req, res, next) => {
  try {
    const bearerToken = req.header('Authorization')?.replace('Bearer ', '');
    const cookieToken = getCookieValue(req.headers.cookie, 'authToken');
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({
        error: true,
        message: 'No authentication token found'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtError) {
      return res.status(401).json({
        error: true,
        code: jwtError.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        message: jwtError.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid authentication token'
      });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        error: true,
        message: 'Invalid token payload'
      });
    }

    let user;
    try {
      user = await User.findOne({ _id: decoded.userId });
    } catch (dbError) {
      console.error('Database error in auth middleware:', dbError.message);
      return res.status(503).json({
        error: true,
        message: 'Authentication service temporarily unavailable. Please try again shortly.'
      });
    }

    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'User account not found'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Unexpected auth middleware error:', error.message);
    }

    res.status(500).json({
      error: true,
      message: 'Internal server error during authentication'
    });
  }
};

module.exports = auth;
