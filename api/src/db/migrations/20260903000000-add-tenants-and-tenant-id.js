'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tenants', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      slug: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      domain: { type: Sequelize.STRING(255), allowNull: true },
      admin_domain: { type: Sequelize.STRING(255), allowNull: true },
      billing_status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    const tables = [
      'users',
      'categories',
      'products',
      'orders',
      'settings',
      'media',
      'change_requests',
      'services',
      'attributes',
      'attribute_values',
      'product_skus',
      'sku_attribute_values',
      'service_variants',
      'service_variant_modifiers',
      'tags',
      'tag_values',
    ];

    for (const table of tables) {
      await queryInterface.addColumn(table, 'tenant_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      await queryInterface.addIndex(table, ['tenant_id']);
    }

    // Quitar los uniques globales y reemplazarlos por uniques compuestos por tenant
    const uniques = [
      { table: 'users', field: 'email' },
      { table: 'products', field: 'slug' },
      { table: 'categories', field: 'slug' },
      { table: 'services', field: 'slug' },
      { table: 'settings', field: 'key' },
    ];

    for (const { table, field } of uniques) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${table}_${field}_key"`,
      );
      await queryInterface.addIndex(table, ['tenant_id', field], { unique: true });
    }
  },

  async down(queryInterface) {
    const tables = [
      'users',
      'categories',
      'products',
      'orders',
      'settings',
      'media',
      'change_requests',
      'services',
      'attributes',
      'attribute_values',
      'product_skus',
      'sku_attribute_values',
      'service_variants',
      'service_variant_modifiers',
      'tags',
      'tag_values',
    ];

    for (const table of tables) {
      await queryInterface.removeColumn(table, 'tenant_id');
    }

    await queryInterface.dropTable('tenants');
  },
};
