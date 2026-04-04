const { Role, User } = require('../models');

const defaultRoles = [
  {
    name: 'Admin',
    permissions: ['read:records', 'write:records', 'delete:records', 'manage:users'],
    description: 'Full access to all resources and user management.',
  },
  {
    name: 'Analyst',
    permissions: ['read:records', 'read:analytics'],
    description: 'Read-only access to records plus analytics.',
  },
  {
    name: 'Viewer',
    permissions: ['read:dashboard'],
    description: 'Read-only access to dashboard summary.',
  },
];

const seedRoles = async () => {
  for (const role of defaultRoles) {
    await Role.findOrCreate({ where: { name: role.name }, defaults: role });
  }
  console.log('Roles seeded.');
};

const seedAdminUser = async () => {
  const adminRole = await Role.findOne({ where: { name: 'Admin' } });
  if (!adminRole) return;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  const [, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      name: 'Admin',
      email,
      password_hash: password,
      role_id: adminRole.id,
      status: 'active',
    },
  });

  if (created) console.log(`Admin user created: ${email}`);
  else console.log('Admin user already exists.');
};

module.exports = { seedRoles, seedAdminUser };
