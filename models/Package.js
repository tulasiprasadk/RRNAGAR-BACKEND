// Package.js - Sequelize model for monthly packages (generalized)
module.exports = (sequelize, DataTypes) => {
  const Package = sequelize.define('Package', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID of the product in the package'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Category of the package (e.g., flowers, groceries)'
    },
    deliveredDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of days delivered'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'packages',
    timestamps: true
  });
  return Package;
};