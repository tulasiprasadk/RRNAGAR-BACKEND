// FlowerPackage.js - Sequelize model for monthly flower packages
module.exports = (sequelize, DataTypes) => {
  const FlowerPackage = sequelize.define('FlowerPackage', {
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
    flowers: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of flowers in the package'
    },
    deliveredDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of days flowers delivered'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'flower_packages',
    timestamps: true
  });
  return FlowerPackage;
};
