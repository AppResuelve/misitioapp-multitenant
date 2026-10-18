// @ts-nocheck
"use client";

export function Textarea({
  label,
  error,
  className = "",
  maxLength,
  value,
  ...props
}) {
  const charCount = typeof value === "string" ? value.length : 0;
  const overLimit = maxLength && charCount > maxLength;
  const nearLimit = maxLength && charCount / maxLength >= 0.8 && !overLimit;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 bg-[var(--color-bg-base)] border rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors resize-y min-h-[80px] ${
          error
            ? "border-red-500 focus:ring-1 focus:ring-red-500"
            : "border-[var(--color-border)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
        }`}
        maxLength={maxLength}
        value={value}
        {...props}
      />
      <div className="flex items-center justify-between mt-1">
        {error ? (
          <p className="text-xs text-red-500 dark:text-red-400 font-medium">
            {error}
          </p>
        ) : (
          <span />
        )}
        {maxLength && (
          <p
            className={`text-xs font-medium ${
              overLimit
                ? "text-red-500 dark:text-red-400"
                : nearLimit
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-[var(--color-text-muted)]"
            }`}
          >
            {charCount.toLocaleString()} / {maxLength.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
