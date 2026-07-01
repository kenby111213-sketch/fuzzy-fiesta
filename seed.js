// Nạp dữ liệu mẫu: thực đơn + bàn. Chạy: node seed.js
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const MenuItem = require('./models/MenuItem');
const Table = require('./models/Table');
const User = require('./models/User');

const MENU = [
  { name: 'Cà phê đen', price: 20000, category: 'Cà phê' },
  { name: 'Cà phê sữa', price: 25000, category: 'Cà phê' },
  { name: 'Bạc xỉu', price: 30000, category: 'Cà phê' },
  { name: 'Cà phê muối', price: 35000, category: 'Cà phê' },
  { name: 'Cappuccino', price: 45000, category: 'Cà phê' },
  { name: 'Latte', price: 45000, category: 'Cà phê' },
  { name: 'Trà đào', price: 40000, category: 'Trà' },
  { name: 'Trà sen vàng', price: 40000, category: 'Trà' },
  { name: 'Trà tắc', price: 25000, category: 'Trà' },
  { name: 'Nước cam', price: 35000, category: 'Nước ép' },
  { name: 'Nước ép ổi', price: 35000, category: 'Nước ép' },
  { name: 'Bánh mì', price: 20000, category: 'Bánh' },
  { name: 'Bánh croissant', price: 30000, category: 'Bánh' },
  { name: 'Bánh tiramisu', price: 45000, category: 'Bánh' },
];

async function run() {
  await connectDB();

  const menuCount = await MenuItem.countDocuments();
  if (menuCount === 0) {
    await MenuItem.insertMany(MENU);
    console.log(`✅ Đã thêm ${MENU.length} món vào thực đơn`);
  } else {
    console.log(`ℹ️ Thực đơn đã có ${menuCount} món, bỏ qua`);
  }

  const tableCount = await Table.countDocuments();
  if (tableCount === 0) {
    const tables = Array.from({ length: 8 }, (_, i) => ({ name: `Bàn ${i + 1}` }));
    await Table.insertMany(tables);
    console.log(`✅ Đã tạo ${tables.length} bàn`);
  } else {
    console.log(`ℹ️ Đã có ${tableCount} bàn, bỏ qua`);
  }

  // Tài khoản đăng nhập mặc định
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'cafe123';
    const user = new User({ username, name: 'Quản lý' });
    await user.setPassword(password);
    await user.save();
    console.log(`✅ Đã tạo tài khoản: ${username} / ${password}  (hãy đổi mật khẩu sau khi đăng nhập)`);
  } else {
    console.log(`ℹ️ Đã có ${userCount} tài khoản, bỏ qua`);
  }

  await mongoose.disconnect();
  console.log('Xong.');
}

run().catch((err) => {
  console.error('Lỗi seed:', err.message);
  process.exit(1);
});
