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
  Building2,
  Banknote,
  Wallet,
  CheckCircle2,
  XCircle,
  Tag as TagIcon,
  X,
  Check,
} from "lucide-react";
import { usePaymentMethods } from "@/hooks/admin-usePaymentMethods";
import { useAlert } from "@/context/AlertContext";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { PAYMENT_CHANNEL_PRESETS } from "@/data/admindata";

const PAYMENT_TYPES = [
  { value: "credit", label: "Tarjetas de crédito", icon: CreditCard },
  { value: "debit", label: "Tarjetas de débito", icon: CreditCard },
  { value: "transfer", label: "Transferencia bancaria", icon: Building2 },
  { value: "cash", label: "Efectivo", icon: Banknote },
  { value: "wallets", label: "Billeteras virtuales / Apps", icon: Wallet },
];

export default function PaymentMethodsPage() {
  const { fire } = useAlert();
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
    setModalOpen(true);
  };

  const handleTypeChange = (newType) => {
    const preset = PAYMENT_CHANNEL_PRESETS[newType];
    setFormData((prev) => ({
      ...prev,
      type: newType,
      title: preset ? preset.title : prev.title,
      brands: [], // Resetea las marcas al cambiar de canal para no mezclar
    }));
  };

  const handleToggleBrand = (presetBrand) => {
    setFormData((prev) => {
      const exists = prev.brands.some(
        (b) =>
          b.id === presetBrand.id ||
          b.name.toLowerCase() === presetBrand.name.toLowerCase(),
      );

      if (exists) {
        return {
          ...prev,
          brands: prev.brands.filter(
            (b) =>
              b.id !== presetBrand.id &&
              b.name.toLowerCase() !== presetBrand.name.toLowerCase(),
          ),
        };
      } else {
        return {
          ...prev,
          brands: [
            ...prev.brands,
            {
              id: presetBrand.id,
              name: presetBrand.name,
              imageUrl: presetBrand.imageUrl,
            },
          ],
        };
      }
    });
  };

  const handleRemoveBrand = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      brands: prev.brands.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSave = async (e) => {
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

      fire({
        type: "success",
        title: editingItem ? "Actualizado" : "Creado",
        text: `Medio de pago guardado con éxito.`,
      });

      setModalOpen(false);
    } catch (err: any) {
      fire({
        type: "error",
        title: "Error al guardar",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "No se pudo procesar la solicitud.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmation = await fire({
      title: "¿Eliminar medio de pago?",
      text: "Esta acción no se puede deshacer y se ocultará del storefront.",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmation.isConfirmed) return;

    try {
      await deletePaymentMethod(id);
      fire({
        type: "success",
        title: "Eliminado",
        text: "El medio de pago fue eliminado.",
      });
    } catch {
      fire({
        type: "error",
        title: "Error",
        text: "No se pudo eliminar el medio de pago.",
      });
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const newStatus = await togglePaymentMethodActive(item);
      fire({
        type: "success",
        title: newStatus ? "Visible" : "Oculto",
        text: `El canal ahora está ${newStatus ? "activo" : "oculto"} en la tienda.`,
      });
    } catch {
      fire({
        type: "error",
        title: "Error",
        text: "No se pudo actualizar el estado.",
      });
    }
  };

  const handleMoveOrder = async (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= methods.length) return;

    const newItems = [...methods];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    try {
      await reorderPaymentMethods(newItems);
    } catch {
      fire({
        type: "error",
        title: "Error",
        text: "No se pudo guardar el nuevo orden.",
      });
    }
  };

  const currentPreset =
    PAYMENT_CHANNEL_PRESETS[formData.type] || PAYMENT_CHANNEL_PRESETS.credit;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Medios de Pago</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Gestioná los métodos de cobro, cuotas y marcas visibles en la
            tienda.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-sm font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo medio de pago</span>
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spinner />
        </div>
      ) : methods.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <CreditCard className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">
            No hay medios de pago configurados
          </h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
            Creá tu primer canal para que se muestre en el detalle de tus
            productos.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors cursor-pointer"
          >
            Agregar medio de pago
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700/70 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-lg bg-zinc-800/80 text-cyan-400 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-zinc-100 text-sm truncate">
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        item.isActive
                          ? "text-cyan-400 bg-cyan-500/10"
                          : "text-zinc-500 bg-zinc-800"
                      }`}
                    >
                      {item.isActive ? "Activo" : "Oculto"}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  )}

                  {Array.isArray(item.brands) && item.brands.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {item.brands.map((b) => (
                        <div
                          key={b.id || b.name}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-300"
                        >
                          {b.imageUrl && (
                            <img
                              src={b.imageUrl}
                              alt={b.name}
                              className="h-3.5 w-auto object-contain bg-white/5 rounded-xs p-0.5"
                            />
                          )}
                          <span>{b.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <button
                  disabled={index === 0}
                  onClick={() => handleMoveOrder(index, "up")}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Subir posición"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  disabled={index === methods.length - 1}
                  onClick={() => handleMoveOrder(index, "down")}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Bajar posición"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-zinc-800 mx-1" />

                <button
                  onClick={() => handleToggleActive(item)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    item.isActive
                      ? "text-emerald-400 hover:bg-emerald-500/10"
                      : "text-zinc-500 hover:bg-zinc-800"
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
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Editar medio de pago" : "Nuevo medio de pago"}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Canal de pago
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
            >
              {PAYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500 mt-1">
              Título en tienda:{" "}
              <span className="text-zinc-300 font-medium">
                "{formData.title}"
              </span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Insignia o Promoción (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: 10% OFF, Hasta 3 cuotas sin interés"
              value={formData.badge}
              onChange={(e) =>
                setFormData({ ...formData, badge: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Descripción o Instrucción (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Acreditación inmediata. Enviás el comprobante por WhatsApp."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Opciones Predeterminadas del Sistema */}
          <div className="pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Marcas y tarjetas disponibles
              </label>
              <span className="text-[11px] text-zinc-500">
                Click para seleccionar
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
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
                        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-200"
                        : "bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
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
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Marcas activas */}
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Marcas activas ({formData.brands.length})
            </label>
            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/80 min-h-[44px] items-center">
              {formData.brands.map((b, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
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
                    className="p-0.5 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {formData.brands.length === 0 && (
                <span className="text-xs text-zinc-500 italic">
                  Ninguna marca seleccionada.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <label
              htmlFor="isActive"
              className="text-sm text-zinc-300 cursor-pointer"
            >
              Visible en la tienda pública
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Guardando..." : editingItem ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
