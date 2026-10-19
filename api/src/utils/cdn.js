// src/utils/cdn.js

const proxyAssetUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  const cdnHost = process.env.ASSETS_CDN_URL; // ej: "https://assets.appresuelve.com.ar"
  if (!cdnHost) return url;

  return url.replace("https://res.cloudinary.com", cdnHost);
};

/**
 * Reemplaza URLs de Cloudinary en las imágenes de una instancia de Producto
 */
const proxyProductImages = (product) => {
  if (!product) return product;

  // Si images es un array de strings ["https://res.cloudinary.com/..."]
  if (Array.isArray(product.images)) {
    product.images = product.images.map(proxyAssetUrl);
  }

  // Si existe un campo imagen principal plano (ej. imageUrl / image)
  if (product.imageUrl) {
    product.imageUrl = proxyAssetUrl(product.imageUrl);
  }
  if (product.image) {
    product.image = proxyAssetUrl(product.image);
  }

  // Si los SKUs tienen imágenes propias
  if (Array.isArray(product.skus)) {
    product.skus.forEach((sku) => {
      if (sku.imageUrl) sku.imageUrl = proxyAssetUrl(sku.imageUrl);
      if (sku.image) sku.image = proxyAssetUrl(sku.image);
      if (Array.isArray(sku.images)) {
        sku.images = sku.images.map(proxyAssetUrl);
      }
    });
  }

  return product;
};

module.exports = {
  proxyAssetUrl,
  proxyProductImages,
};
