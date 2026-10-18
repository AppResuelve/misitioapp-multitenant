// @ts-nocheck
"use client";
import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { uploadImage } from "@/services/admin-api";
import { compressImages } from "@/utils/compressImage";
import { Spinner } from "@/components/ui/Spinner";
import { useAlert } from "@/context/AlertContext";

export default function ImageUpload({
  images = [],
  onChange,
  max = 4,
  cols = 4,
  label,
  folder = "productos",
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const Alert = useAlert();
  const colClasses = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (images.length + files.length > max) {
      Alert.fire({ message: `Máximo ${max} imágenes`, type: "warning" });
      return;
    }

    const allowedMimes = /^image\/(jpeg|jpg|png|webp|gif)$/;
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        Alert.fire({
          message: `"${file.name}" supera los 10MB`,
          type: "warning",
        });
        return;
      }
      if (!allowedMimes.test(file.type)) {
        Alert.fire({
          message: `"${file.name}" no es una imagen válida (jpg, png, webp, gif)`,
          type: "warning",
        });
        return;
      }
    }

    setUploading(true);
    try {
      const processedFiles = await compressImages(files);
      const results = await Promise.allSettled(
        processedFiles.map((file) => uploadImage(file, folder)),
      );

      const newImages = [...images];
      const errors = [];
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          newImages.push(result.value.url);
        } else {
          errors.push(files[i].name);
        }
      });

      onChange(newImages);

      if (errors.length) {
        Alert.fire({
          message: `Error al subir: ${errors.join(", ")}`,
          type: errors.length === files.length ? "error" : "warning",
        });
      }
    } catch (err) {
      let msg = "Error al subir imagen";
      try {
        const body =
          typeof err.response?.data === "string"
            ? JSON.parse(err.response.data)
            : err.response?.data;
        msg = body?.error || body?.message || msg;
      } catch {}
      Alert.fire({ message: msg, type: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div>
      <div
        className={`grid gap-2 lg:gap-3 ${colClasses[cols] || "grid-cols-4"}`}
      >
        {images.map((url, i) => (
          <div
            key={i}
            className="relative group aspect-square rounded-lg overflow-hidden bg-[var(--color-bg-base)] border border-[var(--color-border)] shadow-xs"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute top-1.5 right-1.5 p-1 rounded-md bg-red-600/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
              title="Eliminar imagen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-primary)] text-white shadow-sm">
                Principal
              </span>
            )}
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] flex flex-col items-center justify-center gap-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-bg-elevated)]/50 transition-colors bg-[var(--color-bg-surface)]/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="text-xs font-medium">Subir</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />
      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mt-2">
        {label || `Imágenes (${images.length}/${max})`}
      </label>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">
        jpg, png, webp, gif — Máx. 10MB
      </p>
    </div>
  );
}
