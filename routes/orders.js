const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Table = require('../models/Table');

// Tính tiền từ danh sách món (không tin số liệu client gửi lên)
function computeTotals(items, discount = 0) {
  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.price) * Number(it.quantity),
    0
  );
  const d = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  return { subtotal, discount: d, totalAmount: subtotal - d };
}

// Danh sách đơn (lọc theo trạng thái, mặc định mới nhất trước)
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    // các đơn đang hoạt động (bếp/quầy cần xử lý)
    if (req.query.active === 'true')
      filter.status = { $in: ['Mới', 'Đang pha', 'Hoàn thành'] };
    const orders = await Order.find(filter)
      .populate('table', 'name')
      .sort({ orderTime: -1 })
      .limit(Number(req.query.limit) || 200);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Xem 1 đơn
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('table', 'name');
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Tạo đơn mới
router.post('/', async (req, res, next) => {
  try {
    const { items = [], discount = 0, table = null, note = '' } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'Đơn phải có ít nhất 1 món' });

    const totals = computeTotals(items, discount);
    const order = await Order.create({
      items,
      ...totals,
      table: table || null,
      note,
    });

    // Nếu gắn với bàn thì đánh dấu bàn đang phục vụ
    if (table) {
      await Table.findByIdAndUpdate(table, {
        status: 'Đang phục vụ',
        currentOrder: order._id,
      });
    }

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// Cập nhật đơn (sửa món / giảm giá / trạng thái / thanh toán)
router.put('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn' });

    // Tự bù trường tài chính cho các đơn cũ (tạo trước khi có subtotal),
    // để thao tác đổi trạng thái / hủy không bị kẹt vì lỗi validate.
    if (order.subtotal == null) {
      const t = computeTotals(order.items, order.discount);
      order.subtotal = t.subtotal;
      order.discount = t.discount;
      order.totalAmount = t.totalAmount;
    }

    const { items, discount, status, paymentMethod, note } = req.body;

    if (Array.isArray(items) && items.length > 0) {
      order.items = items;
      const totals = computeTotals(items, discount ?? order.discount);
      order.subtotal = totals.subtotal;
      order.discount = totals.discount;
      order.totalAmount = totals.totalAmount;
    } else if (discount !== undefined) {
      const totals = computeTotals(order.items, discount);
      order.discount = totals.discount;
      order.totalAmount = totals.totalAmount;
    }

    if (note !== undefined) order.note = note;
    if (paymentMethod !== undefined) order.paymentMethod = paymentMethod;

    if (status) {
      order.status = status;
      if (status === 'Đã thanh toán') order.paidAt = new Date();
      // Giải phóng bàn khi thanh toán hoặc hủy
      if (['Đã thanh toán', 'Đã hủy'].includes(status) && order.table) {
        await Table.findByIdAndUpdate(order.table, {
          status: 'Trống',
          currentOrder: null,
        });
      }
    }

    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Xóa đơn (giải phóng bàn nếu có)
router.delete('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn' });
    if (order.table) {
      await Table.findByIdAndUpdate(order.table, {
        status: 'Trống',
        currentOrder: null,
      });
    }
    await order.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
