"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Si la tabla no existiera (bases nuevas), la crea
    const tableExists = await queryInterface.tableExists("branches");
    if (!tableExists) {
      await queryInterface.createTable("branches", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        tenant_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "tenants", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        name: { type: Sequelize.STRING(255), allowNull: false },
        phone: { type: Sequelize.STRING(32), allowNull: false },
        address: { type: Sequelize.STRING(255), allowNull: true },
        city: {
          type: Sequelize.STRING(150),
          allowNull: true,
          defaultValue: null,
        },
        country: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: "AR",
        },
        hours: { type: Sequelize.TEXT, allowNull: true },
        sort_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("NOW()"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("NOW()"),
        },
      });
      await queryInterface.addIndex("branches", ["tenant_id"]);
      return;
    }

    // 2. Si la tabla ya existe (como en deploy), agrega solo las columnas que falten
    const tableDefinition = await queryInterface.describeTable("branches");

    if (!tableDefinition.city) {
      await queryInterface.addColumn("branches", "city", {
        type: Sequelize.STRING(150),
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!tableDefinition.country) {
      await queryInterface.addColumn("branches", "country", {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: "AR",
      });
    }
  },

  async down(queryInterface) {
    const tableExists = await queryInterface.tableExists("branches");
    if (!tableExists) return;

    const tableDefinition = await queryInterface.describeTable("branches");
    if (tableDefinition.country)
      await queryInterface.removeColumn("branches", "country");
    if (tableDefinition.city)
      await queryInterface.removeColumn("branches", "city");
  },
};
