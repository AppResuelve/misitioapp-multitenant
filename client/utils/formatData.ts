export function formatPrice(price: any) {
  if (price == null) return "$0";
  return `$${Number(price).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
