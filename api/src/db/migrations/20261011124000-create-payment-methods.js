"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payment_methods", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "credit",
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      badge: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      brands: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Índice compuesto para optimizar la consulta multitenant ordenada
    await queryInterface.addIndex(
      "payment_methods",
      ["tenant_id", "is_active", "sort_order"],
      {
        name: "idx_payment_methods_tenant_active_order",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("payment_methods");
  },
};
