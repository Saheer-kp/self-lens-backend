const jwt = require("jsonwebtoken");

function signToken(payload, options = {}) {
  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  signToken,
  verifyToken,
};
