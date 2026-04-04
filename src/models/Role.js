const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define(
  'Role',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.ENUM('Admin', 'Analyst', 'Viewer'),
      allowNull: false,
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: "e.g. ['read:records', 'write:records', 'manage:users']",
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    indexes: [{ unique: true, fields: ['name'] }],
  }
);

module.exports = Role;
