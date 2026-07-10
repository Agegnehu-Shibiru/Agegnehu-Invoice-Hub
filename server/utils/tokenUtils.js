const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '15m' });

const signRefreshToken = (userId, familyId) =>
  jwt.sign({ id: userId, familyId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

const generateFamilyId = () => crypto.randomUUID();

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge,
  path: '/',
});

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 min
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

const sendTokens = (res, user) => {
  const accessToken = signAccessToken(user._id);
  const familyId = generateFamilyId();
  const refreshToken = signRefreshToken(user._id, familyId);

  res.cookie('accessToken', accessToken, cookieOptions(ACCESS_COOKIE_MAX_AGE));
  res.cookie('refreshToken', refreshToken, cookieOptions(REFRESH_COOKIE_MAX_AGE));

  return { accessToken, refreshToken, familyId };
};

const clearTokens = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateFamilyId,
  sendTokens,
  clearTokens,
};
