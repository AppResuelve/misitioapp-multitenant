'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_variants', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      service_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'services', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(255), allowNull: false },
      price: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      duration_minutes: { type: Sequelize.INTEGER, allowNull: true },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      status: { type: Sequelize.ENUM('active', 'draft'), defaultValue: 'active', allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });


    await queryInterface.createTable('service_variant_modifiers', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      service_variant_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'service_variants', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(255), allowNull: false },
      price: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      is_required: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      max_selection: { type: Sequelize.INTEGER, allowNull: true },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      status: { type: Sequelize.ENUM('active', 'draft'), defaultValue: 'active', allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

  },

  async down(queryInterface) {
    await queryInterface.dropTable('service_variant_modifiers');
    await queryInterface.dropTable('service_variants');
  },
};
