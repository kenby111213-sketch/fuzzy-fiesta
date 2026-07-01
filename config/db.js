require('dotenv').config();
const dns = require('node:dns');
const mongoose = require('mongoose');

// DNS của mạng hiện tại chặn truy vấn SRV record trực tiếp từ Node.js,
// nên dùng DNS public để phân giải cluster Atlas (mongodb+srv://).
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'quanly_dat_mon' });
  console.log('Đã kết nối MongoDB');
}

module.exports = connectDB;
