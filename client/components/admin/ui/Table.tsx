// @ts-nocheck
'use client'
import { Checkbox } from './Checkbox'

export function Table({ columns, data, onRowClick, emptyMessage = 'No hay datos', selectable = false, selected = [], onSelectionChange, onSelectAll }) {

  const currentSelectedCount = data.filter((row) => selected.includes(row.id)).length
  const allChecked = selectable && data.length > 0 && currentSelectedCount === data.length
  const someChecked = selectable && currentSelectedCount > 0 && currentSelectedCount < data.length

  const handleSelectAll = () => {
    if (onSelectAll) { onSelectAll(); return }
    if (!onSelectionChange) return
    if (allChecked) {
      onSelectionChange([])
    } else {
      onSelectionChange(data.map((r) => r.id))
    }
  }

  const handleSelectRow = (id) => {
    if (!onSelectionChange) return
    if (selected.includes(id)) {
      onSelectionChange(selected.filter((s) => s !== id))
    } else {
      onSelectionChange([...selected, id])
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-900">
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
              <th key={i} className={`px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-zinc-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={`bg-zinc-950 hover:bg-zinc-900 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {selectable && (
                  <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.includes(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                    />
                  </td>
                )}
                {columns.map((col, j) => (
                  <td key={j} className={`px-4 py-3 text-zinc-300 ${col.className || ''}`}>
                    {col.accessor ? col.accessor(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
