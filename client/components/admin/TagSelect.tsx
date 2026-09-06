'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface TagValue {
  id: number
  value: string
  sortOrder: number
}
interface Tag {
  id: number
  name: string
  color: string
  sortOrder: number
  values: TagValue[]
}

interface TagSelectProps {
  tags: Tag[]
  selected: number[]
  onChange: (ids: number[]) => void
}

export function TagSelect({ tags, selected, onChange }: TagSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selectedMap = useMemo(() => {
    const map = new Map<number, { tag: Tag; value: TagValue }>()
    tags.forEach(tag => {
      tag.values.forEach(v => {
        if (selected.includes(v.id)) {
          map.set(v.id, { tag, value: v })
        }
      })
    })
    return map
  }, [tags, selected])

  const activeGroups = useMemo(() => {
    const groups = new Map<number, { tag: Tag; values: TagValue[] }>()
    selectedMap.forEach(({ tag, value }) => {
      if (!groups.has(tag.id)) groups.set(tag.id, { tag, values: [] })
      groups.get(tag.id)!.values.push(value)
    })
    return Array.from(groups.values())
  }, [selectedMap])

  const availableByTag = useMemo(() => {
    return tags.map(tag => ({
      ...tag,
      available: tag.values.filter(v => !selected.includes(v.id)),
    })).filter(tag => tag.available.length > 0)
  }, [tags, selected])

  const addTag = (id: number) => {
    onChange([...selected, id])
  }

  const removeTag = (id: number) => {
    onChange(selected.filter(s => s !== id))
  }

  if (tags.length === 0) return null

  return (
    <div className="space-y-3" ref={containerRef}>
      <p className="text-sm font-medium text-zinc-400">Etiquetas</p>

      {/* Dropdown button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-400 hover:border-zinc-600 transition-colors"
        >
          <span>Seleccionar etiqueta...</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
            {availableByTag.length === 0 ? (
              <div className="px-3 py-4 text-xs text-zinc-500 text-center">
                Todas las etiquetas seleccionadas
              </div>
            ) : (
              availableByTag.map(tag => (
                <div key={tag.id}>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    {tag.name}
                  </div>
                  {tag.available.map(tv => (
                    <button
                      key={tv.id}
                      type="button"
                      onClick={() => addTag(tv.id)}
                      className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      {tv.value}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Active badges grouped by tag */}
      {activeGroups.length > 0 && (
        <div className="space-y-2">
          {activeGroups.map(({ tag, values }) => (
            <div key={tag.id}>
              <p className="text-xs text-zinc-500 mb-1 ml-0.5">{tag.name}</p>
              <div className="flex flex-wrap gap-2">
                {values.map(tv => (
                  <span
                    key={tv.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-default"
                    style={{
                      backgroundColor: tag.color + '18',
                      color: tag.color,
                      borderColor: tag.color + '40',
                    }}
                  >
                    {tv.value}
                    <button
                      type="button"
                      onClick={() => removeTag(tv.id)}
                      className="ml-0.5 p-0.5 rounded-full hover:bg-black/20 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
