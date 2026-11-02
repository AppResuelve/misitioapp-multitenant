const { Category } = require("../../models");
const tagsService = require("../../services/store/tags.service");

const list = async (req, res, next) => {
  try {
    const { categoryId, categorySlug, tagIds } = req.query;

    let resolvedCategoryId =
      categoryId && categoryId !== "undefined" && categoryId !== "null"
        ? Number(categoryId)
        : null;

    // Si no hay ID pero viene slug (SSR directo desde la URL)
    if (!resolvedCategoryId && categorySlug && categorySlug !== "Todos") {
      const cat = await Category.findOne({
        where: {
          tenantId: req.tenant.id,
          slug: categorySlug,
          status: "active",
        },
        attributes: ["id"],
      });
      if (cat) resolvedCategoryId = cat.id;
    }

    const activeTagIds = tagIds
      ? (Array.isArray(tagIds)
          ? tagIds.map(Number)
          : tagIds.split(",").map(Number)
        ).filter(Boolean)
      : [];

    const tags = await tagsService.list(
      req.tenant.id,
      resolvedCategoryId,
      activeTagIds,
    );

    res.json(tags);
  } catch (err) {
    next(err);
  }
};

module.exports = { list };
