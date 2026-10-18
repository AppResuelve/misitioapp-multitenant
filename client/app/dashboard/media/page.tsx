// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAlert } from "@/context/AlertContext";
import { uploadImage } from "@/services/admin-api";
import { compressImages } from "@/utils/compressImage";
import { Upload, Trash2, Copy, Check, RotateCcw } from "lucide-react";
import {
  Button,
  DropdownSelect,
  Card,
  Spinner,
  Pagination,
} from "@/components/ui";
import api from "@/services/admin-api";
import {
  MEDIA_TABS,
  UPLOAD_FOLDERS,
  MEDIA_PAGE_SIZE,
  MEDIA_MESSAGES,
} from "@/constants/media";

const folderLabel = (folder: string) => {
  const t = MEDIA_TABS.find((tab) => tab.key === folder);
  return t ? t.label : folder;
};

export default function Media() {
  const [media, setMedia] = useState([]);
  const [trashMedia, setTrashMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [tab, setTab] = useState("todos");
  const [page, setPage] = useState(1);
  const [uploadFolder, setUploadFolder] = useState("galeria");
  const [emptying, setEmptying] = useState(false);

  const fileInputRef = useRef(null);
  const Alert = useAlert();

  const isTrash = tab === "papelera";

  const fetchMedia = async () => {
    try {
      const { data } = await api.get("/admin/upload");
      setMedia(data || []);
    } catch {
      Alert.fire({ message: "Error al cargar galería", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/upload", {
        params: { trash: true },
      });
      setTrashMedia(data || []);
    } catch {
      Alert.fire({ message: "Error al cargar papelera", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isTrash) {
      fetchTrash();
    } else {
      fetchMedia();
    }
  }, [isTrash]);

  const filtered = useMemo(() => {
    if (isTrash) return trashMedia;
    if (tab === "todos") return media;
    return media.filter((m) => m.folder === tab);
  }, [media, trashMedia, tab, isTrash]);

  const totalPages = Math.ceil(filtered.length / MEDIA_PAGE_SIZE);
  const paged = filtered.slice(
    (page - 1) * MEDIA_PAGE_SIZE,
    page * MEDIA_PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [tab]);

  const handleUpload = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;

    setUploading(true);
    try {
      const files = await compressImages(rawFiles);
      const results = await Promise.allSettled(
        files.map((file) => uploadImage(file, uploadFolder)),
      );

      const rejected = results.filter((r) => r.status === "rejected");
      if (rejected.length > 0) {
        Alert.fire({
          message: `${rejected.length} imagen(es) no pudieron subirse`,
          type: "warning",
        });
      } else {
        Alert.fire({ message: MEDIA_MESSAGES.UPLOAD_SUCCESS, type: "success" });
      }

      await fetchMedia();
    } catch {
      Alert.fire({ message: MEDIA_MESSAGES.UPLOAD_ERROR, type: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (item) => {
    if (isTrash) {
      const result = await Alert.fire({
        title: MEDIA_MESSAGES.FORCE_DELETE_TITLE,
        message: MEDIA_MESSAGES.FORCE_DELETE_WARNING,
        type: "warning",
        variant: "modal",
        showCancelButton: true,
        confirmButtonText: "Eliminar para siempre",
        cancelButtonText: "Cancelar",
      });
      if (!result.isConfirmed) return;

      try {
        await api.delete(`/admin/upload/${item.id}/force`);
        fetchTrash();
      } catch {
        Alert.fire({ message: "Error al eliminar imagen", type: "error" });
      }
      return;
    }

    try {
      const { data: usage } = await api.get(`/admin/upload/${item.id}/usage`);

      if (usage.count > 0) {
        const names = usage.products.map((p) => `• ${p.name}`).join("\n");
        const result = await Alert.fire({
          title: "Imagen en uso",
          message: `Esta imagen está siendo usada por ${usage.count} producto(s):\n\n${names}\n\nSi la eliminás, pasará a la papelera. Para borrarla definitivamente, vaciá la papelera.`,
          type: "warning",
          variant: "modal",
          showCancelButton: true,
          confirmButtonText: "Mover a papelera",
          cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) return;
      } else {
        const result = await Alert.fire({
          title: MEDIA_MESSAGES.DELETE_CONFIRM_TITLE,
          message: MEDIA_MESSAGES.DELETE_CONFIRM_TRASH,
          type: "warning",
          variant: "modal",
          showCancelButton: true,
          confirmButtonText: "Mover a papelera",
          cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) return;
      }

      await api.delete(`/admin/upload/${item.id}`);
      fetchMedia();
    } catch {
      Alert.fire({ message: "Error al eliminar imagen", type: "error" });
    }
  };

  const handleRestore = async (item) => {
    try {
      await api.post(`/admin/upload/${item.id}/restore`);
      fetchTrash();
      Alert.fire({ message: MEDIA_MESSAGES.RESTORE_SUCCESS, type: "success" });
    } catch {
      Alert.fire({ message: MEDIA_MESSAGES.RESTORE_ERROR, type: "error" });
    }
  };

  const handleEmptyTrash = async () => {
    const result = await Alert.fire({
      title: MEDIA_MESSAGES.EMPTY_TRASH_TITLE,
      message: MEDIA_MESSAGES.EMPTY_TRASH_WARNING(trashMedia.length),
      type: "warning",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: "Vaciar papelera",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    setEmptying(true);
    try {
      const { data } = await api.post("/admin/upload/trash/empty");
      setTrashMedia([]);
      Alert.fire({
        message: MEDIA_MESSAGES.EMPTY_TRASH_SUCCESS(data.deleted),
        type: "success",
      });
    } catch {
      Alert.fire({ message: "Error al vaciar papelera", type: "error" });
    } finally {
      setEmptying(false);
    }
  };

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Galería
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {isTrash
              ? `${trashMedia.length} en papelera`
              : `${filtered.length} imágenes registradas`}
          </p>
        </div>

        {isTrash ? (
          <Button
            variant="danger"
            onClick={handleEmptyTrash}
            disabled={emptying || trashMedia.length === 0}
          >
            <Trash2 className="w-4 h-4" />
            {emptying ? "Vaciando..." : "Vaciar papelera"}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <DropdownSelect
              options={UPLOAD_FOLDERS.map((f) => ({
                value: f,
                label: folderLabel(f),
              }))}
              value={uploadFolder}
              onChange={(v) => setUploadFolder(v as string)}
              className="w-44"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Subiendo..." : "Subir"}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[...MEDIA_TABS, { key: "papelera", label: "Papelera" }].map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? t.key === "papelera"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    : "bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary)]/20"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] border border-transparent"
              }`}
            >
              {t.label}
              {t.key === "papelera" && trashMedia.length > 0 && (
                <span className="ml-1 opacity-75">({trashMedia.length})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="relative min-h-[220px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-bg-base)]/60 backdrop-blur-xs">
            <Spinner size="lg" />
          </div>
        )}

        {filtered.length === 0 && !loading ? (
          <Card>
            <div className="text-center py-16">
              {isTrash ? (
                <>
                  <Trash2 className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3 opacity-60" />
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    Papelera vacía
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Las imágenes que elimines aparecerán acá antes de su borrado
                    definitivo.
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3 opacity-60" />
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    No hay imágenes
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {tab === "todos"
                      ? "Subí imágenes para empezar a enriquecer tu catálogo."
                      : `La carpeta "${folderLabel(tab)}" está vacía.`}
                  </p>
                </>
              )}
            </div>
          </Card>
        ) : (
          <>
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-[var(--color-border)]">
                {paged.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3.5 px-4 py-3 hover:bg-[var(--color-bg-elevated)]/40 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-bg-base)] border border-[var(--color-border)] shrink-0 flex items-center justify-center">
                      <img
                        src={item.url}
                        alt={item.publicId}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {!isTrash && (
                      <span className="text-xs font-medium text-[var(--color-text-muted)] px-2 py-0.5 rounded-md bg-[var(--color-bg-elevated)] shrink-0">
                        {folderLabel(item.folder)}
                      </span>
                    )}

                    <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate font-mono">
                      {item.publicId}
                    </span>

                    {isTrash && (
                      <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                        {item.deletedAt
                          ? new Date(item.deletedAt).toLocaleDateString()
                          : ""}
                      </span>
                    )}

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {isTrash ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRestore(item)}
                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            title="Restaurar"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Eliminar definitivamente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.url, item.id)}
                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-bg-elevated)] transition-colors cursor-pointer"
                            title="Copiar URL"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Mover a papelera"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pagination Component */}
            {totalPages > 1 && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-muted)]">
                <span>
                  Mostrando {(page - 1) * MEDIA_PAGE_SIZE + 1}–
                  {Math.min(page * MEDIA_PAGE_SIZE, filtered.length)} de{" "}
                  {filtered.length} imágenes
                </span>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
