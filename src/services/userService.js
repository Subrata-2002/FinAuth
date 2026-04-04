const { User, Role } = require('../models');

const listUsers = async ({ page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await User.findAndCountAll({
    attributes: { exclude: ['password_hash'] },
    include: [{ association: 'role', attributes: ['name'] }],
    limit: parseInt(limit),
    offset,
    order: [['createdAt', 'ASC']],
  });
  return {
    success: true,
    data: {
      users: rows.map(formatUser),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    },
  };
};

const updateRole = async (id, role_name) => {
  const user = await User.findByPk(id, { include: [{ association: 'role' }] });
  if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });

  const role = await Role.findOne({ where: { name: role_name } });
  if (!role) throw Object.assign(new Error(`Role '${role_name}' not found.`), { status: 400 });

  user.role_id = role.id;
  await user.save();

  return {
    success: true,
    message: 'User role updated successfully',
    data: { id: user.id, name: user.name, role: role.name },
  };
};

const updateStatus = async (id, status) => {
  const user = await User.findByPk(id);
  if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });

  user.status = status;
  await user.save();

  return {
    success: true,
    message: `User status updated to ${status}`,
    data: { id: user.id, name: user.name, status: user.status },
  };
};

const formatUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role?.name,
  status: user.status,
  createdAt: user.createdAt,
});

module.exports = { listUsers, updateRole, updateStatus };
