const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ===== Tài khoản đăng nhập =====
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: 'Nhân viên' }, // tên hiển thị
  },
  { timestamps: true }
);

// Đặt mật khẩu (tự băm)
UserSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

// Kiểm tra mật khẩu
UserSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
