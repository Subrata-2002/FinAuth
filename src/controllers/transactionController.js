const txService = require('../services/transactionService');

const listRecords = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, page, limit } = req.query;
    res.json(await txService.listRecords({ type, category, startDate, endDate }, { page, limit }));
  } catch (err) { next(err); }
};

const createRecord = async (req, res, next) => {
  try {
    res.status(201).json(await txService.createRecord(req.body, req.user.id));
  } catch (err) { next(err); }
};

const updateRecord = async (req, res, next) => {
  try {
    res.json(await txService.updateRecord(req.params.id, req.body, req.user.id));
  } catch (err) { next(err); }
};

const deleteRecord = async (req, res, next) => {
  try {
    await txService.deleteRecord(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { listRecords, createRecord, updateRecord, deleteRecord };
