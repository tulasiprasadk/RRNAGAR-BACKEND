const express = require("express");
const router = express.Router();
const { Order, Supplier, Product, Ad, sequelize } = require("../../models");
const { Op } = require("sequelize");




// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum("totalAmount", { where: { paymentStatus: "approved" } });
    const totalSuppliers = await Supplier.count();
    const totalAds = await Ad.count();
    res.json({
      totalOrders,
      totalRevenue: totalRevenue || 0,
      totalSuppliers,
      totalAds
    });
  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// GET /api/admin/charts/revenue
router.get("/charts/revenue", async (req, res) => {
  try {
    const results = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']
      ],
      where: { paymentStatus: "approved" },
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']]
    });
    const data = results.map(r => ({
      month: (new Date(r.get('month'))).getMonth() + 1,
      total: parseFloat(r.get('total'))
    }));
    res.json(data);
  } catch (err) {
    console.error("ADMIN REVENUE CHART ERROR:", err);
    res.status(500).json({ error: "Failed to load revenue chart" });
  }
});

// GET /api/admin/charts/orders
router.get("/charts/orders", async (req, res) => {
  try {
    const results = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']]
    });
    const data = results.map(r => ({
      month: (new Date(r.get('month'))).getMonth() + 1,
      count: parseInt(r.get('count'))
    }));
    res.json(data);
  } catch (err) {
    console.error("ADMIN ORDERS CHART ERROR:", err);
    res.status(500).json({ error: "Failed to load orders chart" });
  }
});

module.exports = router;
