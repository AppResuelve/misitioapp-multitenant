// src/utils/branchFormatter.js
const { DAY_NAMES, DAY_ORDER } = require("../constants/dateTime");

function hasGaps(sortedDays) {
  for (let i = 1; i < sortedDays.length; i++) {
    if (DAY_ORDER[sortedDays[i]] - DAY_ORDER[sortedDays[i - 1]] > 1) {
      return true;
    }
  }
  return false;
}

function formatDaysLabel(sortedShortDays) {
  if (sortedShortDays.length === 0) return "";
  if (sortedShortDays.length === 1) return DAY_NAMES[sortedShortDays[0]];
  if (sortedShortDays.length === 2) {
    return `${DAY_NAMES[sortedShortDays[0]]} y ${DAY_NAMES[sortedShortDays[1]]}`;
  }
  if (!hasGaps(sortedShortDays)) {
    return `${DAY_NAMES[sortedShortDays[0]]} a ${
      DAY_NAMES[sortedShortDays[sortedShortDays.length - 1]]
    }`;
  }
  const abbreviated = sortedShortDays.map((d) => DAY_NAMES[d]);
  return (
    abbreviated.slice(0, -1).join(", ") +
    " y " +
    abbreviated[abbreviated.length - 1]
  );
}

function formatBranchHours(hoursJson) {
  if (!hoursJson) return [];
  try {
    const schedules =
      typeof hoursJson === "string" ? JSON.parse(hoursJson) : hoursJson;
    if (!Array.isArray(schedules)) return [];
    return schedules
      .map((block) => {
        if (!block.days || block.days.length === 0) return null;
        const sorted = [...block.days].sort(
          (a, b) => DAY_ORDER[a] - DAY_ORDER[b],
        );
        const daysLabel = formatDaysLabel(sorted);
        const timesLabel =
          (block.timeRanges || [])
            .map((r) => `${r.open} a ${r.close}`)
            .join(" / ") || "Sin horario";
        return `${daysLabel}: ${timesLabel}`;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

module.exports = {
  hasGaps,
  formatDaysLabel,
  formatBranchHours,
};
