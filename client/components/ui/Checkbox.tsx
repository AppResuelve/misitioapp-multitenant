"use client";

import React, { useRef, useEffect } from "react";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  checked?: boolean;
  indeterminate?: boolean;
  className?: string;
}

export function Checkbox({
  checked = false,
  indeterminate = false,
  onChange,
  className = "",
  disabled = false,
  ...props
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  return (
    <label
      className={`relative inline-flex items-center cursor-pointer select-none ${
        disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
      } ${className}`}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span className="w-[18px] h-[18px] flex items-center justify-center rounded border border-[var(--color-border-hover)] bg-[var(--color-bg-base)] peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary)]/50 transition-colors duration-150">
        {checked ? (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : indeterminate ? (
          <svg
            className="w-3 h-3 text-[var(--color-text-secondary)]"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M3 6H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : null}
      </span>
    </label>
  );
}
