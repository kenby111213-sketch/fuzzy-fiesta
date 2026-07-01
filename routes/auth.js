const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { signToken, requireAuth } = require('../middleware/auth');

// Đăng nhập
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: (username || '').toLowerCase().trim() });
    if (!user || !(await user.checkPassword(password || ''))) {
      return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
    }
    res.json({ token: signToken(user), user: { username: user.username, name: user.name } });
  } catch (err) {
    next(err);
  }
});

// Thông tin tài khoản hiện tại (dùng để kiểm tra token còn hạn)
router.get('/me', requireAuth, (req, res) => {
  res.json({ username: req.user.username, name: req.user.name });
});

// Đổi mật khẩu
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || !(await user.checkPassword(oldPassword || ''))) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    }
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 4 ký tự' });
    }
    await user.setPassword(newPassword);
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
