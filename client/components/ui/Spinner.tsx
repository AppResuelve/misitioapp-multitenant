'use client'
import { Loader } from 'lucide-react'

const SIZE_MAP = {
  sm: 'w-3.5 h-3.5',
  md: 'w-6 h-6',
  lg: 'w-9 h-9',
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <Loader
      className={`${SIZE_MAP[size]} animate-spin text-cyan-400 ${className}`}
    />
  )
}
