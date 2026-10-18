// @ts-nocheck
"use client";
import { Store, Package, Tags, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui";
import { useDashboard } from "@/hooks/admin-useDashboard";

const STORE_STATUS_MAP = {
  active: { label: "Activa", dot: "bg-emerald-500" },
  draft: { label: "Borrador", dot: "bg-amber-500" },
  maintenance: { label: "Mantenimiento", dot: "bg-red-500" },
};

export default function Dashboard() {
  const { data, loading } = useDashboard();
  const statusInfo = STORE_STATUS_MAP[data?.store?.status] || {
    label: data?.store?.status || "—",
    dot: "bg-[var(--color-text-muted)]",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card: Tienda */}
        <Card>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary-text)]">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Tienda
          </p>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-6 w-32 bg-[var(--color-bg-elevated)] rounded-md" />
              <div className="h-4 w-20 bg-[var(--color-bg-elevated)] rounded-md" />
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-[var(--color-text-primary)] truncate">
                {data?.store?.name}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {statusInfo.label}
                </span>
              </div>
            </>
          )}
        </Card>

        {/* Card: Productos */}
        <Card>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Productos
          </p>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 w-14 bg-[var(--color-bg-elevated)] rounded-md" />
              <div className="h-4 w-28 bg-[var(--color-bg-elevated)] rounded-md" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {data?.products?.active ?? 0}
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                activos de {data?.products?.total ?? 0} total
              </p>
              {data?.topProducts?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Más pedidos
                  </div>
                  <ol className="space-y-1.5">
                    {data.topProducts.map((p, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between text-sm py-0.5"
                      >
                        <span className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors truncate">
                          {p.name}
                        </span>
                        <span className="text-xs font-semibold text-[var(--color-text-muted)] ml-2 shrink-0 tabular-nums">
                          {p.count}x
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Card: Categorías */}
        <Card>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Tags className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Categorías
          </p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 w-14 bg-[var(--color-bg-elevated)] rounded-md" />
            </div>
          ) : (
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {data?.categories?.total ?? 0}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
