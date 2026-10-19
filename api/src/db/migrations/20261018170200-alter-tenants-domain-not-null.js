"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Si hay algún tenant de prueba sin domain, le asignamos uno temporal basado en su slug
    await queryInterface.sequelize.query(`
      UPDATE tenants 
      SET domain = slug || '.appresuelve.com.ar' 
      WHERE domain IS NULL OR domain = '';
    `);

    // 1. Modificar columna para que sea obligatoria
    await queryInterface.changeColumn("tenants", "domain", {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    // 2. Agregar índice único sobre domain
    await queryInterface.addIndex("tenants", ["domain"], {
      unique: true,
      name: "tenants_domain_unique",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("tenants", "tenants_domain_unique");

    await queryInterface.changeColumn("tenants", "domain", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },
};
