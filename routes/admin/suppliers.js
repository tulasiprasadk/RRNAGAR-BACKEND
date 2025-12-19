const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { Supplier } = require("../../models");

// Middleware: Require admin session
router.use((req, res, next) => {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ error: "Admin login required" });
  }
  next();
});

// Create supplier (admin)
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email required" });
    const existing = await Supplier.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: "Supplier already exists" });
    let hash = password ? await bcrypt.hash(password, 10) : null;
    const supplier = await Supplier.create({ name, email, phone, password: hash, status: "pending" });
    res.status(201).json(supplier);
  } catch (err) {
    res.status(500).json({ error: "Failed to create supplier" });
  }
});

// Approve supplier (admin)
router.post("/:id/approve", async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    supplier.status = "approved";
    await supplier.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve supplier" });
  }
});

// Reject supplier (admin)
router.post("/:id/reject", async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    supplier.status = "rejected";
    supplier.rejectionReason = req.body.reason || "";
    await supplier.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reject supplier" });
  }
});

module.exports = router;
