// @ts-nocheck
'use client'
import { useRef, useEffect } from 'react'

export function Checkbox({ checked, indeterminate, onChange, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate || false
    }
  }, [indeterminate])

  return (
    <label className={`relative inline-flex items-center cursor-pointer ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="w-[18px] h-[18px] flex items-center justify-center rounded border border-zinc-600 bg-zinc-800 peer-checked:bg-cyan-500 peer-checked:border-cyan-500 transition-colors duration-150">
        {checked ? (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : indeterminate ? (
          <svg className="w-3 h-3 text-zinc-400" viewBox="0 0 12 12" fill="none">
            <path d="M3 6H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : null}
      </span>
    </label>
  )
}
