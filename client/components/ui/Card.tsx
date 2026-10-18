// @ts-nocheck
"use client";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 transition-colors shadow-xs ${className}`}
    >
      {children}
    </div>
  );
}
