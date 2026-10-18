export function safeParseHours(hours: any): any[] {
  if (!hours) return [];
  if (Array.isArray(hours)) return hours;
  if (typeof hours === "string") {
    try {
      const parsed = JSON.parse(hours);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function formatLocationText(branch: any, countries: any[]): string {
  const countryObj = countries.find((c) => c.code === branch.country);
  const countryName = countryObj ? countryObj.name : branch.country;

  const parts = [branch.address, branch.city, branch.state, countryName].filter(
    Boolean,
  );

  return parts.join(", ") || "—";
}
