// @ts-nocheck
"use client";

import { useState, useEffect } from "react";

export function useAdminHeaderHeight(
  elementId: string = "admin-top-banner",
): number {
  const [height, setHeight] = useState<number>(0);
  const el = document.getElementById(elementId);
  console.log("sdfdsfsdfsdfsfsfs", el);

  useEffect(() => {
    if (!el) {
      setHeight(0);
      return;
    }

    setHeight(el.offsetHeight);

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        const measured = Math.round(
          entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight,
        );
        setHeight(measured);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [elementId]);

  return height;
}
