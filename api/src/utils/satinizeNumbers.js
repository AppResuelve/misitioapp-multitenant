// Helper para limpiar strings de precios con $, puntos o comas
const sanitizeNumber = (val) => {
  if (typeof val === "string") {
    // Saca $, espacios y maneja comas decimales si vienen como "1500,50"
    const cleaned = val.replace(/[$ ]/g, "").replace(",", ".");
    return Number(cleaned);
  }
  return val;
};

// Helper para stock (redondea si querés enteros o permite decimales)
const sanitizeInt = (val) => {
  const num = sanitizeNumber(val);
  return typeof num === "number" && !isNaN(num) ? Math.round(num) : num;
};

module.exports = {
  sanitizeNumber,
  sanitizeInt,
};
