"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownOption {
  value: string | number;
  label: string;
}

interface DropdownSelectProps {
  label?: string;
  options: DropdownOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DropdownSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  className = "",
  disabled = false,
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-3 py-2 bg-[var(--color-bg-base)] border rounded-lg text-sm transition-colors
            ${
              disabled
                ? "opacity-50 cursor-not-allowed text-[var(--color-text-muted)] border-[var(--color-border)]"
                : "text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-[var(--color-border-hover)] cursor-pointer"
            }
            ${open ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]" : ""}
          `}
        >
          <span
            className={
              selected
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)]"
            }
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto py-1">
            {options.length === 0 ? (
              <div className="px-3 py-4 text-xs text-[var(--color-text-muted)] text-center">
                Sin opciones
              </div>
            ) : (
              options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? "bg-[var(--color-primary-light)] text-[var(--color-primary-text)] font-semibold"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
