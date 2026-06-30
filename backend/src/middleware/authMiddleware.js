const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes by verifying JWT tokens
 */
const protect = async (req, res, next) => {
  let token;

  // Check for Authorization Header starting with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // Get user from DB (excluding password)
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User matching token no longer exists.' });
      }

      next();
    } catch (error) {
      console.error('[Auth Error] JWT verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing.' });
  }
};

/**
 * Authorize specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'none'}) is not authorized to access this resource.`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
