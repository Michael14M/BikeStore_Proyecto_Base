const service = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await service.getDashboard();
  res.json({ ok: true, ...data });
});

module.exports = { getDashboard };
