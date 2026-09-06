'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. attributes
    await queryInterface.createTable('attributes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // 2. attribute_values
    await queryInterface.createTable('attribute_values', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      attribute_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'attributes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      value: { type: Sequelize.STRING(255), allowNull: false },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('attribute_values', ['attribute_id']);

    // 3. product_skus
    await queryInterface.createTable('product_skus', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      retail_price: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      wholesale_price: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      wholesale_min_qty: { type: Sequelize.INTEGER, allowNull: true },
      stock: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      sku: { type: Sequelize.STRING(100), allowNull: true },
      images: { type: Sequelize.JSONB, defaultValue: [], allowNull: false },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      status: { type: Sequelize.ENUM('active', 'draft'), defaultValue: 'active', allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('product_skus', ['product_id']);
    await queryInterface.addIndex('product_skus', ['status']);

    // 4. sku_attribute_values (bridge)
    await queryInterface.createTable('sku_attribute_values', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      sku_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'product_skus', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      attribute_value_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'attribute_values', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('sku_attribute_values', ['sku_id']);
    await queryInterface.addIndex('sku_attribute_values', ['attribute_value_id']);
    await queryInterface.addIndex('sku_attribute_values', ['sku_id', 'attribute_value_id'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sku_attribute_values');
    await queryInterface.dropTable('product_skus');
    await queryInterface.dropTable('attribute_values');
    await queryInterface.dropTable('attributes');
  },
};
