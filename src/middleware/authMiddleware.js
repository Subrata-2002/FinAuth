const jwt = require('jsonwebtoken');
const { User } = require('../models');


     const authenticate = async (req, res, next) => {
             const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing or malformed.',
      data: null,
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      include: [{ association: 'role' }],
    });

    if (!user || user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active.',
        data: null,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      data: null,
    });
  }
};

module.exports = { authenticate };
