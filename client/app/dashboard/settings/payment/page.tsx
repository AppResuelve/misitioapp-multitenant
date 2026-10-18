// @ts-nocheck
"use client";

import { useState } from "react";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Check,
  X,
} from "lucide-react";
import { usePaymentMethods } from "@/hooks/admin-usePaymentMethods";
import { useAlert } from "@/context/AlertContext";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import {
  Modal,
  Spinner,
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
} from "@/components/ui";
import { PAYMENT_CHANNEL_PRESETS } from "@/data/admindata";
import {
  PAYMENT_TYPES,
  PAYMENT_TYPE_ICONS,
  PAYMENT_MESSAGES,
} from "@/constants/paymentMethods";

export default function PaymentMethodsPage() {
  const Alert = useAlert();
  const { setIsDirty, confirmLeave } = useUnsavedChanges();
  const {
    paymentMethods: methods,
    loading,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    togglePaymentMethodActive,
    reorderPaymentMethods,
  } = usePaymentMethods();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    type: "credit",
    title: PAYMENT_CHANNEL_PRESETS.credit.title,
    badge: "",
    description: "",
    isActive: true,
    brands: [],
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      type: "credit",
      title: PAYMENT_CHANNEL_PRESETS.credit.title,
      badge: "",
      description: "",
      isActive: true,
      brands: [],
    });
    setIsDirty(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    const channelType = item.type || "credit";
    const defaultTitle =
      PAYMENT_CHANNEL_PRESETS[channelType]?.title || item.title;

    setFormData({
      type: channelType,
      title: defaultTitle,
      badge: item.badge || "",
      description: item.description || "",
      isActive: item.isActive ?? true,
      brands: item.brands || [],
    });
    setIsDirty(false);
    setModalOpen(true);
  };

  const handleCloseModal = async () => {
    if (await confirmLeave()) {
      setModalOpen(false);
      setEditingItem(null);
      setIsDirty(false);
    }
  };

  const handleTypeChange = (newType: string) => {
    const preset = PAYMENT_CHANNEL_PRESETS[newType];
    setFormData((prev) => ({
      ...prev,
      type: newType,
      title: preset ? preset.title : prev.title,
      brands: [], // Resetea las marcas al cambiar de canal para mantener consistencia
    }));
    setIsDirty(true);
  };

  const handleToggleBrand = (presetBrand) => {
    setFormData((prev) => {
      const exists = prev.brands.some(
        (b) =>
          b.id === presetBrand.id ||
          b.name.toLowerCase() === presetBrand.name.toLowerCase(),
      );

      const nextBrands = exists
        ? prev.brands.filter(
            (b) =>
              b.id !== presetBrand.id &&
              b.name.toLowerCase() !== presetBrand.name.toLowerCase(),
          )
        : [
            ...prev.brands,
            {
              id: presetBrand.id,
              name: presetBrand.name,
              imageUrl: presetBrand.imageUrl,
            },
          ];

      return { ...prev, brands: nextBrands };
    });
    setIsDirty(true);
  };

  const handleRemoveBrand = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      brands: prev.brands.filter((_, idx) => idx !== indexToRemove),
    }));
    setIsDirty(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        sortOrder: editingItem ? editingItem.sortOrder : methods.length,
      };

      if (editingItem) {
        await updatePaymentMethod(editingItem.id, payload);
      } else {
        await createPaymentMethod(payload);
      }

      Alert.fire({
        type: "success",
        title: editingItem ? "Actualizado" : "Creado",
        message: editingItem
          ? PAYMENT_MESSAGES.SAVE_SUCCESS_EDIT
          : PAYMENT_MESSAGES.SAVE_SUCCESS_NEW,
        duration: 1500,
      });

      setIsDirty(false);
      setModalOpen(false);
    } catch (err: any) {
      Alert.fire({
        type: "error",
        title: "Error al guardar",
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          PAYMENT_MESSAGES.SAVE_ERROR,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmation = await Alert.fire({
      title: PAYMENT_MESSAGES.DELETE_CONFIRM_TITLE,
      message: PAYMENT_MESSAGES.DELETE_CONFIRM_TEXT,
      type: "warning",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmation.isConfirmed) return;

    try {
      await deletePaymentMethod(id);
      Alert.fire({
        type: "success",
        title: "Eliminado",
        message: PAYMENT_MESSAGES.DELETE_SUCCESS,
      });
    } catch {
      Alert.fire({
        type: "error",
        title: "Error",
        message: PAYMENT_MESSAGES.DELETE_ERROR,
      });
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const newStatus = await togglePaymentMethodActive(item);
      Alert.fire({
        type: "success",
        title: newStatus ? "Visible" : "Oculto",
        message: PAYMENT_MESSAGES.STATUS_UPDATED(newStatus),
      });
    } catch {
      Alert.fire({
        type: "error",
        title: "Error",
        message: "No se pudo actualizar la visibilidad.",
      });
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= methods.length) return;

    const newItems = [...methods];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    try {
      await reorderPaymentMethods(newItems);
    } catch {
      Alert.fire({
        type: "error",
        title: "Error",
        message: PAYMENT_MESSAGES.REORDER_ERROR,
      });
    }
  };

  const currentPreset =
    PAYMENT_CHANNEL_PRESETS[formData.type] || PAYMENT_CHANNEL_PRESETS.credit;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Medios de Pago
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Gestioná los métodos de cobro, cuotas y marcas visibles en la
            tienda.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" />
          <span>Nuevo medio de pago</span>
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : methods.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-12 text-center shadow-xs">
          <CreditCard className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
            No hay medios de pago configurados
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
            Creá tu primer canal para que se muestre en el detalle de tus
            productos.
          </p>
          <Button
            onClick={handleOpenCreate}
            variant="secondary"
            className="mt-4"
          >
            Agregar medio de pago
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((item, index) => {
            const IconComponent = PAYMENT_TYPE_ICONS[item.type] || CreditCard;

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-border-hover)] transition-colors shadow-xs"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary-text)] shrink-0">
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[var(--color-text-primary)] text-sm truncate">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          item.isActive
                            ? "text-[var(--color-primary-text)] bg-[var(--color-primary-light)]"
                            : "text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)]"
                        }`}
                      >
                        {item.isActive ? "Activo" : "Oculto"}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    )}

                    {Array.isArray(item.brands) && item.brands.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {item.brands.map((b) => (
                          <div
                            key={b.id || b.name}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--color-bg-base)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]"
                          >
                            {b.imageUrl && (
                              <img
                                src={b.imageUrl}
                                alt={b.name}
                                className="h-3.5 w-auto object-contain bg-white/10 rounded-xs p-0.5"
                              />
                            )}
                            <span className="font-medium">{b.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones de reordenamiento y estado */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveOrder(index, "up")}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    title="Subir posición"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === methods.length - 1}
                    onClick={() => handleMoveOrder(index, "down")}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    title="Bajar posición"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-[var(--color-border)] mx-1" />

                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      item.isActive
                        ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)]"
                    }`}
                    title={
                      item.isActive ? "Ocultar en tienda" : "Mostrar en tienda"
                    }
                  >
                    {item.isActive ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-bg-elevated)] transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Editar medio de pago" : "Nuevo medio de pago"}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Select
              label="Canal de pago"
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              options={PAYMENT_TYPES}
            />
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
              Título en storefront:{" "}
              <span className="text-[var(--color-text-primary)] font-semibold">
                "{formData.title}"
              </span>
            </p>
          </div>

          <Input
            label="Insignia o Promoción (opcional)"
            type="text"
            placeholder="Ej: 10% OFF, Hasta 3 cuotas sin interés"
            value={formData.badge}
            onChange={(e) => {
              setFormData({ ...formData, badge: e.target.value });
              setIsDirty(true);
            }}
          />

          <Textarea
            label="Descripción o Instrucción (opcional)"
            rows={2}
            placeholder="Ej: Acreditación inmediata. Enviás el comprobante por WhatsApp."
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              setIsDirty(true);
            }}
          />

          {/* Opciones Predeterminadas del Sistema (Solo marcas del preset) */}
          <div className="pt-3 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Marcas y tarjetas disponibles
              </label>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Click para activar / desactivar
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {currentPreset.defaultBrands.map((preset) => {
                const isSelected = formData.brands.some(
                  (b) =>
                    b.id === preset.id ||
                    b.name.toLowerCase() === preset.name.toLowerCase(),
                );

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleToggleBrand(preset)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                      isSelected
                        ? "bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary-text)]"
                        : "bg-[var(--color-bg-base)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]"
                    }`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center shrink-0 bg-white/10 rounded-sm p-0.5">
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="truncate flex-1">{preset.name}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[var(--color-primary-text)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Resumen de marcas seleccionadas */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Marcas visibles ({formData.brands.length})
              </label>
              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border)] min-h-[44px] items-center">
                {formData.brands.map((b, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)]"
                  >
                    <img
                      src={b.imageUrl}
                      alt={b.name}
                      className="h-3.5 w-auto object-contain bg-white/10 rounded-xs p-0.5"
                    />
                    <span>{b.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBrand(idx)}
                      className="p-0.5 text-[var(--color-text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                      title="Quitar"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {formData.brands.length === 0 && (
                  <span className="text-xs text-[var(--color-text-muted)] italic">
                    Ninguna marca seleccionada.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Toggle Activo */}
          <div className="pt-3 border-t border-[var(--color-border)]">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => {
                setFormData({ ...formData, isActive: e.target.checked });
                setIsDirty(true);
              }}
              label="Visible en la tienda pública"
            />
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingItem ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
