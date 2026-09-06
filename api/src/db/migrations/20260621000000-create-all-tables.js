'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. users
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password: { type: Sequelize.STRING(255), allowNull: true },
      status: { type: Sequelize.ENUM('pending', 'active'), defaultValue: 'pending', allowNull: false },
      role: { type: Sequelize.ENUM('admin'), defaultValue: 'admin', allowNull: false },
      activation_token_hash: { type: Sequelize.STRING(255), allowNull: true },
      activation_expires: { type: Sequelize.DATE, allowNull: true },
      activation_sent_at: { type: Sequelize.DATE, allowNull: true },
      reset_token_hash: { type: Sequelize.STRING(255), allowNull: true },
      reset_expires: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // 2. categories
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      order: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // 3. products (FK → categories)
    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      images: { type: Sequelize.JSONB, defaultValue: [], allowNull: false },
      retail_price: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      compare_price: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      discount_percentage: { type: Sequelize.INTEGER, allowNull: true },
      wholesale_price: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      wholesale_min_qty: { type: Sequelize.INTEGER, allowNull: true },
      status: { type: Sequelize.ENUM('active', 'draft'), defaultValue: 'active', allowNull: false },
      tags: { type: Sequelize.JSONB, defaultValue: [], allowNull: false },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // 4. orders
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      items: { type: Sequelize.JSONB, defaultValue: [], allowNull: false },
      customer_name: { type: Sequelize.STRING(255), allowNull: false },
      customer_phone: { type: Sequelize.STRING(50), allowNull: false },
      customer_email: { type: Sequelize.STRING(255), allowNull: true },
      total: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0, allowNull: false },
      status: {
        type: Sequelize.ENUM('new', 'seen', 'confirmed', 'delivered', 'cancelled'),
        defaultValue: 'new',
        allowNull: false,
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // 5. settings
    await queryInterface.createTable('settings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      key: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      value: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // 6. media
    await queryInterface.createTable('media', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      url: { type: Sequelize.STRING(500), allowNull: false },
      public_id: { type: Sequelize.STRING(255), allowNull: false },
      filename: { type: Sequelize.STRING(255), allowNull: false },
      size: { type: Sequelize.INTEGER, allowNull: true },
      mime_type: { type: Sequelize.STRING(100), allowNull: true },
      folder: { type: Sequelize.STRING(100), defaultValue: 'galeria', allowNull: false },
      usage: { type: Sequelize.JSONB, defaultValue: [], allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // 7. change_requests
    await queryInterface.createTable('change_requests', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      component_id: { type: Sequelize.INTEGER, allowNull: false },
      category_id: { type: Sequelize.INTEGER, allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'done', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false,
      },
      values: { type: Sequelize.JSONB, defaultValue: {}, allowNull: false },
      free: { type: Sequelize.BOOLEAN, defaultValue: true },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      whatsapp_message: { type: Sequelize.TEXT, allowNull: true },
      admin_notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // 8. services
    await queryInterface.createTable('services', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      price: { type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      images: { type: Sequelize.JSONB, defaultValue: [], allowNull: false },
      status: { type: Sequelize.ENUM('active', 'draft'), defaultValue: 'active', allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('services');
    await queryInterface.dropTable('change_requests');
    await queryInterface.dropTable('media');
    await queryInterface.dropTable('settings');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('users');
  },
};
