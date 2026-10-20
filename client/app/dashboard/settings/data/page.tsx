// @ts-nocheck
"use client";

import { useState } from "react";
import { useAlert } from "@/context/AlertContext";
import { useAuth } from "@/context/AuthContext";
import { Download } from "lucide-react";
import { Card, Button, Spinner } from "@/components/ui";
import { downloadTemplate } from "@/utils/excel";
import { triggerBlobDownload } from "@/utils/downloadBlob";
import { DATA_SETTINGS_MESSAGES } from "@/constants/dataSettings";
import api from "@/services/admin-api";

export default function DataSettings() {
  const Alert = useAlert();
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const businessName = user?.businessName || "db";

  const handleDownloadProducts = async () => {
    setExporting(true);
    try {
      const response = await api.get("/admin/products/export", {
        responseType: "blob",
      });

      // Aseguramos el MIME type correcto para Excel OpenXML
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      triggerBlobDownload(blob, `productos de ${businessName}`);

      Alert.fire({
        message: DATA_SETTINGS_MESSAGES.EXPORT_SUCCESS,
        type: "success",
        duration: 1500,
      });
    } catch (err: any) {
      // Si el backend tiró error con payload blob, podemos leer el texto si hiciera falta
      Alert.fire({
        message: DATA_SETTINGS_MESSAGES.EXPORT_ERROR,
        type: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Datos
      </h1>

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
            disabled={exporting}
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
            disabled={exporting}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar plantilla vacía</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
