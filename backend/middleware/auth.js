const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header or cookie
  let token = req.header('Authorization');
  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const bearerToken = token.split(' ')[1] || token;
    const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET || 'secret123');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
