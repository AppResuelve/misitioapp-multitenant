"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("branches", "state", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "city", // Si estás en MySQL / MariaDB lo ubica después de city; en PostgreSQL simplemente se agrega
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("branches", "state");
  },
};
