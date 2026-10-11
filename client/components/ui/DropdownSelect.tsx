'use client'
import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface DropdownOption {
  value: string | number
  label: string
}

interface DropdownSelectProps {
  label?: string
  options: DropdownOption[]
  value: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DropdownSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  className = '',
  disabled = false,
}: DropdownSelectProps) {
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

  const selected = options.find(o => String(o.value) === String(value))

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-zinc-400 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm transition-colors
            ${disabled
              ? 'opacity-50 cursor-not-allowed text-zinc-500'
              : 'text-zinc-200 hover:border-zinc-600 cursor-pointer'
            }
            ${open ? 'border-cyan-500 ring-1 ring-cyan-500' : ''}
          `}
        >
          <span className={selected ? 'text-zinc-200' : 'text-zinc-500'}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-4 text-xs text-zinc-500 text-center">
                Sin opciones
              </div>
            ) : (
              options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors
                    ${String(opt.value) === String(value)
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'text-zinc-300 hover:bg-zinc-700'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
