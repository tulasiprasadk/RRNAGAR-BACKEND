// routes/flowerPackage.js - Monthly Flower Package API
const express = require('express');
const router = express.Router();
const { FlowerPackage } = require('../models');

// Create a new monthly flower package
router.post('/', async (req, res) => {
  try {
    const { userId, startDate, flowers } = req.body;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 29); // 30 days total
    const pkg = await FlowerPackage.create({ userId, startDate, endDate, flowers });
    res.status(201).json(pkg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// Get all packages for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const pkgs = await FlowerPackage.findAll({ where: { userId: req.params.userId } });
    res.json(pkgs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Mark a day as delivered
router.post('/:id/deliver', async (req, res) => {
  try {
    const pkg = await FlowerPackage.findByPk(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    if (pkg.deliveredDays >= 30) return res.status(400).json({ error: 'All days delivered' });
    await pkg.update({ deliveredDays: pkg.deliveredDays + 1 });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update package' });
  }
});

module.exports = router;
