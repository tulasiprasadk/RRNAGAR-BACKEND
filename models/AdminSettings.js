// backend/models/AdminSettings.js
// Stores global admin settings for margin, delivery, discount, etc.

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('AdminSettings', {
    marginPercent: { type: DataTypes.FLOAT, defaultValue: 15 }, // %
    deliveryCharge: { type: DataTypes.FLOAT, defaultValue: 0 },
    freeDeliveryThreshold: { type: DataTypes.FLOAT, defaultValue: 0 }, // Amount above which delivery is free
    discountPercent: { type: DataTypes.FLOAT, defaultValue: 0 }, // %
    discountThreshold: { type: DataTypes.FLOAT, defaultValue: 0 }, // Amount above which discount applies
    discountFixed: { type: DataTypes.FLOAT, defaultValue: 0 }, // Fixed discount
  });
};
