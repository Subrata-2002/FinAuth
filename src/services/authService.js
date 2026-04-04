const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role?.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async ({ name, email, password }) => {
  const role = await Role.findOne({ where: { name: 'Viewer' } });
  if (!role) throw Object.assign(new Error('Default role not found.'), { status: 500 });

  const user = await User.create({ name, email, password_hash: password, role_id: role.id });
  return {
    success: true,
    message: 'User registered successfully.Please login to continue.',
    data: {
      user: sanitize(user, role.name),
    },
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email }, include: [{ association: 'role' }] });
  console.log("use data is "+user);
  console.log("check"+await user.validatePassword(password));
  if (!user || !(await user.validatePassword(password))) {
    throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
  }
  if (user.status !== 'active') {
    throw Object.assign(new Error('Account is not active.'), { status: 403 });
  }
  return {
    success: true,
    message: 'Login successful',
    data: {
      token: generateToken(user),
      user: sanitize(user, user.role?.name),
    },
  };
};

const sanitize = (user, roleName) => ({
  id: user.id,
  name: user.name,
  role: roleName,
  status: user.status,
});

module.exports = { register, login };
