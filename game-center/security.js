const crypto = require('crypto');

function hash(p) {
  return crypto.createHash('sha256').update(p).digest('hex');
}

function verify(input, stored) {
  return hash(input) === stored;
}

module.exports = { hash, verify };