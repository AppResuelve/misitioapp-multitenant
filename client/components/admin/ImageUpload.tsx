// @ts-nocheck
"use client";
import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { uploadImage } from "@/services/admin-api";
import { compressImages } from "@/utils/compressImage";
import { Spinner } from "./ui/Spinner";
import { useAlert } from "./ui/AlertContext";

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
        Alert.fire({ message: `"${file.name}" supera los 10MB`, type: "warning" });
        return;
      }
      if (!allowedMimes.test(file.type)) {
        Alert.fire({ message: `"${file.name}" no es una imagen válida (jpg, png, webp, gif)`, type: "warning" });
        return;
      }
    }

    setUploading(true);
    try {
      const processedFiles = await compressImages(files);
      const results = await Promise.allSettled(
        processedFiles.map((file) => uploadImage(file, folder))
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
      <label className="block text-sm font-medium text-zinc-400 mb-2">
        {label || `Imágenes (${images.length}/${max})`}
      </label>
      <p className="text-xs text-zinc-500 -mt-1 mb-3">
        jpg, png, webp, gif — Máx. 10MB
      </p>

      <div
        className={`grid gap-2 lg:gap-3  ${colClasses[cols] || "grid-cols-4"}`}
      >
        {images.map((url, i) => (
          <div
            key={i}
            className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute top-1 right-1 p-1 rounded-md bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-500 text-white">
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
            className="aspect-square rounded-lg border-2 border-dashed border-zinc-700 hover:border-cyan-500 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-cyan-400 transition-colors bg-zinc-800/50"
          >
            {uploading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="text-xs">Subir</span>
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
    </div>
  );
}
