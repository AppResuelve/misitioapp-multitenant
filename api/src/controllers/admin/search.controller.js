const { Op } = require("sequelize");
const { Product, Category } = require("../../models");

/**
 * GET /admin/search
 * Query params:
 *   - q: string (término de búsqueda)
 *   - scope: "all" | "products" | "categories" (default: "all")
 *   - limit: number (default: 10, max: 20)
 */
async function adminFastSearch(req, res) {
  try {
    const { q = "", scope = "all", limit = 10 } = req.query;
    const term = String(q).trim();

    // Si viene vacío o con solo espacios, retornamos lista vacía sin tocar la DB
    if (!term) {
      return res.json({ results: [] });
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 20);
    const likeQuery = { [Op.iLike]: `%${term}%` };

    let foundCategories = [];
    let foundProducts = [];

    // 1. Buscar Categorías si aplica
    if (scope === "all" || scope === "categories") {
      foundCategories = await Category.findAll({
        where: {
          name: likeQuery,
        },
        attributes: ["id", "name", "slug", "image"],
        limit: parsedLimit,
        order: [["name", "ASC"]],
      });
    }

    // 2. Buscar Productos si aplica (por nombre o SKU)
    if (scope === "all" || scope === "products") {
      foundProducts = await Product.findAll({
        where: {
          [Op.or]: [{ name: likeQuery }],
        },
        attributes: ["id", "name", "slug", "retailPrice", "images", "status"],
        limit: parsedLimit,
        order: [["name", "ASC"]],
      });
    }

    // 3. Normalizar formato unificado para el FastSearchModal
    const formattedCategories = foundCategories.map((c) => ({
      id: c.id,
      name: c.name,
      type: "category",
      label: c.name,
      subtitle: `/${c.slug || ""}`,
      imageUrl: c.image || null,
    }));

    const formattedProducts = foundProducts.map((p) => {
      // Extrae la primera imagen si viene como arreglo o string JSON
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
          p.price != null ? `$${Number(p.price).toLocaleString("es-AR")}` : "",
        imageUrl: mainImg,
        status: p.status,
      };
    });

    // En scope 'all', intercalamos o unimos categorías primero y luego productos
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
