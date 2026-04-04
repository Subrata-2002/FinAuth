const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const { validate } = require('../middleware/errorHandler');
const ctrl = require('../controllers/userController');

router.use(authenticate, requireRole('Admin'));


router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  ctrl.listUsers
);


router.patch(
  '/:id/role',
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    body('role').isIn(['Admin', 'Analyst', 'Viewer']).withMessage('Role must be Admin, Analyst, or Viewer'),
  ],
  validate,
  ctrl.updateRole
);


router.patch(
  '/:id/status',
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    body('status').isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  ],
  validate,
  ctrl.updateStatus
);

module.exports = router;
