// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { isDeepEqual } from "@/utils/fastCompare";

/**
 * @param currentData - El estado actual del formulario
 * @param initialData - El snapshot inicial de referencia
 * @param active - Si el tracker debe estar activo (ej. false mientras carga o modal cerrado)
 * @param delay - Tiempo en ms de debounce tras la última pulsación (default: 300ms)
 * @returns { isDirty } - Booleano reactivo para deshabilitar botones o mostrar alertas
 */
export function useFormDirtyTracker<T>(
  currentData: T,
  initialData: T | null | undefined,
  active: boolean = true,
  delay: number = 300,
) {
  const { setIsDirty: setGlobalDirty } = useUnsavedChanges();
  const [isDirty, setIsDirty] = useState(false);
  const lastDirtyRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!active || initialData === null || initialData === undefined) {
      if (lastDirtyRef.current) {
        lastDirtyRef.current = false;
        setIsDirty(false);
        setGlobalDirty(false);
      }
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const equal = isDeepEqual(currentData, initialData);
      const shouldBeDirty = !equal;

      if (shouldBeDirty !== lastDirtyRef.current) {
        lastDirtyRef.current = shouldBeDirty;
        setIsDirty(shouldBeDirty);
        setGlobalDirty(shouldBeDirty);
      }
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentData, initialData, active, delay, setGlobalDirty]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setGlobalDirty(false);
      lastDirtyRef.current = false;
    };
  }, [setGlobalDirty]);

  return { isDirty };
}
