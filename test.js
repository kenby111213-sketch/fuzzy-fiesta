const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Order = require('./models/Order');

async function run() {
  await connectDB();

  // 1. Tạo đơn hàng
  const order = await Order.create({
    items: [
      { name: 'Bún chả', quantity: 1, price: 40000 },
      { name: 'Nước ngọt', quantity: 1, price: 10000 },
    ],
    totalAmount: 50000,
  });
  console.log('1. Tạo đơn:', order._id.toString(), '- status:', order.status);

  // 2. Đọc lại đơn vừa tạo
  const found = await Order.findById(order._id);
  console.log('2. Đọc đơn:', found.items.map((i) => i.name).join(', '));

  // 3. Cập nhật trạng thái: Mới -> Đang nấu -> Đã xong
  found.status = 'Đang nấu';
  await found.save();
  console.log('3. Cập nhật trạng thái thành:', found.status);

  found.status = 'Đã xong';
  await found.save();
  console.log('3. Cập nhật trạng thái thành:', found.status);

  // 4. Đếm số đơn đang ở trạng thái "Đã xong"
  const doneCount = await Order.countDocuments({ status: 'Đã xong' });
  console.log('4. Tổng số đơn "Đã xong":', doneCount);

  // 5. Xóa đơn test vừa tạo (dọn dẹp, không ảnh hưởng dữ liệu thật)
  await Order.deleteOne({ _id: order._id });
  console.log('5. Đã xóa đơn test');

  await mongoose.disconnect();
  console.log('\n✅ TEST PASS: tất cả thao tác CRUD đều hoạt động đúng.');
}

run().catch((err) => {
  console.error('❌ TEST FAILED:', err.message);
  process.exit(1);
});
