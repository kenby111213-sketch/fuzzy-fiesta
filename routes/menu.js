const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// Lấy danh sách món (có thể lọc theo nhóm hoặc trạng thái còn bán)
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.available === 'true') filter.available = true;
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// Thêm món
router.post('/', async (req, res, next) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// Sửa món
router.put('/:id', async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ error: 'Không tìm thấy món' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// Xóa món
router.delete('/:id', async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy món' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
