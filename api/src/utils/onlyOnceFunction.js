const { generateSkuCode } = require("./skuGenerator");
const { Product, ProductSku } = require("../models"); // Ajustá la ruta relativa a tus modelos

// --- MIGRACIÓN TEMPORAL DE SKUs (Quitar en el próximo deploy) ---
async function fillMissingSkusOnce() {
  try {
    // Solo busca los que no tienen SKU
    const missing = await ProductSku.findAll({
      where: { sku: null },
      include: [{ model: Product, as: "product", attributes: ["name"] }],
      limit: 3000, // Margen de seguridad
    });

    if (missing.length === 0) {
      console.log("✅ [Migración SKUs] Todos los productos ya tienen SKU.");
      return;
    }

    console.log(
      `⏳ [Migración SKUs] Asignando SKU a ${missing.length} productos base...`,
    );

    for (const record of missing) {
      const productName = record.product?.name || "PRODUCTO";
      // Usa tu función generateSkuCode
      const code = generateSkuCode(productName, [], []);
      await record.update({ sku: code });
    }

    console.log(
      `🚀 [Migración SKUs] Se completaron ${missing.length} SKUs con éxito.`,
    );
  } catch (err) {
    console.error("❌ [Migración SKUs] Error:", err.message);
  }
}

module.exports = { fillMissingSkusOnce };
// -------------------------------------------------------------
