'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Bridge table: ServiceVariant ↔ AttributeValue
    await queryInterface.createTable('variant_attribute_values', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      service_variant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'service_variants', key: 'id' },
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
    await queryInterface.addIndex('variant_attribute_values', ['service_variant_id']);
    await queryInterface.addIndex('variant_attribute_values', ['attribute_value_id']);
    await queryInterface.addIndex('variant_attribute_values', ['service_variant_id', 'attribute_value_id'], { unique: true });

    // 2. Drop name column — reemplazada por attributeValues
    await queryInterface.removeColumn('service_variants', 'name');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('service_variants', 'name', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: '',
    });
    await queryInterface.dropTable('variant_attribute_values');
  },
};
