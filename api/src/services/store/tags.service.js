const { Tag, TagValue, sequelize } = require("../../models");
const { Op } = require("sequelize");

const list = async (tenantId, categoryId, activeTagIds = []) => {
  if (!tenantId) return [];

  // 1. FIX CRÍTICO: Filtrar las etiquetas por el tenantId
  const tags = await Tag.findAll({
    where: { tenantId },
    include: [
      {
        model: TagValue,
        as: "values",
        attributes: ["id", "value", "sortOrder", "tagId"],
        // Si tu tabla tag_values también tiene tenant_id, lo resguardamos:
        ...(TagValue.rawAttributes.tenantId ? { where: { tenantId } } : {}),
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

  // Sanitizamos el categoryId
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

      const categoryFilter = validCategoryId
        ? `AND "Product"."category_id" = ${validCategoryId}`
        : "";

      // Garantizamos que solo busque productos de este tenant
      const tenantFilter = `AND "Product"."tenant_id" = ${Number(tenantId)}`;

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
