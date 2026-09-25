'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeIndex('sku_attribute_values', ['tenant_id']);
    await queryInterface.removeColumn('sku_attribute_values', 'tenant_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('sku_attribute_values', 'tenant_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'tenants', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    await queryInterface.addIndex('sku_attribute_values', ['tenant_id']);
  },
};
