"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "store_settings",
      "auto_calculate_unit_prices",
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    );

    await queryInterface.addColumn("store_settings", "allow_wholesale", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("store_settings", "hide_out_of_stock", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("store_settings", "track_stock", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addColumn("store_settings", "min_order_amount", {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
    });

    await queryInterface.addColumn("store_settings", "min_wholesale_amount", {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
    });

    await queryInterface.addColumn("store_settings", "show_price_with_tax", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      "store_settings",
      "auto_calculate_unit_prices",
    );
    await queryInterface.removeColumn("store_settings", "allow_wholesale");
    await queryInterface.removeColumn("store_settings", "hide_out_of_stock");
    await queryInterface.removeColumn("store_settings", "track_stock");
    await queryInterface.removeColumn("store_settings", "min_order_amount");
    await queryInterface.removeColumn("store_settings", "min_wholesale_amount");
    await queryInterface.removeColumn("store_settings", "show_price_with_tax");
  },
};
