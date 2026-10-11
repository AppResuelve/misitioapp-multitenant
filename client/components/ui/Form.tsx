// @ts-nocheck
'use client'
export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:pointer-events-none'

  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20',
    secondary: 'bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30',
    ghost: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-zinc-400 mb-1.5">{label}</label>}
      <input
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors text-sm"
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', maxLength, value, ...props }) {
  const charCount = typeof value === 'string' ? value.length : 0
  const overLimit = maxLength && charCount > maxLength
  const nearLimit = maxLength && charCount / maxLength >= 0.8 && !overLimit

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-zinc-400 mb-1.5">{label}</label>}
      <textarea
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors text-sm resize-y min-h-[80px]"
        maxLength={maxLength}
        value={value}
        {...props}
      />
      {maxLength && (
        <p className={`mt-1 text-xs ${overLimit ? 'text-red-400' : nearLimit ? 'text-yellow-400' : 'text-zinc-500'}`}>
          {charCount.toLocaleString()} / {maxLength.toLocaleString()}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Select({ label, options = [], error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-zinc-400 mb-1.5">{label}</label>}
      <select
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors text-sm"
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
