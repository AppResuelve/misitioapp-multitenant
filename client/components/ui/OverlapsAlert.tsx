import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal"; // Ajustá la ruta según corresponda
import { Pagination } from "./Pagination"; // Ajustá la ruta según corresponda

export function OverlapsAlert({ overlaps }: { overlaps: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8; // Cantidad de productos por página en el modal

  if (!overlaps || overlaps.length === 0) return null;

  // Productos para la vista previa (máximo 4)
  const previewItems = overlaps.slice(0, 4);
  const hasMore = overlaps.length > 4;

  // Lógica de paginación para el modal
  const totalPages = Math.ceil(overlaps.length / pageSize);
  const paginatedItems = overlaps.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <>
      {/* Alerta de solapamiento principal */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Productos con más de un descuento aplicado
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => {
                setCurrentPage(1);
                setIsModalOpen(true);
              }}
              className="text-xs font-medium text-amber-800 dark:text-amber-300 hover:underline cursor-pointer"
            >
              Ver todos ({overlaps.length})
            </button>
          )}
        </div>

        <div className="space-y-1.5 pl-6">
          {previewItems.map((o) => (
            <p
              key={o.productId}
              className="text-sm text-amber-900/90 dark:text-amber-200/90"
            >
              <span className="font-semibold">{o.name}</span>:{" "}
              {o.discounts
                .map((d: any) => `${d.name} (${d.percentage}%)`)
                .join(" + ")}
            </p>
          ))}
        </div>
      </div>

      {/* Modal con paginación para ver todos los solapamientos */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Productos con solapamiento de descuentos"
        size="lg"
      >
        <div className="space-y-4">
          <div className="space-y-2 divide-y divide-[var(--color-border)]">
            {paginatedItems.map((o) => (
              <div key={o.productId} className="pt-2 first:pt-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {o.name}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {o.discounts
                    .map((d: any) => `${d.name} (${d.percentage}%)`)
                    .join(" + ")}
                </p>
              </div>
            ))}
          </div>

          {/* Paginación */}
          <div className="pt-4 border-t border-[var(--color-border)]">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(page: number) => setCurrentPage(page)}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
