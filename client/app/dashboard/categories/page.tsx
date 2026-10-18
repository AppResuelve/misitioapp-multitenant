// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2, GripVertical, Folder } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useCategories } from "@/hooks/admin-useCategories";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { Button, Input, Modal, Spinner } from "@/components/ui";
import api from "@/services/admin-api";
import { slugify } from "@/utils/slugify";
import { CATEGORY_MESSAGES } from "@/constants/categories";
import ImageUpload from "@/components/admin/ImageUpload";

export default function Categories() {
  const { categories, loading, refetch } = useCategories();
  const { setIsDirty, confirmLeave } = useUnsavedChanges();
  const Alert = useAlert();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState(null);
  const [slugManual, setSlugManual] = useState(false);
  const [ordered, setOrdered] = useState([]);
  const [toggling, setToggling] = useState(null);
  const [saving, setSaving] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  useEffect(() => {
    setOrdered(categories || []);
  }, [categories]);

  const handleDragStart = (index) => {
    dragItem.current = index;
    setDraggedIdx(index);
  };

  const handleDragEnter = (index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = async () => {
    const from = dragItem.current;
    const to = dragOverItem.current;
    setDraggedIdx(null);

    if (from === null || to === null || from === to) return;

    const reordered = [...ordered];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setOrdered(reordered);

    dragItem.current = null;
    dragOverItem.current = null;

    try {
      await api.put("/admin/categories/reorder", {
        orderedIds: reordered.map((c) => c.id),
      });
    } catch {
      Alert.fire({ message: CATEGORY_MESSAGES.REORDER_ERROR, type: "error" });
      refetch();
    }
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setSlug("");
    setImage(null);
    setSlugManual(false);
    setIsDirty(false);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setName(cat.name || "");
    setSlug(cat.slug || "");
    setImage(cat.image || null);
    setSlugManual(true);
    setIsDirty(false);
    setModalOpen(true);
  };

  const closeModal = async () => {
    if (await confirmLeave()) {
      setModalOpen(false);
      setEditing(null);
      setImage(null);
      setIsDirty(false);
    }
  };

  const handleNameChange = (value) => {
    setName(value);
    setIsDirty(true);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value) => {
    setSlug(value);
    setSlugManual(true);
    setIsDirty(true);
  };

  const handleImageChange = (imgs) => {
    setImage(imgs[0] || null);
    setIsDirty(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      Alert.fire({ message: CATEGORY_MESSAGES.NAME_REQUIRED, type: "warning" });
      return;
    }

    const finalSlug = slug.trim() || slugify(name);
    setSaving(true);

    try {
      if (editing) {
        await api.put(`/admin/categories/${editing.id}`, {
          name: name.trim(),
          slug: finalSlug,
          image: image || null,
        });
      } else {
        await api.post("/admin/categories", {
          name: name.trim(),
          slug: finalSlug,
          image: image || null,
          order: categories.length,
        });
      }

      setModalOpen(false);
      setIsDirty(false);
      Alert.fire({
        message: editing
          ? CATEGORY_MESSAGES.UPDATE_SUCCESS
          : CATEGORY_MESSAGES.CREATE_SUCCESS,
        type: "success",
        duration: 1500,
      });
      refetch();
    } catch (err) {
      let msg = CATEGORY_MESSAGES.SAVE_ERROR;
      try {
        const body =
          typeof err.response?.data === "string"
            ? JSON.parse(err.response.data)
            : err.response?.data;
        msg = body?.error || body?.message || msg;
      } catch {}
      Alert.fire({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    const result = await Alert.fire({
      title: CATEGORY_MESSAGES.DELETE_CONFIRM_TITLE,
      message: CATEGORY_MESSAGES.DELETE_CONFIRM_TEXT(cat.name),
      type: "warning",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/admin/categories/${cat.id}`);
      Alert.fire({
        message: CATEGORY_MESSAGES.DELETE_SUCCESS,
        type: "success",
      });
      refetch();
    } catch {
      Alert.fire({ message: CATEGORY_MESSAGES.DELETE_ERROR, type: "error" });
    }
  };

  const handleToggleStatus = async (cat) => {
    const newStatus = cat.status === "active" ? "draft" : "active";
    setToggling(cat.id);
    try {
      await api.patch(`/admin/categories/${cat.id}/status`, {
        status: newStatus,
      });
      setOrdered((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, status: newStatus } : c)),
      );
    } catch {
      Alert.fire({ message: CATEGORY_MESSAGES.STATUS_ERROR, type: "error" });
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Categorías
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {ordered.length} categorías registradas
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Lista */}
      <div className="relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-bg-base)]/60 backdrop-blur-xs">
            <Spinner size="lg" />
          </div>
        )}

        <div className="space-y-2.5">
          {ordered.length === 0 && !loading ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)]/30">
              <p className="font-medium text-[var(--color-text-primary)]">
                No hay categorías creadas
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Comenzá creando categorías para organizar tu catálogo.
              </p>
            </div>
          ) : (
            ordered.map((cat, i) => (
              <div
                key={cat.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragEnter={() => handleDragEnter(i)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`flex items-center gap-3.5 px-4 py-3 bg-[var(--color-bg-card)] border rounded-xl group transition-all shadow-xs ${
                  draggedIdx === i
                    ? "opacity-40 border-[var(--color-primary)] scale-[0.99]"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-hover)]"
                }`}
              >
                {/* Grip Reordenar */}
                <div
                  className="cursor-grab active:cursor-grabbing p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
                  title="Arrastrar para reordenar"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Miniatura / Thumbnail */}
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shrink-0 flex items-center justify-center relative">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Folder className="w-5 h-5 text-[var(--color-text-muted)]/70" />
                  )}
                </div>

                {/* Nombre y Slug */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {cat.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    /{cat.slug}
                  </p>
                </div>

                {/* Conteo de Productos */}
                <span className="text-xs font-medium text-[var(--color-text-muted)] shrink-0 px-2.5 py-1 rounded-md bg-[var(--color-bg-elevated)]">
                  {cat.products?.length || 0} productos
                </span>

                {/* Badge Estado */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(cat)}
                  disabled={toggling === cat.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50 w-[96px] justify-center shrink-0 ${
                    cat.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                  }`}
                >
                  {toggling === cat.id ? (
                    <Spinner size="sm" />
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        cat.status === "active"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                  )}
                  {cat.status === "active" ? "Activo" : "Borrador"}
                </button>

                {/* Acciones */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-bg-elevated)] transition-colors cursor-pointer"
                    title="Editar categoría"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Eliminar categoría"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Editar categoría" : "Nueva categoría"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Tortas, Galletitas, Macarons..."
            required
            autoFocus
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="tortas-artesanales"
            required
          />

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Imagen de portada (opcional)
            </label>
            <ImageUpload
              images={image ? [image] : []}
              onChange={handleImageChange}
              max={1}
              cols={2}
              folder="categorias"
            />
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
              Recomendada para destacar la categoría en el inicio o en la
              cabecera del catálogo.
            </p>
          </div>

          <div className="flex gap-3 pt-3 justify-end border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear categoría"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
