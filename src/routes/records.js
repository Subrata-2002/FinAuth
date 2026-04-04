const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const { validate } = require('../middleware/errorHandler');
const ctrl = require('../controllers/transactionController');

router.use(authenticate);


router.get(
  '/',
  requireRole('Admin', 'Analyst'),
  [
    query('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    query('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO date'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  ctrl.listRecords
);


router.post(
  '/',
  requireRole('Admin'),
  [
    body('amount').isFloat({ min: 0.0001 }).withMessage('Amount must be a positive number'),
    body('type').isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').isISO8601().withMessage('Date must be a valid ISO date'),
    body('description').optional().trim(),
  ],
  validate,
  ctrl.createRecord
);


router.patch(
  '/:id',
  requireRole('Admin'),
  [
    param('id').isUUID().withMessage('Invalid record ID'),
    body('amount').optional().isFloat({ min: 0.0001 }).withMessage('Amount must be a positive number'),
    body('type').optional().isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
    body('description').optional().trim(),
  ],
  validate,
  ctrl.updateRecord
);


router.delete(
  '/:id',
  requireRole('Admin'),
  [param('id').isUUID().withMessage('Invalid record ID')],
  validate,
  ctrl.deleteRecord
);

module.exports = router;
