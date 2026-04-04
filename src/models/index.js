const sequelize = require('../config/database');
const Role = require('./Role');
const User = require('./User');
const Transaction = require('./Transaction');


Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

User.hasMany(Transaction, { foreignKey: 'user_id' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'creator' });

module.exports = { sequelize, Role, User, Transaction };
