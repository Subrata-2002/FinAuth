const router = require('express').Router();
const { query } = require('express-validator');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/errorHandler');
const ctrl = require('../controllers/dashboardController');

router.use(authenticate);

router.get(
  '/summary',
  [query('month').optional().matches(/^\d{4}-\d{2}$/).withMessage('month must be in YYYY-MM format')],
  validate,
  ctrl.getSummary
);


router.get('/by-category', ctrl.getCategoryBreakdown);


router.get('/trends', ctrl.getMonthlyTrends);


router.get(
  '/recent',
  [query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50')],
  validate,
  ctrl.getRecentTransactions
);

module.exports = router;
