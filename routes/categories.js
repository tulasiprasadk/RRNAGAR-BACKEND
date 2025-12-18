/**
 * backend/routes/categories.js
 * Categories API – FINAL CLEAN & SAFE
 */

const express = require("express");
const router = express.Router();
const { Category } = require("../models");
const { translateBatch } = require("../services/translator");

/* =============================
   GET ALL CATEGORIES
   GET /api/categories
============================= */
router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [["id", "ASC"]],
      attributes: ["id", "name", "createdAt", "updatedAt"],
    });

    if (!categories.length) {
      return res.json([]);
    }

    const names = categories.map((c) => c.name || "");
    let kannadaNames = names;

    try {
      const translated = await translateBatch(names, "kn");
      if (Array.isArray(translated)) {
        kannadaNames = translated;
      }
    } catch (err) {
      // Translation failure should NEVER break categories
      console.warn("⚠️ Category Kannada translation skipped");
    }

    const result = categories.map((c, idx) => ({
      id: c.id,
      name: c.name,
      nameKannada: kannadaNames[idx] || c.name,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json(result);
  } catch (err) {
    console.error("❌ Category GET failed:", err);
    res.status(500).json({ error: "Unable to load categories" });
  }
});

/* =============================
   CREATE CATEGORY
   POST /api/categories
============================= */
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Valid category name required" });
    }

    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (err) {
    console.error("❌ Category CREATE failed:", err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
