"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("discounts", "campaign_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "campaigns", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("discounts", ["tenant_id", "campaign_id"], {
      name: "idx_discounts_tenant_campaign",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("discounts", "campaign_id");
  },
};
