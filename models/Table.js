const mongoose = require('mongoose');

// ===== Bàn (Table) =====
const TableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // ví dụ "Bàn 1"
    status: {
      type: String,
      enum: ['Trống', 'Đang phục vụ'],
      default: 'Trống',
    },
    // đơn đang mở tại bàn (nếu có)
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', TableSchema);
