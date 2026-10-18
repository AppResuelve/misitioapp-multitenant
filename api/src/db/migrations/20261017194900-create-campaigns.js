"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("campaigns", {
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
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      starts_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      ends_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("draft", "active", "archived"),
        allowNull: false,
        defaultValue: "draft",
      },
      color: {
        type: Sequelize.STRING(32),
        allowNull: true,
        defaultValue: "#6366f1",
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

    await queryInterface.addIndex("campaigns", ["tenant_id", "slug"], {
      unique: true,
      name: "idx_campaigns_tenant_slug_unique",
    });

    await queryInterface.addIndex(
      "campaigns",
      ["tenant_id", "status", "starts_at", "ends_at"],
      {
        name: "idx_campaigns_tenant_status_dates",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("campaigns");
  },
};
