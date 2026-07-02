const mongoose = require('mongoose');

// ===== Món trong đơn (sub-document) =====
const OrderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }, // liên kết thực đơn (tùy chọn)
    name: { type: String, required: true }, // tên món (lưu lại phòng khi đổi/xóa menu)
    quantity: { type: Number, required: true, min: 1 }, // số lượng
    price: { type: Number, required: true, min: 0 }, // đơn giá tại thời điểm bán
    note: { type: String, default: '' }, // ghi chú: ít đường, nhiều đá...
  },
  { _id: false }
);

// ===== Đơn hàng (Order) =====
const OrderSchema = new mongoose.Schema({
  items: { type: [OrderItemSchema], required: true }, // danh sách món
  subtotal: { type: Number, required: true, min: 0 }, // tạm tính (chưa giảm giá)
  discount: { type: Number, default: 0, min: 0 }, // số tiền giảm
  totalAmount: { type: Number, required: true, min: 0 }, // thành tiền phải trả
  status: {
    type: String,
    enum: ['Mới', 'Đang pha', 'Hoàn thành', 'Đã thanh toán', 'Đã hủy'],
    default: 'Mới',
  }, // trạng thái đơn
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null }, // bàn (null = mang đi)
  paymentMethod: {
    type: String,
    enum: ['Tiền mặt', 'Chuyển khoản', 'Thẻ', 'Ví MoMo', ''],
    default: '',
  },
  note: { type: String, default: '' },
  orderTime: { type: Date, default: Date.now }, // thời gian tạo đơn
  paidAt: { type: Date, default: null }, // thời gian thanh toán
});

module.exports = mongoose.model('Order', OrderSchema);
