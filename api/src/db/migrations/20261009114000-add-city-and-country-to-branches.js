"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("branches", "city", {
      type: Sequelize.STRING(150),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn("branches", "country", {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: "AR",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("branches", "country");
    await queryInterface.removeColumn("branches", "city");
  },
};
