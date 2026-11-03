// @ts-nocheck
"use client";

import { useState } from "react";
import { useAlert } from "@/context/AlertContext";
import { useAuth } from "@/context/AuthContext";
import { Download, MoreVertical, Trash2, AlertTriangle } from "lucide-react";
import { Card, Button, Spinner } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { downloadTemplate } from "@/utils/excel";
import { triggerBlobDownload } from "@/utils/downloadBlob";
import { DATA_SETTINGS_MESSAGES } from "@/constants/dataSettings";
import { dataService } from "@/services/data.service";

const CONFIRMATION_KEYWORD = "eliminar-todos-los-productos";

export default function DataSettings() {
  const Alert = useAlert();
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCriticalModal, setShowCriticalModal] = useState(false);

  const businessName = user?.businessName || "db";

  const handleDownloadProducts = async () => {
    setExporting(true);
    try {
      const blob = await dataService.exportProducts();
      triggerBlobDownload(blob, `productos de ${businessName}`);

      Alert.fire({
        message: DATA_SETTINGS_MESSAGES.EXPORT_SUCCESS,
        type: "success",
        duration: 1500,
      });
    } catch (err: any) {
      Alert.fire({
        message: DATA_SETTINGS_MESSAGES.EXPORT_ERROR,
        type: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAllProducts = async () => {
    setShowCriticalModal(false);

    const result = await Alert.fire({
      type: "error",
      variant: "modal",
      title: "Eliminar todos los productos",
      message: `Esta acción es irreversible y vaciará el catálogo completo. Para confirmar, escribí "${CONFIRMATION_KEYWORD}":`,
      input: "text",
      inputPlaceholder: CONFIRMATION_KEYWORD,
      showCancelButton: true,
      confirmButtonText: "Eliminar definitivamente",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (value !== CONFIRMATION_KEYWORD) {
          return `Debés escribir exactamente "${CONFIRMATION_KEYWORD}"`;
        }
        return null;
      },
    });

    if (!result?.isConfirmed) return;

    setDeleting(true);
    try {
      const res = await dataService.deleteAllProducts();

      Alert.fire({
        type: "success",
        title: "Catálogo vaciado",
        message:
          res.message ||
          `Se eliminaron ${res.count ?? "todos los"} productos correctamente.`,
        duration: 2500,
      });
    } catch (err: any) {
      Alert.fire({
        type: "error",
        title: "Error",
        message:
          err?.response?.data?.error ||
          err.message ||
          "No se pudieron eliminar los productos",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Datos
        </h1>

        <button
          type="button"
          onClick={() => setShowCriticalModal(true)}
          title="Acciones avanzadas"
          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] border border-transparent hover:border-[var(--color-border)] transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Planillas de productos
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-xl">
            Descargá la planilla con todos tus productos para editarlos de forma
            masiva en Excel y volver a importarlos cuando quieras.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleDownloadProducts}
            disabled={exporting || deleting}
            className="gap-2"
          >
            {exporting ? (
              <Spinner size="sm" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>
              {exporting
                ? "Generando planilla..."
                : "Descargar planilla de productos"}
            </span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={downloadTemplate}
            disabled={exporting || deleting}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar plantilla vacía</span>
          </Button>
        </div>
      </Card>

      <Modal
        open={showCriticalModal}
        onClose={() => setShowCriticalModal(false)}
        title="Acciones críticas"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed font-medium">
              Estas acciones son destructivas y no pueden revertirse. Procedé
              con precaución.
            </p>
          </div>

          <div className="border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Vaciar catálogo completo
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Elimina permanentemente todos los productos asociados a tu
                tienda.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleDeleteAllProducts}
              disabled={deleting}
              className="w-full justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-red-600/20"
            >
              {deleting ? (
                <Spinner size="sm" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>Eliminar todos los productos</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
