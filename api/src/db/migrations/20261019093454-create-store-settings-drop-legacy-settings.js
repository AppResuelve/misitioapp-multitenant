"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Eliminar la tabla vieja key-value
      await queryInterface.dropTable("settings", { transaction });

      // 2. Crear la nueva tabla store_settings
      await queryInterface.createTable(
        "store_settings",
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
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
          store_status: {
            type: Sequelize.ENUM("active", "paused", "maintenance"),
            allowNull: false,
            defaultValue: "active",
          },
          business_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            defaultValue: "",
          },
          business_slogan: {
            type: Sequelize.STRING(255),
            allowNull: true,
            defaultValue: "",
          },
          business_description: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: "",
          },
          email: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          currency: {
            type: Sequelize.STRING(10),
            allowNull: false,
            defaultValue: "ARS",
          },
          logo_url: {
            type: Sequelize.STRING(500),
            allowNull: true,
            defaultValue: "/logotipo.png",
          },
          favicon_url: {
            type: Sequelize.STRING(500),
            allowNull: true,
            defaultValue: "/favicon.ico",
          },
          social_links: {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: {
              instagram: "",
              facebook: "",
              tiktok: "",
              youtube: "",
              whatsapp: "",
            },
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
        },
        { transaction },
      );

      // 3. Índice explícito de unicidad para tenant_id
      await queryInterface.addIndex("store_settings", ["tenant_id"], {
        name: "store_settings_tenant_id_unique",
        unique: true,
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Eliminar la nueva tabla
      await queryInterface.dropTable("store_settings", { transaction });

      // 2. Si usamos Postgres, eliminar el tipo ENUM creado para store_status
      if (queryInterface.sequelize.options.dialect === "postgres") {
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_store_settings_store_status";',
          { transaction },
        );
      }

      // 3. Recrear estructura básica de la tabla legacy settings por si se hace rollback
      await queryInterface.createTable(
        "settings",
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
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
            onDelete: "CASCADE",
          },
          key: {
            type: Sequelize.STRING(100),
            allowNull: false,
          },
          value: {
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
        },
        { transaction },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
