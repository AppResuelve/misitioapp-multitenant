function slugify(text = "") {
  if (typeof text !== "string") return "";

  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve tildes y diacríticos
    .replace(/[^a-z0-9]+/g, "-") // Reemplaza caracteres no alfanuméricos por guiones
    .replace(/^-+|-+$/g, "") // Remueve guiones al inicio y al final
    .substring(0, 255); // Límite VARCHAR(255)
}

module.exports = { slugify };
