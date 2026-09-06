'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('service_variant_modifiers', 'is_required');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('service_variant_modifiers', 'is_required', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },
};
