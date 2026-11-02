"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Agregar 'archived' al ENUM de discounts
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_discounts_status" ADD VALUE IF NOT EXISTS 'archived';
    `);

    // 2. Agregar 'archived' al ENUM de site_contents
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_site_contents_status" ADD VALUE IF NOT EXISTS 'archived';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Nota: PostgreSQL no permite eliminar valores de un tipo ENUM fácilmente
    // sin recrear el tipo, por lo que en rollback se suele dejar vacío o documentado.
  },
};
