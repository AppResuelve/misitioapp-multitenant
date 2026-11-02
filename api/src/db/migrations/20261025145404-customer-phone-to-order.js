"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("orders", "customer_phone", {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: "",
    });
  },

  async down(queryInterface, Sequelize) {
    // Asegura que no queden valores NULL antes de forzar allowNull: false
    await queryInterface.sequelize.query(
      `UPDATE "orders" SET "customer_phone" = '' WHERE "customer_phone" IS NULL;`,
    );

    await queryInterface.changeColumn("orders", "customer_phone", {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: "",
    });
  },
};
