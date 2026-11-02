// @/hooks/useSlotAvailability.ts
import { useEffect, useMemo } from "react";
import { MAX_ITEMS_PER_SLOT } from "@/constants/siteContent";

interface SlotDef {
  key: string;
  label: string;
  [key: string]: any;
}

interface ItemWithSlot {
  id: string | number;
  slotKey: string;
  status?: string;
}

interface UseSlotAvailabilityProps {
  slots: readonly SlotDef[];
  existingItems: ItemWithSlot[];
  currentSlotKey: string;
  currentId?: string | string[];
  isEditing: boolean;
  onSelectSlot: (slotKey: string) => void;
}

export function useSlotAvailability({
  slots,
  existingItems,
  currentSlotKey,
  currentId,
  isEditing,
  onSelectSlot,
}: UseSlotAvailabilityProps) {
  // Solo compiten por el límite los que NO están archivados
  const activeAndDraftItems = useMemo(() => {
    return existingItems.filter(
      (item) =>
        item.status !== "archived" &&
        (!isEditing || String(item.id) !== String(currentId)),
    );
  }, [existingItems, isEditing, currentId]);

  // Opciones formateadas con (count / max) y disabled
  const slotOptions = useMemo(() => {
    return slots.map((slot) => {
      const count = activeAndDraftItems.filter(
        (item) => item.slotKey === slot.key,
      ).length;

      const isFull = count >= MAX_ITEMS_PER_SLOT;

      return {
        value: slot.key,
        label: isFull
          ? `${slot.label} (Lleno - ${count}/${MAX_ITEMS_PER_SLOT})`
          : `${slot.label} (${count}/${MAX_ITEMS_PER_SLOT})`,
        disabled: isFull,
      };
    });
  }, [slots, activeAndDraftItems]);

  // Si la ranura seleccionada por defecto se llenó, salta a la primera libre
  useEffect(() => {
    if (!isEditing && activeAndDraftItems.length > 0) {
      const currentSlotCount = activeAndDraftItems.filter(
        (item) => item.slotKey === currentSlotKey,
      ).length;

      if (currentSlotCount >= MAX_ITEMS_PER_SLOT) {
        const availableSlot = slots.find((s) => {
          const count = activeAndDraftItems.filter(
            (i) => i.slotKey === s.key,
          ).length;
          return count < MAX_ITEMS_PER_SLOT;
        });

        if (availableSlot) {
          onSelectSlot(availableSlot.key);
        }
      }
    }
  }, [activeAndDraftItems, isEditing, currentSlotKey, slots, onSelectSlot]);

  return { slotOptions };
}
