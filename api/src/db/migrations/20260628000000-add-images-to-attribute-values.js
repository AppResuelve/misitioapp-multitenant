'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('attribute_values', 'images', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('attribute_values', 'images');
  },
};
