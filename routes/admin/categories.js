// backend/routes/admin/categories.js

const express = require("express");
const router = express.Router();
const { Category } = require("../../models");

/* ================================
   ADMIN AUTH MIDDLEWARE
================================ */
router.use((req, res, next) => {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ error: "Admin login required" });
  }
  next();
});

/* ================================
   GET ALL CATEGORIES
   GET /api/admin/categories
================================ */
router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [["id", "ASC"]],
    });
    res.json(categories);
  } catch (err) {
    console.error("Admin categories GET error:", err);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

/* ================================
   CREATE CATEGORY
   POST /api/admin/categories
================================ */
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name required" });
    }

    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (err) {
    console.error("Admin category CREATE error:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

/* ================================
   UPDATE CATEGORY
   PUT /api/admin/categories/:id
================================ */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Not found" });
    }

    category.name = name || category.name;
    await category.save();

    res.json(category);
  } catch (err) {
    console.error("Admin category UPDATE error:", err);
    res.status(500).json({ error: "Failed to update category" });
  }
});

/* ================================
   DELETE CATEGORY
   DELETE /api/admin/categories/:id
================================ */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Not found" });
    }

    await category.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error("Admin category DELETE error:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

module.exports = router;
