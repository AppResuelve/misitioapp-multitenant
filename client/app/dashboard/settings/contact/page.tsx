// @ts-nocheck
"use client";

import { useState } from "react";
import { useAlert } from "@/context/AlertContext";
import { useBranches } from "@/hooks/admin-useBranches";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { Plus, Edit, Trash2, GripVertical, MapPin } from "lucide-react";
import { Button, Input, Select, Modal, Spinner } from "@/components/ui";
import ScheduleInput from "@/components/admin/ScheduleInput";
import { COUNTRIES } from "@/data/geoLocationsdata";
import { DEFAULT_COUNTRY_CODE, BRANCH_MESSAGES } from "@/constants/branches";
import { safeParseHours, formatLocationText } from "@/utils/branches";

export default function ContactSettings() {
  const Alert = useAlert();
  const { isDirty, confirmLeave } = useUnsavedChanges();
  const {
    ordered,
    loading,
    createBranch,
    updateBranch,
    deleteBranch,
    toggleBranchStatus,
    reorderBranches,
  } = useBranches();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);

  // Drag & drop
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY_CODE);
  const [hours, setHours] = useState([]);

  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const handleDragEnter = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (
      draggingIndex === null ||
      dragOverIndex === null ||
      draggingIndex === dragOverIndex
    ) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...ordered];
    const [moved] = reordered.splice(draggingIndex, 1);
    reordered.splice(dragOverIndex, 0, moved);

    setDraggingIndex(null);
    setDragOverIndex(null);

    try {
      await reorderBranches(reordered);
    } catch {
      Alert.fire({ message: BRANCH_MESSAGES.REORDER_ERROR, type: "error" });
    }
  };

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      await toggleBranchStatus(id);
    } catch {
      Alert.fire({ message: BRANCH_MESSAGES.STATUS_ERROR, type: "error" });
    } finally {
      setToggling(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setPhone("");
    setAddress("");
    setCity("");
    setState("");
    setCountry(DEFAULT_COUNTRY_CODE);
    setHours([]);

    setModalOpen(true);
  };

  const openEdit = (branch) => {
    setEditing(branch);
    setName(branch.name || "");
    setPhone(branch.phone || "");
    setAddress(branch.address || "");
    setCity(branch.city || "");
    setState(branch.state || "");
    setCountry(branch.country || DEFAULT_COUNTRY_CODE);
    setHours(safeParseHours(branch.hours));

    setModalOpen(true);
  };

  const closeModal = async () => {
    if (await confirmLeave()) {
      setModalOpen(false);
      setEditing(null);
    }
  };

  const handleCountryChange = (newCountryCode: string) => {
    setCountry(newCountryCode);
    setState("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || null,
        city: city.trim() || null,
        state: state || null,
        country: country || null,
        hours: JSON.stringify(hours),
      };

      if (editing) {
        await updateBranch(editing.id, payload);
      } else {
        await createBranch(payload);
      }

      Alert.fire({
        message: editing
          ? BRANCH_MESSAGES.SAVE_SUCCESS_EDIT
          : BRANCH_MESSAGES.SAVE_SUCCESS_NEW,
        type: "success",
        duration: 1500,
      });

      setModalOpen(false);
      setEditing(null);
    } catch (err: any) {
      Alert.fire({
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          BRANCH_MESSAGES.SAVE_ERROR,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branch) => {
    const confirmation = await Alert.fire({
      title: BRANCH_MESSAGES.DELETE_CONFIRM_TITLE,
      message: BRANCH_MESSAGES.DELETE_CONFIRM_TEXT(branch.name),
      type: "warning",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmation.isConfirmed) return;

    try {
      await deleteBranch(branch.id);
      Alert.fire({
        message: BRANCH_MESSAGES.DELETE_SUCCESS,
        type: "success",
      });
    } catch {
      Alert.fire({ message: BRANCH_MESSAGES.DELETE_ERROR, type: "error" });
    }
  };

  const selectedCountryData =
    COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];

  const countryOptions = COUNTRIES.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  const stateOptions = [
    { value: "", label: "Seleccionar provincia / estado..." },
    ...selectedCountryData.states.map((st) => ({
      value: st,
      label: st,
    })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Contacto
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Configurá las sucursales físicas, teléfonos y horarios de atención.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Agregar sucursal
        </Button>
      </div>

      {ordered.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6 text-[var(--color-text-muted)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1.5">
            No hay sucursales cargadas
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-4">
            Hacé clic en &quot;Agregar sucursal&quot; para registrar el primer
            punto de retiro o atención.
          </p>
          <Button variant="secondary" onClick={openCreate}>
            Agregar sucursal
          </Button>
        </div>
      ) : (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-base)]/50">
                  <th className="w-12 px-3 py-3"></th>
                  <th className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-5 py-3">
                    Nombre
                  </th>
                  <th className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-5 py-3">
                    Ubicación
                  </th>
                  <th className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-5 py-3">
                    Teléfono
                  </th>
                  <th className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-5 py-3">
                    Estado
                  </th>
                  <th className="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-5 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {ordered.map((branch, index) => {
                  const locationText = formatLocationText(branch, COUNTRIES);

                  return (
                    <tr
                      key={branch.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className={`hover:bg-[var(--color-bg-elevated)]/40 transition-colors ${
                        draggingIndex === index ? "opacity-40" : ""
                      }`}
                    >
                      <td className="pl-4 pr-1 py-4 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors" />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {branch.name}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="text-sm text-[var(--color-text-secondary)] truncate max-w-xs block"
                          title={locationText}
                        >
                          {locationText}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-[var(--color-text-secondary)] font-mono">
                          {branch.phone || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggle(branch.id)}
                          disabled={toggling === branch.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            branch.isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                          } ${
                            toggling === branch.id
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              branch.isActive
                                ? "bg-emerald-500"
                                : "bg-[var(--color-text-muted)]"
                            }`}
                          />
                          {branch.isActive ? "Activa" : "Inactiva"}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(branch)}
                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-bg-elevated)] transition-colors cursor-pointer"
                            title="Editar sucursal"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(branch)}
                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Eliminar sucursal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Editar sucursal" : "Agregar sucursal"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            placeholder="Sucursal Centro"
            required
            autoFocus
          />

          <Input
            label="Teléfono de contacto"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
            }}
            placeholder="5493624123456"
            required
          />

          <Input
            label="Dirección"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
            }}
            placeholder="Av. Paraguay 78"
          />

          {/* País y Provincia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="País"
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              options={countryOptions}
            />

            <Select
              label={selectedCountryData.subdivisionLabel}
              value={state}
              onChange={(e) => {
                setState(e.target.value);
              }}
              options={stateOptions}
            />
          </div>

          <Input
            label="Ciudad / Localidad"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
            }}
            placeholder="Resistencia"
          />

          <div className="pt-2 border-t border-[var(--color-border)]">
            <ScheduleInput
              value={hours}
              onChange={(val) => {
                setHours(val);
              }}
            />
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
