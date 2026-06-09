const crypto = require('node:crypto');

const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, SCRYPT_OPTIONS);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

function verifyPassword(password, stored) {
  try {
    const [algorithm, saltText, hashText] = String(stored).split('$');
    if (algorithm !== 'scrypt' || !saltText || !hashText) return false;
    const expected = Buffer.from(hashText, 'base64url');
    const actual = crypto.scryptSync(
      password,
      Buffer.from(saltText, 'base64url'),
      expected.length,
      SCRYPT_OPTIONS
    );
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function requestHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

module.exports = { hashPassword, verifyPassword, randomToken, requestHash };
