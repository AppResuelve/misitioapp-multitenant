"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[var(--color-bg-elevated)] rounded-md ${className}`}
      aria-hidden="true"
    />
  );
}
