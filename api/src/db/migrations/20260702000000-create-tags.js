'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tags', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      color: { type: Sequelize.STRING(7), defaultValue: '#6366f1' },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addConstraint('tags', {
      fields: ['name'],
      type: 'unique',
      name: 'uq_tags_name',
    });

    await queryInterface.createTable('tag_values', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tag_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tags', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      value: { type: Sequelize.STRING(255), allowNull: false },
      sort_order: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addConstraint('tag_values', {
      fields: ['tag_id', 'value'],
      type: 'unique',
      name: 'uq_tag_values_tag_value',
    });

    await queryInterface.createTable('product_tags', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
      },
      tag_value_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tag_values', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addConstraint('product_tags', {
      fields: ['product_id', 'tag_value_id'],
      type: 'unique',
      name: 'uq_product_tags',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_tags');
    await queryInterface.dropTable('tag_values');
    await queryInterface.dropTable('tags');
  },
};
