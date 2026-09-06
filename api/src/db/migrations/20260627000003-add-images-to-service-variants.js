'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('service_variants', 'images', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('service_variants', 'images');
  },
};
