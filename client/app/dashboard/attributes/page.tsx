// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Input, Select, Modal, Spinner } from "@/components/ui";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { useAlert } from "@/context/AlertContext";
import api from "@/services/admin-api";
import {
  UNIT_LABEL,
  UNIT_OPTIONS,
  ATTRIBUTE_MESSAGES,
} from "@/constants/attributes";

export default function Attributes() {
  const Alert = useAlert();
  const { setIsDirty, confirmLeave } = useUnsavedChanges();
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", unit_type: "", values: [] });

  const load = () => {
    setLoading(true);
    api
      .get("/admin/attributes")
      .then(({ data }) => setAttributes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditingId("new");
    setForm({ name: "", unit_type: "", values: [] });
    setIsDirty(false);
  };

  const openEdit = (attr) => {
    setEditingId(attr.id);
    setIsDirty(false);
    setForm({
      name: attr.name || "",
      unit_type: attr.unitType || "",
      values: (attr.values || []).map((v) => ({
        id: v.id,
        value: v.value,
        sort_order: v.sortOrder || 0,
      })),
    });
  };

  const closeForm = async () => {
    if (await confirmLeave()) {
      setEditingId(null);
      setIsDirty(false);
    }
  };

  const handleValueChange = (index, value) => {
    const next = [...form.values];
    next[index] = { ...next[index], value };
    setForm({ ...form, values: next });
    setIsDirty(true);
  };

  const addValue = () => {
    setForm({
      ...form,
      values: [...form.values, { value: "", sort_order: form.values.length }],
    });
    setIsDirty(true);
  };

  const removeValue = (index) => {
    setForm({ ...form, values: form.values.filter((_, i) => i !== index) });
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.fire({
        message: ATTRIBUTE_MESSAGES.NAME_REQUIRED,
        type: "warning",
      });
      return;
    }

    // Filtrar valores vacíos no intencionales
    const validValues = form.values
      .filter((v) => String(v.value).trim() !== "")
      .map((v, idx) => ({
        ...(v.id && { id: v.id }),
        value: String(v.value).trim(),
        sort_order: idx,
      }));

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        unit_type: form.unit_type || null,
        sort_order: 0,
        values: validValues,
      };

      if (editingId === "new") {
        await api.post("/admin/attributes", payload);
      } else {
        await api.put(`/admin/attributes/${editingId}`, payload);
      }

      Alert.fire({
        message:
          editingId === "new"
            ? ATTRIBUTE_MESSAGES.SAVE_SUCCESS_NEW
            : ATTRIBUTE_MESSAGES.SAVE_SUCCESS_EDIT,
        type: "success",
      });
      setIsDirty(false);
      setEditingId(null);
      load();
    } catch {
      Alert.fire({ message: ATTRIBUTE_MESSAGES.SAVE_ERROR, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (attr) => {
    const result = await Alert.fire({
      title: ATTRIBUTE_MESSAGES.DELETE_CONFIRM_TITLE,
      message: `¿Eliminar "${attr.name}" y todos sus valores asociados?`,
      type: "warning",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/admin/attributes/${attr.id}`);
      Alert.fire({
        message: ATTRIBUTE_MESSAGES.DELETE_SUCCESS,
        type: "success",
      });
      load();
    } catch {
      Alert.fire({ message: ATTRIBUTE_MESSAGES.DELETE_ERROR, type: "error" });
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
            Atributos
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Gestioná tamaños, colores, cantidades y otras variantes de productos
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" /> Nuevo atributo
        </Button>
      </div>

      {/* Lista de atributos */}
      <div className="space-y-3">
        {attributes.map((attr) => (
          <div
            key={attr.id}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 transition-colors shadow-xs"
          >
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-base text-[var(--color-text-primary)]">
                    {attr.name}
                  </h3>
                  {attr.unitType && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary)]/20">
                      por {UNIT_LABEL[attr.unitType] || attr.unitType}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(attr.values || []).map((v) => (
                    <span
                      key={v.id}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                    >
                      {v.value}
                      {attr.unitType
                        ? ` ${UNIT_LABEL[attr.unitType] || attr.unitType}`
                        : ""}
                    </span>
                  ))}
                  {(!attr.values || attr.values.length === 0) && (
                    <span className="text-xs text-[var(--color-text-muted)] italic">
                      Sin valores asignados
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEdit(attr)}
                >
                  Editar
                </Button>
                <button
                  type="button"
                  onClick={() => handleDelete(attr)}
                  className="p-2 text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar atributo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {attributes.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)]/30">
            <p className="font-medium text-[var(--color-text-primary)]">
              No hay atributos creados
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
              Creá atributos como "Color" o "Tamaño" para usar en productos y
              servicios.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Creación / Edición */}
      <Modal
        open={Boolean(editingId)}
        onClose={closeForm}
        title={editingId === "new" ? "Nuevo atributo" : "Editar atributo"}
      >
        <div className="space-y-4">
          <Input
            label="Nombre del atributo"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              setIsDirty(true);
            }}
            placeholder="Color, Tamaño, Cantidad..."
            required
            autoFocus
          />

          <div>
            <Select
              label="Tipo de unidad (opcional)"
              value={form.unit_type}
              options={UNIT_OPTIONS}
              onChange={(e) => {
                setForm({ ...form, unit_type: e.target.value });
                setIsDirty(true);
              }}
            />
            {form.unit_type && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                Los valores deben ser números (ej: 100, 250, 500). Se usarán
                para calcular el precio proporcionalmente.
              </p>
            )}
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
                  {form.unit_type
                    ? "Sin valores definidos. Ej: 100, 250, 500..."
                    : "Sin valores definidos. Ej: Rojo, Azul, Verde..."}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {form.values.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--color-text-muted)] w-5 text-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="relative flex-1">
                      <input
                        type={form.unit_type ? "number" : "text"}
                        inputMode={form.unit_type ? "numeric" : "text"}
                        min={form.unit_type ? "1" : undefined}
                        value={v.value}
                        onChange={(e) => handleValueChange(i, e.target.value)}
                        placeholder={form.unit_type ? "Ej: 250" : "Valor"}
                        className="w-full px-3 py-1.5 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                      />
                    </div>
                    {form.unit_type && (
                      <span className="text-xs font-medium text-[var(--color-text-muted)] shrink-0 min-w-[28px]">
                        {UNIT_LABEL[form.unit_type] || form.unit_type}
                      </span>
                    )}
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
            <Button variant="secondary" onClick={closeForm}>
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
