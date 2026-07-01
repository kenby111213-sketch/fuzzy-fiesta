const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Chỉ tính các đơn đã thanh toán
const PAID = { status: 'Đã thanh toán' };

// Tổng quan: hôm nay, 7 ngày, món bán chạy, doanh thu theo ngày
router.get('/summary', async (req, res, next) => {
  try {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start7 = new Date(startToday);
    start7.setDate(start7.getDate() - 6); // gồm hôm nay là 7 ngày

    // KPI hôm nay
    const todayAgg = await Order.aggregate([
      { $match: { ...PAID, paidAt: { $gte: startToday } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);
    const today = todayAgg[0] || { revenue: 0, count: 0 };

    // Doanh thu theo ngày (7 ngày gần nhất)
    const daily = await Order.aggregate([
      { $match: { ...PAID, paidAt: { $gte: start7 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Món bán chạy (7 ngày)
    const topItems = await Order.aggregate([
      { $match: { ...PAID, paidAt: { $gte: start7 } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          qty: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 10 },
    ]);

    res.json({ today, daily, topItems });
  } catch (err) {
    next(err);
  }
});

// Doanh thu theo khoảng ngày tùy chọn: /reports/range?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/range', async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(0);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    to.setHours(23, 59, 59, 999);

    const agg = await Order.aggregate([
      { $match: { ...PAID, paidAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
    ]);
    res.json(agg[0] || { revenue: 0, count: 0 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
