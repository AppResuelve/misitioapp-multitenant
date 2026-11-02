const { Op } = require("sequelize");
const { Product, Category } = require("../../models");

/**
 * GET /admin/search
 * Query params:
 *   - q: string (término de búsqueda)
 *   - scope: "all" | "products" | "categories" (default: "all")
 *   - limit: number (default: 10, max: 20)
 *   - status: "all" | "active" | "draft" | "archived" (default: "all")
 */
async function adminFastSearch(req, res) {
  try {
    const { q = "", scope = "all", limit = 10, status = "all" } = req.query;
    const term = String(q).trim();
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!term) {
      return res.json({ results: [] });
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 20);
    const likeQuery = { [Op.iLike]: `%${term}%` };

    // Cláusula base con aislamiento multitenant
    const baseWhere = tenantId ? { tenantId } : {};

    let foundCategories = [];
    let foundProducts = [];

    // 1. Buscar Categorías si aplica
    if (scope === "all" || scope === "categories") {
      const categoryWhere = {
        ...baseWhere,
        name: likeQuery,
        ...(status !== "all" && { status }),
      };

      foundCategories = await Category.findAll({
        where: categoryWhere,
        attributes: ["id", "name", "slug", "image", "status"],
        limit: parsedLimit,
        order: [["name", "ASC"]],
      });
    }

    // 2. Buscar Productos si aplica
    if (scope === "all" || scope === "products") {
      const productWhere = {
        ...baseWhere,
        [Op.or]: [{ name: likeQuery }],
        ...(status !== "all" && { status }),
      };

      foundProducts = await Product.findAll({
        where: productWhere,
        attributes: ["id", "name", "slug", "retailPrice", "images", "status"],
        limit: parsedLimit,
        order: [["name", "ASC"]],
      });
    }

    // 3. Normalizar formato unificado
    const formattedCategories = foundCategories.map((c) => ({
      id: c.id,
      name: c.name,
      type: "category",
      label: c.name,
      subtitle: `/${c.slug || ""}`,
      imageUrl: c.image || null,
      status: c.status,
    }));

    const formattedProducts = foundProducts.map((p) => {
      let mainImg = null;
      if (Array.isArray(p.images) && p.images.length > 0) {
        mainImg = p.images[0];
      } else if (typeof p.images === "string" && p.images.startsWith("[")) {
        try {
          const parsed = JSON.parse(p.images);
          mainImg = parsed[0] || null;
        } catch {
          mainImg = null;
        }
      }

      return {
        id: p.id,
        name: p.name,
        type: "product",
        label: p.name,
        subtitle:
          p.retailPrice != null
            ? `$${Number(p.retailPrice).toLocaleString("es-AR")}`
            : "",
        imageUrl: mainImg,
        status: p.status,
      };
    });

    const results = [...formattedCategories, ...formattedProducts].slice(
      0,
      parsedLimit,
    );

    return res.json({ results });
  } catch (error) {
    console.error("Error en adminFastSearch:", error);
    return res.status(500).json({
      error: "Ocurrió un error al procesar la búsqueda",
    });
  }
}

module.exports = {
  adminFastSearch,
};
