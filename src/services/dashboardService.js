const { fn, col, literal, Op } = require('sequelize');
const { Transaction, sequelize } = require('../models');

const getSummary = async (month) => {
  const where = { is_deleted: false };

  if (month) {
    const [year, mon] = month.split('-');
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0); 
    where.date = { [Op.between]: [start, end] };
  }

  const rows = await Transaction.findAll({
    where,
    attributes: ['type', [fn('SUM', col('amount')), 'total'], [fn('COUNT', col('id')), 'count']],
    group: ['type'],
    raw: true,
  });

  const totals = { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
  rows.forEach((r) => {
    if (r.type === 'income') { totals.income = parseFloat(r.total) || 0; totals.incomeCount = parseInt(r.count); }
    if (r.type === 'expense') { totals.expense = parseFloat(r.total) || 0; totals.expenseCount = parseInt(r.count); }
  });

  return {
    success: true,
    data: {
      totalIncome: totals.income.toFixed(2),
      totalExpenses: totals.expense.toFixed(2),
      netBalance: (totals.income - totals.expense).toFixed(2),
      totalTransactions: totals.incomeCount + totals.expenseCount,
      period: month || 'all-time',
    },
  };
};

const getCategoryBreakdown = async () => {
  const rows = await Transaction.findAll({
    where: { is_deleted: false },
    attributes: [
      'type',
      'category',
      [fn('SUM', col('amount')), 'total'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['type', 'category'],
    order: [['type', 'ASC'], [literal('total'), 'DESC']],
    raw: true,
  });

  const income = rows.filter((r) => r.type === 'income').map(formatBreakdown);
  const expense = rows.filter((r) => r.type === 'expense').map(formatBreakdown);

  return { success: true, data: { income, expense } };
};

const formatBreakdown = (r) => ({
  category: r.category,
  total: parseFloat(r.total).toFixed(2),
  count: parseInt(r.count),
});


const getMonthlyTrends = async () => {
  const rows = await sequelize.query(
    `SELECT
       TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
       type,
       SUM(amount) AS total
     FROM "Transactions"
     WHERE is_deleted = false
     GROUP BY DATE_TRUNC('month', date), type
     ORDER BY DATE_TRUNC('month', date) ASC`,
    { type: sequelize.QueryTypes.SELECT }
  );

 
  const map = {};
  rows.forEach(({ month, type, total }) => {
    if (!map[month]) map[month] = { month, income: '0.00', expenses: '0.00' };
    if (type === 'income') map[month].income = parseFloat(total).toFixed(2);
    if (type === 'expense') map[month].expenses = parseFloat(total).toFixed(2);
  });

  const trends = Object.values(map).map((m) => ({
    ...m,
    net: (parseFloat(m.income) - parseFloat(m.expenses)).toFixed(2),
  }));

  return { success: true, data: { period: 'monthly', trends } };
};


const getRecentTransactions = async (limit = 10) => {
  const rows = await Transaction.findAll({
    where: { is_deleted: false },
    order: [['date', 'DESC'], ['createdAt', 'DESC']],
    limit: parseInt(limit),
  });

  return {
    success: true,
    data: {
      recent: rows.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        description: tx.description,
        date: tx.date,
      })),
    },
  };
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends, getRecentTransactions };
