"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        "billings",
        "monthly_changes_limit",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 2,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        "billings",
        "changes_this_month",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn("billings", "monthly_changes_limit", {
        transaction,
      });
      await queryInterface.removeColumn("billings", "changes_this_month", {
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
