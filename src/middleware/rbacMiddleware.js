
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. No role assigned.',
        data: null,
      });
    }

    if (!roles.includes(req.user.role.name)) {
      const msg =
        roles.length === 1 && roles[0] === 'Admin'
          ? 'Access denied. Admins only.'
          : 'Access denied. Only Admins can Have Permission for this.';
      return res.status(403).json({
        success: false,
        message: msg,
        data: null,
      });
    }

    next();
  };
};

module.exports = { requireRole };
