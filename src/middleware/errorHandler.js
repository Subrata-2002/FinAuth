const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
     if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
       message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const globalErrorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors?.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error.',
    data: null,
  });
};

module.exports = { validate, globalErrorHandler };
