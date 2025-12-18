const { Product, Supplier, Category, sequelize } = require("../models");

async function seed() {
  await sequelize.sync({ alter: true });

  // Find or create default supplier
  const [supplier] = await Supplier.findOrCreate({
    where: { name: "Default Supplier" },
    defaults: { phone: "9999999999" }
  });

  // Find or create Groceries category
  const [groceriesCategory] = await Category.findOrCreate({
    where: { name: "Groceries" },
    defaults: { icon: "🛒" }
  });

  // Add sample groceries
  const groceries = [
    { title: "Rice 1kg", description: "Premium quality rice.", price: 60 },
    { title: "Toor Dal 500g", description: "Protein-rich toor dal.", price: 80 },
    { title: "Sunflower Oil 1L", description: "Healthy cooking oil.", price: 120 },
    { title: "Sugar 1kg", description: "Refined sugar.", price: 50 },
    { title: "Salt 1kg", description: "Iodized salt.", price: 20 }
  ];

  for (const item of groceries) {
    await Product.create({
      ...item,
      SupplierId: supplier.id,
      CategoryId: groceriesCategory.id
    });
  }

  console.log("Groceries products seeded!");
  process.exit();
}

seed();
