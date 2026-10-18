// @ts-nocheck
"use client";
import { Checkbox } from "./Checkbox";

export function Table({
  columns,
  data,
  onRowClick,
  emptyMessage = "No hay datos",
  selectable = false,
  selected = [],
  onSelectionChange,
  onSelectAll,
}) {
  const currentSelectedCount = data.filter((row) =>
    selected.includes(row.id),
  ).length;
  const allChecked =
    selectable && data.length > 0 && currentSelectedCount === data.length;
  const someChecked =
    selectable &&
    currentSelectedCount > 0 &&
    currentSelectedCount < data.length;

  const handleSelectAll = () => {
    if (onSelectAll) {
      onSelectAll();
      return;
    }
    if (!onSelectionChange) return;
    if (allChecked) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((r) => r.id));
    }
  };

  const handleSelectRow = (id) => {
    if (!onSelectionChange) return;
    if (selected.includes(id)) {
      onSelectionChange(selected.filter((s) => s !== id));
    } else {
      onSelectionChange([...selected, id]);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--color-bg-surface)] border-b border-[var(--color-border)]">
            {selectable && (
              <th className="w-10 px-3 py-3">
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider ${
                  col.className || ""
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-12 text-center text-[var(--color-text-muted)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => {
              const isSelected = selected.includes(row.id);
              return (
                <tr
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors ${
                    isSelected
                      ? "bg-[var(--color-primary-light)]"
                      : "bg-transparent hover:bg-[var(--color-bg-elevated)]/60"
                  } ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {selectable && (
                    <td
                      className="w-10 px-3 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectRow(row.id)}
                      />
                    </td>
                  )}
                  {columns.map((col, j) => (
                    <td
                      key={j}
                      className={`px-4 py-3 text-[var(--color-text-primary)] ${
                        col.className || ""
                      }`}
                    >
                      {col.accessor ? col.accessor(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
