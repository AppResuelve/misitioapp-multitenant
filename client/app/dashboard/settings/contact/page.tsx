// @ts-nocheck
"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, GripVertical, MapPin } from "lucide-react";
import { Button, Input } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useAlert } from "@/context/AlertContext";
import ScheduleInput from "@/components/admin/ScheduleInput";
import { useBranches } from "@/hooks/admin-useBranches";
import { COUNTRIES } from "@/data/geoLocationsdata";

export default function ContactSettings() {
  const Alert = useAlert();
  const {
    ordered,
    setOrdered,
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

  // Estados para drag & drop sin acceder a refs en render
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("AR"); // Default Argentina
  const [hours, setHours] = useState([]);

  // Drag and drop handlers
  const handleDragStart = (index) => {
    setDraggingIndex(index);
  };

  const handleDragEnter = (index) => {
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
      Alert.fire({ message: "Error al reordenar", type: "error" });
    }
  };

  const handleToggle = async (id) => {
    setToggling(id);
    try {
      await toggleBranchStatus(id);
    } catch {
      Alert.fire({ message: "Error al cambiar estado", type: "error" });
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
    setCountry("AR");
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
    setCountry(branch.country || "AR");
    setHours(
      branch.hours
        ? typeof branch.hours === "string"
          ? JSON.parse(branch.hours)
          : branch.hours
        : [],
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleCountryChange = (newCountryCode) => {
    setCountry(newCountryCode);
    setState(""); // Resetear provincia al cambiar de país para evitar inconsistencias
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        phone,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
        hours: JSON.stringify(hours),
      };

      if (editing) {
        await updateBranch(editing.id, payload);
      } else {
        await createBranch(payload);
      }

      closeModal();
    } catch (err: any) {
      Alert.fire({
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Error al guardar",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branch) => {
    if (!confirm(`¿Eliminar "${branch.name}"?`)) return;
    try {
      await deleteBranch(branch.id);
    } catch {
      Alert.fire({ message: "Error al eliminar", type: "error" });
    }
  };

  // Obtener provincias del país seleccionado
  const selectedCountryData =
    COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Contacto</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Agregar sucursal
        </Button>
      </div>

      {ordered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6 text-zinc-500" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">
            No hay sucursales cargadas
          </h2>
          <p className="text-sm text-zinc-400 mb-4">
            Hacé clic en &quot;Agregar sucursal&quot; para crear la primera.
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="w-12"></th>
                <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-6 py-3">
                  Nombre
                </th>
                <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-6 py-3">
                  Ubicación
                </th>
                <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-6 py-3">
                  Teléfono
                </th>
                <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-6 py-3">
                  Estado
                </th>
                <th className="text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider px-6 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((branch, index) => {
                const countryObj = COUNTRIES.find(
                  (c) => c.code === branch.country,
                );
                const countryName = countryObj
                  ? countryObj.name
                  : branch.country;

                const locationParts = [
                  branch.address,
                  branch.city,
                  branch.state,
                  countryName,
                ].filter(Boolean);

                const locationText = locationParts.join(", ") || "-";

                return (
                  <tr
                    key={branch.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-opacity ${
                      draggingIndex === index ? "opacity-50" : ""
                    }`}
                  >
                    <td className="pl-4 pr-2 py-4 cursor-grab">
                      <GripVertical className="w-4 h-4 text-zinc-600 hover:text-zinc-400 transition-colors" />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-100">
                        {branch.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="text-sm text-zinc-400 truncate max-w-xs block"
                        title={locationText}
                      >
                        {locationText}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-400">
                        {branch.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(branch.id)}
                        disabled={toggling === branch.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          branch.isActive
                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                        } ${toggling === branch.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            branch.isActive ? "bg-emerald-400" : "bg-zinc-500"
                          }`}
                        />
                        {branch.isActive ? "Activa" : "Inactiva"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(branch)}
                          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(branch)}
                          className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition-colors cursor-pointer"
                          title="Eliminar"
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
            onChange={(e) => setName(e.target.value)}
            placeholder="Sucursal Centro"
            required
          />
          <Input
            label="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="5493624123456"
            required
          />
          <Input
            label="Dirección"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Av. Paraguay 78"
          />

          {/* País y Provincia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                País
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                {selectedCountryData.subdivisionLabel}
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="">Seleccionar...</option>
                {selectedCountryData.states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ciudad */}
          <Input
            label="Ciudad / Localidad"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Resistencia"
          />

          <ScheduleInput value={hours} onChange={(val) => setHours(val)} />

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
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
