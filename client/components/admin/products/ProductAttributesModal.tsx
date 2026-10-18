// @ts-nocheck
"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { Search, Plus, Trash2, Check, X } from "lucide-react";
import { Modal, Button } from "@/components/ui";
import AttributeValueCard from "./AttributeValueCard";
import { UNIT_LABEL } from "@/constants/productForm";
import api from "@/services/admin-api";
import { useAlert } from "@/context/AlertContext";

interface ProductAttributesModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  attributes: any[];
  setAttributes: React.Dispatch<React.SetStateAction<any[]>>;
  modalAttrs: Record<number, Set<number>>;
  setModalAttrs: React.Dispatch<
    React.SetStateAction<Record<number, Set<number>>>
  >;
}

export default function ProductAttributesModal({
  open,
  onClose,
  onConfirm,
  attributes,
  setAttributes,
  modalAttrs,
  setModalAttrs,
}: ProductAttributesModalProps) {
  const Alert = useAlert();
  const [attrSearch, setAttrSearch] = useState("");
  const [attrSelectOpen, setAttrSelectOpen] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside para el dropdown del buscador interno
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node)
      ) {
        setAttrSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasOtherUnitType = (excludeAttrId: number) => {
    return Object.keys(modalAttrs).some((id) => {
      if (Number(id) === excludeAttrId) return false;
      const a = attributes.find((x) => x.id === Number(id));
      return Boolean(a?.unitType);
    });
  };

  const modalAddAllValues = (attr: any) => {
    if (attr.unitType && hasOtherUnitType(attr.id)) return;
    setModalAttrs((prev) => ({
      ...prev,
      [attr.id]: new Set(attr.values.map((v: any) => v.id)),
    }));
  };

  const modalToggleAttrValue = (attrId: number, valueId: number) => {
    if (!modalAttrs[attrId]) {
      const attr = attributes.find((a) => a.id === attrId);
      if (attr?.unitType && hasOtherUnitType(attrId)) return;
      setModalAttrs((prev) => ({ ...prev, [attrId]: new Set([valueId]) }));
      return;
    }
    setModalAttrs((prev) => {
      const current = new Set(prev[attrId]);
      if (current.has(valueId)) {
        current.delete(valueId);
        if (current.size === 0) {
          const { [attrId]: _, ...rest } = prev;
          return rest;
        }
      } else {
        current.add(valueId);
      }
      return { ...prev, [attrId]: current };
    });
  };

  const modalToggleAttr = (attrId: number, valueId: number) => {
    setModalAttrs((prev) => {
      const aId = Number(attrId);
      const current = new Set(prev[aId] || []);
      if (current.has(valueId)) {
        current.delete(valueId);
      } else {
        current.add(valueId);
      }
      return { ...prev, [aId]: current };
    });
  };

  const modalRemoveAttr = async (attrId: number) => {
    const attr = attributes.find((a) => a.id === Number(attrId));
    const result = await Alert.fire({
      title: "¿Quitar atributo?",
      message: `¿Quitar "${attr?.name}" y deseleccionar todos sus valores?`,
      type: "warning",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: "Quitar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    setModalAttrs((prev) => {
      const { [Number(attrId)]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateAttrValueImages = async (valueId: number, images: string[]) => {
    for (const attr of attributes) {
      const v = attr.values.find((x: any) => x.id === valueId);
      if (v) {
        api
          .put(`/admin/attributes/${attr.id}/values/${valueId}`, { images })
          .catch(() => {});
        setAttributes((prev) =>
          prev.map((a) =>
            a.id === attr.id
              ? {
                  ...a,
                  values: a.values.map((x: any) =>
                    x.id === valueId ? { ...x, images } : x,
                  ),
                }
              : a,
          ),
        );
        break;
      }
    }
  };

  const sortedModalEntries = Object.entries(modalAttrs).sort(
    ([a], [b]) => Number(a) - Number(b),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Administrar atributos"
      size="lg"
    >
      <div className="space-y-4">
        {/* Buscador de atributos no agregados */}
        {attributes.filter((a) => !modalAttrs[a.id]).length > 0 && (
          <div className="relative" ref={searchDropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
              <input
                type="text"
                value={attrSearch}
                onChange={(e) => {
                  setAttrSearch(e.target.value);
                  setAttrSelectOpen(true);
                }}
                onFocus={() => setAttrSelectOpen(true)}
                placeholder="Buscar o agregar atributo..."
                className="w-full pl-9 pr-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            {attrSelectOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-2xl z-50 p-1.5 space-y-0.5">
                {(() => {
                  const q = attrSearch.toLowerCase();
                  const filtered = attributes
                    .filter((a) => {
                      const selected = modalAttrs[a.id];
                      if (!selected) return true;
                      return selected.size < a.values.length;
                    })
                    .filter((a) => {
                      if (!q) return true;
                      if (a.name.toLowerCase().includes(q)) return true;
                      return a.values.some((v: any) =>
                        v.value.toLowerCase().includes(q),
                      );
                    });

                  if (!filtered.length) {
                    return (
                      <p className="text-xs text-[var(--color-text-muted)] py-3 px-3 text-center">
                        Sin resultados
                      </p>
                    );
                  }

                  return filtered.map((attr) => {
                    const isDisabled =
                      attr.unitType && hasOtherUnitType(attr.id);
                    const selected = modalAttrs[attr.id];

                    return (
                      <div
                        key={attr.id}
                        className={`${isDisabled ? "opacity-40" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (!isDisabled) {
                              modalAddAllValues(attr);
                              setAttrSearch("");
                              setAttrSelectOpen(false);
                            }
                          }}
                          disabled={isDisabled}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors cursor-pointer group"
                        >
                          <Plus className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-text)] shrink-0 transition-colors" />
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            {attr.name}
                          </span>
                          {attr.unitType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary)]/20 shrink-0">
                              por {UNIT_LABEL[attr.unitType] || attr.unitType}
                            </span>
                          )}
                          {selected && (
                            <span className="text-[11px] text-[var(--color-text-muted)] ml-auto shrink-0">
                              {selected.size}/{attr.values.length}
                            </span>
                          )}
                        </button>

                        {/* Valores secundarios directos */}
                        {attr.values
                          .filter(
                            (v: any) => !q || v.value.toLowerCase().includes(q),
                          )
                          .map((v: any) => {
                            const isSelected = selected?.has(v.id);
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => {
                                  if (!isDisabled) {
                                    modalToggleAttrValue(attr.id, v.id);
                                    setAttrSearch("");
                                    setAttrSelectOpen(false);
                                  }
                                }}
                                disabled={isDisabled}
                                className={`w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-left hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors cursor-pointer ${
                                  isSelected ? "opacity-50" : ""
                                }`}
                              >
                                {isSelected ? (
                                  <Check className="w-3.5 h-3.5 text-[var(--color-primary-text)] shrink-0" />
                                ) : (
                                  <span className="w-3.5 h-3.5 rounded-full border border-[var(--color-border)] shrink-0" />
                                )}
                                <span
                                  className={`text-xs ${
                                    isSelected
                                      ? "text-[var(--color-text-muted)] line-through"
                                      : "text-[var(--color-text-secondary)]"
                                  }`}
                                >
                                  {v.value}
                                  {attr.unitType
                                    ? ` ${UNIT_LABEL[attr.unitType] || attr.unitType}`
                                    : ""}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

        {/* Lista de atributos seleccionados */}
        <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-4">
          {sortedModalEntries.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)]/30">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                Sin atributos seleccionados
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Buscá y seleccioná atributos para empezar a combinarlos en
                variantes.
              </p>
            </div>
          ) : (
            sortedModalEntries.map(([attrId, valueIds], idx) => {
              const attr = attributes.find((a) => a.id === Number(attrId));
              if (!attr) return null;

              return (
                <Fragment key={attrId}>
                  {idx > 0 && <hr className="border-[var(--color-border)]" />}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {attr.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => modalRemoveAttr(Number(attrId))}
                        className="p-1 text-[var(--color-text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                        title="Quitar atributo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {attr.values
                        .filter((v: any) => valueIds.has(v.id))
                        .map((v: any) => (
                          <AttributeValueCard
                            key={v.id}
                            value={v.value}
                            unitType={attr.unitType}
                            images={v.images || []}
                            onRemove={() =>
                              modalToggleAttr(Number(attrId), v.id)
                            }
                            onUpdateImages={(imgs) =>
                              updateAttrValueImages(v.id, imgs)
                            }
                          />
                        ))}
                    </div>
                  </div>
                </Fragment>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end pt-3 border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>Actualizar variantes</Button>
        </div>
      </div>
    </Modal>
  );
}
