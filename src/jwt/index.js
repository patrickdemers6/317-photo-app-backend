const jwt = require('jsonwebtoken');

const BEARER = 'Bearer ';

module.exports = (authHeader) => {
  if (!authHeader || !authHeader.startsWith(BEARER)) return null;

  return jwt.decode(authHeader.substring(BEARER.length));
};
