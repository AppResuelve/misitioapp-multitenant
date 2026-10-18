// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Package, Folder, ArrowRight } from "lucide-react";
import { Spinner } from "@/components/ui";
import api from "@/services/admin-api";

interface FastSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
  scope?: "all" | "products" | "categories"; // Scope inicial o forzado
  lockScope?: boolean; // Si es true, el badge de scope es fijo y no se puede quitar
  placeholder?: string;
}

export default function FastSearchModal({
  open,
  onClose,
  onSelect,
  scope = "all",
  lockScope = false,
  placeholder,
}: FastSearchModalProps) {
  const [query, setQuery] = useState("");
  const [currentScope, setCurrentScope] = useState(scope);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar scope inicial al abrir
  useEffect(() => {
    if (open) {
      setCurrentScope(scope);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, scope]);

  // Manejo de query y detección de comandos tipo "/products " o "/categories "
  const handleInputChange = (val: string) => {
    if (!lockScope) {
      if (val.startsWith("/products ") || val.startsWith("/p ")) {
        setCurrentScope("products");
        setQuery(val.replace(/^\/(products|p)\s+/, ""));
        return;
      }
      if (val.startsWith("/categories ") || val.startsWith("/c ")) {
        setCurrentScope("categories");
        setQuery(val.replace(/^\/(categories|c)\s+/, ""));
        return;
      }
    }
    setQuery(val);
  };

  // Debounce de 400ms para llamar a la API
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const term = query.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get("/admin/search", {
          params: { q: term, scope: currentScope, limit: 12 },
        });
        setResults(data.results || []);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, currentScope]);

  // Navegación por teclado (Flechas y Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (
      e.key === "Backspace" &&
      !query &&
      !lockScope &&
      currentScope !== "all"
    ) {
      setCurrentScope("all");
      return;
    }

    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      onSelect(results[selectedIndex]);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de búsqueda */}
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[var(--color-border)]">
          <Search className="w-5 h-5 text-[var(--color-text-muted)] shrink-0" />

          {/* Badge del Scope */}
          {currentScope !== "all" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary)]/20 shrink-0">
              {currentScope === "products" ? (
                <>
                  <Package className="w-3.5 h-3.5" />
                  <span>Productos</span>
                </>
              ) : (
                <>
                  <Folder className="w-3.5 h-3.5" />
                  <span>Categorías</span>
                </>
              )}
              {!lockScope && (
                <button
                  type="button"
                  onClick={() => setCurrentScope("all")}
                  className="hover:opacity-70 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              placeholder ||
              (currentScope === "products"
                ? "Buscar producto por nombre o SKU..."
                : currentScope === "categories"
                  ? "Buscar categoría..."
                  : "Buscar o escribí /products o /categories...")
            }
            className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />

          {loading && <Spinner size="sm" />}

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Resultados */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[var(--color-border)]/40">
          {results.length > 0 ? (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface)]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] overflow-hidden shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : item.type === "product" ? (
                        <Package className="w-4 h-4 text-[var(--color-text-muted)] opacity-60" />
                      ) : (
                        <Folder className="w-4 h-4 text-[var(--color-text-muted)] opacity-60" />
                      )}
                    </div>

                    <div className="truncate">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] uppercase tracking-wider">
                      {item.type === "product" ? "Producto" : "Categoría"}
                    </span>
                    {isSelected && (
                      <ArrowRight className="w-4 h-4 text-[var(--color-primary-text)] animate-in fade-in" />
                    )}
                  </div>
                </div>
              );
            })
          ) : query.trim() && !loading ? (
            <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
              No se encontraron resultados para &quot;{query}&quot;
            </div>
          ) : !query.trim() ? (
            <div className="py-10 text-center text-xs text-[var(--color-text-muted)]">
              Comenzá a escribir para buscar en el catálogo...
            </div>
          ) : null}
        </div>

        {/* Footer con atajos */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg-surface)]/40 text-[11px] text-[var(--color-text-muted)]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] font-sans">
                ↑↓
              </kbd>{" "}
              Navegar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] font-sans">
                Enter
              </kbd>{" "}
              Seleccionar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] font-sans">
                Esc
              </kbd>{" "}
              Cerrar
            </span>
          </div>
          {!lockScope && (
            <span>
              Tip: usá <strong className="font-semibold">/p</strong> o{" "}
              <strong className="font-semibold">/c</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
