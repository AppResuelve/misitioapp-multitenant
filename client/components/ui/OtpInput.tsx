// src/components/ui/OtpInput.tsx
"use client";

import React, { useRef } from "react";

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  error = false,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const handleDigitChange = (index: number, char: string) => {
    const clean = char.replace(/\D/g, "");
    if (!clean) return;

    const nextDigits = [...digits];
    nextDigits[index] = clean.slice(-1);
    const combined = nextDigits.join("").slice(0, length);
    onChange(combined);

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const nextDigits = [...digits];
      if (nextDigits[index]) {
        nextDigits[index] = "";
        onChange(nextDigits.join(""));
      } else if (index > 0) {
        nextDigits[index - 1] = "";
        onChange(nextDigits.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;

    onChange(pasted);
    const targetIdx = Math.min(pasted.length, length - 1);
    inputRefs.current[targetIdx]?.focus();
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-2.5">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[index] || ""}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          onChange={(e) => handleDigitChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border transition-all duration-150 outline-none
            bg-[var(--color-bg-base)] text-[var(--color-text-primary)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              error
                ? "border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 hover:border-[var(--color-border-hover)]"
            }
          `}
        />
      ))}
    </div>
  );
}
