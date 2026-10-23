"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("email_logs", "recipient", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("email_logs", "metadata", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("email_logs", "recipient");
    await queryInterface.removeColumn("email_logs", "metadata");
  },
};
