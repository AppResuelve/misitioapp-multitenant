const { Tag, TagValue, sequelize } = require("../../models");
const { Op } = require("sequelize");
const { getTenantId } = require("../tenantContext");

const list = async (categoryId, activeTagIds = []) => {
  const tags = await Tag.findAll({
    include: [
      {
        model: TagValue,
        as: "values",
        attributes: ["id", "value", "sortOrder", "tagId"],
      },
    ],
    order: [
      ["sortOrder", "ASC"],
      ["values", "sortOrder", "ASC"],
    ],
  });

  const activeByGroup = {};
  if (activeTagIds.length > 0) {
    for (const tag of tags) {
      for (const val of tag.values) {
        if (activeTagIds.includes(val.id)) {
          if (!activeByGroup[val.tagId]) activeByGroup[val.tagId] = [];
          activeByGroup[val.tagId].push(val.id);
        }
      }
    }
  }

  // FIX: Sanitizamos el categoryId para evitar el temido 'undefined' literal
  const validCategoryId =
    categoryId && categoryId !== "undefined" && categoryId !== "null"
      ? Number(categoryId)
      : null;

  for (const tag of tags) {
    for (const tv of tag.values) {
      const testByGroup = {};
      for (const [groupId, ids] of Object.entries(activeByGroup)) {
        testByGroup[groupId] = [...ids];
      }

      // Reemplazamos cualquier selección previa de este grupo con SOLO el candidato
      testByGroup[tag.id] = [tv.id];

      const intersects = Object.values(testByGroup).map(
        (ids) =>
          `SELECT "product_id" FROM "product_tags" WHERE "tag_value_id" IN (${ids.join(",")})`,
      );

      // Usamos la variable ya limpia y sanitizada
      const categoryFilter = validCategoryId
        ? `AND "Product"."category_id" = ${validCategoryId}`
        : "";

      const tenantId = getTenantId();
      const tenantFilter = tenantId
        ? `AND "Product"."tenant_id" = ${tenantId}`
        : "";

      const checkQuery = `
        SELECT COUNT(*) as count
        FROM (
          SELECT "Product"."id"
          FROM "products" AS "Product"
          WHERE "Product"."status" = 'active'
            ${tenantFilter}
            ${categoryFilter}
            AND "Product"."id" IN (${intersects.join(" INTERSECT ")})
        ) AS filtered
      `;

      const result = await sequelize.query(checkQuery, {
        type: sequelize.QueryTypes.SELECT,
      });
      tv.dataValues.isAvailable = parseInt(result[0]?.count || "0") > 0;
    }
  }

  return tags;
};

module.exports = { list };
