const { Op } = require("sequelize");
const { TagValue, Tag } = require("../models");

/**
 * Recibe un array de strings de tags (ej. ["Tipo de Piel: Grasa", "Antiage"])
 * y devuelve los IDs de TagValue correspondientes, creando los Tags o TagValues faltantes si es necesario.
 */
async function resolveTagValueIds(tenantId, rawTags, transaction) {
  if (!rawTags) return [];

  // 1. Normalizar a una lista plana de strings individuales, separando por comas o saltos de línea
  const inputList = Array.isArray(rawTags) ? rawTags : [rawTags];
  const items = [];

  for (const entry of inputList) {
    if (!entry || typeof entry !== "string") continue;
    // Separa por comas o saltos de línea si vienen varios juntos en una sola celda
    const splitItems = entry
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    items.push(...splitItems);
  }

  if (items.length === 0) return [];

  const tagValueIds = [];

  for (const raw of items) {
    const parts = raw
      .split(":")
      .map((s) => s.trim())
      .filter(Boolean);

    let tagName = "General";
    let valName = "";

    if (parts.length >= 2) {
      tagName = parts[0];
      valName = parts.slice(1).join(":").trim();
    } else {
      valName = parts[0];
    }

    if (!valName) continue;

    // 1. Buscar o crear el Tag contenedor (padre)
    const [tag] = await Tag.findOrCreate({
      where: {
        tenantId,
        name: { [Op.iLike]: tagName },
      },
      defaults: {
        tenantId,
        name: tagName,
        color: "#6366f1",
        sortOrder: 0,
      },
      transaction,
    });

    // 2. Buscar o crear el TagValue hijo
    const [tagValue] = await TagValue.findOrCreate({
      where: {
        tenantId,
        tagId: tag.id,
        value: { [Op.iLike]: valName },
      },
      defaults: {
        tenantId,
        tagId: tag.id,
        value: valName,
        sortOrder: 0,
      },
      transaction,
    });

    tagValueIds.push(tagValue.id);
  }

  return [...new Set(tagValueIds)];
}

module.exports = { resolveTagValueIds };
