const express = require("express");
const router = express.Router();
/* =============================
  ADMIN: UPDATE PRODUCT PRICE
============================= */
router.put("/:id", async (req, res) => {
  try {
    const adminId = req.session?.adminId;
    if (!adminId) return res.status(401).json({ error: "Admin login required" });
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const { price, title, variety, subVariety, description, CategoryId } = req.body;
    if (price !== undefined) product.price = price;
    if (title !== undefined) product.title = title;
    if (variety !== undefined) product.variety = variety;
    if (subVariety !== undefined) product.subVariety = subVariety;
    if (description !== undefined) product.description = description;
    if (CategoryId !== undefined) product.CategoryId = CategoryId;
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const { Product, Supplier, Category, Ad, AnalyticsVisit, ProductSupplier } = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const { translateToKannada } = require("../services/translator");

/* =============================
   MULTER SAFE SETUP
============================= */
const uploadDir = "uploads/products";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`)
});

const upload = multer({ storage });

/* =============================
   STATIC ROUTES (MUST BE FIRST)
============================= */

// GET ads
router.get("/ads/all", async (_, res) => {
  try {
    const ads = await Ad.findAll({
      where: { active: true },
      order: [["order", "ASC"]]
    });
    res.json(ads);
  } catch (err) {
    res.status(500).json({ error: "Failed to load ads" });
  }
});

// analytics visit
router.post("/visit", async (req, res) => {
  try {
    await AnalyticsVisit.create({
      path: req.body.path || "",
      referrer: req.body.referrer || "",
      ip: req.ip,
      userAgent: req.get("User-Agent") || ""
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// templates
router.get("/templates/all", async (_, res) => {
  try {
    const templates = await Product.findAll({
      where: { isTemplate: true },
      include: [{ model: Category }],
      order: [["title", "ASC"]]
    });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =============================
   GET PRODUCTS LIST
============================= */
router.get("/", async (req, res) => {
  try {
    const { search, q, categoryId, variety, supplier } = req.query;
    let searchTerm = search || q;
    if (!searchTerm && req.query) {
      // fallback: check all possible keys for tomato
      for (const key of Object.keys(req.query)) {
        if (String(req.query[key]).toLowerCase().includes("tomato")) {
          searchTerm = "tomato";
          break;
        }
      }
    }
    console.log("[PRODUCT SEARCH] search=", search, "q=", q, "searchTerm=", searchTerm, "categoryId=", categoryId, "variety=", variety, "supplier=", supplier);
    const where = {};

    if (searchTerm) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${searchTerm}%` } },
        { variety: { [Op.iLike]: `%${searchTerm}%` } },
        { subVariety: { [Op.iLike]: `%${searchTerm}%` } },
        { description: { [Op.iLike]: `%${searchTerm}%` } }
      ];
    }

    if (categoryId) where.CategoryId = Number(categoryId);
    if (variety) where.variety = variety;

    if (supplier === "true" && req.session?.supplierId) {
      where.supplierId = req.session.supplierId;
    }

    const products = await Product.findAll({
      where,
      include: [
        {
          model: Supplier,
          as: "suppliers",
          attributes: ["id", "name", "phone"],
          through: { attributes: [] }
        },
        {
          model: Category,
          attributes: ["id", "name"]
        }
      ],
      order: [["createdAt", "DESC"]]
    });
    console.log(`[PRODUCT SEARCH] found ${products.length} products`);
    res.json(products);
  } catch (err) {
    console.error("❌ Products GET error:", err);
    res.status(500).json({ error: "Failed to load products" });
  }
});

/* =============================
   GET PRODUCT BY ID (LAST)
============================= */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Supplier, as: "suppliers", attributes: ["id", "name", "phone"], through: { attributes: [] } },
        { model: Category, attributes: ["id", "name"] }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =============================
   CREATE PRODUCT
============================= */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const supplierId = req.session?.supplierId || null;
    const adminId = req.session?.adminId || null;

    if (!supplierId && !adminId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const {
      title,
      name,
      price,
      description,
      categoryId,
      variety,
      subVariety,
      unit,
      templateId
    } = req.body;

    const productData = {
      title: title || name,
      description: description || "",
      price: Number(price || 0),
      CategoryId: categoryId || null,
      variety: variety || null,
      subVariety: subVariety || null,
      unit: unit || "piece",
      image: req.file ? req.file.path : "",
      supplierId,
      isTemplate: adminId && !supplierId
    };

    if (templateId && supplierId) {
      const template = await Product.findByPk(templateId);
      if (template?.isTemplate) {
        Object.assign(productData, {
          title: template.title,
          description: template.description,
          variety: template.variety,
          subVariety: template.subVariety,
          unit: template.unit,
          CategoryId: template.CategoryId,
          image: template.image
        });
      }
    }

    const product = await Product.create(productData);

    try {
      const titleKannada = await translateToKannada(product.title);
      const descKannada = product.description
        ? await translateToKannada(product.description)
        : "";
      await product.update({ titleKannada, descriptionKannada: descKannada });
    } catch {
      /* silent */
    }

    res.status(201).json(product);
  } catch (err) {
    console.error("❌ Product CREATE error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =============================
   DELETE PRODUCT
============================= */
router.delete("/:id", async (req, res) => {
  try {
    const supplierId = req.session?.supplierId;
    const adminId = req.session?.adminId;

    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });

    if (!adminId) {
      const owns =
        product.supplierId === supplierId ||
        (await ProductSupplier.findOne({
          where: { productId: product.id, supplierId }
        }));

      if (!owns) {
        return res.status(403).json({ error: "Not authorized" });
      }
    }

    await ProductSupplier.destroy({ where: { productId: product.id } });
    await product.destroy();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
