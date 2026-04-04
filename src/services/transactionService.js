const { Op } = require('sequelize');
const { Transaction, User } = require('../models');

const buildFilters = ({ type, category, startDate, endDate }) => {
  const where = { is_deleted: false };
  if (type) where.type = type;
  if (category) where.category = category;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date[Op.gte] = startDate;
    if (endDate) where.date[Op.lte] = endDate;
  }
  return where;
};

const listRecords = async (filters = {}, { page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await Transaction.findAndCountAll({
    where: buildFilters(filters),
    order: [['date', 'DESC']],
    limit: parseInt(limit),
    offset,
  });
  return {
    success: true,
    data: {
      records: rows.map(formatRecord),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    },
  };
};

const createRecord = async (data, user_id) => {
  const tx = await Transaction.create({ ...data, user_id });
  return {
    success: true,
    message: 'Record created successfully',
    data: {
      id: tx.id,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
      description: tx.description,
      createdBy: tx.user_id,
      createdAt: tx.createdAt,
    },
  };
};

const updateRecord = async (id, data, user_id) => {
  const tx = await Transaction.findOne({ where: { id, is_deleted: false } });
  if (!tx) throw Object.assign(new Error('Record not found.'), { status: 404 });
  await tx.update({ ...data, updated_by: user_id });
  return {
    success: true,
    message: 'Record updated successfully',
    data: {
      id: tx.id,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
      description: tx.description,
      updatedBy: tx.updated_by,
      updatedAt: tx.updatedAt,
    },
  };
};

const deleteRecord = async (id) => {
  const tx = await Transaction.findOne({ where: { id, is_deleted: false } });
  if (!tx) throw Object.assign(new Error('Record not found.'), { status: 404 });
  tx.is_deleted = true;
  await tx.save();
};

const formatRecord = (tx) => ({
  id: tx.id,
  amount: tx.amount,
  type: tx.type,
  category: tx.category,
  date: tx.date,
  description: tx.description,
});

module.exports = { listRecords, createRecord, updateRecord, deleteRecord };
