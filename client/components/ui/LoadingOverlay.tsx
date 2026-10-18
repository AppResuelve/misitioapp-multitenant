"use client";
import { Spinner } from "./Spinner";

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  description?: string;
}

export function LoadingOverlay({
  open,
  message,
  description,
}: LoadingOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs pointer-events-auto transition-opacity duration-200">
      <div className="flex flex-col items-center text-center px-4 max-w-sm">
        <Spinner size="lg" />
        {message && (
          <p className="text-zinc-100 font-medium text-base mt-4 drop-shadow-xs">
            {message}
          </p>
        )}
        {description && (
          <p className="text-zinc-400 text-sm mt-1 leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
