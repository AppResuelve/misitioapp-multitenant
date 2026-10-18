"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("site_contents", {
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
      kind: {
        type: Sequelize.ENUM("banner", "carousel"),
        allowNull: false,
      },
      slot_key: {
        type: Sequelize.STRING(100),
        allowNull: false, // 'top_bar' | 'hero' | 'category_highlight' | 'product_highlight' | 'brand_carousel' | 'social_proof'
      },
      status: {
        type: Sequelize.ENUM("draft", "active"),
        allowNull: false,
        defaultValue: "draft",
      },
      campaign_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "campaigns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      starts_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ends_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      link_type: {
        type: Sequelize.ENUM("none", "category", "product", "external"),
        allowNull: false,
        defaultValue: "none",
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "categories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "products", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      external_url: {
        type: Sequelize.STRING(1000),
        allowNull: true,
      },
      config: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    // Optimiza la consulta pública por tenant, slot y estado
    await queryInterface.addIndex(
      "site_contents",
      ["tenant_id", "slot_key", "status"],
      {
        name: "idx_site_contents_tenant_slot_status",
      },
    );

    // Búsqueda rápida por campaña asociada
    await queryInterface.addIndex(
      "site_contents",
      ["tenant_id", "campaign_id"],
      {
        name: "idx_site_contents_tenant_campaign",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("site_contents");
  },
};
