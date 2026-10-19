"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("email_logs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"), // o defaultValue: Sequelize.UUIDV4
        primaryKey: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "tenants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      period_key: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "sent",
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn("NOW"),
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // Índice compuesto único para evitar duplicar emails por ciclo
    await queryInterface.addIndex(
      "email_logs",
      ["tenant_id", "type", "period_key"],
      {
        unique: true,
        name: "email_logs_tenant_type_period_unique",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("email_logs");
  },
};
