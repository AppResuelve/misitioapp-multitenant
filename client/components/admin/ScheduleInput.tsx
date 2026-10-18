// @ts-nocheck
"use client";
import { Plus, X } from "lucide-react";

const DAYS = [
  { key: "mon", label: "Lun" },
  { key: "tue", label: "Mar" },
  { key: "wed", label: "Mié" },
  { key: "thu", label: "Jue" },
  { key: "fri", label: "Vie" },
  { key: "sat", label: "Sáb" },
  { key: "sun", label: "Dom" },
];

const DAY_NAMES = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
  sun: "Domingo",
};
const DAY_ORDER = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };

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
  if (sortedShortDays.length === 1)
    return DAY_NAMES[sortedShortDays[0]].slice(0, 3);
  if (sortedShortDays.length === 2) {
    return `${DAY_NAMES[sortedShortDays[0]].slice(0, 3)} y ${DAY_NAMES[sortedShortDays[1]].slice(0, 3)}`;
  }
  if (!hasGaps(sortedShortDays)) {
    return `${DAY_NAMES[sortedShortDays[0]].slice(0, 3)} a ${DAY_NAMES[sortedShortDays[sortedShortDays.length - 1]].slice(0, 3)}`;
  }
  const abbreviated = sortedShortDays.map((d) => DAY_NAMES[d].slice(0, 3));
  return (
    abbreviated.slice(0, -1).join(", ") +
    " y " +
    abbreviated[abbreviated.length - 1]
  );
}

function formatPreview(schedules) {
  if (!schedules || schedules.length === 0) return "";
  return schedules
    .map((block) => {
      if (!block.days || block.days.length === 0) return "";
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
    .filter(Boolean)
    .join("\n");
}

export default function ScheduleInput({ value = [], onChange }) {
  const schedules =
    Array.isArray(value) && value.length > 0
      ? value
      : [{ days: [], timeRanges: [{ open: "09:00", close: "18:00" }] }];

  const handleChange = (newSchedules) => {
    onChange(newSchedules);
  };

  const toggleDay = (blockIdx, day) => {
    const updated = schedules.map((block, i) => {
      if (i !== blockIdx) return block;
      const days = block.days.includes(day)
        ? block.days.filter((d) => d !== day)
        : [...block.days, day];
      return { ...block, days };
    });
    handleChange(updated);
  };

  const updateTime = (blockIdx, rangeIdx, field, value) => {
    const updated = schedules.map((block, i) => {
      if (i !== blockIdx) return block;
      const ranges = [...block.timeRanges];
      ranges[rangeIdx] = { ...ranges[rangeIdx], [field]: value };
      return { ...block, timeRanges: ranges };
    });
    handleChange(updated);
  };

  const addTimeRange = (blockIdx) => {
    const updated = schedules.map((block, i) => {
      if (i !== blockIdx) return block;
      if (block.timeRanges.length >= 2) return block;
      const last = block.timeRanges[block.timeRanges.length - 1];
      return {
        ...block,
        timeRanges: [
          ...block.timeRanges,
          { open: last?.close || "13:00", close: "18:00" },
        ],
      };
    });
    handleChange(updated);
  };

  const removeTimeRange = (blockIdx, rangeIdx) => {
    const updated = schedules.map((block, i) => {
      if (i !== blockIdx) return block;
      return {
        ...block,
        timeRanges: block.timeRanges.filter((_, j) => j !== rangeIdx),
      };
    });
    handleChange(updated);
  };

  const addBlock = () => {
    if (schedules.length >= 2) return;
    handleChange([
      ...schedules,
      { days: [], timeRanges: [{ open: "09:00", close: "13:00" }] },
    ]);
  };

  const removeBlock = (blockIdx) => {
    handleChange(schedules.filter((_, i) => i !== blockIdx));
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
        Horarios de atención
      </label>

      {schedules.map((block, blockIdx) => (
        <div
          key={blockIdx}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 space-y-3 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
              Bloque {blockIdx + 1}
            </span>
            {schedules.length > 1 && (
              <button
                type="button"
                onClick={() => removeBlock(blockIdx)}
                className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Quitar bloque"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selector de días */}
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-2 font-medium">
              Días
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map(({ key, label }) => {
                const isActive = block.days.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDay(blockIdx, key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary)] font-semibold"
                        : "bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rangos horarios */}
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-2 font-medium">
              Horarios
            </p>
            <div className="space-y-2">
              {block.timeRanges.map((range, rangeIdx) => (
                <div key={rangeIdx} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={range.open}
                    onChange={(e) =>
                      updateTime(blockIdx, rangeIdx, "open", e.target.value)
                    }
                    className="px-2.5 py-1.5 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] text-xs focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                  />
                  <span className="text-[var(--color-text-muted)] text-xs font-medium">
                    hasta
                  </span>
                  <input
                    type="time"
                    value={range.close}
                    onChange={(e) =>
                      updateTime(blockIdx, rangeIdx, "close", e.target.value)
                    }
                    className="px-2.5 py-1.5 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] text-xs focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                  />
                  {block.timeRanges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeRange(blockIdx, rangeIdx)}
                      className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Quitar horario"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {block.timeRanges.length < 2 && (
              <button
                type="button"
                onClick={() => addTimeRange(blockIdx)}
                className="mt-2.5 text-xs text-[var(--color-primary-text)] hover:opacity-80 transition-opacity flex items-center gap-1 font-medium cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Agregar horario
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Botón agregar bloque */}
      {schedules.length < 2 && (
        <button
          type="button"
          onClick={addBlock}
          className="text-xs text-[var(--color-primary-text)] hover:opacity-80 transition-opacity flex items-center gap-1.5 w-full justify-center py-2.5 rounded-lg border border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] cursor-pointer font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Agregar bloque de días
        </button>
      )}

      {/* Previsualización del horario */}
      {schedules.some(
        (b) => b.days?.length > 0 && b.timeRanges?.length > 0,
      ) && (
        <div className="px-4 py-3 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 text-sm text-[var(--color-primary-text)] whitespace-pre-line leading-relaxed font-medium">
          {formatPreview(schedules)}
        </div>
      )}
    </div>
  );
}
