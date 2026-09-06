'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('attributes', 'unit_type', {
      type: Sequelize.ENUM('kg', 'm', 'l'),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('attributes', 'unit_type');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_attributes_unit_type\"");
  },
};
