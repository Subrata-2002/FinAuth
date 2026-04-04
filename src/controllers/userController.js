const userService = require('../services/userService');

const listUsers = async (req, res, next) => {
  try {
    res.json(await userService.listUsers(req.query));
  } catch (err) { next(err); }
};

const updateRole = async (req, res, next) => {
  try {
    res.json(await userService.updateRole(req.params.id, req.body.role));
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    res.json(await userService.updateStatus(req.params.id, req.body.status));
  } catch (err) { next(err); }
};

module.exports = { listUsers, updateRole, updateStatus };
