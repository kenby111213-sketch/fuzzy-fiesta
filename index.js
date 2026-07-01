const path = require('path');
const express = require('express');
const connectDB = require('./config/db');
const { requireAuth } = require('./middleware/auth');

const app = express();
app.use(express.json());

// Đăng nhập (công khai)
app.use('/api/auth', require('./routes/auth'));

// Các API nghiệp vụ — bắt buộc đăng nhập
app.use('/api/menu', requireAuth, require('./routes/menu'));
app.use('/api/orders', requireAuth, require('./routes/orders'));
app.use('/api/tables', requireAuth, require('./routes/tables'));
app.use('/api/reports', requireAuth, require('./routes/reports'));

// Giao diện web (tĩnh)
app.use(express.static(path.join(__dirname, 'public')));

// Xử lý lỗi tập trung
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.name === 'ValidationError' ? 400 : 500).json({
    error: err.message || 'Lỗi máy chủ',
  });
});

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`☕ Server chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Không kết nối được MongoDB:', err.message);
    process.exit(1);
  });
