const { clearHash } = require('../services/cache');

exports.cleanHash = async (req, res, next) => {
  await next();

  clearHash(req.user.id);
};
