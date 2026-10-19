"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Crear tabla billings completa
    await queryInterface.createTable("billings", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "tenants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      plan_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: "Plan Comercio",
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "active",
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "ARS",
      },
      current_period_start: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      current_period_end: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW() + INTERVAL '30 days'"),
      },
      grace_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 4,
      },
      grace_until: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      suspended_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_cron_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // 2. Crear una fila activa para cada tenant que ya existía
    await queryInterface.sequelize.query(`
      INSERT INTO billings (
        tenant_id, 
        plan_name, 
        status, 
        amount, 
        currency, 
        current_period_start, 
        current_period_end, 
        grace_days, 
        created_at, 
        updated_at
      )
      SELECT 
        id, 
        'Plan Comercio', 
        'active', 
        0.00, 
        'ARS', 
        NOW(), 
        NOW() + INTERVAL '30 days', 
        4, 
        NOW(), 
        NOW()
      FROM tenants
      ON CONFLICT (tenant_id) DO NOTHING;
    `);

    // 3. Quitar billing_status de tenants
    await queryInterface.removeColumn("tenants", "billing_status");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("tenants", "billing_status", {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: "active",
    });

    await queryInterface.dropTable("billings");
  },
};
