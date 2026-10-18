"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, X } from "lucide-react";

interface TagValue {
  id: number;
  value: string;
  sortOrder: number;
}
interface Tag {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
  values: TagValue[];
}

interface TagSelectProps {
  tags: Tag[];
  selected: number[];
  onChange: (ids: number[]) => void;
}

export function TagSelect({ tags, selected, onChange }: TagSelectProps) {
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

  const selectedMap = useMemo(() => {
    const map = new Map<number, { tag: Tag; value: TagValue }>();
    tags.forEach((tag) => {
      tag.values.forEach((v) => {
        if (selected.includes(v.id)) {
          map.set(v.id, { tag, value: v });
        }
      });
    });
    return map;
  }, [tags, selected]);

  const activeGroups = useMemo(() => {
    const groups = new Map<number, { tag: Tag; values: TagValue[] }>();
    selectedMap.forEach(({ tag, value }) => {
      if (!groups.has(tag.id)) groups.set(tag.id, { tag, values: [] });
      groups.get(tag.id)!.values.push(value);
    });
    return Array.from(groups.values());
  }, [selectedMap]);

  const availableByTag = useMemo(() => {
    return tags
      .map((tag) => ({
        ...tag,
        available: tag.values.filter((v) => !selected.includes(v.id)),
      }))
      .filter((tag) => tag.available.length > 0);
  }, [tags, selected]);

  const addTag = (id: number) => {
    onChange([...selected, id]);
  };

  const removeTag = (id: number) => {
    onChange(selected.filter((s) => s !== id));
  };

  if (tags.length === 0) return null;

  return (
    <div className="space-y-3" ref={containerRef}>
      <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
        Etiquetas
      </label>

      {/* Selector desplegable */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-between px-3 py-2 bg-[var(--color-bg-base)] border rounded-lg text-sm transition-colors cursor-pointer ${
            open
              ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
              : "border-[var(--color-border)] hover:border-[var(--color-border-hover)]"
          }`}
        >
          <span className="text-[var(--color-text-muted)]">
            Seleccionar etiqueta...
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto py-1">
            {availableByTag.length === 0 ? (
              <div className="px-3 py-4 text-xs text-[var(--color-text-muted)] text-center">
                Todas las etiquetas seleccionadas
              </div>
            ) : (
              availableByTag.map((tag, idx) => (
                <div
                  key={tag.id}
                  className={
                    idx > 0
                      ? "border-t border-[var(--color-border)]/50 pt-1"
                      : ""
                  }
                >
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    {tag.name}
                  </div>
                  {tag.available.map((tv) => (
                    <button
                      key={tv.id}
                      type="button"
                      onClick={() => addTag(tv.id)}
                      className="w-full text-left px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors flex items-center justify-between group"
                    >
                      <span>{tv.value}</span>
                      <span
                        className="w-2 h-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: tag.color }}
                      />
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Badges activos agrupados por etiqueta */}
      {activeGroups.length > 0 && (
        <div className="space-y-2.5 pt-1">
          {activeGroups.map(({ tag, values }) => (
            <div key={tag.id}>
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 ml-0.5">
                {tag.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {values.map((tv) => (
                  <span
                    key={tv.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-default"
                    style={{
                      backgroundColor: `${tag.color}18`,
                      color: tag.color,
                      borderColor: `${tag.color}40`,
                    }}
                  >
                    {tv.value}
                    <button
                      type="button"
                      onClick={() => removeTag(tv.id)}
                      className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
