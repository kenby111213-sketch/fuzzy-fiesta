const mongoose = require('mongoose');

// ===== Thực đơn (Menu) =====
const MenuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // tên món
    price: { type: Number, required: true, min: 0 }, // giá bán
    category: {
      type: String,
      enum: ['Cà phê', 'Trà', 'Nước ép', 'Bánh', 'Khác'],
      default: 'Khác',
    }, // nhóm món
    available: { type: Boolean, default: true }, // còn bán hay không
    imageUrl: { type: String, default: '' }, // ảnh minh họa (tùy chọn)
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', MenuItemSchema);
