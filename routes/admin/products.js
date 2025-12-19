const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const { Product, Supplier, ProductSupplier } = require('../../models');

// Change supplier password (admin only)
// Bypass all checks: allow setting supplier password with just email and newPassword
router.post("/supplier/set-password", async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const supplier = await Supplier.findOne({ where: { email } });
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    supplier.password = hash;
    await supplier.save();
    res.json({ success: true, message: "Supplier password updated (bypassed checks)" });
  } catch (err) {
    console.error("Admin set supplier password error (bypassed checks):", err);
    res.status(500).json({ error: "Failed to update password" });
  }
});

// Get suppliers for a product
router.get('/:productId/suppliers', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId, {
      include: [{
        model: Supplier,
        as: 'suppliers',
        through: { attributes: ['price', 'stock', 'isActive'] }
      }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product.suppliers || []);
  } catch (error) {
    console.error('Error fetching product suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Assign supplier to product
router.post('/:productId/suppliers', async (req, res) => {
  try {
    const { supplierId, price, stock } = req.body;
    
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if already assigned
    const existing = await ProductSupplier.findOne({
      where: { productId: req.params.productId, supplierId }
    });

    if (existing) {
      // Update existing
      await existing.update({ price, stock, isActive: true });
      return res.json({ message: 'Supplier updated', productSupplier: existing });
    }

    // Create new assignment
    await product.addSupplier(supplier, {
      through: { price, stock, isActive: true }
    });

    res.json({ message: 'Supplier assigned to product' });
  } catch (error) {
    console.error('Error assigning supplier:', error);
    res.status(500).json({ error: 'Failed to assign supplier' });
  }
});

// Remove supplier from product
router.delete('/:productId/suppliers/:supplierId', async (req, res) => {
  try {
    const deleted = await ProductSupplier.destroy({
      where: {
        productId: req.params.productId,
        supplierId: req.params.supplierId
      }
    });

    if (deleted === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Supplier removed from product' });
  } catch (error) {
    console.error('Error removing supplier:', error);
    res.status(500).json({ error: 'Failed to remove supplier' });
  }
});

// Admin: Apply 15% margin to all products
router.post('/apply-margin', async (req, res) => {
  try {
    const products = await Product.findAll();
    let updatedCount = 0;
    for (const product of products) {
      if (typeof product.price === 'number') {
        product.price = parseFloat((product.price * 1.15).toFixed(2));
        await product.save();
        updatedCount++;
      }
    }
    res.json({ success: true, updated: updatedCount });
  } catch (err) {
    console.error('Error applying margin:', err);
    res.status(500).json({ error: 'Failed to apply margin to products' });
  }
});

module.exports = router;
