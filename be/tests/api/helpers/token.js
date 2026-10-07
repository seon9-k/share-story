const jwt = require('jsonwebtoken');

const tokenFor = (user_id) => jwt.sign({ user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
const bearer = (user_id) => `Bearer ${tokenFor(user_id)}`;
const expiredBearer = (user_id) =>
  `Bearer ${jwt.sign({ user_id }, process.env.JWT_SECRET, { expiresIn: -10 })}`;

module.exports = { tokenFor, bearer, expiredBearer };
