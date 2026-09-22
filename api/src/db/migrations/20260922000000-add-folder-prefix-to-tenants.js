'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tenants', 'folder_prefix', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tenants', 'folder_prefix');
  },
};
