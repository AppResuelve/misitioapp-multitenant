// @ts-nocheck
'use client'
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button, Input } from "@/components/admin/ui/Form";
import { Spinner } from "@/components/admin/ui/Spinner";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { useAlert } from "@/components/admin/ui/AlertContext";
import api from "@/services/admin-api";

const UNIT_LABEL = { kg: 'Gr', m: 'Cm', l: 'Ml' }

export default function Attributes() {
  const Alert = useAlert();
  const { setIsDirty, confirmLeave } = useUnsavedChanges();
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", unit_type: null, values: [] });

  const load = () => {
    setLoading(true);
    api.get("/admin/attributes").then(({ data }) => setAttributes(data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditingId("new"); setForm({ name: "", unit_type: null, values: [] }); setIsDirty(false) };
  const openEdit = (attr) => {
    setEditingId(attr.id);
    setIsDirty(false)
    setForm({ name: attr.name || "", unit_type: attr.unitType || null, values: (attr.values || []).map((v) => ({ id: v.id, value: v.value, sort_order: v.sortOrder || 0 })) });
  };
  const closeForm = async () => { if (await confirmLeave()) setEditingId(null) };
  const handleValueChange = (index, value) => { const next = [...form.values]; next[index] = { ...next[index], value }; setForm({ ...form, values: next }); setIsDirty(true) };
  const addValue = () => { setForm({ ...form, values: [...form.values, { value: "", sort_order: form.values.length }] }); setIsDirty(true) };
  const removeValue = (index) => { setForm({ ...form, values: form.values.filter((_, i) => i !== index) }); setIsDirty(true) };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.fire({ message: "El nombre del atributo es obligatorio", type: "warning" }); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, unit_type: form.unit_type, sort_order: 0, values: form.values.map((v) => ({ ...(v.id && { id: v.id }), value: v.value, sort_order: v.sort_order || 0 })) };
      if (editingId === "new") await api.post("/admin/attributes", payload);
      else await api.put(`/admin/attributes/${editingId}`, payload);
      Alert.fire({ message: editingId === "new" ? "Atributo creado" : "Atributo actualizado", type: "success" });
      setIsDirty(false); setEditingId(null); load();
    } catch { Alert.fire({ message: "Error al guardar", type: "error" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (attr) => {
    const result = await Alert.fire({ title: "¿Eliminar atributo?", message: `¿Eliminar "${attr.name}" y todos sus valores?`, type: "warning", variant: "modal", showCancelButton: true, confirmButtonText: "Eliminar", cancelButtonText: "Cancelar" });
    if (!result.isConfirmed) return;
    try { await api.delete(`/admin/attributes/${attr.id}`); Alert.fire({ message: "Atributo eliminado", type: "success" }); load(); }
    catch { Alert.fire({ message: "Error al eliminar", type: "error" }); }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner /></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Atributos</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestioná tamaños, colores, cantidades y otras variantes de productos</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Nuevo atributo</Button>
      </div>

      <div className="space-y-3">
        {attributes.map((attr) => (
          <div key={attr.id} className="rounded-xl border border-zinc-700 bg-zinc-900/50 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-zinc-100">{attr.name} {attr.unitType && <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 ml-2">por {UNIT_LABEL[attr.unitType] || attr.unitType}</span>}</h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(attr.values || []).map((v) => <span key={v.id} className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">{v.value}{attr.unitType ? ` ${UNIT_LABEL[attr.unitType] || attr.unitType}` : ''}</span>)}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => openEdit(attr)}>Editar</Button>
              <button onClick={() => handleDelete(attr)} className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {attributes.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-zinc-700">
            <p className="text-zinc-500">No hay atributos creados</p>
            <p className="text-xs text-zinc-600 mt-1">Creá atributos como "Color" o "Tamaño" para usar en productos y servicios</p>
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeForm} />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-zinc-100">{editingId === "new" ? "Nuevo atributo" : "Editar atributo"}</h2>
            <Input label="Nombre del atributo" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setIsDirty(true) }} placeholder="Color, Tamaño, Cantidad..." />
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Tipo de unidad (opcional)</label>
              <select
                value={form.unit_type || ""}
                onChange={(e) => { setForm({ ...form, unit_type: e.target.value || null }); setIsDirty(true) }}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="">Ninguna (texto libre)</option>
                <option value="kg">Gramo (Gr)</option>
                <option value="m">Centímetro (Cm)</option>
                <option value="l">Mililitro (Ml)</option>
              </select>
              {form.unit_type && (
                <p className="text-xs text-zinc-500 mt-1">Los valores deben ser números (ej: 100, 250, 500). Se usarán para calcular el precio proporcionalmente.</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-400">Valores</span>
                <button type="button" onClick={addValue} className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300"><Plus className="w-3 h-3" /> Agregar valor</button>
              </div>
              {form.values.length === 0 ? (
                <p className="text-xs text-zinc-600 italic">{form.unit_type ? "Ej: 100, 250, 500, 1000..." : "Ej: Rojo, Azul, Verde..."}</p>
              ) : (
                <div className="space-y-2">
                  {form.values.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600 w-5">{i + 1}</span>
                      <input
                        type={form.unit_type ? "number" : "text"}
                        inputMode={form.unit_type ? "numeric" : "text"}
                        min={form.unit_type ? "1" : undefined}
                        value={v.value}
                        onChange={(e) => handleValueChange(i, e.target.value)}
                        placeholder={form.unit_type ? "Ej: 250" : "Valor"}
                        className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-cyan-500"
                      />
                      {form.unit_type && (
                        <span className="text-xs text-zinc-500 shrink-0">{UNIT_LABEL[form.unit_type] || form.unit_type}</span>
                      )}
                      <button onClick={() => removeValue(i)} className="p-1.5 text-zinc-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={closeForm}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
