const dashboardService = require('../services/dashboardService');

const getSummary = async (req, res, next) => {
  try { res.json(await dashboardService.getSummary(req.query.month)); } catch (err) { next(err); }
};

const getCategoryBreakdown = async (req, res, next) => {
  try { res.json(await dashboardService.getCategoryBreakdown()); } catch (err) { next(err); }
};

const getMonthlyTrends = async (req, res, next) => {
  try { res.json(await dashboardService.getMonthlyTrends()); } catch (err) { next(err); }
};

const getRecentTransactions = async (req, res, next) => {
  try { res.json(await dashboardService.getRecentTransactions(req.query.limit)); } catch (err) { next(err); }
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends, getRecentTransactions };
