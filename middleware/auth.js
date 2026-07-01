const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'doi-chuoi-bi-mat-nay-tren-production';

function signToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, name: user.name },
    SECRET,
    { expiresIn: '30d' }
  );
}

// Chặn các request chưa đăng nhập
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' });
  }
}

module.exports = { signToken, requireAuth, SECRET };
