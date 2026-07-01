const express = require('express');
const router = express.Router();
const Table = require('../models/Table');

// Danh sách bàn (kèm đơn hiện tại)
router.get('/', async (req, res, next) => {
  try {
    const tables = await Table.find()
      .populate('currentOrder')
      .sort({ name: 1 });
    res.json(tables);
  } catch (err) {
    next(err);
  }
});

// Thêm bàn
router.post('/', async (req, res, next) => {
  try {
    const table = await Table.create({ name: req.body.name });
    res.status(201).json(table);
  } catch (err) {
    next(err);
  }
});

// Sửa tên bàn
router.put('/:id', async (req, res, next) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true, runValidators: true }
    );
    if (!table) return res.status(404).json({ error: 'Không tìm thấy bàn' });
    res.json(table);
  } catch (err) {
    next(err);
  }
});

// Xóa bàn (chỉ khi đang trống)
router.delete('/:id', async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ error: 'Không tìm thấy bàn' });
    if (table.status !== 'Trống')
      return res.status(400).json({ error: 'Bàn đang phục vụ, không thể xóa' });
    await table.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
