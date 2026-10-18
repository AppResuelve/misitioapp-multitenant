// @ts-nocheck
"use client";

import { useState } from "react";
import { useAlert } from "@/context/AlertContext";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { useTags } from "@/hooks/admin-useTags";
import { Plus, Trash2, Tag } from "lucide-react";
import { Button, Input, Modal, Spinner } from "@/components/ui";
import api from "@/services/admin-api";
import {
  DEFAULT_TAG_COLOR,
  PRESET_TAG_COLORS,
  TAG_MESSAGES,
} from "@/constants/tags";

export default function TagsPage() {
  const { tags, loading, refetch } = useTags();
  const Alert = useAlert();
  const { confirmLeave } = useUnsavedChanges();

  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    color: DEFAULT_TAG_COLOR,
    values: [],
  });
  const [originalForm, setOriginalForm] = useState(null);

  const openNew = () => {
    setEditingId("new");
    setForm({ name: "", color: DEFAULT_TAG_COLOR, values: [] });
    setOriginalForm(null);
  };

  const openEdit = (tag) => {
    const snapshot = {
      name: tag.name,
      color: tag.color || DEFAULT_TAG_COLOR,
      values: (tag.values || []).map((v) => ({
        id: v.id,
        value: v.value,
        sortOrder: v.sortOrder || 0,
      })),
    };
    setEditingId(tag.id);
    setForm(snapshot);
    setOriginalForm(snapshot);
  };

  const closeForm = async () => {
    if (await confirmLeave()) {
      setEditingId(null);
      setOriginalForm(null);
    }
  };

  const addValue = () => {
    setForm({
      ...form,
      values: [...form.values, { value: "", sortOrder: form.values.length }],
    });
  };

  const removeValue = (i) => {
    setForm({ ...form, values: form.values.filter((_, idx) => idx !== i) });
  };

  const handleValueChange = (i, value) => {
    const vals = [...form.values];
    vals[i] = { ...vals[i], value };
    setForm({ ...form, values: vals });
  };

  const buildConflictMessage = (body) => {
    const lines = [body.message];
    if (body.sampleProducts?.length > 0) {
      lines.push("");
      lines.push("Productos afectados:");
      body.sampleProducts.forEach((p) => lines.push(`  • ${p.name}`));
      const remaining = body.affectedCount - body.sampleProducts.length;
      if (remaining > 0) {
        lines.push(`  ...y ${remaining} más`);
      }
    }
    lines.push("");
    lines.push("Si continuás, se desasociará de esos productos.");
    return lines.join("\n");
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.fire({ message: TAG_MESSAGES.NAME_REQUIRED, type: "warning" });
      return;
    }

    const validValues = form.values
      .filter((v) => String(v.value).trim() !== "")
      .map((v, idx) => ({
        ...(v.id && { id: v.id }),
        value: String(v.value).trim(),
        sortOrder: idx,
      }));

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        color: form.color,
        values: validValues,
      };

      if (editingId === "new") {
        await api.post("/admin/tags", payload);
      } else {
        try {
          await api.put(`/admin/tags/${editingId}`, payload);
        } catch (err) {
          const body = err.response?.data;
          if (body?.requiresConfirmation) {
            const result = await Alert.fire({
              title: "¿Guardar cambios?",
              message: buildConflictMessage(body),
              type: "warning",
              variant: "modal",
              showCancelButton: true,
              confirmButtonText: "Guardar",
              cancelButtonText: "Cancelar",
            });
            if (result.isConfirmed) {
              await api.put(`/admin/tags/${editingId}?force=true`, payload);
            } else {
              if (originalForm) setForm(originalForm);
              setSaving(false);
              return;
            }
          } else {
            throw err;
          }
        }
      }

      Alert.fire({
        message:
          editingId === "new"
            ? TAG_MESSAGES.SAVE_SUCCESS_NEW
            : TAG_MESSAGES.SAVE_SUCCESS_EDIT,
        type: "success",
        duration: 1500,
      });
      setEditingId(null);
      setOriginalForm(null);
      refetch();
    } catch {
      Alert.fire({ message: TAG_MESSAGES.SAVE_ERROR, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tag) => {
    try {
      await api.delete(`/admin/tags/${tag.id}`);
      Alert.fire({ message: TAG_MESSAGES.DELETE_SUCCESS, type: "success" });
      refetch();
    } catch (err) {
      const body = err.response?.data;
      if (body?.requiresConfirmation) {
        const result = await Alert.fire({
          title: TAG_MESSAGES.DELETE_CONFIRM_TITLE,
          message: buildConflictMessage(body),
          type: "warning",
          variant: "modal",
          showCancelButton: true,
          confirmButtonText: "Eliminar",
          cancelButtonText: "Cancelar",
        });
        if (result.isConfirmed) {
          try {
            await api.delete(`/admin/tags/${tag.id}?force=true`);
            Alert.fire({
              message: TAG_MESSAGES.DELETE_SUCCESS,
              type: "success",
            });
            refetch();
          } catch {
            Alert.fire({ message: TAG_MESSAGES.DELETE_ERROR, type: "error" });
          }
        }
      } else {
        Alert.fire({ message: TAG_MESSAGES.DELETE_ERROR, type: "error" });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Etiquetas
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Gestioná etiquetas para filtrar productos en la tienda
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" /> Nueva etiqueta
        </Button>
      </div>

      {/* Lista de Etiquetas */}
      <div className="space-y-3">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 transition-colors shadow-xs"
          >
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-3.5 h-3.5 rounded-full mt-1 sm:mt-0 shrink-0 ring-2 ring-offset-2 ring-transparent"
                  style={{ backgroundColor: tag.color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-[var(--color-text-primary)]">
                    {tag.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(tag.values || []).map((v) => (
                      <span
                        key={v.id}
                        className="text-xs font-medium px-2.5 py-0.5 rounded-full border transition-colors"
                        style={{
                          backgroundColor: `${tag.color}15`,
                          color: tag.color,
                          borderColor: `${tag.color}35`,
                        }}
                      >
                        {v.value}
                      </span>
                    ))}
                    {(!tag.values || tag.values.length === 0) && (
                      <span className="text-xs text-[var(--color-text-muted)] italic">
                        Sin valores asignados
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEdit(tag)}
                >
                  Editar
                </Button>
                <button
                  type="button"
                  onClick={() => handleDelete(tag)}
                  className="p-2 text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Eliminar etiqueta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {tags.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)]/30">
            <Tag className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3 opacity-60" />
            <p className="font-medium text-[var(--color-text-primary)]">
              No hay etiquetas creadas
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
              Creá etiquetas como "Ocasión" o "Línea" para agrupar y filtrar
              productos.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Creación / Edición */}
      <Modal
        open={Boolean(editingId)}
        onClose={closeForm}
        title={editingId === "new" ? "Nueva etiqueta" : "Editar etiqueta"}
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
            }}
            placeholder="Ocasión, Tamaño, Colección..."
            required
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Color identificador
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => {
                  setForm({ ...form, color: e.target.value });
                }}
                className="w-10 h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] cursor-pointer p-0.5"
              />
              <div className="flex items-center gap-1.5">
                {PRESET_TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, color: c });
                    }}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                      form.color === c
                        ? "scale-115 ring-2 ring-[var(--color-primary)] ring-offset-2"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <span className="text-xs text-[var(--color-text-muted)] font-mono ml-auto">
                {form.color}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                Valores
              </span>
              <button
                type="button"
                onClick={addValue}
                className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-text)] hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar valor
              </button>
            </div>

            {form.values.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)]/50 text-center">
                <p className="text-xs text-[var(--color-text-muted)] italic">
                  Ej: Cumpleaños, Aniversario, San Valentín...
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {form.values.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--color-text-muted)] w-5 text-center shrink-0">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={v.value}
                      onChange={(e) => handleValueChange(i, e.target.value)}
                      placeholder="Valor de la etiqueta"
                      className="flex-1 px-3 py-1.5 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => removeValue(i)}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                      title="Eliminar valor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={closeForm} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
