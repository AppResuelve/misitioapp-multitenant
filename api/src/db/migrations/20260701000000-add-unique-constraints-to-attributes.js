'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint('attributes', {
      fields: ['name'],
      type: 'unique',
      name: 'uq_attributes_name',
    });
    await queryInterface.addConstraint('attribute_values', {
      fields: ['attribute_id', 'value'],
      type: 'unique',
      name: 'uq_attribute_values_attribute_id_value',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('attributes', 'uq_attributes_name');
    await queryInterface.removeConstraint('attribute_values', 'uq_attribute_values_attribute_id_value');
  },
};
