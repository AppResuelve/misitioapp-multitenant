'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('discounts', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      type: {
        type: Sequelize.ENUM('global', 'category', 'price_range', 'products', 'cart_total'),
        allowNull: false,
      },
      percentage: { type: Sequelize.INTEGER, allowNull: false },
      config: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      status: {
        type: Sequelize.ENUM('draft', 'active'),
        allowNull: false,
        defaultValue: 'draft',
      },
      start_at: { type: Sequelize.DATE, allowNull: false },
      end_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('discounts', ['tenant_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('discounts');
  },
};
